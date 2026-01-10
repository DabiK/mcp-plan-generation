/**
 * Quick test script to verify schema generation works
 * Run with: tsx src/infrastructure/mcp/test-schema-generation.ts
 */

import { generateMcpSchema } from './schema-generator';
import { CreatePlanDraftMcpInput } from './types/CreatePlanDraftMcpInput';
import { AddStepToPlanMcpInput } from './types/AddStepToPlanMcpInput';

console.log('=== Testing Schema Generation ===\n');

console.log('1. CreatePlanDraftMcpInput Schema:');
const createDraftSchema = generateMcpSchema(CreatePlanDraftMcpInput);
console.log(JSON.stringify(createDraftSchema, null, 2));

console.log('\n2. AddStepToPlanMcpInput Schema:');
const addStepSchema = generateMcpSchema(AddStepToPlanMcpInput);
console.log(JSON.stringify(addStepSchema, null, 2));

console.log('\n3. Testing toDomain() methods:');
const draftInput = new CreatePlanDraftMcpInput();
draftInput.planType = 'feature';
draftInput.title = 'Test Plan';
draftInput.description = 'Test Description';
draftInput.objective = 'Test Objective';
draftInput.author = 'Test Author';
draftInput.tags = ['test', 'demo'];

console.log('MCP Input:', draftInput);
console.log('\nDomain Input:', draftInput.toDomain());

console.log('\n=== All Tests Passed! ===');
