import { injectable } from 'tsyringe';
import planflowSchema from '../../infrastructure/validation/schemas/planflow-v1.1.0.json';

export interface GetPlanFormatOutput {
  schema: typeof planflowSchema;
  version: string;
  examples: string[];
  constraints: {
    maxSteps: number;
    supportedPlanTypes: string[];
    supportedStepKinds: string[];
    supportedStepStatuses: string[];
  };
  actionTypes: {
    type: string;
    description: string;
    requiredFields: string[];
    optionalFields: string[];
    example: Record<string, unknown>;
  }[];
}

@injectable()
export class GetPlanFormatUseCase {
  execute(): GetPlanFormatOutput {
    return {
      schema: planflowSchema,
      version: '1.1.0',
      examples: [
        'feature-user-profile-component.json',
        'refactor-async-await-middleware.json',
      ],
      constraints: {
        maxSteps: 100,
        supportedPlanTypes: [
          'feature',
          'refactor',
          'migration',
          'bugfix',
          'optimization',
          'documentation',
        ],
        supportedStepKinds: [
          'create_file',
          'edit_file',
          'delete_file',
          'run_command',
          'test',
          'review',
          'documentation',
          'custom',
        ],
        supportedStepStatuses: [
          'pending',
          'in_progress',
          'completed',
          'failed',
          'skipped',
          'blocked',
        ],
      },
      actionTypes: [
        {
          type: 'create_file',
          description: 'Create a new file with optional content',
          requiredFields: ['type', 'filePath'],
          optionalFields: ['content', 'description'],
          example: {
            type: 'create_file',
            filePath: 'src/components/Button.tsx',
            content: 'export const Button = () => <button>Click me</button>',
            description: 'Create reusable Button component',
          },
        },
        {
          type: 'edit_file',
          description: 'Modify an existing file with before/after code snippets',
          requiredFields: ['type', 'filePath'],
          optionalFields: ['before', 'after', 'description', 'lineNumbers'],
          example: {
            type: 'edit_file',
            filePath: 'src/utils/auth.ts',
            before: 'function login(user, pass) {\\n  // callback style\\n}',
            after: 'async function login(user, pass) {\\n  // async/await style\\n}',
            lineNumbers: { start: 1, end: 3 },
            description: 'Convert to async/await',
          },
        },
        {
          type: 'delete_file',
          description: 'Remove a file from the project',
          requiredFields: ['type', 'filePath'],
          optionalFields: ['reason', 'description'],
          example: {
            type: 'delete_file',
            filePath: 'src/legacy/old-component.tsx',
            reason: 'Replaced by new implementation',
            description: 'Remove deprecated component',
          },
        },
        {
          type: 'run_command',
          description: 'Execute a shell command',
          requiredFields: ['type', 'command'],
          optionalFields: ['workingDirectory', 'expectedOutput', 'description'],
          example: {
            type: 'run_command',
            command: 'npm install react-query',
            workingDirectory: './frontend',
            expectedOutput: 'added 15 packages',
            description: 'Install React Query',
          },
        },
        {
          type: 'test',
          description: 'Run tests with coverage tracking',
          requiredFields: ['type'],
          optionalFields: ['testCommand', 'testFiles', 'coverage', 'description'],
          example: {
            type: 'test',
            testCommand: 'npm test -- --coverage',
            testFiles: ['src/__tests__/auth.test.ts', 'src/__tests__/user.test.ts'],
            coverage: 80,
            description: 'Run unit tests with 80% coverage',
          },
        },
        {
          type: 'review',
          description: 'Code review step with checklist and reviewers',
          requiredFields: ['type'],
          optionalFields: ['checklistItems', 'reviewers', 'description'],
          example: {
            type: 'review',
            checklistItems: ['Code follows style guide', 'No console.log statements', 'Tests are passing'],
            reviewers: ['@senior-dev', '@tech-lead'],
            description: 'Code review before merge',
          },
        },
        {
          type: 'documentation',
          description: 'Create or update documentation',
          requiredFields: ['type'],
          optionalFields: ['sections', 'format', 'filePath', 'description'],
          example: {
            type: 'documentation',
            sections: ['Installation', 'Usage', 'API Reference'],
            format: 'markdown',
            filePath: 'docs/getting-started.md',
            description: 'Update getting started guide',
          },
        },
        {
          type: 'custom',
          description: 'Custom action with flexible payload',
          requiredFields: ['type', 'description'],
          optionalFields: ['payload'],
          example: {
            type: 'custom',
            description: 'Deploy to staging environment',
            payload: { environment: 'staging', region: 'us-east-1' },
          },
        },
      ],
    };
  }
}
