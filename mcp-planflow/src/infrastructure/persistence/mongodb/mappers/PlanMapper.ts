import { Plan, PlanMetadata, PlanDetails, Step, Duration, Action, ValidationCriteria } from '../../../../domain/entities';
import { PlanId, StepId, PlanType, StepKind, StepStatus } from '../../../../domain/value-objects';

export interface MongoDBPlanDocument {
  _id?: any;
  planId: string;
  schemaVersion: string;
  planType: string;
  metadata: {
    title: string;
    description: string;
    author?: string;
    createdAt: Date;
    updatedAt: Date;
    tags?: string[];
    revision: number;
  };
  plan: {
    objective: string;
    scope: string;
    constraints?: string[];
    assumptions?: string[];
    successCriteria?: string[];
  };
  steps: Array<{
    id: string;
    title: string;
    description: string;
    kind: string;
    status: string;
    dependsOn: string[];
    estimatedDuration?: {
      value: number;
      unit: string;
    };
    actions: Array<{
      type: string;
      description: string;
      payload?: Record<string, unknown>;
    }>;
    validation?: {
      criteria: string[];
      automatedTests?: string[];
    };
  }>;
  createdAt: Date;
  updatedAt: Date;
  revision: number;
}

export class PlanMapper {
  /**
   * Convertit un document MongoDB en entité Plan du domain
   */
  static toDomain(doc: MongoDBPlanDocument): Plan {
    const steps = doc.steps.map(
      (stepDoc) =>
        new Step(
          new StepId(stepDoc.id),
          stepDoc.title,
          stepDoc.description,
          stepDoc.kind as StepKind,
          stepDoc.status as StepStatus,
          stepDoc.dependsOn.map((id) => new StepId(id)),
          stepDoc.estimatedDuration as Duration | undefined,
          stepDoc.actions as Action[],
          stepDoc.validation as ValidationCriteria | undefined
        )
    );

    const metadata: PlanMetadata = {
      title: doc.metadata.title,
      description: doc.metadata.description,
      author: doc.metadata.author,
      createdAt: doc.metadata.createdAt,
      updatedAt: doc.metadata.updatedAt,
      tags: doc.metadata.tags,
      revision: doc.metadata.revision,
    };

    const planDetails: PlanDetails = {
      objective: doc.plan.objective,
      scope: doc.plan.scope,
      constraints: doc.plan.constraints,
      assumptions: doc.plan.assumptions,
      successCriteria: doc.plan.successCriteria,
    };

    return new Plan(
      new PlanId(doc.planId),
      doc.schemaVersion,
      doc.planType as PlanType,
      metadata,
      planDetails,
      steps,
      doc.createdAt,
      doc.updatedAt,
      doc.revision
    );
  }

  /**
   * Convertit une entité Plan du domain en document MongoDB
   */
  static toPersistence(plan: Plan): MongoDBPlanDocument {
    return {
      planId: plan.id.getValue(),
      schemaVersion: plan.schemaVersion,
      planType: plan.planType,
      metadata: {
        title: plan.metadata.title,
        description: plan.metadata.description,
        author: plan.metadata.author,
        createdAt: plan.metadata.createdAt,
        updatedAt: plan.metadata.updatedAt,
        tags: plan.metadata.tags,
        revision: plan.metadata.revision,
      },
      plan: {
        objective: plan.plan.objective,
        scope: plan.plan.scope,
        constraints: plan.plan.constraints,
        assumptions: plan.plan.assumptions,
        successCriteria: plan.plan.successCriteria,
      },
      steps: plan.steps.map((step) => ({
        id: step.id.getValue(),
        title: step.title,
        description: step.description,
        kind: step.kind,
        status: step.status,
        dependsOn: step.dependsOn.map((id) => id.getValue()),
        estimatedDuration: step.estimatedDuration,
        actions: step.actions,
        validation: step.validation,
      })),
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      revision: plan.revision,
    };
  }
}
