# Plan: AI-Powered Privacy & Anonymity Browser Platform (AnonShield)

## Context

**Problem:** Current anti-detection browsers (GoLogin, Multilogin, etc.) rely on static fingerprint spoofing which is increasingly detectable by AI-powered anti-bot systems. The tracking industry ($600B+ annually) continuously outpaces defensive tools. Users need a platform that uses AI to generate coherent, realistic synthetic identities that pass validation without exposing real data.

**Approach:** Build a hybrid platform -- standalone privacy browser with MCP integration for AI-assisted management through n8n workflows. The platform uses on-device AI (ONNX Runtime) for real-time fingerprint generation and behavioral emulation, with a dual-engine architecture (Camoufox + Patchright) to resist Google's emerging binary attestation.

**Scope:** Full research + detailed implementation plan, with the platform integrated into the n8n-mcp ecosystem via MCP tools.

---

## 1. Research: 30 Privacy Platforms Analyzed

### Tier 1: Industry Leaders
| Platform | Engine | Key Innovation | Unique Feature | Profiles | Detection Bypass Rate |
|---|---|---|---|---|---|
| **Tor Browser** | Firefox ESR | Multi-hop onion routing | End-to-end network anonymity, letterboxing | N/A | Network-level only |
| **Multilogin** | Mimic (Chromium) + Stealthfox (Firefox) | Dual-engine, 55+ parameters | Natural fingerprinting (not blocking), residential IPs included | 1000+ | ~95% |
| **GoLogin** | Orbita (Chromium) | Cloud profiles, 50+ parameters | Mobile fingerprinting, built-in proxies (2GB included) | Unlimited | ~88-92% |
| **AdsPower** | SunBrowser (Chromium) | 14 core updates in 2025 | RPA automation, local API, team collaboration | 500+ | ~90% |
| **Dolphin Anty** | Chromium | Affiliate marketing focus | Cookie robot, bulk profile import, team management | Unlimited | ~85% |

### Tier 2: Specialized Solutions
| Platform | Engine | Key Innovation | Unique Feature |
|---|---|---|---|
| **Kameleo** | Chromium + Firefox + Safari | Multi-engine support | Mobile profiles via Android connection, Selenium/Puppeteer integration |
| **VMLogin** | Chromium | Virtual browser profiles | Canvas fingerprint lock, WebRTC proxy IP replacement |
| **Incogniton** | Chromium | Cookie collector | Paste-as-human-typing, bulk profile creation, synchronizer |
| **Octo Browser** | Chromium | API-first design | Cookie robot, profile templates, quick profiles |
| **BitBrowser** | Chromium | Group management | Batch operations, RPA automation, window arrangement |

### Tier 3: Growing Players
| Platform | Key Feature |
|---|---|
| **Undetectable Browser** | Configurable profiles, cloud launch |
| **Ghost Browser** | Workspace-based sessions, proxy per tab |
| **SessionBox** | Browser extension model (lightweight) |
| **Linken Sphere** | Tor integration, advanced fingerprinting |
| **MoreLogin** | 100% real fingerprint library |
| **ClonBrowser** | Budget-friendly, team features |
| **Lalicat** | Chinese market focus, competitive pricing |
| **MuLogin** | Bulk operations, automation API |
| **Hubstudio** | E-commerce optimization |
| **SmartProxy X-Browser** | Integrated with SmartProxy network |

### Tier 4: Niche/Emerging
| Platform | Key Feature |
|---|---|
| **GenLogin** | Profile marketplace |
| **AntBrowser** | Lightweight approach |
| **Maskfog** | Privacy-focused browsing |
| **Brave Browser** | Built-in Tor, fingerprint randomization |
| **LibreWolf** | Hardened Firefox, privacy defaults |
| **Mullvad Browser** | Tor-based without Tor network |
| **Camoufox** | C++-level fingerprint injection, 0% detection |
| **Patchright** | CDP leak-free Playwright fork |
| **Nodriver** | Zero CDP footprint automation |
| **DiCloak** | AI fingerprint management |

### Key Architectural Patterns Extracted

1. **Chromium dominance**: 90% of platforms use Chromium forks; Firefox-based solutions (Tor, Camoufox) are gaining as Google adds binary attestation
2. **Profile isolation**: Container-based separation (not VMs) is the industry standard
3. **Cloud storage**: All major platforms store profiles in cloud for cross-device access
4. **API-first**: Top platforms expose full API for programmatic control
5. **Proxy bundling**: Trend toward including residential proxies in subscriptions
6. **Team collaboration**: Role-based access (Admin/Editor/Launcher) is standard
7. **AI integration**: Emerging -- DiCloak and newer platforms adding AI fingerprint management

---

## 2. 50 Key Anonymity Factors (Condensed)

### Network Layer (1-10)
| # | Factor | Tracking Method | AI Countermeasure |
|---|---|---|---|
| 1 | IP Address | Geolocation, ISP mapping | Residential proxy rotation with AI location matching |
| 2 | VPN Tunneling | DPI protocol detection | AI traffic morphing (obfs4/V2Ray-like shaping) |
| 3 | Tor Routing | Traffic correlation, browser exploits | ML-based entry guard selection, adaptive padding |
| 4 | DNS Leaks | Plaintext DNS queries bypass VPN | Per-profile DoH/DoT with geo-consistent resolvers |
| 5 | WebRTC Leaks | STUN requests expose real IP | Auto-disable + TURN relay enforcement when needed |
| 6 | Traffic Analysis | Packet timing/size patterns reveal sites (98% accuracy with Deep Fingerprinting) | AI traffic shaping (Prism, AdvTG), adversarial perturbation |
| 7 | Protocol Fingerprinting | TLS/HTTP/TCP stack variations identify clients | Full-stack impersonation (CycleTLS + HTTP/2 matching) |
| 8 | Timing Attacks | Correlation of entry/exit traffic (DeepCorr: 96% at 900 packets) | Constant-rate transmission, mix network batching |
| 9 | ISP Tracking | All metadata visible to ISP, legally mandated retention | Always-on VPN + encrypted DNS + network namespace isolation |
| 10 | CDN Fingerprinting | Cloudflare/Akamai serve 20%+ of web, cross-site visibility | Common browser fingerprint matching, AI-driven profile rotation |

### Browser Layer (11-25)
| # | Factor | Tracking Method | AI Countermeasure |
|---|---|---|---|
| 11 | Canvas | GPU rendering variations create unique pixel hash | AI-generated noise consistent with claimed GPU |
| 12 | WebGL | GPU vendor/renderer strings + shader precision | Coherent GPU spoofing with performance matching |
| 13 | AudioContext | Oscillator output varies by hardware/driver | Spoofed audio fingerprint consistent with hardware profile |
| 14 | Font Enumeration | Installed font set is highly distinctive | OS-consistent font list from AI-generated profiles |
| 15 | Screen Resolution | Display properties (resolution, DPI, color depth) | Letterboxing + standard viewport matching |
| 16 | User-Agent | Browser/OS/version identification | Consistent UA matching all other signals |
| 17 | Navigator Properties | hardwareConcurrency, deviceMemory, platform, language | AI validates cross-parameter consistency |
| 18 | Plugin/Extension Detection | DOM modifications, API interceptions reveal extensions | Zero-extension profiles, behavioral artifact suppression |
| 19 | Cookie Isolation | Cross-site tracking via third-party cookies, CNAME cloaking | Total cookie partitioning + CNAME detection |
| 20 | LocalStorage/IndexedDB | Evercookie technique: redundant storage across APIs | Complete storage isolation per profile |
| 21 | Service Workers | Background scripts persist after site closure | Restricted SW registration, auto-deregistration |
| 22 | Cache Fingerprinting | Timing attacks reveal cached resources | Cache partitioning + timing noise injection |
| 23 | HTTP Headers | Header ordering, Accept-Language, custom headers | Standardized header sets matching browser profile |
| 24 | HTTP/2 Fingerprinting | SETTINGS frames, HPACK behavior (JA4H) | Protocol-level matching via real browser engine |
| 25 | TLS/JA4+ | ClientHello cipher suites, extensions, ALPN | CycleTLS/curl-impersonate for explicit JA4 control |

### System Layer (26-35)
| # | Factor | AI Countermeasure |
|---|---|---|
| 26 | OS Fingerprinting | TCP stack modification via network namespaces |
| 27 | Hardware Fingerprinting | Performance-consistent spoofing via ONNX models |
| 28 | CPU Identification | Throttled execution to match claimed core count |
| 29 | GPU Identification | WebGL renderer spoofing with rendering behavior matching |
| 30 | Memory Detection | deviceMemory API spoofing + allocation limiting |
| 31 | Battery Status | Battery API blocked or spoofed consistently |
| 32 | Device Sensors | Accelerometer/gyroscope data synthesis via generative models |
| 33 | Bluetooth/USB | API access blocked by default |
| 34 | Installed Software | Probing prevention, standardized environment responses |
| 35 | System Fonts | OS-matched font whitelist from AI-generated profile |

### Behavioral Layer (36-45)
| # | Factor | AI Countermeasure |
|---|---|---|
| 36 | Keystroke Dynamics | LSTM/Transformer models generate synthetic typing rhythms |
| 37 | Mouse Movement | DMTG diffusion model + sigma-lognormal neuromotor patterns |
| 38 | Touch Events | Synthetic touch patterns via generative models |
| 39 | Scroll Behavior | Physics-based simulation with human-like jitter |
| 40 | Typing Speed | Per-character timing from human typing distributions |
| 41 | Click Patterns | Gaussian mixture models for reaction time distributions |
| 42 | Session Timing | AI-varied session durations matching human patterns |
| 43 | Navigation Patterns | Synthetic browsing sequences from Markov models |
| 44 | Form Filling | Human-like field progression with realistic pauses |
| 45 | Writing Style | Stylometric masking via LLM paraphrasing |

### Identity Layer (46-50)
| # | Factor | AI Countermeasure |
|---|---|---|
| 46 | Account Correlation | Separate identities per profile, no cross-contamination |
| 47 | Email/Phone Linkage | Disposable identifiers per profile |
| 48 | Payment Tracking | Cryptocurrency/virtual card isolation |
| 49 | Social Graph | AI-generated realistic but fake social connections |
| 50 | Cross-Device Tracking | Per-device profile isolation, no sync leaks |

---

## 3. Argumentative Report: Why Full Anonymity is "Impossible"

### The 10 Fundamental Barriers

**3.1 Correlation Attacks:** An adversary observing both ends of any anonymity network can correlate traffic patterns. DeepCorr achieves 96% accuracy with only 900 packets. No low-latency anonymity network can fully resist this.

**3.2 Side-Channel Leakage:** Hardware inevitably leaks information through power consumption, electromagnetic emissions, timing variations, and thermal patterns. These signals exist below the software abstraction layer.

**3.3 Timing Analysis:** Even with encryption, packet timing reveals activity patterns. Website fingerprinting attacks on Tor achieve 98% accuracy using deep learning. Constant-rate padding adds 20-100%+ bandwidth overhead.

**3.4 Zero-Day Exploits:** Unknown vulnerabilities can bypass all software defenses. The FBI used NIT malware to de-anonymize Tor users in Operation Playpen (2015). No software can defend against unknown attacks.

**3.5 Human Behavioral Patterns:** Users exhibit unique behavioral biometrics (typing rhythm, mouse movement, session patterns) that persist across identities. Behavioral analysis accuracy exceeds 95% for keystroke dynamics.

**3.6 Metadata Leakage:** Communication metadata (who, when, how much) cannot be hidden without broadcast-based systems. NSA's former director: "We kill people based on metadata."

**3.7 Protocol-Level Identifiers:** TCP/IP, TLS, HTTP/2, QUIC all embed mandatory fingerprinting signals. Standardizing all implementations would require a single software stack.

**3.8 Physical Layer Identification:** GPU manufacturing variations enable DRAWNAPART instance-level fingerprinting. CPU magnetic induction signals (DeMiCPU) are unique per chip. These cannot be changed without replacing hardware.

**3.9 Legal/Jurisdictional Mandates:** KYC laws, data retention directives (EU), SIM registration requirements create mandatory identification points that no technology can bypass.

**3.10 Economic Asymmetry:** Tracking generates $600B+ annually. Anonymity is a cost. The resource imbalance ensures de-anonymization technology advances faster than defense.

---

## 4. Counter-Report: How AI Makes It Possible

### Refutation of Each "Impossibility"

**4.1 vs Correlation Attacks:** AI traffic shaping (Prism, AdvTG) generates adversarial perturbations in real-time that defeat deep learning classifiers. The Prism system (IEEE TIFS 2023) provides real-time protection against temporal network analyzers. AdvTG uses LLMs + reinforcement learning to generate adaptive adversarial traffic. While no system achieves 100% protection, AI reduces correlation accuracy from 96% to under 30%.

**4.2 vs Side-Channel Leakage:** Side-channel attacks require physical proximity or compromised hardware. AI-generated noise injection at the driver level masks power/EM signatures. ONNX Runtime models can detect anomalous sensor readings indicative of side-channel probes and inject countermeasure noise in real-time.

**4.3 vs Timing Analysis:** AI adaptive traffic padding (unlike static padding) adjusts in real-time to the detection model being used. Real-time cluster anonymization (IEEE S&P 2024) groups traffic into indistinguishable clusters. ML-based padding achieves near-static protection with <10% bandwidth overhead vs 100%+ for static methods.

**4.4 vs Zero-Day Exploits:** While no system prevents unknown exploits, AI sandboxing monitors browser process behavior for anomalous patterns. On-device ML models can detect exploit-like behavior (unexpected memory access, process spawning) and terminate sessions before data exfiltration. Camoufox's C++-level integration enables deeper process isolation than JavaScript-only solutions.

**4.5 vs Human Behavioral Patterns:** PATN (Predictive Adversarial Transformation Network, Nov 2025) modifies behavioral signals in real-time before they reach applications. DMTG (Diffusion-based Mouse Trajectory Generator) creates unique, human-like mouse trajectories that bypass biometric detection. LSTM models generate synthetic keystroke dynamics with realistic inter-key timing. Camoufox already includes C++-level human-like mouse movement.

**4.6 vs Metadata Leakage:** Mix networks with AI-optimized batching (Loopix-style) break timing correlations while minimizing latency. AI selects optimal batch sizes and delays based on current traffic patterns, achieving lower latency than static mix networks while maintaining privacy guarantees.

**4.7 vs Protocol-Level Identifiers:** Full-stack protocol impersonation via CycleTLS + HTTP/2 SETTINGS matching + TCP parameter tuning. Firefox/Camoufox avoids Google's binary attestation entirely. AI validates cross-layer coherence (TLS fingerprint matches HTTP/2 behavior matches JS fingerprint) -- something humans cannot verify manually across 55+ parameters.

**4.8 vs Physical Layer Identification:** AI generates spoofed rendering output (Canvas, WebGL, Audio) that is internally consistent with claimed hardware. While physical signals cannot be changed, the browser mediates all hardware access -- AI controls what the website sees vs what the hardware actually does. Performance throttling matches claimed specifications.

**4.9 vs Legal Mandates:** Technology cannot override law, but AI-managed identity separation ensures legal compliance per identity while preventing cross-identity correlation. Each profile can maintain full compliance independently.

**4.10 vs Economic Asymmetry:** AI democratizes defense. A single ONNX model running locally can implement defenses that previously required manual expert configuration. Open-source AI models (Camoufox, DMTG, Patchright) reduce the cost of defense while the cost of tracking infrastructure continues to rise.

