import { Router, Request, Response } from 'express';
import { container } from 'tsyringe';
import type { IPlanCreation } from '../../../application/ports/in/IPlanCreation';
import type { IPlanRetrieval } from '../../../application/ports/in/IPlanRetrieval';
import type { IStepManagement } from '../../../application/ports/in/IStepManagement';
import type { IPlanModification } from '../../../application/ports/in/IPlanModification';
import { PlanNotFoundError } from '../../../domain/errors/PlanNotFoundError';
import { ValidationError } from '../../../domain/errors/ValidationError';
import { DTOMapper } from '../../mappers/DTOMapper';

export const planRouter = Router();

// Initialize DTOMapper for converting domain entities to DTOs
const dtoMapper = new DTOMapper();

// ========== PLAN FORMAT & VALIDATION ==========

// GET /api/plans/format - Get plan format specification
planRouter.get('/format', async (req: Request, res: Response) => {
  try {
    const planRetrieval = container.resolve<IPlanRetrieval>('IPlanRetrieval');
    const result = await planRetrieval.getFormat();
    res.json(result);
  } catch (error) {
    console.error('Error in GET /format:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/plans/validate - Validate a plan
planRouter.post('/validate', async (req: Request, res: Response) => {
  try {
    const planCreation = container.resolve<IPlanCreation>('IPlanCreation');
    const result = await planCreation.validatePlan({ plan: req.body });
    
    if (result.valid) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in POST /validate:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ========== PLAN CRUD OPERATIONS ==========

// GET /api/plans - List all plans with optional filters
planRouter.get('/', async (req: Request, res: Response) => {
  try {
    const planRetrieval = container.resolve<IPlanRetrieval>('IPlanRetrieval');
    
    const filters = {
      planType: req.query.planType as string | undefined,
      status: req.query.status as string | undefined,
      planId: req.query.planId as string | undefined,
      search: req.query.search as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const result = await planRetrieval.list(filters);
    
    // Convert domain entities to DTOs
    const plansDTO = result.plans.map(plan => dtoMapper.toDTO(plan));
    
    res.json({ plans: plansDTO });
  } catch (error) {
    console.error('Error in GET /plans:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/plans/:id - Get a specific plan by ID
planRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const planRetrieval = container.resolve<IPlanRetrieval>('IPlanRetrieval');
    const result = await planRetrieval.getById(req.params.id);
    
    // Convert domain entity to DTO
    const planDTO = dtoMapper.toDTO(result.plan);
    
    res.json({ plan: planDTO });
  } catch (error) {
    if (error instanceof PlanNotFoundError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    } else {
      console.error('Error in GET /plans/:id:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// POST /api/plans - Create a new plan (legacy - redirects to draft)
planRouter.post('/', async (req: Request, res: Response) => {
  try {
    const planCreation = container.resolve<IPlanCreation>('IPlanCreation');
    
    // Validate and create as finalized plan
    const draftResult = await planCreation.createDraft(req.body);
    
    // If the plan has steps, finalize it
    if (req.body.steps && req.body.steps.length > 0) {
      const finalResult = await planCreation.finalizeDraft(draftResult.planId);
      
      // Convert domain entity to DTO
      const planDTO = dtoMapper.toDTO(finalResult.plan);
      
      res.status(201).json({ plan: planDTO });
    } else {
      // Convert domain entity to DTO
      const planDTO = dtoMapper.toDTO(draftResult.plan);
      
      res.status(201).json({ planId: draftResult.planId, plan: planDTO });
    }
  } catch (error) {
    console.error('Error in POST /plans:', error);
    
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: 'Validation Error',
        message: error.message,
        details: error.errors,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// PUT /api/plans/:id - Update an existing plan
planRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const planModification = container.resolve<IPlanModification>('IPlanModification');
    const result = await planModification.updatePlan({
      planId: req.params.id,
      updates: req.body,
    });
    
    // Convert domain entity to DTO
    const planDTO = dtoMapper.toDTO(result.plan);
    
    res.json({ plan: planDTO });
  } catch (error) {
    if (error instanceof PlanNotFoundError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    } else if (error instanceof ValidationError) {
      res.status(400).json({
        error: 'Validation Error',
        message: error.message,
        details: error.errors,
      });
    } else {
      console.error('Error in PUT /plans/:id:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// DELETE /api/plans/:id - Delete a plan
planRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const planModification = container.resolve<IPlanModification>('IPlanModification');
    await planModification.deletePlan(req.params.id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof PlanNotFoundError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    } else {
      console.error('Error in DELETE /plans/:id:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// POST /api/plans/:planId/steps/:stepId/review - Set review status for a step
planRouter.post('/:planId/steps/:stepId/review', async (req: Request, res: Response) => {
  try {
    const stepManagement = container.resolve<IStepManagement>('IStepManagement');
    const result = await stepManagement.setReviewStatus({
      planId: req.params.planId,
      stepId: req.params.stepId,
      status: req.body.decision,
      comment: req.body.comment,
    });
    
    // Convert domain entity to DTO
    const planDTO = dtoMapper.toDTO(result.plan);
    
    res.json({ plan: planDTO });
  } catch (error) {
    console.error('Error setting step review status:', error);
    if (error instanceof PlanNotFoundError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// ========== STEP COMMENT MANAGEMENT ==========

// POST /api/plans/:planId/steps/:stepId/comments - Add a comment to a step
planRouter.post('/:planId/steps/:stepId/comments', async (req: Request, res: Response) => {
  try {
    const stepManagement = container.resolve<IStepManagement>('IStepManagement');
    const result = await stepManagement.addStepComment({
      planId: req.params.planId,
      stepId: req.params.stepId,
      comment: req.body,
    });
    
    // Return the created comment directly
    res.status(201).json(result);
  } catch (error) {
    console.error('Error adding step comment:', error);
    if (error instanceof PlanNotFoundError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// PUT /api/plans/:planId/steps/:stepId/comments/:commentId - Update a step comment
planRouter.put('/:planId/steps/:stepId/comments/:commentId', async (req: Request, res: Response) => {
  try {
    const stepManagement = container.resolve<IStepManagement>('IStepManagement');
    const result = await stepManagement.updateStepComment({
      planId: req.params.planId,
      stepId: req.params.stepId,
      commentId: req.params.commentId,
      content: req.body.content,
    });
    
    // Return the updated comment directly
    res.json(result);
  } catch (error) {
    console.error('Error updating step comment:', error);
    if (error instanceof PlanNotFoundError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// DELETE /api/plans/:planId/steps/:stepId/comments/:commentId - Delete a step comment
planRouter.delete('/:planId/steps/:stepId/comments/:commentId', async (req: Request, res: Response) => {
  try {
    const stepManagement = container.resolve<IStepManagement>('IStepManagement');
    await stepManagement.deleteStepComment({
      planId: req.params.planId,
      stepId: req.params.stepId,
      commentId: req.params.commentId,
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting step comment:', error);
    if (error instanceof PlanNotFoundError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// ========== PLAN COMMENT MANAGEMENT ==========

// GET /api/plans/:planId/comments - Get all comments for a plan
planRouter.get('/:planId/comments', async (req: Request, res: Response) => {
  try {
    const planModification = container.resolve<IPlanModification>('IPlanModification');
    const comments = await planModification.getPlanComments(req.params.planId);
    res.json({ comments });
  } catch (error) {
    console.error('Error getting plan comments:', error);
    if (error instanceof PlanNotFoundError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// POST /api/plans/:planId/comments - Add a comment to a plan
planRouter.post('/:planId/comments', async (req: Request, res: Response) => {
  try {
    const planModification = container.resolve<IPlanModification>('IPlanModification');
    const comment = await planModification.addPlanComment({
      planId: req.params.planId,
      comment: req.body,
    });
    
    // Return success response with comment
    res.status(201).json({ success: true, comment });
  } catch (error) {
    console.error('Error adding plan comment:', error);
    if (error instanceof PlanNotFoundError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// PUT /api/plans/:planId/comments/:commentId - Update a plan comment
planRouter.put('/:planId/comments/:commentId', async (req: Request, res: Response) => {
  try {
    const planModification = container.resolve<IPlanModification>('IPlanModification');
    const comment = await planModification.updatePlanComment({
      planId: req.params.planId,
      commentId: req.params.commentId,
      content: req.body.content,
    });
    
    // Return success response with updated comment
    res.json({ success: true, comment });
  } catch (error) {
    console.error('Error updating plan comment:', error);
    if (error instanceof PlanNotFoundError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// DELETE /api/plans/:planId/comments/:commentId - Delete a plan comment
planRouter.delete('/:planId/comments/:commentId', async (req: Request, res: Response) => {
  try {
    const planModification = container.resolve<IPlanModification>('IPlanModification');
    await planModification.deletePlanComment({
      planId: req.params.planId,
      commentId: req.params.commentId,
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan comment:', error);
    if (error instanceof PlanNotFoundError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// ========== PLAN CONTEXT (Legacy - needs implementation in ports) ==========

// GET /api/plans/:planId/context - Get plan context
planRouter.get('/:planId/context', async (req: Request, res: Response) => {
  try {
    // TODO: Move to hexagonal architecture when context management port is created
    const GetPlanContextUseCase = (await import('../../../application/use-cases/GetPlanContextUseCase')).GetPlanContextUseCase;
    const useCase = container.resolve(GetPlanContextUseCase);
    const result = await useCase.execute(req.params.planId);

    if (result) {
      res.json(result);
    } else {
      res.status(404).json({
        error: 'Not Found',
        message: 'No context found for this plan',
      });
    }
  } catch (error) {
    console.error('Error getting plan context:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ========== INCREMENTAL PLAN CREATION ROUTES ==========

// POST /api/plans/draft - Create a new draft plan
planRouter.post('/draft', async (req: Request, res: Response) => {
  try {
    const planCreation = container.resolve<IPlanCreation>('IPlanCreation');
    const result = await planCreation.createDraft(req.body);
    
    // Convert domain entity to DTO
    const planDTO = dtoMapper.toDTO(result.plan);
    
    res.status(201).json({ planId: result.planId, plan: planDTO });
  } catch (error) {
    console.error('Error in POST /plans/draft:', error);
    
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: 'Validation Error',
        message: error.message,
        details: error.errors,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// POST /api/plans/:id/steps - Add a step to a plan
planRouter.post('/:id/steps', async (req: Request, res: Response) => {
  try {
    const stepManagement = container.resolve<IStepManagement>('IStepManagement');
    const result = await stepManagement.addStep({
      planId: req.params.id,
      step: req.body,
    });
    
    // Convert domain entity to DTO
    const planDTO = dtoMapper.toDTO(result.plan);
    
    res.status(201).json({ plan: planDTO });
  } catch (error) {
    console.error('Error in POST /plans/:id/steps:', error);
    
    if (error instanceof PlanNotFoundError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    } else if (error instanceof ValidationError) {
      res.status(400).json({
        error: 'Validation Error',
        message: error.message,
        details: error.errors,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// PUT /api/plans/:id/steps/:stepId - Update a step in a plan
planRouter.put('/:id/steps/:stepId', async (req: Request, res: Response) => {
  try {
    const stepManagement = container.resolve<IStepManagement>('IStepManagement');
    const result = await stepManagement.updateStep({
      planId: req.params.id,
      stepId: req.params.stepId,
      updates: req.body,
    });
    
    // Convert domain entity to DTO
    const planDTO = dtoMapper.toDTO(result.plan);
    
    res.json({ plan: planDTO });
  } catch (error) {
    console.error('Error in PUT /plans/:id/steps/:stepId:', error);
    
    if (error instanceof PlanNotFoundError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    } else if (error instanceof ValidationError) {
      res.status(400).json({
        error: 'Validation Error',
        message: error.message,
        details: error.errors,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// DELETE /api/plans/:id/steps/:stepId - Remove a step from a plan
planRouter.delete('/:id/steps/:stepId', async (req: Request, res: Response) => {
  try {
    const stepManagement = container.resolve<IStepManagement>('IStepManagement');
    const result = await stepManagement.removeStep({
      planId: req.params.id,
      stepId: req.params.stepId,
      mode: (req.query.mode as 'strict' | 'cascade') || 'strict',
    });
    
    // Convert domain entity to DTO
    const planDTO = dtoMapper.toDTO(result.plan);
    
    res.json({ plan: planDTO });
  } catch (error) {
    console.error('Error in DELETE /plans/:id/steps/:stepId:', error);
    
    if (error instanceof PlanNotFoundError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    } else if (error instanceof ValidationError) {
      res.status(400).json({
        error: 'Validation Error',
        message: error.message,
        details: error.errors,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// PATCH /api/plans/:id/metadata - Update plan metadata
planRouter.patch('/:id/metadata', async (req: Request, res: Response) => {
  try {
    const planModification = container.resolve<IPlanModification>('IPlanModification');
    const result = await planModification.updateMetadata({
      planId: req.params.id,
      metadata: req.body.metadata,
      planDetails: req.body.planDetails,
    });
    
    // Convert domain entity to DTO
    const planDTO = dtoMapper.toDTO(result.plan);
    
    res.json({ plan: planDTO });
  } catch (error) {
    console.error('Error in PATCH /plans/:id/metadata:', error);
    
    if (error instanceof PlanNotFoundError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// POST /api/plans/:id/finalize - Finalize a draft plan
planRouter.post('/:id/finalize', async (req: Request, res: Response) => {
  try {
    const planCreation = container.resolve<IPlanCreation>('IPlanCreation');
    const result = await planCreation.finalizeDraft(req.params.id);
    
    // Convert domain entity to DTO
    const planDTO = dtoMapper.toDTO(result.plan);
    
    res.json({ plan: planDTO });
  } catch (error) {
    console.error('Error in POST /plans/:id/finalize:', error);
    
    if (error instanceof PlanNotFoundError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    } else if (error instanceof ValidationError) {
      res.status(400).json({
        error: 'Validation Error',
        message: error.message,
        details: error.errors,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});
