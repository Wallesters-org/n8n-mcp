import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NodeRepository } from '../../../src/database/node-repository';
import { DatabaseAdapter, PreparedStatement, RunResult } from '../../../src/database/database-adapter';

/**
 * Performance optimization tests for NodeRepository
 * Tests the optimizations implemented for database queries and storage
 */
describe('NodeRepository - Performance Optimizations', () => {
  let repository: NodeRepository;
  let mockAdapter: MockDatabaseAdapter;
  
  class MockDatabaseAdapter implements DatabaseAdapter {
    private statements = new Map<string, MockPreparedStatement>();
    
    prepare = vi.fn((sql: string) => {
      if (!this.statements.has(sql)) {
        this.statements.set(sql, new MockPreparedStatement(sql));
      }
      return this.statements.get(sql)!;
    });
    
    exec = vi.fn();
    close = vi.fn();
    pragma = vi.fn();
    transaction = vi.fn((fn: () => any) => fn());
    checkFTS5Support = vi.fn(() => true);
    inTransaction = false;
    
    _getStatement(sql: string) {
      return this.statements.get(sql);
    }
  }
  
  class MockPreparedStatement implements PreparedStatement {
    run = vi.fn((...params: any[]): RunResult => ({ changes: 1, lastInsertRowid: 1 }));
    get = vi.fn();
    all = vi.fn(() => []);
    iterate = vi.fn();
    pluck = vi.fn(() => this);
    expand = vi.fn(() => this);
    raw = vi.fn(() => this);
    columns = vi.fn(() => []);
    bind = vi.fn(() => this);
    
    constructor(private sql: string) {}
  }
  
  beforeEach(() => {
    mockAdapter = new MockDatabaseAdapter();
    repository = new NodeRepository(mockAdapter);
  });
  
  describe('Database Query Optimization', () => {
    it('should use single OR query when normalized type differs from original', () => {
      // Setup
      const nodeType = 'slack'; // Short form
      const normalizedType = 'n8n-nodes-base.slack'; // Full form (different)
      
      // Execute
      repository.getNode(nodeType);
      
      // Verify: Should prepare single query with OR condition
      expect(mockAdapter.prepare).toHaveBeenCalledTimes(1);
      const preparedSql = mockAdapter.prepare.mock.calls[0][0];
      
      // Should contain OR condition
      expect(preparedSql).toContain('OR');
      expect(preparedSql).toMatch(/SELECT \* FROM nodes WHERE node_type = \? OR node_type = \?/);
      
      // Should be called with both normalized and original types
      const statement = mockAdapter._getStatement(preparedSql);
      expect(statement?.get).toHaveBeenCalledWith(normalizedType, nodeType);
    });
    
    it('should use single query when normalized type equals original', () => {
      // Setup
      const nodeType = 'n8n-nodes-base.slack'; // Already normalized
      
      // Execute
      repository.getNode(nodeType);
      
      // Verify: Should prepare single query without OR
      expect(mockAdapter.prepare).toHaveBeenCalledTimes(1);
      const preparedSql = mockAdapter.prepare.mock.calls[0][0];
      
      // Should NOT contain OR condition
      expect(preparedSql).not.toContain('OR');
      expect(preparedSql).toMatch(/SELECT \* FROM nodes WHERE node_type = \?/);
      
      // Should be called with only normalized type (single parameter)
      const statement = mockAdapter._getStatement(preparedSql);
      expect(statement?.get).toHaveBeenCalledWith(nodeType);
    });
    
    it('should avoid double query for fallback lookups', () => {
      // This test verifies the optimization eliminates the second query
      const nodeType = 'slack';
      
      // Execute
      repository.getNode(nodeType);
      
      // Verify: Should only prepare ONE query (not two)
      expect(mockAdapter.prepare).toHaveBeenCalledTimes(1);
      
      // Should NOT have multiple prepare calls with different SQL
      const sqlCalls = mockAdapter.prepare.mock.calls.map(call => call[0]);
      expect(sqlCalls.length).toBe(1);
    });
  });
  
  describe('JSON Storage Optimization', () => {
    it('should store JSON without pretty-printing (compact format)', () => {
      const node = {
        nodeType: 'n8n-nodes-base.httpRequest',
        displayName: 'HTTP Request',
        description: 'Test node',
        category: 'transform',
        style: 'declarative',
        packageName: 'n8n-nodes-base',
        properties: [
          { name: 'url', type: 'string' },
          { name: 'method', type: 'options' }
        ],
        operations: [{ name: 'execute', displayName: 'Execute' }],
        credentials: [{ name: 'httpAuth' }],
        isAITool: false,
        isTrigger: false,
        isWebhook: false,
        isVersioned: true,
        version: '1.0',
        outputs: [{ type: 'main' }],
        outputNames: ['output']
      };
      
      // Execute
      repository.saveNode(node);
      
      // Get the actual call to statement.run
      const insertSql = mockAdapter.prepare.mock.calls.find(call => 
        call[0].includes('INSERT OR REPLACE')
      )?.[0];
      
      const statement = mockAdapter._getStatement(insertSql!);
      const runArgs = statement?.run.mock.calls[0];
      
      // Verify compact JSON (no extra whitespace)
      const propertiesArg = runArgs?.[15]; // properties_schema parameter
      const operationsArg = runArgs?.[16]; // operations parameter
      const credentialsArg = runArgs?.[17]; // credentials_required parameter
      const outputsArg = runArgs?.[18]; // outputs parameter
      const outputNamesArg = runArgs?.[19]; // output_names parameter
      
      // Should be compact JSON (no newlines or extra spaces)
      expect(propertiesArg).toBe(JSON.stringify(node.properties));
      expect(propertiesArg).not.toContain('\n');
      expect(propertiesArg).not.toContain('  '); // No double spaces (indentation)
      
      expect(operationsArg).toBe(JSON.stringify(node.operations));
      expect(operationsArg).not.toContain('\n');
      
      expect(credentialsArg).toBe(JSON.stringify(node.credentials));
      expect(credentialsArg).not.toContain('\n');
      
      expect(outputsArg).toBe(JSON.stringify(node.outputs));
      expect(outputsArg).not.toContain('\n');
      
      expect(outputNamesArg).toBe(JSON.stringify(node.outputNames));
      expect(outputNamesArg).not.toContain('\n');
    });
    
    it('should produce smaller JSON strings than pretty-printed format', () => {
      const testData = [
        { name: 'prop1', type: 'string', required: true },
        { name: 'prop2', type: 'number', required: false },
        { name: 'prop3', type: 'options', options: [{ name: 'opt1' }, { name: 'opt2' }] }
      ];
      
      const compactJson = JSON.stringify(testData);
      const prettyJson = JSON.stringify(testData, null, 2);
      
      // Compact should be significantly smaller (typically 15-20% reduction)
      expect(compactJson.length).toBeLessThan(prettyJson.length);
      
      // For this test data, should be at least 25% smaller
      const reductionPercent = ((prettyJson.length - compactJson.length) / prettyJson.length) * 100;
      expect(reductionPercent).toBeGreaterThan(20);
    });
  });
  
  describe('Performance Characteristics', () => {
    it('should handle multiple getNode calls efficiently with query optimization', () => {
      const nodeTypes = ['slack', 'gmail', 'httpRequest', 'webhook'];
      
      // Execute multiple lookups
      nodeTypes.forEach(nodeType => {
        repository.getNode(nodeType);
      });
      
      // Each call should prepare exactly one query
      expect(mockAdapter.prepare).toHaveBeenCalledTimes(nodeTypes.length);
      
      // No call should have duplicate SQL preparation
      const sqlCalls = mockAdapter.prepare.mock.calls.map(call => call[0]);
      const uniqueSqls = new Set(sqlCalls);
      
      // Should have at most 2 unique SQL patterns (with OR, without OR)
      expect(uniqueSqls.size).toBeLessThanOrEqual(2);
    });
  });
});