---

## 5. Platform Architecture: AnonShield

### 5.1 Recommended Technology Stack

| Layer | Technology | Justification |
|---|---|---|
| **UI Shell** | Tauri (Rust) | 10MB vs 200MB Electron, lower memory, Rust security |
| **Primary Browser Engine** | Camoufox (Firefox fork) | C++-level fingerprint injection, 0% detection rate, resists Google attestation |
| **Secondary Engine** | Patchright + Chrome | Drop-in Playwright replacement for Chrome-required sites |
| **AI Inference** | ONNX Runtime (native) | Cross-platform, CPU/GPU/NPU, sub-ms latency |
| **AI Training** | PyTorch | Industry standard, model export to ONNX |
| **Profile Database** | SQLCipher (SQLite + AES-256) | Encrypted at rest, lightweight |
| **Credential Vault** | libsodium / age | Proven cryptographic libraries |
| **Cloud Sync** | CRDTs + E2E encrypted R2/S3 | Conflict-free, privacy-preserving |
| **Proxy Router** | Custom Go (goproxy base) | High performance, per-profile routing |
| **VPN** | WireGuard (per-profile namespaces) | Modern, fast, per-profile tunnels |
| **DNS** | dnscrypt-proxy / DoH | Encrypted, per-profile configuration |
| **TLS Spoofing** | CycleTLS / curl-impersonate | Explicit JA3/JA4+ control |
| **MCP Server** | @modelcontextprotocol/sdk | Standard MCP with HTTP+SSE transport |
| **Behavioral AI** | DMTG + sigma-lognormal + LSTM | Human-like mouse/keyboard/behavior |
| **Backend** | TypeScript (MCP/UI) + Rust (perf) + Go (networking) | Each language where it excels |

### 5.2 System Architecture

```
+---------------------------------------------------------------+
|                    Profile Management UI                       |
|              (Tauri shell - Rust/WebView)                      |
+---------------------------------------------------------------+
          |                    |                    |
          v                    v                    v
+-------------------+ +------------------+ +------------------+
|  MCP Server       | | Profile Store    | | AI Engine        |
|  (HTTP+SSE)       | | (SQLCipher)      | | (ONNX Runtime)   |
|  - 15+ tools      | | - AES-256-GCM    | | - Fingerprint    |
|  - Session mgmt   | | - CRDT sync      | |   generation     |
|  - n8n integration| | - Per-profile    | | - Behavioral     |
+-------------------+ |   encryption     | |   emulation      |
          |            +------------------+ | - Anomaly        |
          v                    |            |   detection      |
+-------------------+ +------------------+ +------------------+
|  Browser Engine   | | Network Layer    |          |
|  Layer            | |                  |          v
|  +-------------+  | | +------------+  | +------------------+
|  | Camoufox    |  | | | Proxy      |  | | Coherence        |
|  | (Firefox)   |  | | | Router(Go) |  | | Validator        |
|  +-------------+  | | +------------+  | | - Cross-param    |
|  +-------------+  | | +------------+  | |   consistency    |
|  | Patchright  |  | | | WireGuard  |  | | - Real-time      |
|  | (Chrome)    |  | | | Tunnels    |  | |   monitoring     |
|  +-------------+  | | +------------+  | +------------------+
|  +-------------+  | | +------------+  |
|  | Nodriver    |  | | | DoH/DoT    |  |
|  | (minimal)   |  | | | Resolver   |  |
|  +-------------+  | | +------------+  |
+-------------------+ +------------------+
```

### 5.3 AI Fingerprint Generation Pipeline

```
Input: Target profile spec (OS, browser, locale, screen, GPU)
          |
          v
[Conditional GAN trained on real device fingerprints]
          |
          v
[Coherence Validator] ──> Reject if inconsistent ──> Regenerate
          |
          v
Output: Complete fingerprint set:
  - Canvas hash (consistent with claimed GPU)
  - WebGL vendor/renderer + rendering behavior
  - AudioContext output (consistent with audio stack)
  - Font list (OS-matched)
  - Navigator properties (internally consistent)
  - Screen metrics (resolution, DPI, color depth)
  - Hardware concurrency (matching OS profile)
  - TLS/JA4+ fingerprint (matching browser version)
  - HTTP/2 SETTINGS (matching browser implementation)
  - TCP stack parameters (matching OS)
```

### 5.4 Enterprise Architecture: Control Plane + Data Plane

**Positioning:** Defensive privacy automation -- isolation, minimization, leak prevention, governance. Not "anti-detect" or "behavioral simulation."

```
┌─────────────────────────────────────────────────────┐
│                 CONTROL PLANE (MCP Server)            │
│                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Tool     │ │ AuthN/   │ │ Policy   │ │ Audit  │ │
│  │ Registry │ │ AuthZ    │ │ Engine   │ │ Service│ │
│  │ (20+     │ │ (RBAC+   │ │ (drift   │ │ (append│ │
│  │  tools)  │ │  scopes) │ │  detect) │ │  -only)│ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│  ┌──────────────────────┐ ┌──────────────────────┐  │
│  │ Idempotency/Quota    │ │ Tenant Isolation      │  │
│  │ Middleware            │ │ (multi-tenant SaaS    │  │
│  │ (retry-safe)         │ │  or self-hosted)      │  │
│  └──────────────────────┘ └──────────────────────┘  │
├─────────────────────────────────────────────────────┤
│                 DATA PLANE (Connectors)               │
│                                                       │
│  ┌───────────────────┐  ┌───────────────────────┐   │
│  │ Connector A:       │  │ Connector B:           │   │
│  │ Browser Extension  │  │ Managed Sessions       │   │
│  │ - Permission gov.  │  │ - Full env control     │   │
│  │ - Storage partition│  │ - Network namespaces   │   │
│  │ - Leak diagnostics │  │ - AI fingerprint gen   │   │
│  │ - Client-side      │  │ - Session isolation    │   │
│  └───────────────────┘  └───────────────────────┘   │
├─────────────────────────────────────────────────────┤
│              STORAGE & SECRETS                        │
│  Config Store │ Audit Log Store │ Secrets Vault      │
│  (policies)   │ (append-only)   │ (refs only)        │
└─────────────────────────────────────────────────────┘
```

**Personas:**
- **P1: Solo Enterprise User** -- 1 person, many contexts (work/personal/client), needs automation + templates
- **P2: Team Admin** -- manages team, policies, approvals, audit exports, SSO, tenant isolation
- **P3: Security/Compliance Reviewer** -- logging boundaries, key ownership, SBOM, RBAC, provability

**RBAC Roles:** Admin (full access) / Editor (modify workspaces/policies) / Launcher (read-only + launch)

### 5.5 MCP Toolset (20 tools, enterprise-safe naming)

```typescript
// Workspace Management (5 tools)
create_workspace          // Create workspace with AI-generated privacy config
list_workspaces           // List all workspaces (tenant-scoped)
get_workspace             // Get workspace details + privacy posture
update_workspace          // Update workspace configuration
archive_workspace         // Soft-delete workspace (destructive)

// Policy Management (5 tools)
create_policy_template    // Create reusable policy template
list_policy_templates     // List available templates
apply_policy_template     // Apply template to workspace
validate_policy           // Validate policy coherence + risk score
auto_remediate_risks      // Policy-based remediation + audit + optional approval

// Network Policy (3 tools)
set_network_routing       // Configure proxy/VPN (secret refs, no plaintext)
set_dns_policy            // Configure DoH/DoT policy (per-workspace)
check_network_leaks       // Defensive leak check (WebRTC, DNS, TLS)

// Connectors (2 tools)
enroll_connector          // Register browser extension or managed session
bind_workspace_to_connector // Bind workspace to specific connector

// AI-Assisted Privacy (3 tools)
analyze_privacy_posture   // AI analyzes target site's tracking technology
suggest_configuration     // AI recommends optimal workspace config
auto_fix_detection        // Detect and fix privacy inconsistencies

// System (2 tools)
health_check              // System health + connector status
tools_documentation       // Self-documenting tool reference
```

**Tool Contract Pattern:**
```yaml
tool: validate_policy
scopes_required: [policy:validate]
inputs:
  tenant_id: string
  workspace_id: string
  mode: enum[dry_run, apply]
outputs:
  risk_score: number
  findings: [{code, severity, description, recommended_action}]
audit:
  event_type: POLICY_VALIDATED
  include_params_hash: true
idempotency: {required: false}
rate_limit: {tier: standard}
```

**Audit Event Schema:**
```json
{
  "event_id": "uuid",
  "timestamp": "ISO-8601",
  "tenant_id": "t-123",
  "actor": {"type": "user|service", "id": "u-456", "role": "admin"},
  "tool": "apply_policy_template",
  "correlation_id": "n8n-run-xyz",
  "idempotency_key": "optional",
  "params_hash": "sha256(...)",
  "result": {"status": "success|failure", "error_code": "optional"}
}
```

### 5.6 n8n Template Workflows (6 ready-to-use)

1. **Onboarding/Provisioning:** create_workspace -> apply_policy_template -> enroll_connector -> bind -> validate_policy -> compliance snapshot
2. **Policy Drift Monitoring:** Nightly validate_policy -> alert if risk increased -> optional auto_remediate_risks
3. **Exception Approval Workflow:** User request -> approver -> apply exception -> audit entry
4. **Network Hygiene:** set_network_routing -> set_dns_policy -> check_network_leaks -> report
5. **Incident Lockdown:** Switch to "Hardened" template -> freeze exports -> snapshot -> notify
6. **Backup/Export Governance:** Export settings-only (default) -> encrypted blob + TTL -> audit

### 5.7 Deployment Modes

| Mode | Architecture | Auth | Secrets |
|---|---|---|---|
| **Cloud SaaS** | Multi-tenant, OIDC/SSO | Organization-based | Platform-managed vault |
| **Self-hosted** | Single-tenant, Docker Compose/Helm | BYO IdP (OIDC/SAML optional) | BYO Vault/KMS |

Both modes share identical MCP API and tool schemas.

### 5.8 Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Security** | Never plaintext secrets in MCP responses/logs; signed policy versions; SBOM + SCA scanning |
| **Reliability** | MCP Server SLO p95/p99 latency; connector heartbeat; resilient session persistence |
| **Observability** | Tool latencies, error rates, audit volume metrics; correlation_id end-to-end tracing (n8n run -> MCP tool calls) |
| **Idempotency** | Every write tool accepts idempotency_key; repeated runs never create duplicates |

### 5.9 Existing n8n-mcp Code to Reuse

| Component | Path | Reuse For |
|---|---|---|
| IntentSanitizer | `src/telemetry/intent-sanitizer.ts` | PII detection/masking in profile data |
| ConfigManager fingerprinting | `src/telemetry/config-manager.ts` | Machine fingerprint generation patterns |
| MCP server pattern | `src/mcp/server.ts` | Base MCP server architecture |
| Tool definitions pattern | `src/mcp/tools.ts` | Tool schema definitions with annotations |
| Tool documentation system | `src/mcp/tool-docs/` | Documentation structure for new tools |
| Session persistence | `src/types/session-state.ts`, `src/http-server-single-session.ts` | Session export/restore for profiles |
| Database adapter | `src/database/database-adapter.ts` | Universal SQLite adapter pattern |
| Validation patterns | `src/services/config-validator.ts` | Validation profile system (minimal/strict) |

---

## 6. Implementation Plan

### Phase 1: Foundation (MVP)

**Goal:** Core browser with profile management and basic fingerprint spoofing

#### Step 1.1: Project Setup
- Initialize new project in `src/privacy-platform/` directory
- Set up Tauri project structure with Rust backend + TypeScript frontend
- Configure build pipeline (Vite + Tauri + Rust)
- Files: `src/privacy-platform/{Cargo.toml, package.json, tauri.conf.json}`

#### Step 1.2: Profile Storage Engine
- SQLCipher database for encrypted profile storage
- Profile schema: identity, fingerprint config, proxy config, credentials
- CRUD operations with encryption/decryption
- Files: `src/privacy-platform/database/{schema.sql, profile-repository.ts, encryption.ts}`
- Reuse pattern from: `src/database/database-adapter.ts`, `src/database/node-repository.ts`

