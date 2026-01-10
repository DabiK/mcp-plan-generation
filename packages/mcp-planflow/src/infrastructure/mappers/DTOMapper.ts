import { injectable } from 'tsyringe';
import { Plan, PlanMetadata, PlanDetails } from '../../domain/entities/Plan';
import { Step } from '../../domain/entities/Step';
import { PlanId } from '../../domain/value-objects/PlanId';
import { StepId } from '../../domain/value-objects/StepId';
import { PlanType } from '../../domain/value-objects/PlanType';
import { PlanStatus } from '../../domain/value-objects/PlanStatus';
import { StepStatus } from '../../domain/value-objects/StepStatus';
import { StepKind } from '../../domain/value-objects/StepKind';
import { PlanDTO, StepDTO } from '../../application/dtos';

/**
 * Infrastructure Mapper - DTO ↔ Domain Entity
 * Utilisé par les Adapters (MCP, HTTP, MongoDB)
 * Vit dans Infrastructure car connaît à la fois DTOs et Entities
 */
@injectable()
export class DTOMapper {
  /**
   * Mapping Domain → DTO (pour les réponses)
   * Utilisé par les Input Adapters (MCP, HTTP)
   */
  toDTO(plan: Plan): PlanDTO {
    return {
      planId: plan.id.getValue(),
      schemaVersion: plan.schemaVersion,
      planType: plan.planType,
      status: plan.status,
      metadata: {
        title: plan.metadata.title,
        description: plan.metadata.description,
        author: plan.metadata.author,
        createdAt: plan.metadata.createdAt.toISOString(),
        updatedAt: plan.metadata.updatedAt.toISOString(),
        tags: plan.metadata.tags,
        revision: plan.metadata.revision,
      },
      plan: {
        objective: plan.plan.objective,
        scope: plan.plan.scope,
        constraints: plan.plan.constraints,
        assumptions: plan.plan.assumptions,
        successCriteria: plan.plan.successCriteria,
        diagrams: plan.plan.diagrams,
      },
      steps: plan.steps.map(s => this.stepToDTO(s)),
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
      revision: plan.revision,
      comments: plan.comments?.map(c => ({
        id: c.id,
        content: c.content,
        author: c.author,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt?.toISOString(),
      })),
    };
  }

  stepToDTO(step: Step): StepDTO {
    return {
      id: step.id.getValue(),
      title: step.title,
      description: step.description,
      kind: step.kind,
      status: step.status,
      dependsOn: step.dependsOn.map(id => id.getValue()),
      estimatedDuration: step.estimatedDuration,
      actions: step.actions,
      validation: step.validation,
      comments: step.comments.map(c => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt?.toISOString(),
      })),
      reviewStatus: step.reviewStatus ? {
        decision: step.reviewStatus.decision,
        timestamp: step.reviewStatus.timestamp.toISOString(),
        reviewer: step.reviewStatus.reviewer,
      } : undefined,
      diagram: step.diagram ? {
        type: step.diagram.type as 'flowchart' | 'sequence' | 'class' | 'er' | 'gantt' | 'state',
        content: step.diagram.content,
        description: step.diagram.description,
      } : undefined,
    };
  }

  /**
   * Mapping DTO → Domain (pour les entrées)
   * Peu utilisé car les Ports In reçoivent déjà des Input DTOs structurés
   */
  fromDTO(dto: PlanDTO): Plan {
    return new Plan(
      new PlanId(dto.planId),
      dto.schemaVersion,
      dto.planType as PlanType,
      dto.status as PlanStatus,
      {
        title: dto.metadata.title,
        description: dto.metadata.description,
        author: dto.metadata.author,
        createdAt: new Date(dto.metadata.createdAt),
        updatedAt: new Date(dto.metadata.updatedAt),
        tags: dto.metadata.tags || [],
        revision: dto.metadata.revision,
      },
      {
        objective: dto.plan.objective,
        scope: dto.plan.scope || '',
        constraints: dto.plan.constraints || [],
        assumptions: dto.plan.assumptions || [],
        successCriteria: dto.plan.successCriteria || [],
        diagrams: dto.plan.diagrams || [],
      },
      dto.steps.map(s => this.stepFromDTO(s)),
      new Date(dto.createdAt),
      new Date(dto.updatedAt),
      dto.revision
    );
  }

  stepFromDTO(dto: StepDTO): Step {
    return new Step(
      new StepId(dto.id),
      dto.title,
      dto.description,
      dto.kind as StepKind,
      dto.status as StepStatus,
      dto.dependsOn.map(id => new StepId(id)),
      dto.estimatedDuration as any,
      dto.actions,
      dto.validation,
      (dto.comments || []).map(c => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: c.updatedAt ? new Date(c.updatedAt) : undefined,
      })),
      dto.reviewStatus ? {
        decision: dto.reviewStatus.decision,
        timestamp: new Date(dto.reviewStatus.timestamp),
        reviewer: dto.reviewStatus.reviewer,
      } : undefined,
      dto.diagram
    );
  }
}
