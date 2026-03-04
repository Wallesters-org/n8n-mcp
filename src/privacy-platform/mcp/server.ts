import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { privacyPlatformTools } from './tools.js';
import { PrivacyToolHandlers } from './handlers.js';
import { PrivacyRepository } from '../database/repository.js';
import { DatabaseAdapter } from '../../database/database-adapter.js';
import { RequestContext, Role } from '../types/index.js';
import { buildRequestContext } from '../services/rbac.js';
import * as fs from 'fs';
import * as path from 'path';

const PLATFORM_VERSION = '0.1.0';

export interface PrivacyServerOptions {
  db: DatabaseAdapter;
  defaultTenantId?: string;
  defaultUserId?: string;
  defaultRole?: Role;
}

/**
 * Privacy Platform MCP Server
 *
 * Provides 10 core tools for privacy workspace management, policy enforcement,
 * and connector enrollment via the Model Context Protocol.
 */
export class PrivacyMCPServer {
  private server: Server;
  private handlers: PrivacyToolHandlers;
  private repository: PrivacyRepository;
  private options: PrivacyServerOptions;

  constructor(options: PrivacyServerOptions) {
    this.options = options;
    this.repository = new PrivacyRepository(options.db);
    this.handlers = new PrivacyToolHandlers(this.repository);

    // Initialize database schema
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      this.repository.initSchema(schema);
    }

    // Create MCP server
    this.server = new Server(
      {
        name: 'privacy-platform',
        version: PLATFORM_VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.registerHandlers();
  }

  private registerHandlers(): void {
    // List tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: privacyPlatformTools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          annotations: tool.annotations,
        })),
      };
    });

    // Call tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: params } = request.params;
      const ctx = this.buildContext(request);
      return this.handlers.handleToolCall(name, params ?? {}, ctx);
    });
  }

  /**
   * Build request context from MCP request.
   * In production, this would extract tenant/user from auth headers.
   * For now, uses defaults from server options.
   */
  private buildContext(request: unknown): RequestContext {
    return buildRequestContext({
      tenantId: this.options.defaultTenantId ?? 'default-tenant',
      userId: this.options.defaultUserId ?? 'default-user',
      role: this.options.defaultRole ?? 'admin',
    });
  }

  /**
   * Get the underlying MCP Server instance for transport binding
   */
  getServer(): Server {
    return this.server;
  }

  /**
   * Get the repository for direct access (testing, seeding)
   */
  getRepository(): PrivacyRepository {
    return this.repository;
  }
}
