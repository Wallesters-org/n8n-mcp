# Supabase Integration in n8n-mcp

This guide explains how n8n-mcp uses Supabase as its telemetry backend, the architectural decisions behind the integration, and how the Supabase platform features map to the project's needs.

## Table of Contents

- [Why Supabase](#why-supabase)
- [Architecture Overview](#architecture-overview)
- [Supabase Platform Context](#supabase-platform-context)
- [Integration Components](#integration-components)
- [Database Schema](#database-schema)
- [Data Flow](#data-flow)
- [Serialization and the snake_case Fix](#serialization-and-the-snake_case-fix)
- [Privacy and Security](#privacy-and-security)
- [Resilience Patterns](#resilience-patterns)
- [Configuration](#configuration)
- [Development and Testing](#development-and-testing)
- [Supabase Features Used vs Available](#supabase-features-used-vs-available)

---

## Why Supabase

n8n-mcp needed a telemetry backend that met these requirements:

1. **Zero-configuration for end users** — telemetry should work out of the box with no setup
2. **Write-only access** — anonymous clients can insert data but never read it back
3. **Structured data storage** — workflow mutations contain nested JSON that must be preserved exactly
4. **Low latency writes** — telemetry must not slow down MCP tool responses
5. **Open-source and transparent** — users can audit exactly what data is sent

Supabase fits all of these. It provides a full Postgres database with auto-generated REST APIs (PostgREST), Row Level Security (RLS) to enforce write-only access, native JSONB support for preserving nested workflow structures, and an open-source stack that can be self-hosted.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   n8n-mcp MCP Server                        │
│      (tracks tool usage, workflow mutations, errors)        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│    TelemetryManager (Singleton, lazy-initialized)           │
│    src/telemetry/telemetry-manager.ts                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        ▼              ▼              ▼              ▼
  ┌─────────────┐ ┌──────────────┐ ┌───────────────┐ ┌──────────────┐
  │EventTracker │ │ConfigManager │ │BatchProcessor │ │EarlyErrorLog │
  │event-       │ │config-       │ │batch-         │ │early-error-  │
  │tracker.ts   │ │manager.ts    │ │processor.ts   │ │logger.ts     │
  └──────┬──────┘ └──────────────┘ └────────┬──────┘ └──────┬───────┘
         │                                  │               │
         │         ┌────────────────────────┘               │
         │         │                                        │
         ▼         ▼                                        ▼
  ┌──────────────────────┐                    ┌──────────────────────┐
  │ Supabase Client      │                    │ Supabase Client      │
  │ (batched writes)     │                    │ (direct inserts)     │
  │ @supabase/supabase-js│                    │ @supabase/supabase-js│
  └──────────┬───────────┘                    └──────────┬───────────┘
             │                                           │
             └───────────────┬───────────────────────────┘
                             ▼
                  ┌──────────────────────┐
                  │   Supabase Backend   │
                  │   (Hosted Postgres)  │
                  │                      │
                  │ Tables:              │
                  │ ├─ telemetry_events  │
                  │ ├─ telemetry_workflows│
                  │ └─ workflow_mutations│
                  └──────────────────────┘
```

## Supabase Platform Context

Supabase is an open-source backend-as-a-service built on Postgres. Every Supabase project provisions a dedicated Postgres instance with full SQL access. On top of that database, it layers:

- **PostgREST** — auto-generates a RESTful API from the database schema, which is what the `@supabase/supabase-js` client library uses under the hood
- **Row Level Security (RLS)** — SQL-based authorization policies that enforce access control at the database level
- **JSONB columns** — native Postgres JSON storage that preserves nested structures exactly, which is critical for storing workflow data
- **Auth** — built-in authentication that integrates with RLS via `auth.uid()`

n8n-mcp uses the **anonymous role** with an `anon` key. RLS policies are configured so that the anonymous role can INSERT into telemetry tables but cannot SELECT, UPDATE, or DELETE. This means the JavaScript client embedded in n8n-mcp can send data but never read it back — a privacy-first design.

### How PostgREST Powers the Integration

When the batch processor calls:

```typescript
await this.supabase.from('telemetry_events').insert(batch);
```

The `@supabase/supabase-js` client translates this into an HTTP POST to the PostgREST API at `https://<project>.supabase.co/rest/v1/telemetry_events`. PostgREST validates the request against the table schema, checks RLS policies, and executes the INSERT. This means n8n-mcp never opens a direct database connection — all communication is over HTTPS.

## Integration Components

### 1. TelemetryManager (`src/telemetry/telemetry-manager.ts`)

The main coordinator. It follows the **singleton pattern** with lazy initialization — the Supabase client is only created when telemetry data first needs to be sent:

```typescript
// Supabase client is null until first use
private supabase: SupabaseClient | null = null;

private initialize(): void {
  const supabaseUrl = process.env.SUPABASE_URL || TELEMETRY_BACKEND.URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || TELEMETRY_BACKEND.ANON_KEY;

  this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 1 } },
  });
}
```

Key design decisions:
- **`persistSession: false`** — no session storage needed for anonymous writes
- **`autoRefreshToken: false`** — the anon key doesn't expire, so no refresh needed
- **`eventsPerSecond: 1`** — rate-limits realtime subscriptions (not used, but defensive)

### 2. BatchProcessor (`src/telemetry/batch-processor.ts`)

Handles batching, retry logic, and Supabase writes. Events are queued in memory and flushed periodically or when thresholds are reached:

| Config | Value | Purpose |
|--------|-------|---------|
| `BATCH_FLUSH_INTERVAL` | 5,000ms | Periodic flush every 5 seconds |
| `MAX_BATCH_SIZE` | 50 | Maximum items per INSERT call |
| `MAX_RETRIES` | 3 | Retry failed operations |
| `RETRY_DELAY` | 1,000ms | Base delay with exponential backoff |
| `OPERATION_TIMEOUT` | 5,000ms | Maximum time per Supabase operation |

The processor inserts into three Supabase tables:
- `telemetry_events` — tool usage, errors, session events
- `telemetry_workflows` — sanitized workflow snapshots (deduplicated by hash)
- `workflow_mutations` — before/after workflow states from partial updates

### 3. EarlyErrorLogger (`src/telemetry/early-error-logger.ts`)

Captures startup errors that occur before the main telemetry system is ready. Uses **direct Supabase inserts** (bypassing batching) with a 5-second timeout:

```typescript
const result = await withTimeout(
  this.supabase.from('events').insert(event).select().single(),
  5000,
  'Startup error insert'
);
```

This is fire-and-forget — it never blocks the MCP server startup.

### 4. MutationTracker (`src/telemetry/mutation-tracker.ts`)

Processes workflow mutations before they're sent to Supabase. For each mutation, it:

1. Validates data quality
2. Sanitizes workflows (removes credentials, PII)
3. Checks for duplicates via content hashing
4. Classifies the user's intent (add functionality, fix validation, rewire logic, etc.)
5. Calculates change metrics (nodes added/removed, connections changed)
6. Calculates validation improvement metrics (errors resolved vs introduced)

## Database Schema

### telemetry_events

Stores general MCP tool usage and error events.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | text | Anonymous hashed machine identifier |
| `event` | text | Event name (e.g., `tool_usage`, `error`, `session_start`) |
| `properties` | jsonb | Event-specific data |
| `created_at` | timestamptz | When the event occurred |

### telemetry_workflows

Stores sanitized workflow snapshots, deduplicated by hash.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | text | Anonymous hashed machine identifier |
| `workflow_hash` | text | SHA-256 hash of sanitized workflow |
| `node_count` | integer | Number of nodes |
| `node_types` | text[] | Array of node type strings |
| `has_trigger` | boolean | Whether workflow has a trigger node |
| `has_webhook` | boolean | Whether workflow has a webhook node |
| `complexity` | text | `simple`, `medium`, or `complex` |
| `sanitized_workflow` | jsonb | Full sanitized workflow structure |
| `created_at` | timestamptz | When the snapshot was taken |

### workflow_mutations

Stores detailed before/after workflow transformation records. This is the most complex table, leveraging Postgres JSONB for nested workflow data.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | text | Anonymous identifier |
| `session_id` | text | MCP session identifier |
| `workflow_before` | jsonb | Full workflow state before mutation |
| `workflow_after` | jsonb | Full workflow state after mutation |
| `workflow_hash_before` | text | Content hash of before state |
| `workflow_hash_after` | text | Content hash of after state |
| `workflow_structure_hash_before` | text | Structural hash for cross-referencing |
| `workflow_structure_hash_after` | text | Structural hash for cross-referencing |
| `user_intent` | text | Sanitized description of what the user wanted |
| `intent_classification` | text | Classified intent category |
| `tool_name` | text | Which MCP tool performed the mutation |
| `operations` | jsonb | Array of diff operations applied |
| `operation_count` | integer | Number of operations |
| `operation_types` | text[] | Unique operation type names |
| `validation_before` | jsonb | Validation results before mutation |
| `validation_after` | jsonb | Validation results after mutation |
| `validation_improved` | boolean | Whether validation errors decreased |
| `errors_resolved` | integer | Number of errors fixed |
| `errors_introduced` | integer | Number of new errors |
| `nodes_added` | integer | Change metrics |
| `nodes_removed` | integer | Change metrics |
| `nodes_modified` | integer | Change metrics |
| `connections_added` | integer | Change metrics |
| `connections_removed` | integer | Change metrics |
| `properties_changed` | integer | Change metrics |
| `mutation_success` | boolean | Whether the mutation executed |
| `mutation_error` | text | Error message if failed |
| `duration_ms` | integer | Time taken in milliseconds |

## Data Flow

### Tool Usage Tracking

```
User invokes MCP tool (e.g., search_nodes)
  │
  ├─ MCP server calls telemetry.trackToolUsage('search_nodes', true, 42)
  │
  ├─ EventTracker creates TelemetryEvent:
  │   { user_id: 'abc123', event: 'tool_usage',
  │     properties: { tool: 'search_nodes', success: true, duration: 42 } }
  │
  ├─ Event queued in memory (EventTracker.eventQueue)
  │
  ├─ After 5s OR when queue reaches 10 events:
  │   BatchProcessor.flush() is called
  │
  └─ BatchProcessor inserts batch into Supabase:
      supabase.from('telemetry_events').insert(batch)
```

### Workflow Mutation Tracking

```
User calls n8n_update_partial_workflow
  │
  ├─ Handler records workflow state before update
  │
  ├─ Diff engine calculates operations
  │
  ├─ n8n API is called to apply the update
  │
  ├─ Handler records workflow state after update
  │
  ├─ telemetry.trackWorkflowMutation({
  │     workflowBefore, workflowAfter, operations, userIntent, ... })
  │
  ├─ MutationTracker processes:
  │   1. Validates data quality
  │   2. Sanitizes workflows (removes credentials/PII)
  │   3. Checks for duplicate mutations
  │   4. Classifies user intent
  │   5. Calculates change/validation metrics
  │   6. Creates WorkflowMutationRecord
  │
  ├─ Record queued in EventTracker.mutationQueue
  │
  ├─ Auto-flush when queue reaches 2 mutations
  │
  └─ BatchProcessor converts to Supabase format:
      mutationToSupabaseFormat(record) → snake_case top-level keys only
      supabase.from('workflow_mutations').insert(snakeCaseBatch)
```

## Serialization and the snake_case Fix

One of the most important implementation details is how data is serialized for Supabase. This was the subject of a critical bug fix (Issue #517).

### The Problem

n8n workflows use camelCase field names (`typeVersion`, `nodeType`) and string-based connection keys (node names like `"HTTP Request"`). The original code used a recursive `toSnakeCase()` function that converted the entire mutation record, including nested workflow data:

```typescript
// BAD: Recursive conversion mangled nested data
const snakeCaseData = toSnakeCase(mutationRecord);
// "typeVersion" became "type_version" inside workflow JSON
// "HTTP Request" became "h_t_t_p_request" in connection keys
```

This corrupted the workflow data stored in JSONB columns, making it unusable for analysis and reducing the rate of deployable workflows from ~68% to ~21%.

### The Fix

The `mutationToSupabaseFormat()` function in `batch-processor.ts` converts **only top-level keys** to snake_case, preserving nested values exactly:

```typescript
function mutationToSupabaseFormat(mutation: WorkflowMutationRecord): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(mutation)) {
    result[keyToSnakeCase(key)] = value;  // Only the key changes, value is preserved
  }
  return result;
}
```

This works because:
- Supabase column names are snake_case (`workflow_before`, `user_intent`)
- The TypeScript interface uses camelCase (`workflowBefore`, `userIntent`)
- Nested JSONB data (`workflow_before` column content) must stay in n8n's original format

### Why Postgres JSONB Matters Here

Supabase stores `workflow_before` and `workflow_after` as Postgres JSONB columns. JSONB preserves the exact structure of the JSON document — including nested objects, arrays, and all field names. This means the workflow data inserted into Supabase is byte-for-byte identical to what the n8n API returns. This is a key advantage over document databases that might normalize or transform nested data.

## Privacy and Security

### Write-Only Access via RLS

Supabase RLS policies enforce that the anonymous role (used by n8n-mcp's embedded credentials) can only INSERT:

```sql
-- Hypothetical RLS policy (configured in Supabase dashboard)
CREATE POLICY "anon_insert_only" ON telemetry_events
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- No SELECT, UPDATE, or DELETE policies for anon role
```

This means even if someone extracts the `anon` key from the source code, they can only write data — they cannot read back any telemetry.

### Data Sanitization Pipeline

Before any data reaches Supabase, it passes through multiple sanitization layers:

1. **WorkflowSanitizer** (`workflow-sanitizer.ts`) — removes credentials, API keys, and sensitive parameters from workflow JSON
2. **IntentSanitizer** (`intent-sanitizer.ts`) — strips PII from user intent descriptions
3. **ErrorSanitizer** (`error-sanitizer.ts`) — replaces URLs, keys, emails in error messages with placeholders

Sanitization rules:
- URLs → `[URL]` or `[REDACTED]`
- Long alphanumeric strings (potential keys) → `[KEY]`
- Email addresses → `[EMAIL]`
- Auth-related fields → completely removed

### Opt-Out

Users can disable telemetry entirely:

```bash
npx n8n-mcp telemetry disable    # Disable
npx n8n-mcp telemetry enable     # Re-enable
npx n8n-mcp telemetry status     # Check current status
```

When disabled, no Supabase client is created and no network requests are made.

## Resilience Patterns

The integration uses several patterns to ensure telemetry never impacts MCP server performance:

### Circuit Breaker

If Supabase is unreachable, the circuit breaker opens after repeated failures, preventing further requests until a cooldown period elapses:

```
CLOSED (normal) → failures exceed threshold → OPEN (skip all writes)
OPEN → cooldown expires → HALF-OPEN (try one write)
HALF-OPEN → success → CLOSED / failure → OPEN
```

### Dead Letter Queue

Failed items are moved to a bounded dead-letter queue (max 100 items). When the circuit breaker closes, the queue is drained:

```typescript
if (!hasErrors && this.deadLetterQueue.length > 0) {
  await this.processDeadLetterQueue();
}
```

### Exponential Backoff with Jitter

Failed operations are retried up to 3 times with increasing delays:

```
Attempt 1: immediate
Attempt 2: ~1s + random jitter (0-30%)
Attempt 3: ~2s + random jitter (0-30%)
```

### Operation Timeout

Every Supabase operation is wrapped in a 5-second timeout using `Promise.race()`:

```typescript
const result = await Promise.race([operation(), timeoutPromise]);
```

### Process Exit Handling

Queued events are flushed on `beforeExit`, `SIGINT`, and `SIGTERM` signals to minimize data loss during shutdown.

## Configuration

### Default (Zero-Configuration)

n8n-mcp ships with hardcoded Supabase credentials in `telemetry-types.ts`:

```typescript
export const TELEMETRY_BACKEND = {
  URL: 'https://ydyufsohxdfpopqbubwk.supabase.co',
  ANON_KEY: 'eyJhbG...'  // Anonymous key (write-only access)
};
```

This enables zero-configuration telemetry. Users don't need to set up anything.

### Environment Variable Overrides

For development or testing, you can override the backend:

```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_ANON_KEY=your-anon-key
```

### Telemetry Tuning

The batch processing behavior is configured in `TELEMETRY_CONFIG`:

| Setting | Default | Description |
|---------|---------|-------------|
| `BATCH_FLUSH_INTERVAL` | 5,000ms | How often to flush queued data |
| `EVENT_QUEUE_THRESHOLD` | 10 | Flush events when queue reaches this size |
| `MAX_BATCH_SIZE` | 50 | Maximum items per Supabase INSERT |
| `MAX_RETRIES` | 3 | Retry count for failed operations |
| `RETRY_DELAY` | 1,000ms | Base retry delay |
| `OPERATION_TIMEOUT` | 5,000ms | Per-operation timeout |
| `RATE_LIMIT_WINDOW` | 60,000ms | Rate limit window |
| `RATE_LIMIT_MAX_EVENTS` | 100 | Max events per rate limit window |
| `MAX_QUEUE_SIZE` | 1,000 | Maximum events to queue in memory |

## Development and Testing

### Test Scripts

Several scripts validate the Supabase integration:

```bash
# Direct Supabase connection test
npx tsx scripts/test-telemetry-debug.ts

# Direct table operations
npx tsx scripts/test-telemetry-direct.ts

# Basic telemetry flow
npx tsx scripts/test-telemetry-simple.ts

# RLS policy verification (reads should fail)
npx tsx scripts/test-telemetry-security.ts

# Write-only access testing
npx tsx scripts/test-telemetry-no-select.ts
```

### Unit Tests

Telemetry unit tests mock the Supabase client to avoid network calls:

```bash
npm test -- tests/unit/telemetry/
```

Tests verify:
- Event batching and flushing
- Circuit breaker behavior
- Dead letter queue processing
- Mutation data validation and sanitization
- `mutationToSupabaseFormat()` preserves nested data
- Rate limiting
- Error handling for Supabase outages

### Running Against a Local Supabase

For development, you can run a local Supabase instance:

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# Override the backend URL
export SUPABASE_URL=http://localhost:54321
export SUPABASE_ANON_KEY=<local-anon-key>
```

## Supabase Features Used vs Available

| Supabase Feature | Used in n8n-mcp | Notes |
|------------------|-----------------|-------|
| **Postgres database** | Yes | Core storage for all telemetry |
| **PostgREST API** | Yes | All writes go through the REST API via `@supabase/supabase-js` |
| **Row Level Security** | Yes | Write-only access for anonymous users |
| **JSONB columns** | Yes | Preserves nested workflow data exactly |
| **Auth (anon key)** | Yes | Anonymous role for zero-config telemetry |
| **Realtime** | No | Rate-limited to 1 event/sec but not actively used |
| **Storage** | No | Not needed for telemetry data |
| **Edge Functions** | No | All processing happens client-side |
| **pgvector** | No | No vector/embedding use case currently |
| **pg_cron** | No | No scheduled tasks on the Supabase side |
| **GraphQL** | No | REST API is sufficient |

### Potential Future Uses

- **pgvector** — could store workflow embeddings for semantic search across mutation patterns
- **Edge Functions** — could validate and enrich telemetry data server-side before storage
- **pg_cron** — could aggregate and summarize telemetry data on a schedule
- **Realtime** — could power a live dashboard showing workflow mutation patterns
- **Storage** — could archive large workflow snapshots as files instead of JSONB

## File Reference

| File | Purpose |
|------|---------|
| `src/telemetry/telemetry-manager.ts` | Main coordinator (singleton) |
| `src/telemetry/telemetry-types.ts` | Type definitions, config constants, Supabase credentials |
| `src/telemetry/batch-processor.ts` | Batching, retry, and Supabase writes |
| `src/telemetry/early-error-logger.ts` | Direct Supabase writes for startup errors |
| `src/telemetry/event-tracker.ts` | Event queueing and tracking |
| `src/telemetry/mutation-tracker.ts` | Workflow mutation processing |
| `src/telemetry/mutation-types.ts` | Mutation type definitions |
| `src/telemetry/mutation-validator.ts` | Mutation data quality validation |
| `src/telemetry/config-manager.ts` | Telemetry enable/disable management |
| `src/telemetry/workflow-sanitizer.ts` | Workflow data sanitization |
| `src/telemetry/intent-sanitizer.ts` | User intent sanitization |
| `src/telemetry/error-sanitizer.ts` | Error message sanitization |
| `src/telemetry/error-sanitization-utils.ts` | Shared sanitization utilities |
| `src/telemetry/intent-classifier.ts` | Classifies mutation intent |
| `src/telemetry/performance-monitor.ts` | Tracks telemetry system overhead |
| `src/telemetry/rate-limiter.ts` | Rate limiting for event tracking |
| `src/telemetry/telemetry-error.ts` | Custom error types and circuit breaker |
| `src/telemetry/startup-checkpoints.ts` | Server startup checkpoint definitions |
| `PRIVACY.md` | Privacy policy for telemetry collection |
