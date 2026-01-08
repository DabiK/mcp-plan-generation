import { PlanId } from '../value-objects/PlanId';
import { StepId } from '../value-objects/StepId';
import { PlanType } from '../value-objects/PlanType';
import { PlanStatus } from '../value-objects/PlanStatus';
import { Step } from './Step';

export interface PlanMetadata {
  title: string;
  description: string;
  author?: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  revision: number;
}

export interface Diagram {
  title: string;
  type: 'flowchart' | 'sequence' | 'class' | 'er' | 'gantt' | 'state';
  content: string;
  description?: string;
}

export interface PlanDetails {
  objective: string;
  scope: string;
  constraints?: string[];
  assumptions?: string[];
  successCriteria?: string[];
  diagrams?: Diagram[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class Plan {
  constructor(
    public readonly id: PlanId,
    public schemaVersion: string,
    public planType: PlanType,
    public status: PlanStatus,
    public metadata: PlanMetadata,
    public plan: PlanDetails,
    public steps: Step[],
    public createdAt: Date,
    public updatedAt: Date,
    public revision: number
  ) {}

  addStep(step: Step): void {
    // Vérifier que l'ID du step est unique
    if (this.steps.some((s) => s.id.equals(step.id))) {
      throw new Error(`Step with id ${step.id.getValue()} already exists`);
    }
    this.steps.push(step);
    this.updatedAt = new Date();
  }

  removeStep(stepId: StepId): void {
    this.steps = this.steps.filter((s) => !s.id.equals(stepId));
    this.updatedAt = new Date();
  }

  updateStep(stepId: StepId, updates: Partial<Omit<Step, 'id'>>): void {
    const stepIndex = this.steps.findIndex((s) => s.id.equals(stepId));
    if (stepIndex === -1) {
      throw new Error(`Step with id ${stepId.getValue()} not found`);
    }
    
    const currentStep = this.steps[stepIndex];
    console.log('[Plan.updateStep] Current step diagram:', currentStep.diagram);
    console.log('[Plan.updateStep] Updates diagram:', updates.diagram);
    
    this.steps[stepIndex] = new Step(
      currentStep.id,
      updates.title ?? currentStep.title,
      updates.description ?? currentStep.description,
      updates.kind ?? currentStep.kind,
      updates.status ?? currentStep.status,
      updates.dependsOn ?? currentStep.dependsOn,
      updates.estimatedDuration ?? currentStep.estimatedDuration,
      updates.actions ?? currentStep.actions,
      updates.validation ?? currentStep.validation,
      updates.comments ?? currentStep.comments,
      updates.reviewStatus ?? currentStep.reviewStatus,
      updates.diagram ?? currentStep.diagram
    );
    
    console.log('[Plan.updateStep] New step diagram:', this.steps[stepIndex].diagram);
    this.updatedAt = new Date();
  }

  getStep(stepId: StepId): Step | undefined {
    return this.steps.find((s) => s.id.equals(stepId));
  }

  validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Si le plan est en draft, validation allégée
    if (this.status === PlanStatus.DRAFT) {
      // En draft, 0 steps est acceptable
      if (this.steps.length === 0) {
        warnings.push('Draft plan has no steps');
      }
    } else {
      // Plan non-draft (active/completed/cancelled) : validation complète
      
      // Avertir si aucun step
      if (this.steps.length === 0) {
        errors.push('Plan must have at least one step');
      }
    }

    // Vérifier les IDs uniques (pour tous les plans)
    const stepIds = new Set<string>();
    for (const step of this.steps) {
      const id = step.id.getValue();
      if (stepIds.has(id)) {
        errors.push(`Duplicate step ID: ${id}`);
      }
      stepIds.add(id);
    }

    // Vérifier les références de dépendances (pour tous les plans)
    for (const step of this.steps) {
      for (const depId of step.dependsOn) {
        if (!this.steps.some((s) => s.id.equals(depId))) {
          errors.push(
            `Step ${step.id.getValue()} depends on non-existent step ${depId.getValue()}`
          );
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  hasCyclicDependencies(): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (stepId: string): boolean => {
      visited.add(stepId);
      recursionStack.add(stepId);

      const step = this.steps.find((s) => s.id.getValue() === stepId);
      if (!step) return false;

      for (const dep of step.dependsOn) {
        const depId = dep.getValue();
        if (!visited.has(depId)) {
          if (hasCycle(depId)) return true;
        } else if (recursionStack.has(depId)) {
          return true;
        }
      }

      recursionStack.delete(stepId);
      return false;
    };

    for (const step of this.steps) {
      const stepId = step.id.getValue();
      if (!visited.has(stepId)) {
        if (hasCycle(stepId)) return true;
      }
    }

    return false;
  }

  getExecutionOrder(): Step[] {
    // Tri topologique pour obtenir l'ordre d'exécution
    const result: Step[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();

    const visit = (stepId: string): void => {
      if (temp.has(stepId)) {
        throw new Error('Cyclic dependency detected');
      }
      if (visited.has(stepId)) return;

      temp.add(stepId);

      const step = this.steps.find((s) => s.id.getValue() === stepId);
      if (step) {
        for (const dep of step.dependsOn) {
          visit(dep.getValue());
        }
        result.push(step);
      }

      temp.delete(stepId);
      visited.add(stepId);
    };

    for (const step of this.steps) {
      if (!visited.has(step.id.getValue())) {
        visit(step.id.getValue());
      }
    }

    return result;
  }

  incrementRevision(): void {
    this.revision += 1;
    this.updatedAt = new Date();
  }

  isDraft(): boolean {
    return this.status === PlanStatus.DRAFT;
  }

  finalize(): void {
    if (!this.isDraft()) {
      throw new Error('Only draft plans can be finalized');
    }
    
    if (this.steps.length === 0) {
      throw new Error('Cannot finalize plan with no steps');
    }

    const validation = this.validate();
    if (!validation.isValid) {
      throw new Error(`Cannot finalize plan: ${validation.errors.join(', ')}`);
    }

    this.status = PlanStatus.ACTIVE;
    this.updatedAt = new Date();
  }
}