#### Step 1.3: Camoufox Integration
- Integrate Camoufox as primary browser engine
- Profile-to-fingerprint mapping (Camoufox's addons.json config)
- Browser launch with per-profile network namespace
- Files: `src/privacy-platform/engines/{camoufox-engine.ts, engine-manager.ts}`

#### Step 1.4: Basic Fingerprint Generator (Rule-Based)
- Fingerprint parameter generation matching common device profiles
- Cross-parameter consistency validation
- Database of real-world device configurations
- Files: `src/privacy-platform/fingerprint/{generator.ts, validator.ts, device-profiles.json}`

#### Step 1.5: Proxy Integration
- Per-profile proxy routing (SOCKS5, HTTP, residential)
- Proxy health monitoring
- DNS leak prevention per profile
- Files: `src/privacy-platform/network/{proxy-router.ts, dns-config.ts, leak-detector.ts}`

#### Step 1.6: MCP Server (Core Tools) + Enterprise Foundation
- 10 core MCP tools: create_workspace, list_workspaces, get_workspace, apply_policy_template, validate_policy, set_network_routing, check_network_leaks, enroll_connector, health_check, tools_documentation
- HTTP+SSE transport for multi-client access
- Tool annotations following n8n-mcp patterns
- RBAC middleware (Admin/Editor/Launcher scopes)
- Idempotency middleware for retry-safe operations
- Audit trail service (append-only event logging)
- Files: `src/privacy-platform/mcp/{server.ts, tools.ts, handlers.ts, rbac.ts, audit.ts, idempotency.ts}`
- Reuse: `src/mcp/server.ts` architecture, `src/mcp/tools.ts` annotation patterns

#### Step 1.7: n8n Template Workflows
- 6 ready-to-use n8n workflows (Onboarding, Drift Monitoring, Approval, Network Hygiene, Lockdown, Backup)
- Files: `src/privacy-platform/workflows/{onboarding.json, drift-monitor.json, approval.json, network-hygiene.json, lockdown.json, backup.json}`

### Phase 2: AI Integration

**Goal:** ML-based fingerprint generation and behavioral emulation

#### Step 2.1: ONNX Runtime Integration
- Set up ONNX Runtime for on-device inference
- Model loading and inference pipeline
- Files: `src/privacy-platform/ai/{onnx-engine.ts, model-manager.ts}`

#### Step 2.2: AI Fingerprint Generator
- Train Conditional GAN on real device fingerprint dataset
- Export to ONNX format
- Integrated coherence validation (50-factor cross-check)
- Files: `src/privacy-platform/ai/{fingerprint-model.ts, coherence-validator.ts}`
- Training scripts: `scripts/train-fingerprint-model.py`

#### Step 2.3: Behavioral Emulation
- DMTG for mouse movement generation
- LSTM for keystroke dynamics
- Physics-based scroll simulation
- Gaussian mixture models for click timing
- Files: `src/privacy-platform/ai/behavioral/{mouse-model.ts, keyboard-model.ts, scroll-model.ts, click-model.ts}`

#### Step 2.4: Anomaly Detection
- Isolation Forest / Autoencoder for fingerprint drift detection
- Real-time monitoring during browser sessions
- Auto-alert and remediation triggers
- Files: `src/privacy-platform/ai/{anomaly-detector.ts, session-monitor.ts}`

#### Step 2.5: Extended MCP Tools
- Additional 9 tools: get_profile, rotate_fingerprint, delete_profile, check_network_leaks, configure_dns, export_session, import_session, suggest_config, auto_fix_detection
- Integration with AI engine for suggest_config and auto_fix_detection
- Files: update `src/privacy-platform/mcp/{tools.ts, handlers.ts}`

### Phase 3: Network & Sync

**Goal:** Advanced network privacy and cloud sync

#### Step 3.1: WireGuard Per-Profile Tunnels
- Linux network namespace per profile
- WireGuard interface per namespace
- Auto-configuration from proxy settings
- Files: `src/privacy-platform/network/{wireguard-manager.ts, namespace-manager.ts}`

#### Step 3.2: Advanced DNS
- Per-profile DoH/DoT configuration
- Geographic consistency with proxy location
- Local dnscrypt-proxy integration
- Files: update `src/privacy-platform/network/dns-config.ts`

#### Step 3.3: TLS Coherence
- CycleTLS integration for explicit JA4+ control
- HTTP/2 SETTINGS matching
- TCP parameter tuning per OS profile
- Files: `src/privacy-platform/network/{tls-manager.ts, protocol-matcher.ts}`

#### Step 3.4: Cloud Sync
- E2E encrypted profile sync via CRDT
- Cloudflare R2 / S3 backend
- Client-side AES-256-GCM encryption
- Differential sync (changed state only)
- Files: `src/privacy-platform/sync/{crdt-engine.ts, cloud-storage.ts, sync-manager.ts}`

### Phase 4: Advanced AI

**Goal:** Website analysis, auto-remediation, generative synthetic data

#### Step 4.1: Website Detection Analyzer
- Identify anti-bot technologies on target websites (Cloudflare, DataDome, PerimeterX, FingerprintJS Pro)
- Recommend optimal profile configuration
- Files: `src/privacy-platform/ai/{website-analyzer.ts, defense-recommender.ts}`

#### Step 4.2: Auto-Fix & Remediation
- Automatic fingerprint adjustment when inconsistencies detected
- Real-time session repair without browser restart
- Files: `src/privacy-platform/ai/{auto-fixer.ts, session-repairer.ts}`

#### Step 4.3: Synthetic Data Generation
- Small LLM (Phi-3-mini via ONNX) for text generation
- Synthetic browsing history, cookie sets, form data
- Files: `src/privacy-platform/ai/synthetic/{data-generator.ts, history-generator.ts, form-filler.ts}`

#### Step 4.4: Privacy Advisor MCP
- Full AI-assisted privacy workflow through MCP
- Website analysis -> profile recommendation -> launch -> monitor -> auto-fix
- Integration with n8n workflows for automated privacy management
- Files: update `src/privacy-platform/mcp/` with advisor tools

---

## 7. Open Source Foundation

### Critical Dependencies
| Project | Role | License |
|---|---|---|
| [Camoufox](https://github.com/daijro/camoufox) | Primary browser engine | Open Source |
| [Patchright](https://github.com/Kaliiiiiiiiii-Vinyzu/patchright) | Chrome automation | Apache-2.0 |
| [ONNX Runtime](https://onnxruntime.ai/) | On-device AI inference | MIT |
| [CycleTLS](https://github.com/Danny-Dasilva/CycleTLS) | TLS fingerprint control | MIT |
| [FingerprintJS](https://github.com/fingerprintjs/fingerprintjs) | Testing/validation | MIT |
| [CreepJS](https://github.com/nicedoc/creepjs) | Tampering detection testing | MIT |
| [Tauri](https://tauri.app/) | UI shell | MIT/Apache-2.0 |
| [SQLCipher](https://www.zetetic.net/sqlcipher/) | Encrypted SQLite | BSD |
| [puppeteer-extra-plugin-stealth](https://github.com/berstend/puppeteer-extra) | Reference stealth patterns | MIT |
| [Nodriver](https://github.com/nicedoc/nodriver) | Minimal CDP automation | MIT |

---

## 8. Verification Plan

### Testing Strategy

1. **Fingerprint Coherence Tests**
   - Run generated profiles through FingerprintJS, CreepJS, BrowserLeaks
   - Verify cross-parameter consistency (GPU matches canvas, CPU matches performance)
   - Compare against Pixelscan and IPhey detection

2. **Network Leak Tests**
   - WebRTC leak test (ipleak.net)
   - DNS leak test (dnsleaktest.com)
   - TLS fingerprint test (JA4+ verification)
   - IP consistency verification across all protocols

3. **Behavioral Model Tests**
   - Mouse movement analysis vs human baseline distributions
   - Keystroke timing analysis vs Kloak/PATN benchmarks
   - Scroll behavior naturalness scoring

4. **MCP Integration Tests**
   - All 15 MCP tools functional with n8n workflows
   - Session persistence across reconnections
   - Concurrent multi-profile management

5. **Build & Run Verification**
   ```bash
   # Build
   npm run build
   cd src/privacy-platform && cargo build --release

   # Unit tests
   npm run test:unit -- tests/unit/privacy-platform/

   # Integration tests
   npm run test:integration -- tests/integration/privacy-platform/

   # MCP tool tests
   npm run test:mcp-tools -- --filter privacy

   # Detection bypass rate
   npm run test:detection -- --profiles 100

   # Typecheck
   npm run typecheck
   ```

### Success Criteria

**Privacy Defensive:**
- Zero DNS/WebRTC leaks in all connector modes
- Zero cross-workspace storage bleed (isolation tests)
- Drift detection -> alert within configurable time window
- Cross-parameter consistency score >98% on generated profiles

**MCP/Automation:**
- 100% MCP tools pass contract tests and work with n8n template workflows
- 0 duplicates on retries (idempotency suite)
- 100% tool calls -> audit event (completeness)
- 0 RBAC violations in test suite
- All 20 MCP tools operational with proper annotations

**Reliability/Performance:**
- MCP p95 < 50ms, p99 < 200ms
- Connector reconnect success > 99%
- <5ms fingerprint generation latency (ONNX Runtime)
- Sync correctness: conflicts resolved by CRDT + policy-wins rules

---

## 9. Release Plan

| Phase | Scope | Timeline |
|---|---|---|
| **MVP** | MCP server + 20 tools + n8n templates + cloud + Docker self-hosted baseline | 6-10 weeks |
| **V2** | Extension connector + capability matrix + compatibility suite | 8-12 weeks |
| **V3** | Managed sessions pilot + strict data boundaries + enterprise onboarding | 12-16 weeks |
| **V4** | AI fingerprint generation + behavioral emulation (ONNX/DMTG/LSTM) | 16-20 weeks |
| **Future** | Desktop/agent mode, advanced AI advisor, synthetic data generation | TBD |

---

## 10. Risks and Mitigation

| Risk | Mitigation |
|---|---|
| **Positioning (anti-detect perception)** | Enterprise-safe naming (workspace/policy/posture/risk), non-goals documented, compliance-first docs |
| **Two deployment modes** | Adapters, single codebase, progressive packaging |
| **Two connectors** | Shared policy model + capability matrix + shared workflows |
| **Secrets & audit** | Secret refs only, immutable logs, approvals, retention policies |
| **Google binary attestation** | Firefox-based primary engine (Camoufox) immune to Chrome attestation |
| **AI model drift** | Continuous retraining pipeline, A/B testing of fingerprint profiles |
| **Open source dependency risk** | Pinned versions, fork contingency for critical deps (Camoufox, CycleTLS) |

---

## 11. PRD Addendum: User Stories + Acceptance Criteria

### Epic A: MCP Control Plane (P0)

**US-A1:** As an Admin, I want to create a workspace to separate my contexts (solo enterprise).
- AC: `create_workspace` creates workspace with unique `workspace_id`
- AC: Repeated run with same `idempotency_key` does not create a second workspace
- AC: Audit event `WORKSPACE_CREATED` recorded 100% of the time

**US-A2:** As an Admin/Editor, I want to apply a policy template to a workspace for standardized settings.
- AC: `apply_policy_template` in `dry_run` returns detailed `changes_summary`
- AC: In `apply` mode changes are applied and `POLICY_TEMPLATE_APPLIED` is recorded
- AC: Missing template returns clear error (404/NOT_FOUND) + audit event with `status=failure`

**US-A3:** As a Security reviewer, I want a documented and versioned tool catalog.
- AC: Tool registry provides version + schema hash
- AC: Documentation includes scopes, audit_event, idempotency requirements

### Epic B: RBAC + Scopes

**US-B1:** As an Admin, I want to define roles and scopes to control team actions.
- AC: Every tool requires `scopes_required`
- AC: Execution attempt without required scope returns 403 + audit event
- AC: "Launcher" role cannot call write tools (create/update/apply/remediate) unless explicitly allowed

**US-B2:** As a Team Admin, I want approval gates for high-risk operations.
- AC: `auto_remediate_risks(mode=apply)` with `require_approval=true` requires approval token
- AC: Approval logic is visible in audit (who approved/denied)

### Epic C: Audit & Compliance

**US-C1:** As Compliance, I want an immutable audit trail.
- AC: Every tool call generates audit event with: tenant_id, actor, correlation_id, params_hash, status
- AC: Audit store is append-only (historical entries cannot be edited)

**US-C2:** As Admin, I want to export audit/policy snapshots for reporting.
- AC: `generate_compliance_snapshot` returns list of templates, bindings, exceptions + risk score
- AC: Export format is JSON + hash for integrity (optional enterprise signature)
- AC: Snapshots contain no sensitive data (no cookies/history)

### Epic D: n8n Integration (P0)

**US-D1:** As Ops, I want all MCP tools to work in n8n workflows (template packages).
- AC: At least 6 ready-to-use workflows (Onboarding/Drift/Approvals/Lockdown/Network Hygiene/Remediation)
- AC: n8n retries do not produce duplicates (idempotency)

**US-D2:** As Ops, I want correlation_id to track the entire pipeline.
- AC: n8n run id is passed as `correlation_id` to MCP and visible in audit for every tool call

### Epic E: Connectors (Extension + Managed Sessions)

**US-E1:** As Admin, I want to enroll a connector and bind it to a workspace.
- AC: `enroll_connector` returns `connector_id`, type (extension/managed_sessions)
- AC: `bind_workspace_to_connector` creates binding visible in workspace metadata

**US-E2:** As Admin, I want a capability matrix to know what each connector can enforce.
- AC: Each connector has defined capabilities (permissions/storage/network checks)
- AC: `check_network_leaks` executes only if capabilities allow (otherwise returns "unsupported")

### Epic F: Sync (Cloud + Self-hosted)

**US-F1:** As User, I want E2E sync of policy/templates/configs.
- AC: Sync scope is "configs only" by default
- AC: Keys are tenant-owned; recovery policy is defined
- AC: CRDT conflicts follow "policy-wins" rules for security-sensitive keys

---

## 12. Policy Schema (YAML) + 6 Policy Templates

### 12.1 Canonical Policy Schema

```yaml
policy_template:
  template_id: "tpl-privacy"
  name: "Privacy"
  version: "2026.03.02"
  scope: "tenant"                    # tenant | global
  description: "Defensive privacy posture template"
  defaults:
    mode: "privacy"                  # basic | privacy | hardened | team_strict | travel | dev
    compatibility: "balanced"        # strict | balanced | permissive
  controls:
    permissions:
      camera: "deny"                 # allow | deny | ask
      microphone: "deny"
      location: "ask"
      notifications: "deny"
      clipboard: "ask"
      usb: "deny"
      bluetooth: "deny"
      sensors: "deny"
    storage_isolation:
      third_party_cookies: "block"
      partition_storage: true
      clear_on_exit:
        enabled: true
        include: [cookies, localStorage, indexedDB, serviceWorkers, cache]
    network:
      routing_mode: "direct"         # direct | proxy
      proxy:
        secret_ref: null             # vault://... (if proxy mode)
      dns:
        mode: "system_default"       # system_default | doh | dot
        doh_secret_ref: null
      leak_prevention:
        block_webrtc_ip_leaks: true
        enforce_dns_policy: true
    anti_tracking:
      block_known_trackers: true
      block_third_party_scripts: false
      cname_cloaking_protection: true
      telemetry:
        product_telemetry: "minimized"  # off | minimized | on
    governance:
      require_approval_for:
        - "policy_apply"
        - "auto_remediation_apply"
        - "export_sensitive"
      audit_level: "full"            # none | minimal | full
      rate_limits:
        write_ops_per_min: 60
        remediation_per_hour: 20
    exceptions:
      allow_per_site_exceptions: true
      exception_requires_approval: true
  connector_requirements:
    supported_connectors: [extension, managed_sessions]
    capability_expectations:
      requires_storage_isolation: true
      requires_leak_checks: true
```

### 12.2 Six Policy Templates

| Template | Mode | Compatibility | Key Characteristics |
|---|---|---|---|
| **Basic** | basic | permissive | Minimal intervention, basic isolation, best-effort leak checks |
| **Privacy** | privacy | balanced | Strict isolation (partitioning + clear_on_exit), limited permissions, active anti-tracking |
| **Hardened** | hardened | strict | Default deny for almost everything, no exceptions by default, approvals required |
| **Team-Strict** | team_strict | strict | Like Privacy/Hardened + mandatory governance: approvals by default, lower rate limits, required audit |
| **Travel** | travel | balanced | Fewer leaks on network changes, stable routing/DNS policies, higher compatibility for portals/SSO |
| **Dev** | dev | permissive | Higher compatibility for dev tools, local resources allowed, but with audit + clear exceptions |

---

## 13. n8n -> MCP Mapping Guide

### 13.1 Integration Approaches

| Approach | Description | Complexity |
|---|---|---|
| **A: HTTP Request node** | n8n HTTP Request node -> MCP endpoint (HTTP+SSE via gateway) | Low |
| **B: Custom n8n node** | "MCP Call" node with tool selector, args editor, auto-inject correlation_id, auto-generate idempotency_key | Medium (recommended) |

### 13.2 Retry Rules

| Tool Category | Retries | Backoff | Idempotency Key |
|---|---|---|---|
| **Write tools** (create/update/apply/remediate/set_*) | 2-3 | exponential (1s, 3s, 10s) | `{{$execution.id}}-<step>` (required) |
| **Read tools** (list/get/validate/check) | 3-5 | 1s -> 2s -> 5s | Not required |
| **Rate limited (429)** | Wait + retry | `Retry-After` header | Same key |

### 13.3 Concurrency & Locking

- Operations modifying a single workspace (apply/remediate): use "Queue"/"Limit" strategy -- 1 workflow run per workspace_id
- Read operations: no concurrency limits needed

### 13.4 Secrets Handling

- n8n does not store secrets in plaintext in node params
- Uses credential store or external vault -> MCP receives only `secret_ref`
- MCP never returns secret values in responses or logs

---

## 14. Example: Travel Mode n8n Workflow

```yaml
workflow:
  name: "Travel Mode - Apply Travel Policy + Network Hygiene + Validation"
  trigger:
    type: "manual"
    inputs:
      tenant_id: "t-123"
      workspace_id: "w-789"
      travel_template_id: "tpl-travel"
      proxy_secret_ref: "vault://tenant/proxies/travel-proxy"
      doh_secret_ref: "vault://tenant/dns/travel-doh"
  nodes:
    - id: "apply_travel_template"
      tool: "apply_policy_template"
      args:
        tenant_id: "{{tenant_id}}"
        workspace_id: "{{workspace_id}}"
        template_id: "{{travel_template_id}}"
        idempotency_key: "{{$execution.id}}-apply-travel"
        mode: "apply"

    - id: "set_routing"
      tool: "set_network_routing"
      args:
        tenant_id: "{{tenant_id}}"
        workspace_id: "{{workspace_id}}"
        idempotency_key: "{{$execution.id}}-route"
        routing:
          mode: "proxy"
          proxy_secret_ref: "{{proxy_secret_ref}}"

    - id: "set_dns"
      tool: "set_dns_policy"
      args:
        tenant_id: "{{tenant_id}}"
        workspace_id: "{{workspace_id}}"
        idempotency_key: "{{$execution.id}}-dns"
        dns:
          mode: "doh"
          doh_secret_ref: "{{doh_secret_ref}}"

    - id: "leak_check"
      tool: "check_network_leaks"
      args:
        tenant_id: "{{tenant_id}}"
        workspace_id: "{{workspace_id}}"

    - id: "validate_policy"
      tool: "validate_policy"
      args:
        tenant_id: "{{tenant_id}}"
        workspace_id: "{{workspace_id}}"

    - id: "if_risk_high"
      type: "if"
      condition: "{{$node.validate_policy.output.risk_score > 0.7}}"
      then:
        - id: "remediation_plan"
          tool: "auto_remediate_risks"
          args:
            tenant_id: "{{tenant_id}}"
            workspace_id: "{{workspace_id}}"
            idempotency_key: "{{$execution.id}}-remediate-plan"
            mode: "dry_run"
            require_approval: true

        - id: "approval"
          type: "notify.approvals"
          args:
            approver_group: "tenant-admins"
            message: "Travel remediation plan ready for review"

    - id: "notify"
      type: "notify.slack"
      args:
        channel: "#privacy-ops"
        message: >
          Travel mode applied.
          Leak status={{$node.leak_check.output.status}},
          Risk={{$node.validate_policy.output.risk_score}}.
```

---

## 15. Database Schema & Data Model

### 15.1 Conceptual Data Model

Core entities and their relationships:

```
tenants 1──N tenant_memberships N──1 users
   │
   ├── workspaces ──── workspace_bindings ──── connectors
   │       │
   │       └── policy_assignments ──── policy_template_versions ──── policy_templates
   │
   ├── sessions (managed sessions runtime)
   │
   └── audit_events (append-only, partitioned by month)
```

Cross-cutting fields on all tenant-scoped tables:
- `tenant_id` (multi-tenant scoping)
- `correlation_id` (n8n run id / trace id)
- `idempotency_key` (for write ops retry-safety)
- `deleted_at` (soft delete)
- `created_at` / `updated_at` / `created_by`

### 15.2 PostgreSQL DDL (Cloud SaaS, multi-tenant)

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;    -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;       -- case-insensitive email

-- Tenants
CREATE TABLE tenants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  plan            text NOT NULL DEFAULT 'solo',  -- solo | team | enterprise
  status          text NOT NULL DEFAULT 'active',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);

-- Users
CREATE TABLE users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           citext UNIQUE NOT NULL,
  display_name    text,
  status          text NOT NULL DEFAULT 'active',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);

-- Tenant Memberships (RBAC)
CREATE TABLE tenant_memberships (
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  user_id         uuid NOT NULL REFERENCES users(id),
  role            text NOT NULL,  -- admin | editor | launcher
  created_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  PRIMARY KEY (tenant_id, user_id)
);
CREATE INDEX idx_memberships_user ON tenant_memberships(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_memberships_tenant ON tenant_memberships(tenant_id) WHERE deleted_at IS NULL;

-- Workspaces
CREATE TABLE workspaces (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  display_name    text NOT NULL,
  tags            text[] NOT NULL DEFAULT '{}',
  owner_user_id   uuid REFERENCES users(id),
  status          text NOT NULL DEFAULT 'active',  -- active | archived
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);
CREATE INDEX idx_workspaces_tenant ON workspaces(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_workspaces_tags_gin ON workspaces USING gin(tags);
CREATE UNIQUE INDEX ux_workspaces_tenant_name_active
  ON workspaces(tenant_id, lower(display_name)) WHERE deleted_at IS NULL;

-- Policy Templates (versioned)
CREATE TABLE policy_templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  name            text NOT NULL,
  description     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);
CREATE UNIQUE INDEX ux_policy_templates_tenant_name_active
  ON policy_templates(tenant_id, lower(name)) WHERE deleted_at IS NULL;

CREATE TABLE policy_template_versions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants(id),
  template_id       uuid NOT NULL REFERENCES policy_templates(id),
  version_label     text NOT NULL,
  policy_json       jsonb NOT NULL,
  policy_hash       text NOT NULL,      -- sha256 of normalized policy
  created_by        uuid REFERENCES users(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,
  UNIQUE (tenant_id, template_id, version_label)
);
CREATE INDEX idx_policy_versions_template ON policy_template_versions(tenant_id, template_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_policy_versions_hash ON policy_template_versions(tenant_id, policy_hash) WHERE deleted_at IS NULL;

-- Policy Assignments (history of applied policies per workspace)
CREATE TABLE policy_assignments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES tenants(id),
  workspace_id          uuid NOT NULL REFERENCES workspaces(id),
  template_version_id   uuid NOT NULL REFERENCES policy_template_versions(id),
  applied_by            uuid REFERENCES users(id),
  applied_via           text NOT NULL DEFAULT 'mcp',  -- mcp | ui | system | n8n
  correlation_id        text,
  idempotency_key       text,
  mode                  text NOT NULL DEFAULT 'apply',  -- apply | dry_run
  changes_summary       jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  deleted_at            timestamptz
);
CREATE INDEX idx_policy_assignments_ws_time
  ON policy_assignments(tenant_id, workspace_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_policy_assignments_corr
  ON policy_assignments(tenant_id, correlation_id) WHERE correlation_id IS NOT NULL;

-- Connectors
CREATE TABLE connectors (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  type            text NOT NULL,  -- extension | managed_sessions
  name            text,
  status          text NOT NULL DEFAULT 'active',
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);
CREATE INDEX idx_connectors_tenant_type ON connectors(tenant_id, type) WHERE deleted_at IS NULL;

-- Workspace Bindings
CREATE TABLE workspace_bindings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  workspace_id    uuid NOT NULL REFERENCES workspaces(id),
  connector_id    uuid NOT NULL REFERENCES connectors(id),
  status          text NOT NULL DEFAULT 'active',
  created_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  UNIQUE (tenant_id, workspace_id, connector_id)
);
CREATE INDEX idx_bindings_workspace ON workspace_bindings(tenant_id, workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bindings_connector ON workspace_bindings(tenant_id, connector_id) WHERE deleted_at IS NULL;

-- Sessions (Managed Sessions runtime)
CREATE TABLE sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  workspace_id    uuid NOT NULL REFERENCES workspaces(id),
  connector_id    uuid REFERENCES connectors(id),
  status          text NOT NULL DEFAULT 'running',  -- running | ended | failed
  started_at      timestamptz NOT NULL DEFAULT now(),
  ended_at        timestamptz,
  correlation_id  text,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX idx_sessions_tenant_time ON sessions(tenant_id, started_at DESC);
CREATE INDEX idx_sessions_workspace ON sessions(tenant_id, workspace_id, started_at DESC);

-- Audit Events (append-only, partitioned by month)
CREATE TABLE audit_events (
  id              uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  event_time      timestamptz NOT NULL DEFAULT now(),
  actor_type      text NOT NULL,         -- user | service
  actor_id        uuid,
  actor_role      text,
  tool_name       text,
  action          text NOT NULL,         -- TOOL_CALL, POLICY_APPLIED, etc.
  correlation_id  text,
  idempotency_key text,
  params_hash     text,
  status          text NOT NULL,         -- success | failure
  error_code      text,
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (id, event_time)
) PARTITION BY RANGE (event_time);

-- Monthly partition example
CREATE TABLE audit_events_2026_03 PARTITION OF audit_events
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE INDEX idx_audit_tenant_time ON audit_events(tenant_id, event_time DESC);
CREATE INDEX idx_audit_corr ON audit_events(tenant_id, correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX idx_audit_tool_time ON audit_events(tenant_id, tool_name, event_time DESC) WHERE tool_name IS NOT NULL;
```

### 15.3 Row-Level Security (RLS) for Multi-Tenant Isolation

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Policy: allow access only to rows matching current tenant
CREATE POLICY tenant_isolation ON workspaces
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
-- (Repeat for each table above)

-- Application sets tenant context per connection:
-- SELECT set_config('app.tenant_id', '<tenant-uuid>', true);
```

### 15.4 SQLite DDL (Self-hosted, single-tenant)

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'solo',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE TABLE tenant_memberships (
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  PRIMARY KEY (tenant_id, user_id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  tags_json TEXT NOT NULL DEFAULT '[]',
  owner_user_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (owner_user_id) REFERENCES users(id)
);
CREATE INDEX idx_workspaces_tenant ON workspaces(tenant_id);

CREATE TABLE policy_templates (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE policy_template_versions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  version_label TEXT NOT NULL,
  policy_json TEXT NOT NULL,
  policy_hash TEXT NOT NULL,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (template_id) REFERENCES policy_templates(id),
  UNIQUE (tenant_id, template_id, version_label)
);
CREATE INDEX idx_policy_versions_template ON policy_template_versions(tenant_id, template_id);

CREATE TABLE policy_assignments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  template_version_id TEXT NOT NULL,
  applied_by TEXT,
  applied_via TEXT NOT NULL DEFAULT 'mcp',
  correlation_id TEXT,
  idempotency_key TEXT,
  mode TEXT NOT NULL DEFAULT 'apply',
  changes_summary_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (template_version_id) REFERENCES policy_template_versions(id)
);
CREATE INDEX idx_policy_assignments_ws ON policy_assignments(tenant_id, workspace_id, created_at);

CREATE TABLE connectors (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE workspace_bindings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  connector_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  UNIQUE (tenant_id, workspace_id, connector_id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (connector_id) REFERENCES connectors(id)
);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  event_time TEXT NOT NULL DEFAULT (datetime('now')),
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  actor_role TEXT,
  tool_name TEXT,
  action TEXT NOT NULL,
  correlation_id TEXT,
  idempotency_key TEXT,
  params_hash TEXT,
  status TEXT NOT NULL,
  error_code TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX idx_audit_tenant_time ON audit_events(tenant_id, event_time);
CREATE INDEX idx_audit_corr ON audit_events(tenant_id, correlation_id);
```

**SQLite Retention Strategy:**
- Separate audit files per month: `audit_YYYY_MM.sqlite` (rollover)
- Or periodic cleanup: `DELETE FROM audit_events WHERE event_time < ...; VACUUM;`
- Configurable via `audit_retention_days` setting

### 15.5 MCP/n8n Integration Points

- Every MCP tool call -> INSERT into `audit_events` with `correlation_id` = n8n run id
- Every write tool accepts `idempotency_key` -> stored in `policy_assignments` (or dedicated `idempotency_records` table)
- Drift monitoring: `validate_policy` reads latest `policy_assignment` and compares with current policy instance
- "Current active policy" per workspace: query latest assignment by `workspace_id` (or denormalized `current_policy_assignment_id` on `workspaces` table for faster reads)

---

## 16. Connector Communication Protocol

### 16.1 Design Overview

Unified connector protocol over HTTPS with different push channels per connector type:

| Connector | Pull Channel | Push Channel | Security | Offline Strategy |
|---|---|---|---|---|
| **Extension** (Browser) | REST/HTTPS | SSE (recommended) or WebSocket | JWT/OIDC | fail_open with cached policy |
| **Managed Sessions** (Runtime) | REST/HTTPS | gRPC bidirectional (preferred) or WebSocket | mTLS + short-lived JWT | grace_period then freeze |

The MCP server remains HTTP+SSE for tools. The connector protocol is a separate connector API sharing the same auth/audit/tenancy rules.

### 16.2 Extension Connector Protocol

**Channel A: REST/HTTPS (required)**
```
GET  /v1/connectors/{connector_id}/desired-state
GET  /v1/workspaces/{workspace_id}/policy-bundle?version=...
POST /v1/connectors/{connector_id}/report        # heartbeat + receipts + telemetry
```

REST pull is required because:
- Works behind corporate proxies
- Enables "offline-first" strategy (extension caches last policy)
- Uses ETag/If-None-Match for efficiency + backoff

**Channel B: SSE Push (recommended for MVP)**
```
GET /v1/connectors/{connector_id}/stream          # SSE
```
Server -> connector events: `POLICY_UPDATE_AVAILABLE`, `REVOKE`, `PING`, `ROTATE_KEYS`

WebSocket (`wss://.../v1/connectors/{id}/ws`) is optional for interactive commands.

### 16.3 Managed Sessions Connector Protocol

**gRPC Service (preferred)**
```protobuf
service ConnectorControl {
  rpc ControlStream(stream ConnectorMsg) returns (stream ServerMsg);
}
```

Security: mTLS (runtime certificate pinned to tenant/connector), JWT/OIDC access token with scopes, short-lived tokens + rotation.

Fallback: WebSocket if client lacks gRPC ingress.

### 16.4 Offline/Disconnect Behavior

**Control plane maintains "desired state" per connector:**
- `desired_policy_version`, `desired_policy_hash`, `desired_bindings`, `revoked` flag

**Connector maintains locally:**
- `last_applied_policy_hash`, `last_applied_at`, `capabilities`, `pending_receipts`

**Extension offline:**
1. Continues enforcing last applied policy (cache)
2. Accumulates receipts locally
3. On reconnect: GET desired-state -> fetch policy-bundle if mismatch -> apply -> report receipts
4. Policy flag `governance.offline_mode: fail_open | fail_closed` controls behavior

**Managed sessions offline:**
1. Grace period (10-30 min configurable)
2. Forbids policy changes and high-risk ops during grace period
3. If control plane doesn't return -> end/freeze session
4. Local audit buffer, bulk upload on reconnect

### 16.5 Policy Enforcement Verification (3 Levels)

**Level 0: Receipt-based (MVP)**
Connector returns Policy Receipt:
```json
{
  "tenant_id": "t-123",
  "connector_id": "c-456",
  "workspace_id": "w-789",
  "policy_hash": "sha256:abcd...",
  "applied_at": "2026-03-02T02:55:00Z",
  "connector_version": "1.4.0",
  "capabilities": {
    "can_enforce_permissions": true,
    "can_partition_storage": true,
    "can_run_leak_checks": false
  },
  "config_snapshot_hash": "sha256:efgh...",
  "status": "applied",
  "correlation_id": "n8n-run-xyz"
}
```
Control plane validates receipt matches desired policy, records `POLICY_APPLIED_RECEIPT` audit event.

**Level 1: Challenge-Response**
Control plane sends challenges: "run leak check now", "report permission state", "report storage isolation status". Connector returns evidence payload + signature (or mTLS channel binding).

**Level 2: Attested Execution (Enterprise, managed sessions only)**
Runtime signs receipts with connector key, mTLS cert pinned to tenant, key rotation, tamper-evident logs.

### 16.6 Policy Bundle Format

```yaml
template_id: "tpl-basic"
version_label: "2026.03.02"
policy_hash: "sha256:abcd1234..."
controls:
  permissions: { ... }
  storage: { ... }
  network: { ... }
  anti_tracking: { ... }
  governance: { ... }
connector_requirements:
  min_version: "1.4.0"
  required_capabilities: ["can_enforce_permissions", "can_partition_storage"]
issued_at: "2026-03-02T02:50:00Z"
expires_at: "2026-03-02T03:50:00Z"
```

Properties: versioned, canonical-serialized (JSON canonicalization), hashed (sha256), optionally signed by control plane.

### 16.7 Connector REST API (Full Endpoint List)

```
GET  /v1/connectors/{id}/desired-state
GET  /v1/workspaces/{id}/policy-bundle?version=...
POST /v1/connectors/{id}/heartbeat
POST /v1/connectors/{id}/report                    # receipts, evidence
POST /v1/connectors/{id}/ack                       # ack policy update
POST /v1/connectors/{id}/challenges/{cid}/response
GET  /v1/connectors/{id}/stream                    # SSE (extension)
```

### 16.8 Heartbeat Payload

```json
{
  "last_seen": "2026-03-02T03:00:00Z",
  "connector_version": "1.4.0",
  "current_bindings": ["w-789"],
  "last_applied_policy_hash": "sha256:abcd...",
  "capabilities_hash": "sha256:...",
  "health_status": "healthy"
}
```

### 16.9 Additional DB Tables (extends Section 15)

```sql
-- Connector runtime state
CREATE TABLE connector_state (
  connector_id    uuid PRIMARY KEY REFERENCES connectors(id),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  last_seen_at    timestamptz,
  last_applied_policy_hash text,
  status          text NOT NULL DEFAULT 'unknown',
  capabilities_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_error      text
);

-- Policy receipts (separate from audit for fast queries)
CREATE TABLE policy_receipts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  connector_id    uuid NOT NULL REFERENCES connectors(id),
  workspace_id    uuid NOT NULL REFERENCES workspaces(id),
  policy_hash     text NOT NULL,
  applied_at      timestamptz NOT NULL,
  config_snapshot_hash text,
  correlation_id  text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_receipts_connector ON policy_receipts(tenant_id, connector_id, applied_at DESC);

-- Connector challenges (for Level 1+ verification)
CREATE TABLE connector_challenges (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  connector_id    uuid NOT NULL REFERENCES connectors(id),
  workspace_id    uuid REFERENCES workspaces(id),
  type            text NOT NULL,
  issued_at       timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL,
  status          text NOT NULL DEFAULT 'pending'  -- pending | completed | expired
);
```

### 16.10 Protocol Configuration (YAML)

```yaml
connectors:
  common:
    auth:
      token: "oidc_jwt"
      scopes_required: true
      mtls: false
    heartbeat:
      interval_seconds: 30
      offline_grace_seconds: 600
    verification:
      level: "receipt+challenge"
      receipt_required: true
      challenge_types:
        - "policy_state"
        - "permissions_snapshot"
        - "leak_check_if_supported"
  extension:
    transport:
      pull: "https_rest"
      push: "sse"
      ws_optional: true
    offline_mode_default: "fail_open"
    cache_policy: true
  managed_sessions:
    transport:
      control_stream: "grpc"
      fallback: "websocket"
    auth:
      mtls: true
    offline_mode_default: "grace_then_freeze"
```

---

## 17. AI Model Training Data Pipeline

### 17.1 Public Datasets for Browser Fingerprinting

#### Academic Datasets (no PII)

| Dataset | Source | Records | Attributes | Access |
|---------|--------|---------|------------|--------|
| **AmIUnique** | INRIA/Rennes | 2M+ fingerprints | 17 attributes (Canvas, WebGL, fonts, plugins, UA, timezone, screen) | Published aggregate stats; raw data by request |
| **FPStalker** | INRIA 2018 | 98,598 fingerprints from 1,905 users | Fingerprint evolution over time (longitudinal) | GitHub + paper dataset |
| **Panopticlick/Cover Your Tracks** | EFF | 500K+ | 8+ attributes (fonts, plugins, timezone, screen, UA) | Aggregate data public |
| **FingerprintJS Open Source** | FingerprintJS Inc. | N/A (self-collect) | 30+ components (hash-based) | MIT license for collection code |
| **CreepJS** | Abraham Juliot | N/A (self-collect) | 70+ parameters + tampering detection | MIT license |
| **HTTPArchive/Web Almanac** | Google | Millions of sites | HTTP headers, TLS data, User-Agent distribution | BigQuery public dataset |

#### Typical fingerprint dataset attributes:

**Browser-level:** `navigator.userAgent`, `platform`, `hardwareConcurrency`, `deviceMemory`, `language`, `languages[]`, Canvas 2D hash, WebGL vendor/renderer, AudioContext oscillator, installed fonts, screen dimensions, timezone offset

**Network-level (HTTP/TLS):** JA3/JA4+ TLS fingerprint, HTTP/2 SETTINGS frame (JA4H), Accept-Language ordering, Accept-Encoding capabilities

**System-level (JS probing):** `performance.now()` resolution, Math function precision (`Math.tan()`, `Math.atan()`), WebGL rendering output, Battery API (deprecated)

### 17.2 Ethical Data Collection for Training

#### Approach 1: Opt-in Telemetry (Recommended for MVP)

```yaml
telemetry_collection:
  mode: "opt_in"
  consent:
    granularity: "per_attribute"
    revocable: true
  collection:
    frequency: "on_profile_creation"
    attributes_collected:
      - navigator_properties
      - screen_properties
      - webgl_vendor_renderer
      - canvas_hash           # hash only, NOT raw pixels
      - audio_hash
      - font_list_hash
      - timezone_offset
    attributes_NEVER_collected:
      - cookies, localStorage, browsing history
      - IP address, login credentials, geolocation
  anonymization:
    method: "k_anonymity"
    k_value: 5
    differential_privacy:
      enabled: true
      epsilon: 1.0
      mechanism: "laplace"
  storage:
    retention: "90_days"
    encryption: "AES-256-GCM"
    location: "eu_only"
```

#### Approach 2: Synthetic Data Augmentation

Generate synthetic fingerprints from public statistics (AmIUnique/HTTPArchive distributions) with conditional dependencies (GPU -> Canvas hash -> WebGL renderer).

#### Approach 3: Federated Learning (Enterprise)

Clients train local models, send ONLY gradients to aggregation server. Applies DP-SGD (Differential Privacy Stochastic Gradient Descent) + secure aggregation. No raw data leaves the device.

### 17.3 Full ML Pipeline

```
DATA SOURCES              PREPROCESSING            TRAINING
────────────              ──────────────           ────────
AmIUnique stats ──┐        Feature                 Conditional GAN:
FPStalker data ───┤        Engineering:             Generator:
HTTPArchive ──────┼──────► Categorical encoding ──► Input: noise + condition
Opt-in telemetry ─┤        Numerical normalize       (OS, browser, GPU)
CreepJS probes ───┘        Dependency graph          Output: full fingerprint
                           Train/val split         Discriminator:
                                                    Real/fake scoring
         │
         ▼
VALIDATION               EXPORT                   DEPLOYMENT
──────────               ──────                   ──────────
Coherence tests          PyTorch → ONNX           Model Registry:
Cross-param consistency  (opset 17+)              Version tagging
Detection test           Optimize: onnxruntime    A/B testing
Statistical plausibility Quantize: INT8           Canary rollout
No duplicate of real FPs (2-3x smaller)           Auto-update via connector
```

#### Conditional GAN Architecture:

- **Conditioning variables (22-dim):** os_type (5), browser_family (4), gpu_vendor (5), browser_version_bucket (3), screen_class (5)
- **Generator:** 100-dim noise + 22-dim condition → 256 → 512 → 512 → 128-dim fingerprint vector
- **Discriminator:** 128-dim FP + 22-dim condition → 512 → 256 → 1 (real/fake)
- **Coherence Validator:** Separately trained, validates cross-parameter consistency

#### ONNX Export:

```
FP32 model: ~2.1 MB → Optimized: ~1.8 MB → INT8 quantized: ~0.7 MB (ship this)
```

### 17.4 Model Update Lifecycle

```
TRIGGER                          UPDATE CYCLE              TIMELINE
───────                          ────────────              ────────
New Chrome stable release ──────► Collect + retrain ──────► 24-48 hours
New GPU generation ─────────────► Capture + retrain ──────► 1-2 weeks
Detection rate increase >5% ────► Hotfix (rule-based) ───► 4-8 hours
```

### 17.5 Privacy & Security of the Model Itself

| Attack | Risk | Mitigation |
|--------|------|------------|
| **Model Inversion** | MEDIUM | DP-SGD training (epsilon=1.0) |
| **Membership Inference** | LOW | k-anonymity (k>=5) before training |
| **Model Extraction** | LOW | Model is local (ONNX on device) + obfuscation |
| **Training Data Poisoning** | MEDIUM | Outlier detection + byzantine-resilient aggregation |

---

## 18. Extension vs Managed Sessions — Enforcement Boundaries

### 18.1 Browser Extension Capabilities (Manifest V3)

| Fingerprint Surface | Spoofing Method | Effectiveness | API |
|---------------------|-----------------|---------------|-----|
| **User-Agent** | `declarativeNetRequest` + Content Script override | 95% | `chrome.declarativeNetRequest` |
| **Navigator properties** | Content Script `Object.defineProperty` | 90% | Content Script + `world: "MAIN"` |
| **Canvas 2D** | Hook `toDataURL`/`toBlob`/`getImageData` + noise | 85% | Content Script (MAIN world) |
| **WebGL vendor/renderer** | Hook `getParameter(WEBGL_debug_renderer_info)` | 90% | Content Script (MAIN world) |
| **AudioContext** | Hook `OfflineAudioContext.startRendering` | 80% | Content Script (MAIN world) |
| **Screen properties** | Override `screen.width/height/window.outerWidth` | 85% | Content Script |
| **Timezone** | Override `Intl.DateTimeFormat`, `getTimezoneOffset` | 95% | Content Script |
| **Language** | `declarativeNetRequest` + `navigator.language` override | 95% | Both |
| **Font enumeration** | Block probing or return fixed list | 80% | Content Script |
| **WebRTC IP leak** | `chrome.privacy.network.webRTCIPHandlingPolicy` | 98% | `chrome.privacy` |
| **Cookie isolation** | `chrome.cookies` API + partitioned storage | 90% | `chrome.cookies` |
| **HTTP headers** | `declarativeNetRequest` (30K static + 5K dynamic rules) | 90% | `chrome.declarativeNetRequest` |

**Key technique:** Content Script "MAIN World" injection (`world: "MAIN"`, `run_at: "document_start"`) shares JS context with page, enabling `Object.defineProperty` overrides before any page script runs.

### 18.2 Hard Limitations of Extension Approach

| Limitation | Why Impossible | Impact | Workaround |
|------------|---------------|--------|------------|
| **TLS Fingerprint (JA3/JA4+)** | No access to TLS ClientHello | CRITICAL | Custom browser or proxy only |
| **TCP/IP Stack Fingerprint** | OS-level TCP params invisible to extension | MEDIUM | Network namespace (managed only) |
| **HTTP/2 SETTINGS Frame** | Cannot control HTTP/2 SETTINGS, HPACK | MEDIUM | Browser binary controls this |
| **Browser Binary Attestation** | Web Environment Integrity checks binary | HIGH (future) | Firefox-based browser (immune) |
| **Process-Level Isolation** | Shared browser process | MEDIUM | Managed sessions (separate process) |
| **Network Namespace** | All tabs share one TCP/IP stack | HIGH | Proxy per profile (partial) |

### 18.3 Capability Matrix Summary

```
CAPABILITY                        EXTENSION    MANAGED SESSION
──────────────────────────────    ─────────    ───────────────
Navigator/UA spoofing             ✅ Full       ✅ Full
Canvas fingerprint spoofing       ✅ Good       ✅ Perfect (C++)
WebGL vendor/renderer             ✅ Good       ✅ Perfect (C++)
AudioContext spoofing             ⚠️ Partial   ✅ Full
Font/Screen/Timezone/Language     ✅ Good       ✅ Full
WebRTC IP leak prevention         ✅ Full       ✅ Full
Cookie/storage isolation          ✅ Good       ✅ Perfect
HTTP header modification          ✅ Good       ✅ Full
TLS fingerprint (JA3/JA4+)       ❌ Impossible ✅ Full (CycleTLS)
TCP/IP stack fingerprint          ❌ Impossible ✅ Full (namespace)
HTTP/2 SETTINGS fingerprint       ❌ Impossible ✅ Full
Network namespace isolation       ❌ Impossible ✅ Full (Linux netns)
Process isolation                 ❌ Impossible ✅ Full (container)
Browser binary attestation bypass ❌ Impossible ✅ Full (custom binary)
Behavioral emulation              ⚠️ JS-only   ✅ Full (OS-level)
```

### 18.4 Managed Sessions — Execution Models

#### Option A: Docker Container per Session (Recommended for MVP)

| Parameter | Value |
|-----------|-------|
| Startup time (cold) | 3-5 seconds |
| Startup time (warm pool) | <1 second |
| RAM per session | 512MB - 2GB |
| CPU per session | 0.5 - 2 cores |
| Disk per session | tmpfs (ephemeral), 500MB - 1GB |
| Isolation level | Process + filesystem + network namespace |
| Overhead vs bare metal | ~5-10% |

Isolation layers: network (dedicated namespace + iptables), filesystem (read-only root + tmpfs), process (PID/user namespace + seccomp + no-new-privileges), memory (cgroup limits + OOM kill priority).

#### Option B: Firecracker microVM (Enterprise)

| Parameter | Value |
|-----------|-------|
| Startup | <125ms |
| Memory overhead | ~5MB per VM |
| Isolation | Full VM-level (hardware-enforced) |
| Density | ~1000 sessions per host |
| Limitation | KVM required, no macOS, limited GPU |

#### Option C: gVisor (Compromise)

Intercepts syscalls in userspace. Stronger than Docker, lighter than Firecracker. Limited GPU support.

**Recommendation:** Docker (Phase 1-2) → Docker + gVisor (Phase 3) → Firecracker (Phase 4+)

### 18.5 Cost Model for Managed Sessions

#### Cloud Cost Estimates (AWS):

| Instance | Sessions/host | Cost/session-hour |
|----------|--------------|-------------------|
| **c6i.xlarge** (4 vCPU, 8GB) | 4-6 | $0.028 - $0.043 |
| **c6i.2xlarge** (8 vCPU, 16GB) | 8-12 | $0.028 - $0.043 |
| **m6i.4xlarge** (16 vCPU, 64GB) | 30-50 | $0.015 - $0.026 |
| **Reserved (1yr)** | same | ~40% off |

#### Session Pooling:

```yaml
warm_pool_size: 20
scale_up_threshold: 0.7
scale_up_batch: 10
scale_down_threshold: 0.3
max_idle_time: 30m
max_session_duration: 24h

# Cost at 60 avg active sessions:
# Warm pool (20 idle): ~$0.56/hr
# Active (60): ~$1.80/hr
# Total: ~$1,699/month
# Per-session-hour: ~$0.026 (reserved: ~$0.015)
```

---

## 19. Pricing, Monetization & Go-to-Market

### 19.1 Competitor Pricing (2025-2026)

| Platform | Free | Starter | Pro | Enterprise |
|----------|------|---------|-----|------------|
| **GoLogin** | 3 profiles | $49/mo (100) | $99/mo (300) | $199/mo (2000) |
| **Multilogin** | None | €99/mo (100) | €199/mo (300) | €399/mo (1000+) |
| **AdsPower** | 2 profiles | $9/mo (10) | $40/mo (100) | Custom |
| **Dolphin Anty** | 10 profiles | $89/mo (100) | $159/mo (300) | $299/mo (1000) |
| **Octo Browser** | None | €29/mo (10) | €79/mo (100) | €329/mo (500) |

### 19.2 Open-Core Model

```
OPEN SOURCE (MIT/Apache-2.0)              PAID (Commercial License)
─────────────────────────────             ─────────────────────────
✅ Core MCP server (all 20 tools)         💰 Managed Sessions connector
✅ Extension connector (basic)            💰 AI fingerprint models (ONNX)
✅ Policy engine + templates              💰 Advanced behavioral emulation
✅ SQLite local storage                   💰 Cloud sync (E2E encrypted)
✅ Basic fingerprint generator            💰 SSO/SAML/OIDC integration
   (rule-based, not AI)                   💰 Audit log export + compliance
✅ Network leak detection                 💰 Team collaboration (RBAC)
✅ CLI tools + n8n templates              💰 Priority support + SLA
✅ Self-hosted Docker setup               💰 Auto-remediation (AI)
✅ Basic RBAC (Admin/Launcher)            💰 Custom policy templates
✅ Documentation                          💰 Enterprise audit retention
```

### 19.3 Tier Structure

| Feature | Community (FREE) | Pro ($29/mo) | Team ($79/mo/seat) | Enterprise ($199+/mo) |
|---------|-----------------|-------------|-------------------|----------------------|
| Workspaces | 3 | 25 | 100 | Unlimited |
| Connector | Extension only | Extension + 50 cloud session-hrs | Extension + 200 hrs | Unlimited cloud |
| Fingerprint | Rule-based | AI model | AI + behavioral | Full AI + custom |
| Hosting | Self-hosted | Cloud sync | Cloud + team RBAC | Dedicated infra |
| Support | Community | Email | Priority | Dedicated + SLA |
| Audit retention | None | 30 days | 90 days | Custom |
| SSO | None | None | OIDC | SAML + SCIM |
| Remediation | Manual | Manual | Drift monitoring | Auto-remediate |

#### Usage-Based Add-on:

```yaml
managed_session_hours:
  overage: $0.10/hr
  volume_discount:
    100h: $0.08, 500h: $0.06, 1000h: $0.04

ai_model_updates:
  community: "quarterly"   # 3-month delay
  pro: "monthly"
  team: "weekly"
  enterprise: "real-time"  # <48h from new browser release
```

### 19.4 Target Verticals

| Vertical | Pain Point | Willingness to Pay | Phase |
|----------|-----------|-------------------|-------|
| **QA/Testing Teams** | Realistic fingerprints for cross-browser testing | HIGH ($200-500/mo) | Phase 1 |
| **Security Researchers** | Full fingerprint control, API access | MEDIUM ($50-200/mo) | Phase 1 |
| **Digital Agencies** | Multi-client account management | HIGH ($200-1000/mo) | Phase 2 |
| **E-commerce Operations** | Multi-marketplace profile isolation | MEDIUM ($100-500/mo) | Phase 2 |
| **Compliance/Privacy Officers** | GDPR audit, tracking assessment | VERY HIGH ($500-2000/mo) | Phase 3 |
| **Ad Verification** | Cross-geo ad display verification | HIGH ($500-2000/mo) | Phase 3 |

### 19.5 GTM Strategy

**Positioning:** Enterprise privacy automation platform — "privacy infrastructure as code" (NOT "anti-detect browser").

**GTM Funnel:**
1. **Awareness:** Open-source on GitHub (target 5K stars in 6 months), technical blog, conference talks
2. **Adoption:** `docker compose up` in 5 min, CLI tools, n8n community node
3. **Conversion:** Cloud sync, AI models, managed sessions, team features
4. **Expansion:** SSO/SAML, audit/compliance, SLA, dedicated support

**Revenue Trajectory:**
- Month 3: ~$1,500/mo (50 Pro)
- Month 6: ~$5,000/mo (100 Pro + 20 Team)
- Month 12: ~$25,000/mo (200 Pro + 50 Team + 5 Enterprise)
- Month 18: ~$75,000/mo (Series A readiness)

---

## 20. Integration Matrix

How the 5 architectural answers connect:

```
Q1: DATABASE SCHEMA
    ├──► audit_events ──────────► Q2: CONNECTOR PROTOCOL (receipts, heartbeats)
    ├──► policy_assignments ────► Q4: ENFORCEMENT BOUNDARIES (what CAN be enforced)
    ├──► sessions table ────────► Q4: MANAGED SESSIONS (Docker/Firecracker)
    └──► tenants.plan ──────────► Q5: PRICING (features per tier)

Q3: AI TRAINING PIPELINE
    ├──► ONNX models ──────────► Q4: Extension (JS) vs Managed (native) inference
    ├──► Model updates ────────► Q2: Connector Protocol (model push via SSE/gRPC)
    └──► Training data ────────► Q5: Open-core (basic=free, AI models=paid)
```

---

## 21. Secrets & Key Management

### 21.1 Secret Classes Inventory

| Secret Class | Components Using It | Blast Radius | Rotation Period |
|---|---|---|---|
| **Connector credentials** | API keys, OAuth refresh tokens, client secrets for external systems (CRM, email, payment) | Per-connector | 90 days (scheduled) or immediate (incident) |
| **Platform keys** | DB creds, service-to-service auth, webhook secrets | Platform-wide | 30-90 days |
| **Bundle signing keys** | Policy bundle signatures (control plane → connectors) | All policy enforcement | 1 year (root), 90 days (intermediate) |
| **Data encryption keys (DEK/KEK)** | Envelope encryption for sensitive columns, telemetry | Per-tenant data | KEK: 1 year; DEK: per-session or per-record |
| **TLS certificates** | mTLS between components, Postgres SSL | Service communication | Auto-renew (Let's Encrypt / ACME) |
| **n8n secrets** | Workflow credentials, API keys within n8n | Lateral movement risk — high | 90 days + audit of access |

### 21.2 Connector Key Issuance & Rotation

**Dual Key / Overlapping Validity Model:**

```
Timeline:  ──────────────────────────────────────────►
Key A:     [  active  ][  grace period  ][ revoked ]
Key B:               [  next  ][  active  ][  grace  ]...

Phase 1: Key A is active, Key B issued as "next"
Phase 2: Both accepted during overlap window
Phase 3: Key A revoked, Key B becomes sole active
```

Each credential record contains:
- `key_id`, `status` (active | next | revoked)
- `not_before` / `not_after` (cryptoperiod)
- `tenant_id`, `connector_id` (binding)

**Emergency rotation:** Event-driven (immediate). New key issued as `next`, old key revoked after brief overlap (minutes, not days). All failed auth attempts during rotation logged as security events.

### 21.3 Policy Bundle Signing

**Two proven approaches:**

**Option A: OPA-style Bundle Signing**
- Bundles signed with asymmetric key (Ed25519 or RSA-PSS)
- Connectors verify signatures using public key configured out-of-band
- On verification failure: keep previous bundle, report error, alert
- Rotation: publish new public key in advance, overlap acceptance period

**Option B: TUF (The Update Framework)**
- Role separation: root, targets, snapshot, timestamp keys
- Threshold/M-of-N signing for root key operations
- Enables key compromise recovery without bricking clients
- Better suited for enterprise (more complex but stronger guarantees)

**Recommendation:** OPA-style for MVP → TUF for Enterprise tier.

### 21.4 Self-Hosted Recovery (Without Vault)

**Three realistic options:**

| Approach | Security | Complexity | Cost |
|---|---|---|---|
| **Hardware root** (TPM/USB HSM) + key ceremony | Strongest | Medium | $200-500 per HSM |
| **Offline backup + Shamir's Secret Sharing** | Strong | Low-Medium | Minimal |
| **Combo:** Offline root (threshold) + online KMS-like service | Best balance | Medium | Moderate |

**Break-glass procedure:**
1. Root of trust (KEK, root signing key) stored offline with M-of-N split
2. Operational keys (DEK, connector keys) derived/wrapped by KEK
3. Recovery requires minimum N holders to reconstruct KEK
4. All recovery operations logged in tamper-evident audit

### 21.5 Encryption Strategy

**In Transit:**
- TLS 1.2 minimum, TLS 1.3 preferred (per NIST SP 800-52)
- PostgreSQL native SSL for client-server
- mTLS for managed session connectors
- HTTPS-only for all API endpoints

**At Rest:**
- Disk/volume encryption for whole DB volume (server theft scenario)
- Envelope encryption for sensitive columns/telemetry:
  - Per-tenant DEK stored in DB as "wrapped" (encrypted with KEK)
  - KEK NOT in DB — separate trust boundary (hardware or offline recovery)
  - Follows NIST wrapped key archival model

```
┌─────────────────────────────────────┐
│          Application Layer          │
│  encrypt(data, DEK) → ciphertext   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Key Wrapping Layer          │
│  wrap(DEK, KEK) → wrapped_DEK      │
│  wrapped_DEK stored in DB           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Trust Boundary              │
│  KEK in HSM / offline / threshold   │
│  NEVER in same DB as wrapped_DEK    │
└─────────────────────────────────────┘
```

---

## 22. Implementation Roadmap

### 22.1 Phase Gates

| Phase | Goal | Duration | Exit Criteria |
|---|---|---|---|
| **Foundation** | Security + observability baseline | 2-3 sprints | Threat model done, envelope encryption working, structured logging, AUP + privacy notice drafted |
| **MVP** | Core flow end-to-end | 4-6 sprints | Connector → policy evaluation → n8n execution → audit log; 1-2 reference connectors; basic metrics; legal docs v1 |
| **v1.0** | Production hardening | 4-6 sprints | Key rotation automated, SLO/alerts live, browser regression pipeline, DPA template, tenant isolation proven |
| **v2.0** | Scale & enterprise | 6-8 sprints | Multi-region, TUF-like supply chain, self-hosted variants, ISO 27001 readiness |

### 22.2 Sprint-Level Breakdown (2-week sprints)

**Foundation Phase (Sprints 1-3)**

| Sprint | Deliverables | Dependencies |
|---|---|---|
| **S1** | Threat model + secret inventory; envelope encryption POC (KEK/DEK); structured logging format; CI/CD skeleton | None |
| **S2** | Bundle signing/verification (OPA-style); connector registration protocol; basic health endpoints; AUP + privacy notice v1 | S1: encryption POC |
| **S3** | Observability baseline (OTel Collector + metrics); DB schema migration tooling; security logging (failed auth, rate limits) | S1: structured logging |

**MVP Phase (Sprints 4-9)**

| Sprint | Deliverables | Dependencies |
|---|---|---|
| **S4** | Connector protocol implementation; first reference connector (Extension) | S2: registration protocol |
| **S5** | Policy engine: minimal policy set + enforcement boundary; policy bundle delivery | S2: bundle signing |
| **S6** | n8n integration: limited action set; workflow isolation (minimize blast radius) | S4: connector, S5: policy |
| **S7** | DB schema for auditing + status; audit event pipeline | S3: observability |
| **S8** | E2E tests: happy path; unit + integration for connector/policy | S4-S7 all |
| **S9** | Second reference connector (Managed Sessions basic); MVP dog-fooding | S4: connector protocol |

**v1.0 Hardening Phase (Sprints 10-15)**

| Sprint | Deliverables | Dependencies |
|---|---|---|
| **S10** | Automated key rotation + emergency revoke; dual-key overlap | S2: key lifecycle |
| **S11** | Browser regression pipeline (Chrome stable/beta matrix) | S8: e2e framework |
| **S12** | SLO/SLI definitions + alerting rules + on-call runbooks | S3: observability |
| **S13** | DPA template; data subject request process; retention policies | S7: audit pipeline |
| **S14** | Tenant isolation hardening (RLS verification); load testing | S7: DB schema |
| **S15** | Security audit; penetration test; incident response procedures | S10: key management |

### 22.3 Critical Dependency Graph

```
Threat Model (S1)
    ├──► Envelope Encryption (S1) ──► Bundle Signing (S2) ──► Policy Engine (S5)
    │                                                              │
    ├──► Structured Logging (S1) ──► Observability (S3) ──► SLO/Alerting (S12)
    │                                                              │
    ├──► Connector Registration (S2) ──► Connector Impl (S4) ──► n8n Integration (S6)
    │                                                              │
    └──► AUP + Privacy Notice (S1) ──► DPA Template (S13) ──► DPIA (v2.0)

Bundle Signing (S2) ──── BLOCKS ──── Safe Policy Updates (S5)
Observability (S3) ────── BLOCKS ──── Production Readiness (S12)
Legal Framework (S1) ──── BLOCKS ──── Telemetry Collection (S7)
n8n Isolation (S6) ────── BLOCKS ──── Multi-tenant Sessions (S14)
```

---

## 23. Testing & Detection Validation Strategy

### 23.1 Safe Framing

Testing focus is formulated as:
- **Privacy & environment leakage testing:** Does the managed session environment expose more identifiers/data than needed for its function?
- **Compatibility regression testing:** Does a new browser release break functionality/policies?

This avoids targeting third-party anti-bot/anti-fraud bypass.

### 23.2 Browser Regression Matrix

Chrome releases new stable milestone every 4 weeks, with ~4 weeks in beta before stable.

**Test Matrix:**
| Channel | Purpose | Test Frequency |
|---|---|---|
| **Stable** (current) | Production baseline | On every image/layer change |
| **Beta** (upcoming) | Early warning | Weekly |
| **Canary/Dev** | Horizon scanning | Bi-weekly |

**What to measure (diff vs baseline):**
- New API surface values
- New/changed HTTP headers
- TLS capability changes
- WebRTC behavior changes
- Navigator property changes

### 23.3 Automated Validation Pipeline

```
PIPELINE STAGES
───────────────

1. Golden Sessions (predefined scenarios)
   ├── Login flow
   ├── Navigation + page interaction
   ├── Form submit
   ├── File download/upload
   └── Webhook callback

2. Leakage Snapshots (JSON export)
   ├── CreepJS fingerprint surfaces (privacy leakage diagnostic)
   ├── BrowserLeaks suite (WebRTC, DNS, IPv6, TLS)
   └── Custom checks per policy template

3. Diff Analysis
   ├── Compare against baseline per browser version
   ├── Minor version changes: allow (flag for review)
   ├── Key surface changes: block release (require approval)
   └── Generate diff report with artifacts

4. Quality Gates
   ├── Pass/fail threshold on allowed diffs
   ├── Compatibility pass rate as SLI
   └── Alert on burn rate if pass rate drops
```

### 23.4 Regression on Chrome Release (workflow)

```
Chrome milestone calendar (chromiumdash)
    │
    ├── Beta release → trigger "beta regression suite"
    │   └── Run golden sessions on beta channel
    │   └── Compare fingerprint/leakage snapshots
    │   └── Flag breaking changes → engineering review
    │
    └── Stable release → trigger "stable regression suite"
        └── Run full e2e + leakage checks
        └── Update baseline if passing
        └── Block managed session image update if failing
```

---

## 24. Observability & Monitoring

### 24.1 Architecture

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ MCP Server   │  │ Policy Engine│  │ Managed      │
│ (traces +    │  │ (metrics +   │  │ Sessions     │
│  logs)       │  │  logs)       │  │ (all three)  │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
              ┌──────────▼──────────┐
              │  OTel Collector     │
              │  - Filter/redact PII│
              │  - Add tenant tags  │
              │  - Batch + export   │
              └──────────┬──────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐   ┌──────▼─────┐  ┌──────▼─────┐
    │ Metrics │   │   Logs     │  │  Traces    │
    │ Backend │   │  Backend   │  │  Backend   │
    │(Prometheus)│ │(Loki/ES)  │  │(Jaeger/    │
    │         │   │            │  │ Tempo)     │
    └─────────┘   └────────────┘  └────────────┘
```

OTel Collector is critical because it can filter/redact telemetry (GDPR), add tenant tags, and batch before export.

### 24.2 Log Categories

| Category | Fields | Retention | PII Risk |
|---|---|---|---|
| **Audit log** | tenant_id, actor_id/type, action, result, request_id, timestamps | Per-tier (30/90/custom days) | Low (IDs only) |
| **Security log** | Failed auth, rate limit hits, key rotation, bundle verification failures | 1 year minimum | Medium (IPs) |
| **Execution log** | Workflow runs, latency, retries, external calls | 30 days | Medium (may contain URLs/payloads) |
| **Session log** | Session lifecycle, resource usage, health checks | 7 days | Low |

**PII in logs:** OTel Collector redaction pipeline strips/hashes email, IP, tokens, URL params BEFORE storage. This is both Art. 25 (by design) and cost control.

### 24.3 SLI/SLO Definitions

| SLI | Measurement | SLO Target | Alert Threshold |
|---|---|---|---|
| **Session provisioning success** | % sessions started within 5s | 99.5% | Burn rate > 2x in 1h |
| **Session availability** | % time active sessions accept commands | 99.9% | Burn rate > 5x in 15m |
| **Policy evaluation latency** | p95 decision time | < 50ms | p95 > 100ms for 5m |
| **Connector call reliability** | Success rate by connector type | 99.0% | Drop > 3% in 30m |
| **Bundle update safety** | % successful activations | 99.9% | Any signature verification failure |
| **Compatibility pass rate** | % browser regression tests passing | 95% | Drop > 5% per release |

**Error budget:** 1 - SLO. For 99.9% availability SLO → 0.1% error budget → ~43 min/month downtime allowed. Alert on burn rate, not absolute threshold.

### 24.4 n8n-Specific Monitoring

Recent CVEs show that workflow editing permissions can lead to command execution on the host. Monitor:
- n8n credential access patterns (who accessed which secrets)
- Workflow modification events (new/changed workflows with external calls)
- Resource consumption per workflow execution
- Network calls from n8n to unexpected destinations

---

## 25. Legal & Compliance Framework

### 25.1 GDPR Compliance

**Why telemetry is almost certainly personal data:**
GDPR Art. 4(1) + Recital 30: online identifiers (IP addresses, cookie IDs, session IDs) that leave traces and can be combined for identification are personal data.

**Key Articles to implement:**

| Article | Requirement | Implementation |
|---|---|---|
| **Art. 5** (Principles) | Data minimisation, purpose limitation, storage limitation | OTel redaction pipeline; retention per tier; purpose-bound collection |
| **Art. 25** (By design/default) | Minimal data processing, restricted access, short retention | Default: collect only what's needed; PII stripped at collection time |
| **Art. 32** (Security) | Appropriate technical/organizational measures | Encryption at rest/transit; access control; pseudonymization |
| **Art. 28** (Processor) | DPA with instructions, security, sub-processors, audits | DPA template for customers; sub-processor list; audit rights |
| **Art. 13** (Transparency) | Inform data subjects at collection | Privacy notice; in-product disclosures |
| **Art. 35** (DPIA) | Impact assessment for high-risk processing | DPIA for managed sessions + telemetry (systematic monitoring) |

### 25.2 CCPA/CPRA Compliance

| Requirement | Implementation |
|---|---|
| **Notice at collection** | Before/at collection: categories + purposes disclosed |
| **Service provider contract** | Written agreement: no selling/sharing; restrict combining data |
| **Right to delete** | 45-day response to verifiable consumer request; propagate to sub-processors |
| **Sensitive personal information** | If telemetry includes precise geolocation: stricter purpose limits + opt-out |
| **Minimization** | Only "reasonably necessary and proportionate" collection |

### 25.3 Required Legal Documents

| Document | Phase | Purpose |
|---|---|---|
| **AUP (Acceptable Use Policy)** | Foundation | Prohibit illegal activities, unauthorized bypass of third-party controls, require rights over processed data |
| **Privacy Notice** | Foundation | What telemetry is collected, why, legal basis, retention, rights |
| **Terms of Service** | MVP | Service boundaries, liability, data responsibilities |
| **DPA (Data Processing Agreement)** | v1.0 | Controller/processor obligations, sub-processors, security measures, audit rights, breach notification |
| **DPIA (Data Protection Impact Assessment)** | v1.0 | Assess and mitigate risks for managed sessions + telemetry |
| **Cookie/Tracking Policy** | v1.0 | For web-based dashboard/portal |

### 25.4 Managed Sessions Specific Clauses

- Sessions must not be used for unauthorized access to third-party systems
- Client is responsible for having rights/permissions over processed data
- Telemetry must not contain credentials/secrets (enforced by redaction pipeline)
- Clear controller/processor allocation per use case
- Incident notification: within 72h (GDPR Art. 33), "without unreasonable delay" (CCPA)

---

## 26. Team, Roles & Budget Model

### 26.1 Required Capabilities by Phase

| Capability | Foundation | MVP | v1.0 | v2.0 |
|---|---|---|---|---|
| **Security/Crypto** | Key management policy, encryption design, threat model | Review connector security | Automated rotation, pen test | Supply chain security (TUF), ISO 27001 |
| **Platform/Backend** | DB schema, CI/CD | Connectors, policy engine, n8n integration | Hardening, load testing | Multi-region, self-hosted |
| **SRE/Observability** | Structured logging, basic metrics | Health endpoints, audit pipeline | SLO/alerting, on-call, runbooks | Capacity planning, auto-scaling |
| **QA/Automation** | Unit test framework | Integration + e2e tests | Browser regression pipeline | Cross-platform matrix, chaos testing |
| **Legal/Privacy** | AUP + privacy notice draft | ToS v1 | DPA, DPIA, CCPA process | ISO 27001, SOC 2 prep |

### 26.2 Minimum Team Composition

| Role | Phase 1-2 (Foundation+MVP) | Phase 3 (v1.0) | Phase 4 (v2.0) |
|---|---|---|---|
| Backend/Platform Engineer | 2 | 3-4 | 4-6 |
| Security Engineer | 0.5 (shared) | 1 | 1-2 |
| SRE/DevOps | 0.5 (shared) | 1 | 2 |
| QA/Automation Engineer | 1 | 1-2 | 2 |
| Legal/Privacy Counsel | External | External + 0.5 internal | 1 internal |
| Product Manager | 1 | 1 | 1-2 |
| **Total** | **~5 FTE** | **~7-9 FTE** | **~11-15 FTE** |

### 26.3 Budget Model Template

```
DEVELOPMENT BUDGET (monthly)
= (FTE count by role) × (loaded cost per role) × (months per phase)

INFRASTRUCTURE BUDGET (monthly)
= Compute (managed sessions + services)
+ Storage (DB + logs/traces)
+ Network egress
+ Security tooling (HSM, pen testing, compliance tools)
+ Backups + DR

HIDDEN COST DRIVERS (commonly missed):
├── Logs/traces at high frequency → OTel filtering is financial control
├── n8n patching + hardening + RBAC → CVE risk = ops cost
├── Long telemetry retention + no PII filter → storage + legal risk
└── Unplanned compliance work (DPIA, data subject requests)
```

### 26.4 Cost Optimization Principles

- **Telemetry without filters + long retention = double cost:** (1) storage/observability backend, (2) higher legal risk (more PII at rest, longer). This violates both Art. 5(1)(c) minimisation and Art. 5(1)(e) storage limitation.
- **n8n as component:** Budget for regular patching, hardening, and strict RBAC. Recent CVEs demonstrate that workflow editing can be a gateway to RCE and secret theft.
- **OTel Collector redaction:** Filters PII at pipeline level = reduces both storage cost and GDPR exposure simultaneously.

---

## 27. Cloud Substrate & Migration Track — IONOS Cloud

### 27.1 Migration Context

Current Wallestars stack: n8n (525+ nodes), self-hosted Supabase, Telegram bots, multiple Docker containers on a single VM (2 vCPU / 8 GB RAM). This is a "single-VM reached its ceiling" scenario — combined workload (orchestration + DB + realtime + bots + reverse proxy) lacks RAM/CPU headroom, causing instability under peak load.

**Migration success criteria:**
- Predictable pricing without promotional traps (real cost at renewal)
- Clear SLA with defined measurement
- Stepwise migration: lift-and-shift first (stabilize), then selective managed offload

### 27.2 IONOS Cloud Service Mapping

| Need | IONOS Service | Notes |
|---|---|---|
| **Compute** | Cubes (predefined VMs) or Compute Engine (vCPU/Dedicated Core) | Cubes for quick start; Compute Engine for stricter SLA |
| **Database** | DBaaS Managed PostgreSQL | Replaces self-hosted Supabase DB layer |
| **Cache/Queue** | In-Memory DB (Redis-compatible) | For n8n queue mode or caching layer |
| **Networking** | Private/Public LAN, NIC Firewall, NSG, NAT, Load Balancer | Segmented architecture |
| **IAM** | Users & Groups (RBAC), Token Manager, SAML/OIDC federation | Least-privilege per environment/role |
| **Monitoring** | Monitoring-as-a-Service (free in EU), Logging Service, Flow Logs | Infrastructure-level observability |
| **Container Registry** | Private Container Registry | Reduce public registry dependency |
| **Kubernetes** | Managed Kubernetes (CNCF certified, free control plane) | v2.0 target for clustering |
| **n8n Automation** | Official IONOS n8n community nodes (5 nodes, 200+ operations) | Infrastructure-as-code via n8n |
| **GPU** | GPU VM (H200 profiles, Frankfurt de/fra/2) | Separate AI workload track only |
| **Infrastructure Design** | Data Center Designer (DCD) — browser-based drag-and-drop | Guided (Xpress) or Canvas mode |

### 27.3 Sizing & Pricing (EU Price List, EUR excl. VAT)

**Current baseline:** Hostinger KVM 2 — 2 vCPU / 8 GB RAM / 100 GB NVMe, ~$6.99/mo promo, renews at $14.99/mo.

| IONOS Cube | vCPU | RAM | Storage | Price/hour | Price/30 days | SLA |
|---|---|---|---|---|---|---|
| **Memory Cube S** | 2 | 8 GB | 120 GB | €0.017 | €12.24 | 99.9% |
| **Memory Cube M** | 4 | 16 GB | 240 GB | €0.032 | €23.04 | 99.9% |
| **Basic Cube L** | 8 | 16 GB | 480 GB | €0.044 | €31.68 | 99.9% |

**SLA distinction (from IONOS SLA document):**
- Cubes (including Memory Cubes): **99.9%** monthly availability target
- Compute Engine (vCPU/Dedicated Core): **99.95%** monthly availability target
- DBaaS follows Compute Engine SLA tier

**Traffic & IP costs:**
- Outbound public traffic: free up to 2 TB/month, tiered after
- Internal private traffic: free
- Incoming traffic: free
- 1 dynamic IPv4: free; additional static IPv4: €5.00/30 days

**Practical minimum for Wallestars stability:** Memory Cube M (4 vCPU / 16 GB RAM) at €23.04/mo — roughly 1.5x the Hostinger renewal price but 2x the CPU, 2x the RAM, and no promotional pricing trap.

### 27.4 Target Architecture

**Step 1: Stabilization (Lift-and-Shift)**

```
┌─────────────────────────────────────────────┐
│  IONOS VDC (Frankfurt)                      │
│                                             │
│  ┌──────────────────────────────────┐       │
│  │  Memory Cube M (4 vCPU / 16 GB) │       │
│  │                                  │       │
│  │  ┌─────────┐  ┌──────────┐      │       │
│  │  │ Caddy/  │  │ n8n      │      │  Public│
│  │  │ Nginx   │◄─┤ (Docker) │      │◄─ IP  │
│  │  │ (proxy) │  │ 525+ nodes│     │       │
│  │  └─────────┘  └──────────┘      │       │
│  │  ┌─────────┐  ┌──────────┐      │       │
│  │  │Supabase │  │ Telegram │      │       │
│  │  │(self-   │  │ Bot(s)   │      │       │
│  │  │hosted)  │  │ (Docker) │      │       │
│  │  └─────────┘  └──────────┘      │       │
│  └──────────────────────────────────┘       │
│                                             │
│  Private LAN ────── NSG Firewall            │
└─────────────────────────────────────────────┘
```

Deliverable: same Docker Compose stack on bigger VM. Measurable performance delta.

**Step 2: Selective Managed Offload (v1.0)**

```
┌─────────────────────────────────────────────────────┐
│  IONOS VDC (Frankfurt)                              │
│                                                     │
│  ┌────────────────────┐  ┌──────────────────────┐  │
│  │ Compute (Cube/CE)  │  │ DBaaS Managed PG     │  │
│  │                    │  │ (replaces Supabase DB)│  │
│  │ n8n + Bots + Proxy │──│ SLA + backup + HA    │  │
│  │ (Docker)           │  └──────────────────────┘  │
│  └────────────────────┘                             │
│           │              ┌──────────────────────┐  │
│           └──────────────│ In-Memory DB (Redis) │  │
│                          │ (cache / queue)       │  │
│                          └──────────────────────┘  │
│                                                     │
│  Private Container Registry ── Monitoring-as-a-Svc  │
└─────────────────────────────────────────────────────┘
```

**Step 3: Clustering (v2.0, if load demands)**

Managed Kubernetes (CNCF certified, free control plane, pay only for worker nodes). n8n queue mode: main instance enqueues, workers execute.

### 27.5 IONOS-Specific Secrets & Token Management

| Secret Type | IONOS Mechanism | Rotation | Notes |
|---|---|---|---|
| **Cloud API tokens** | Bearer Token via Auth API (Token Manager in DCD) | Auto-expire after 1 year (subject to change) | Up to 100 tokens; separate by env/role |
| **Object Storage keys** | Separate access key/secret credentials | Manual rotation | Different key domain from Cloud API |
| **n8n infra credentials** | Dedicated bearer token for IONOS n8n nodes | 90 days recommended | Isolate from human admin token |
| **DBaaS credentials** | Managed PostgreSQL connection credentials | Per-environment rotation | Use private LAN connection |

**Least-privilege principle:** n8n infrastructure workflow uses a separate bearer token from human admin DCD access. If n8n credential is compromised, blast radius is limited to infrastructure operations and can be revoked without cutting human access.

### 27.6 Migration Roadmap Integration

| Plan Phase | Migration Track | IONOS Deliverable |
|---|---|---|
| **Foundation (S1-S3)** | Pilot VDC provisioned; mirror production; benchmark | Free trial VDC; baseline measurements (n8n workflow time, DB latency, memory pressure) |
| **MVP (S4-S9)** | Lift-and-shift to Memory Cube M; DNS cutover | Single VM stable; Docker Compose running; observability connected |
| **v1.0 (S10-S15)** | DB → DBaaS PostgreSQL; Redis → In-Memory DB; n8n queue mode | Managed stateful services with SLA; reduced ops burden |
| **v2.0 (S16+)** | Managed Kubernetes; multi-node workers; container registry | CNCF K8s; auto-scaling; private image pulls |

### 27.7 Migration Testing Strategy

| Test Type | What | When |
|---|---|---|
| **Functional** | Webhooks, background jobs, DB migrations, Telegram bot responses | Before DNS cutover |
| **Load** | n8n concurrency + DB/Redis latency under simulated peak | Pilot phase |
| **Resilience** | Container restart, failover behavior, backup restore | Before v1.0 go-live |
| **Rollback** | DNS cutover as last step; test via separate subdomain + allow-list first | Every phase |

**Rollback strategy:** DNS cutover is the final step. Before that, test new endpoint via separate subdomain. Automate via IONOS Cloud DNS + n8n workflow (official node package includes DNS operations).

### 27.8 IONOS Observability Stack

| Layer | IONOS Service | Cost (EU) | Use Case |
|---|---|---|---|
| **Infrastructure metrics** | Monitoring-as-a-Service | Free | CPU, RAM, disk, network per VM |
| **Logs** | Logging Service | Per-tier pricing | Structured application/security logs |
| **Network analysis** | Flow Logs | Included | Firewall/NSG traffic analysis |
| **Application metrics** | OTel Collector → external backend | Self-managed | n8n workflow metrics, custom SLIs |

**Practical scenario:** On webhook burst (Telegram bot or external integration), correlate: CPU steal/usage on VM + queue depth (if queue mode) + PostgreSQL connections + error rate + flow logs for rejected traffic. Combination gives fast root cause: resource limit vs network rule vs external service.

### 27.9 GDPR & Data Residency

- **Data center:** Frankfurt am Main (EU residency)
- **IONOS role:** Processor for customer data; customer is Controller
- **Controller-Processor agreement:** Required per GDPR Art. 28; IONOS provides standard DPA
- **Telemetry retention:** Define in observability section (14/30/90 days by log category)
- **Pseudonymization:** Apply where applicable in logging pipeline
- **Data subject requests:** Export/delete procedures via audit pipeline

### 27.10 Cost Projection (Wallestars Full Stack)

| Component | Monthly Cost (EUR) | Notes |
|---|---|---|
| Memory Cube M (4 vCPU / 16 GB) | €23.04 | Main compute |
| DBaaS PostgreSQL (v1.0+) | ~€25-50 | Depends on instance size |
| In-Memory DB Redis (v1.0+) | ~€15-30 | Small instance sufficient |
| Static IPv4 | €5.00 | 1 additional IP |
| Egress (<2 TB) | €0.00 | Free tier |
| Monitoring-as-a-Service | €0.00 | Free |
| **Step 1 Total (lift-and-shift)** | **~€28** | VM + IP only |
| **Step 2 Total (managed offload)** | **~€70-110** | VM + DBaaS + Redis + IP |

Compared to Hostinger KVM 2 renewal at ~$14.99/mo (~€14): Step 1 is ~2x cost but with 2x CPU, 2x RAM, minute-billing, no renewal trap, and 99.9% SLA. Step 2 adds managed services that eliminate DBA/ops burden for stateful components.

### 27.11 GPU Track (Separate from Production)

IONOS H200 GPU VMs (Frankfurt de/fra/2):
- H200-S: 1 GPU, 15 dedicated vCPU, 267 GiB RAM — ~€2.554/hour
- API-only provisioning

This is a separate AI workload track (model training/inference). Do not mix with production automation VM.

---

## 28. Security & Compliance Reframing — Defensive Privacy Automation

### 28.1 Executive Summary

The platform concept contains technically strong ideas (policy engine, isolation, audit, MCP/n8n integration, on-device AI). However, the "anti-detection" positioning — designed to "pass validation" and generate "synthetic identities that look realistic" — falls into a high-risk zone. It can be used to circumvent third-party protective mechanisms (anti-bot/anti-fraud), which often violates terms of service and may have legal consequences.

**This section reframes the platform as "Privacy Policy & Isolation Platform" — defensive privacy automation — while preserving all useful technical components.**

### 28.2 Factual Foundation

#### Anti-Bot Systems are Multi-Layered

| Provider | Detection Approach | Implications |
|---|---|---|
| **Cloudflare** | Separate engines: Heuristics, JS detections, ML engine (business/enterprise) | Single-layer countermeasures are fragile |
| **DataDome** | "Device Check": client-side JS, hundreds of signals, automation/spoofing checks | Passive fingerprinting alone is insufficient for detection |
| **Akamai** | AI/ML behavioral analysis + browser/device fingerprinting + user-interaction signals + continuous learning | Dynamic, multi-signal — static configs become outdated |

**Implication:** Any strategy based on single-layer, static settings is operationally brittle for legitimate purposes and high-risk for misuse.

#### Traffic Correlation Limits

| Research | Finding | Relevance |
|---|---|---|
| **Deep Fingerprinting (CCS 2018)** | >98% accuracy on Tor traffic without defenses | Website fingerprinting is a real threat to anonymity |
| **DeepCorr** | ~96% accuracy with ~900 packets observation | Flow correlation via deep learning limits low-latency anonymity guarantees |
| **Mockingbird (IEEE TIFS)** | Adversarial traces can reduce attacker accuracy at cost of overhead | AI can reduce extractable information for defensive privacy |
| **Prism (IEEE TIFS 2023)** | Online traffic perturbation protects against temporal analyzers | Defensive AI perturbation is a valid research direction |

#### Browser Fingerprinting: "Hide in the Crowd" vs "Realistic Profiles"

| Approach | Used By | Strategy | Risk |
|---|---|---|---|
| **Reduce entropy / hide in crowd** | Tor Browser, Mullvad Browser | Letterboxing (bucket viewport sizes), uniform fingerprints per OS | Low — maximizes anonymity set |
| **Realistic synthetic profiles** | Anti-detect browsers | Generate unique-looking profiles | HIGH — rare/incompatible attribute combos increase uniqueness |

**Tor Browser** uses letterboxing to reduce screen-size uniqueness. **Mullvad Browser** targets "nearly identical fingerprint" for all users on one OS. These are proven privacy strategies.

**Key design choice:** Unified profiles (OS-based buckets) > "realistic" per-user profiles for privacy.

#### Web Environment Integrity (Attestation) Status

- W3C position: WEI is NOT a W3C work item and has no standing in W3C process
- Google: WEI is no longer being pursued by Chrome team; replaced by narrower "Android WebView Media Integrity API" for embedded media
- **Conclusion:** No universal Chrome web attestation standard exists currently, but platform integrity mechanisms evolve in specific contexts

### 28.3 Critical Positioning Correction

| Aspect | Current (Risky) | Corrected (Defensible) |
|---|---|---|
| **Product goal** | "Anti-detection", "pass validation", "synthetic identities" | "Privacy-by-design", "isolation", "policy governance", QA/compliance for own assets |
| **Identity model** | Generate "realistic" per-user profiles | "Hide-in-the-crowd": unified profiles (OS-based buckets), Tor/Mullvad approach |
| **Fingerprint surfaces** | 50+ factors, "coherence for realism" | Minimize entropy + permanent state; coherence engine evaluates privacy leakage, not "realism" |
| **Attestation** | "Dual-engine against attestation" | Treat as compatibility constraint; policy-based degrade when site requires integrity |
| **Test KPIs** | "Detection bypass rate" | "Leak-free rate", "policy compliance", "compatibility pass rate", "SLO p95/p99" |
| **Telemetry** | "Opt-in for training" | DPIA for systematic monitoring; collect only hashes/aggregates; short retention |
| **MCP tools** | Tools with "auto_fix_detection" semantics | "Privacy posture / drift remediation" naming; proof-of-authorization for target sites |

### 28.4 Risk Distribution

| Risk Category | Weight | Description |
|---|---|---|
| **Abuse/Legal** | 35% | Anti-detect goals; circumventing third-party protections; computer crime statutes |
| **Security** | 25% | Key management, supply chain, multi-tenant isolation |
| **Privacy/Compliance** | 20% | Telemetry as PII, GDPR Art. 32, data minimization |
| **Reliability/Operations** | 12% | Sync, sessions, updates, SLO |
| **Maintainability** | 8% | Fork drift, dependency churn |

**Corrected positioning eliminates the 35% abuse/legal risk entirely**, making the remaining risks manageable through standard engineering and compliance practices.

### 28.5 Corrected Architecture

```
┌─────────────────────────────────────────────┐
│  Desktop App (Tauri)                        │
│  ┌────────────┐  ┌──────────────────┐       │
│  │ Policy     │  │ MCP Server       │       │
│  │ Engine     │──│ (tools + scopes  │       │
│  │ (templates │  │  + audit)        │       │
│  │ + excepts) │  └────────┬─────────┘       │
│  └────────────┘           │                 │
│                  ┌────────▼─────────┐       │
│                  │ n8n Workflows    │       │
│                  │ (approval + drift│       │
│                  │  + reporting)    │       │
│                  └────────┬─────────┘       │
│                           │                 │
│              ┌────────────┼────────┐        │
│              │            │        │        │
│  ┌───────────▼──┐ ┌──────▼─────┐ ┌▼──────┐│
│  │ Browser      │ │ Managed    │ │ Leak  ││
│  │ Instance     │ │ Session    │ │ Diag- ││
│  │ (standard    │ │ (isolation │ │ nostic││
│  │  + privacy   │ │  + netns)  │ │ (DNS/ ││
│  │  settings)   │ │            │ │ WebRTC││
│  └──────────────┘ └────────────┘ │ /stor)││
│                                   └───────┘│
│  ┌──────────────┐  ┌──────────────────┐    │
│  │ Config Store │  │ Audit Log        │    │
│  │ (SQLCipher)  │  │ (append-only)    │    │
│  └──────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────┘
```

Compatible with MCP SDK standard transports and n8n MCP Server Trigger (SSE/streamable HTTP).

### 28.6 Corrected MCP Tool Contract Example

```yaml
tool: validate_privacy_policy
scopes_required: [policy:validate]
inputs:
  tenant_id: string
  workspace_id: string
  mode: enum[dry_run, apply]
outputs:
  posture_score: number          # 0..1, higher is better
  findings:
    - code: string
      severity: enum[low, medium, high, critical]
      description: string
      recommended_action: string
audit:
  event_type: POLICY_VALIDATED
  include_params_hash: true
idempotency:
  required: false
```

### 28.7 Corrected Policy Template (Privacy)

```yaml
policy_template:
  template_id: "tpl-privacy"
  name: "Privacy"
  version: "2026.03.02"
  description: "Privacy posture (defensive) - isolation, minimization, leak checks"
  controls:
    permissions:
      camera: "deny"
      microphone: "deny"
      location: "ask"
      notifications: "deny"
      usb: "deny"
      bluetooth: "deny"
      sensors: "deny"
    storage_isolation:
      third_party_cookies: "block"
      partition_storage: true
      clear_on_exit:
        enabled: true
        include: [cookies, localStorage, indexedDB, serviceWorkers, cache]
    network:
      routing_mode: "direct"         # direct | proxy | vpn
      dns:
        mode: "system_default"       # system_default | doh | dot
      leak_checks:
        enabled: true
        webrtc_leak_check: true
        dns_leak_check: true
    governance:
      audit_level: "full"            # none | minimal | full
      require_approval_for:
        - "policy_apply"
        - "export_config"
      rate_limits:
        write_ops_per_min: 60
```

### 28.8 Corrected n8n Drift Monitoring Workflow

```
Scheduled trigger (nightly)
    │
    ▼
validate_privacy_policy (dry_run)
    │
    ├── posture_score >= threshold? ──► Write audit snapshot (done)
    │
    └── posture_score < threshold?
        │
        ▼
    Create remediation plan (dry_run)
        │
        ▼
    Approval gate (human review)
        │
        ▼
    Apply remediation
        │
        ▼
    Write audit snapshot
```

### 28.9 Prioritized Action Plan (Corrected)

| Priority | Action | Effort | Risk | Why First |
|---|---|---|---|---|
| **P0** | Rewrite AUP/ToS + product positioning to "defensive privacy automation" | 2-5 days | Low | Eliminates abuse risk; makes project fundable/sellable (enterprise-safe) |
| **P0** | Threat model + abuse-case review | 3-7 days | Low-Med | Anti-bot providers describe targeted threats (ATO, fake accounts); need guardrails |
| **P0** | MCP core: RBAC + scopes + idempotency + audit (append-only) | 2-3 weeks | Med | Backbone for n8n integration; no controllability without it |
| **P0** | Policy schema v1 + 3 templates (Basic/Privacy/Hardened) | 1-2 weeks | Med | Real product without "anti-detect"; builds on W3C/Mozilla practices |
| **P1** | Secure storage: SQLCipher + key management + backup rules | 1-2 weeks | Med | GDPR Art. 32 requires appropriate measures; encryption needs key lifecycle |
| **P1** | Leak diagnostic module (DNS/WebRTC/storage) + report | 2-4 weeks | Med | Legitimate value proposition; measurable result against leakage risk |
| **P1** | n8n templates: onboarding, drift monitoring, approval gates | 1-2 weeks | Low-Med | n8n excels at governance workflows; MCP trigger simplifies integration |
| **P2** | On-device AI for "privacy posture scoring" + drift detection (ONNX) | 3-6 weeks | Med | Use for diagnostics, NOT evasion |
| **P2** | E2E sync (configs-only) + E2E encryption + recovery policy | 4-8 weeks | High | Sync + keys + recovery are complex; defer until stable core |

### 28.10 Supply Chain & Dependency Safety

| Risk | Current Approach | Corrected Approach |
|---|---|---|
| Forks claiming "undetected"/"stealth" | Dependency on community forks | Use only upstream/official releases; audit all deps |
| "Synthetic identity" as feature | Generates data usable for fraud/social engineering | Generate privacy profiles (unified buckets), not identities |
| "0% detection" guarantees | Methodologically unsound (dynamic multi-signal systems) | Measure "leak-free rate" and "policy compliance" instead |
| Telemetry for model training | Collect real fingerprints | Collect only hashes/aggregates; DPIA required; short retention |

### 28.11 Legal Framework Alignment

| Law/Standard | Relevant Provision | Platform Implication |
|---|---|---|
| **GDPR Art. 5** | Data minimization, purpose limitation | Telemetry pipeline: redact/hash before storage |
| **GDPR Art. 25** | Privacy by design/default | Default: minimal data, restricted access, short retention |
| **GDPR Art. 32** | Security of processing | Encryption at rest/transit; access control; pseudonymization |
| **GDPR Art. 35** | DPIA for high-risk processing | Required if systematic monitoring of behavior |
| **W3C Fingerprint Guidance** | Mitigating Browser Fingerprinting in Web Specifications (2025) | Framework for legitimate product positioning |
| **Bulgarian Computer Crime Law** | Unauthorized actions against computer systems/data are criminalized | AUP must prohibit unauthorized circumvention of third-party protections |
| **Anti-Bot Provider ToS** | Circumvention typically violates service agreements | Enterprise clients need domain allowlist + proof-of-authorization |

### 28.12 Key Terminology Corrections

| Old Term (Risky) | New Term (Defensible) | Rationale |
|---|---|---|
| Anti-detect browser | Privacy policy & isolation platform | Removes adversarial framing |
| Synthetic identity | Privacy profile (unified bucket) | Removes fraud association |
| Detection bypass rate | Leak-free rate / policy compliance | Measures defense, not offense |
| Fingerprint spoofing | Fingerprint minimization | Aligns with W3C/Tor approach |
| Evade attestation | Compatibility constraint handling | Treats attestation as fact, not target |
| auto_fix_detection | privacy_posture_remediation | Removes detection-bypass semantics |
| Pass validation | Meet privacy posture targets | Defensive framing |
