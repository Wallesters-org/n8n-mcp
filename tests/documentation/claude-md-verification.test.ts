/**
 * CLAUDE.md Documentation Verification Tests
 * 
 * This test suite verifies that the information documented in CLAUDE.md
 * matches the actual state of the codebase.
 * 
 * Conceived by Romuald Członkowski - www.aiadvisors.pl/en
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import packageJson from '../../package.json';

const REPO_ROOT = join(__dirname, '../..');
const CLAUDE_MD_PATH = join(REPO_ROOT, 'CLAUDE.md');

describe('CLAUDE.md Documentation Verification', () => {
  const claudeMd = readFileSync(CLAUDE_MD_PATH, 'utf-8');

  describe('Version Information', () => {
    it('should have correct package version', () => {
      expect(claudeMd).toContain(`**Current Version:** ${packageJson.version}`);
    });

    it('should have correct MCP SDK version', () => {
      const mcpVersion = packageJson.dependencies['@modelcontextprotocol/sdk'];
      expect(claudeMd).toContain(`**MCP SDK Version:** ${mcpVersion}`);
    });
  });

  describe('Architecture Structure', () => {
    const directories = [
      'src/config',
      'src/loaders',
      'src/parsers',
      'src/mappers',
      'src/database',
      'src/services',
      'src/types',
      'src/constants',
      'src/errors',
      'src/templates',
      'src/mcp',
      'src/mcp/tool-docs',
      'src/utils',
      'src/n8n',
      'src/scripts',
    ];

    directories.forEach((dir) => {
      it(`should have ${dir} directory`, () => {
        const fullPath = join(REPO_ROOT, dir);
        expect(existsSync(fullPath)).toBe(true);
      });
    });

    const keyFiles = [
      'src/config/n8n-api.ts',
      'src/loaders/node-loader.ts',
      'src/parsers/node-parser.ts',
      'src/parsers/property-extractor.ts',
      'src/parsers/simple-parser.ts',
      'src/mappers/docs-mapper.ts',
      'src/database/database-adapter.ts',
      'src/database/node-repository.ts',
      'src/services/property-filter.ts',
      'src/services/config-validator.ts',
      'src/services/type-structure-service.ts',
      'src/services/expression-validator.ts',
      'src/services/workflow-validator.ts',
      'src/mcp/server.ts',
      'src/mcp/tools.ts',
      'src/mcp/tools-n8n-manager.ts',
      'src/http-server.ts',
      'src/http-server-single-session.ts',
      'src/mcp-engine.ts',
      'src/index.ts',
    ];

    keyFiles.forEach((file) => {
      it(`should have ${file} file`, () => {
        const fullPath = join(REPO_ROOT, file);
        expect(existsSync(fullPath)).toBe(true);
      });
    });
  });

  describe('MCP Tools Count', () => {
    it('should document 20 total MCP tools', () => {
      expect(claudeMd).toContain('**Total MCP Tools:** 20 tools with full annotations');
    });

    it('should have 7 main tools in tools.ts', () => {
      const toolsFile = readFileSync(join(REPO_ROOT, 'src/mcp/tools.ts'), 'utf-8');
      const toolNames = [
        'tools_documentation',
        'search_nodes',
        'get_node',
        'validate_node',
        'get_template',
        'search_templates',
        'validate_workflow',
      ];
      
      toolNames.forEach(name => {
        expect(toolsFile).toContain(`name: '${name}'`);
      });
    });

    it('should have 13 n8n management tools in tools-n8n-manager.ts', () => {
      const managerFile = readFileSync(join(REPO_ROOT, 'src/mcp/tools-n8n-manager.ts'), 'utf-8');
      const toolNames = [
        'n8n_create_workflow',
        'n8n_get_workflow',
        'n8n_update_full_workflow',
        'n8n_update_partial_workflow',
        'n8n_delete_workflow',
        'n8n_list_workflows',
        'n8n_validate_workflow',
        'n8n_autofix_workflow',
        'n8n_test_workflow',
        'n8n_executions',
        'n8n_health_check',
        'n8n_workflow_versions',
        'n8n_deploy_template',
      ];
      
      toolNames.forEach(name => {
        expect(managerFile).toContain(`name: '${name}'`);
      });
    });
  });

  describe('Tool Documentation Structure', () => {
    const toolDocsDirs = [
      'src/mcp/tool-docs/configuration',
      'src/mcp/tool-docs/discovery',
      'src/mcp/tool-docs/guides',
      'src/mcp/tool-docs/system',
      'src/mcp/tool-docs/templates',
      'src/mcp/tool-docs/validation',
      'src/mcp/tool-docs/workflow_management',
    ];

    toolDocsDirs.forEach((dir) => {
      it(`should have ${dir} directory`, () => {
        const fullPath = join(REPO_ROOT, dir);
        expect(existsSync(fullPath)).toBe(true);
      });
    });

    it('should have tool-docs index.ts', () => {
      const indexPath = join(REPO_ROOT, 'src/mcp/tool-docs/index.ts');
      expect(existsSync(indexPath)).toBe(true);
    });

    it('should have tool-docs types.ts', () => {
      const typesPath = join(REPO_ROOT, 'src/mcp/tool-docs/types.ts');
      expect(existsSync(typesPath)).toBe(true);
    });
  });

  describe('NPM Scripts', () => {
    const criticalScripts = [
      'build',
      'rebuild',
      'validate',
      'test',
      'test:run',
      'test:unit',
      'test:integration',
      'test:coverage',
      'lint',
      'typecheck',
      'start',
      'start:http',
    ];

    criticalScripts.forEach((script) => {
      it(`should have ${script} script in package.json`, () => {
        expect(packageJson.scripts[script]).toBeDefined();
      });
    });
  });

  describe('Test Structure', () => {
    it('should have tests/unit directory', () => {
      expect(existsSync(join(REPO_ROOT, 'tests/unit'))).toBe(true);
    });

    it('should have tests/integration directory', () => {
      expect(existsSync(join(REPO_ROOT, 'tests/integration'))).toBe(true);
    });

    it('should have tests/e2e directory', () => {
      expect(existsSync(join(REPO_ROOT, 'tests/e2e'))).toBe(true);
    });

    it('should have multiple test files', () => {
      const countTestFiles = (dir: string): number => {
        let count = 0;
        if (!existsSync(dir)) return count;
        
        const files = readdirSync(dir);
        for (const file of files) {
          const fullPath = join(dir, file);
          const stat = statSync(fullPath);
          
          if (stat.isDirectory()) {
            count += countTestFiles(fullPath);
          } else if (file.endsWith('.test.ts')) {
            count++;
          }
        }
        return count;
      };

      const totalTests = countTestFiles(join(REPO_ROOT, 'tests'));
      // CLAUDE.md mentions 3,336 passing tests, but we'll just verify we have many test files
      expect(totalTests).toBeGreaterThan(100);
    });
  });

  describe('Configuration Files', () => {
    const configFiles = [
      'package.json',
      'tsconfig.json',
      'tsconfig.build.json',
      'vitest.config.ts',
      '.env.example',
    ];

    configFiles.forEach((file) => {
      it(`should have ${file}`, () => {
        expect(existsSync(join(REPO_ROOT, file))).toBe(true);
      });
    });
  });

  describe('Service Layer Files', () => {
    const serviceFiles = [
      'property-filter.ts',
      'config-validator.ts',
      'enhanced-config-validator.ts',
      'node-specific-validators.ts',
      'type-structure-service.ts',
      'expression-validator.ts',
      'workflow-validator.ts',
      'workflow-auto-fixer.ts',
      'workflow-diff-engine.ts',
      'n8n-api-client.ts',
      'n8n-validation.ts',
    ];

    serviceFiles.forEach((file) => {
      it(`should have src/services/${file}`, () => {
        expect(existsSync(join(REPO_ROOT, 'src/services', file))).toBe(true);
      });
    });
  });

  describe('Session Persistence Feature', () => {
    it('should document session persistence in v2.24.1+', () => {
      expect(claudeMd).toContain('Session Persistence Feature (v2.24.1)');
    });

    it('should have session-state types', () => {
      expect(existsSync(join(REPO_ROOT, 'src/types/session-state.ts'))).toBe(true);
    });

    it('should mention export/restore API', () => {
      expect(claudeMd).toContain('exportSessionState()');
      expect(claudeMd).toContain('restoreSessionState()');
    });
  });

  describe('Recent Features Documentation', () => {
    it('should document v2.31.5 as current version', () => {
      expect(claudeMd).toContain('### v2.31.5 (Current)');
    });

    it('should mention MCP Tool Annotations', () => {
      expect(claudeMd).toContain('MCP Tool Annotations');
    });

    it('should document Tool Documentation System', () => {
      expect(claudeMd).toContain('Tool Documentation System');
    });

    it('should document Workflow Diff Engine', () => {
      expect(claudeMd).toContain('Workflow Diff Engine');
    });
  });

  describe('MCP Annotations', () => {
    it('should document all MCP annotation types', () => {
      const annotations = [
        'title',
        'readOnlyHint',
        'destructiveHint',
        'idempotentHint',
        'openWorldHint',
      ];

      annotations.forEach(annotation => {
        expect(claudeMd).toContain(annotation);
      });
    });
  });

  describe('Environment Variables Documentation', () => {
    const envVars = [
      'MCP_MODE',
      'LOG_LEVEL',
      'N8N_API_URL',
      'N8N_API_KEY',
      'PORT',
      'DATABASE_PATH',
    ];

    envVars.forEach((envVar) => {
      it(`should document ${envVar}`, () => {
        expect(claudeMd).toContain(envVar);
      });
    });
  });

  describe('Validation Profiles', () => {
    it('should document four validation strictness levels', () => {
      const profiles = ['minimal', 'runtime', 'ai-friendly', 'strict'];
      profiles.forEach(profile => {
        expect(claudeMd).toContain(`\`${profile}\``);
      });
    });
  });
});
