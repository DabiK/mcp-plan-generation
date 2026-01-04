import { injectable } from 'tsyringe';
import planflowSchema from '../../infrastructure/validation/schemas/planflow-v1.0.0.json';

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
}

@injectable()
export class GetPlanFormatUseCase {
  execute(): GetPlanFormatOutput {
    return {
      schema: planflowSchema,
      version: '1.0.0',
      examples: [
        'simple-feature.json',
        'refactor.json',
        'migration.json',
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
    };
  }
}
