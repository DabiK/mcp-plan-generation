import { Router, Request, Response } from 'express';
import { container } from 'tsyringe';
import {
  GetPlanFormatUseCase,
  ValidatePlanUseCase,
  CreatePlanUseCase,
  GetPlanUseCase,
  UpdatePlanUseCase,
  ListPlansUseCase,
  AddStepCommentUseCase,
  UpdateStepCommentUseCase,
  DeleteStepCommentUseCase,
} from '../../../application/use-cases';
import {
  AddPlanCommentUseCase,
  UpdatePlanCommentUseCase,
  DeletePlanCommentUseCase,
  GetPlanCommentsUseCase,
} from '../../../application/use-cases/PlanCommentUseCases';
import { SetStepReviewStatusUseCase } from '../../../application/use-cases/SetStepReviewStatusUseCase';
import { GetPlanContextUseCase } from '../../../application/use-cases/GetPlanContextUseCase';
import { PlanNotFoundError } from '../../../domain/errors/PlanNotFoundError';

export const planRouter = Router();

// GET /api/plans/format - Get plan format specification
planRouter.get('/format', async (req: Request, res: Response) => {
  try {
    const useCase = container.resolve(GetPlanFormatUseCase);
    const result = await useCase.execute();
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
    const useCase = container.resolve(ValidatePlanUseCase);
    const result = await useCase.execute(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error in POST /validate:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/plans - List all plans with optional filters
planRouter.get('/', async (req: Request, res: Response) => {
  try {
    const useCase = container.resolve(ListPlansUseCase);
    
    const filters = {
      planType: req.query.planType as string | undefined,
      status: req.query.status as string | undefined,
      planId: req.query.planId as string | undefined,
      search: req.query.search as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const result = await useCase.execute(filters);
    res.json(result);
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
    const useCase = container.resolve(GetPlanUseCase);
    const result = await useCase.execute(req.params.id);
    res.json(result);
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

// POST /api/plans - Create a new plan
planRouter.post('/', async (req: Request, res: Response) => {
  try {
    const useCase = container.resolve(CreatePlanUseCase);
    const result = await useCase.execute(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in POST /plans:', error);
    
    if (error instanceof Error && error.message.includes('validation failed')) {
      res.status(400).json({
        error: 'Validation Error',
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

// PUT /api/plans/:id - Update an existing plan
planRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const useCase = container.resolve(UpdatePlanUseCase);
    const result = await useCase.execute({
      planId: req.params.id,
      ...req.body,
    });
    res.json(result);
  } catch (error) {
    if (error instanceof PlanNotFoundError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    } else if (error instanceof Error && error.message.includes('validation failed')) {
      res.status(400).json({
        error: 'Validation Error',
        message: error.message,
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
    const repository = container.resolve('IPlanRepository');
    const deleted = await (repository as any).delete(req.params.id);
    
    if (!deleted) {
      res.status(404).json({
        error: 'Not Found',
        message: `Plan with ID ${req.params.id} not found`,
      });
    } else {
      res.status(204).send();
    }
  } catch (error) {
    console.error('Error in DELETE /plans/:id:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/plans/:planId/steps/:stepId/comments - Add a comment to a step
planRouter.post('/:planId/steps/:stepId/comments', async (req: Request, res: Response) => {
  try {
    const useCase = container.resolve(AddStepCommentUseCase);
    const result = await useCase.execute({
      planId: req.params.planId,
      stepId: req.params.stepId,
      content: req.body.content,
      author: req.body.author,
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error adding step comment:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/plans/:planId/steps/:stepId/comments/:commentId - Update a comment
planRouter.put('/:planId/steps/:stepId/comments/:commentId', async (req: Request, res: Response) => {
  try {
    const useCase = container.resolve(UpdateStepCommentUseCase);
    const result = await useCase.execute({
      planId: req.params.planId,
      stepId: req.params.stepId,
      commentId: req.params.commentId,
      content: req.body.content,
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error updating step comment:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE /api/plans/:planId/steps/:stepId/comments/:commentId - Delete a comment
planRouter.delete('/:planId/steps/:stepId/comments/:commentId', async (req: Request, res: Response) => {
  try {
    const useCase = container.resolve(DeleteStepCommentUseCase);
    const result = await useCase.execute({
      planId: req.params.planId,
      stepId: req.params.stepId,
      commentId: req.params.commentId,
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error deleting step comment:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/plans/:planId/comments - Get all plan comments
planRouter.get('/:planId/comments', async (req: Request, res: Response) => {
  try {
    const useCase = container.resolve(GetPlanCommentsUseCase);
    const comments = await useCase.execute(req.params.planId);
    res.json({ success: true, comments });
  } catch (error) {
    console.error('Error getting plan comments:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/plans/:planId/comments - Add a plan comment
planRouter.post('/:planId/comments', async (req: Request, res: Response) => {
  try {
    const useCase = container.resolve(AddPlanCommentUseCase);
    const result = await useCase.execute({
      planId: req.params.planId,
      content: req.body.content,
      author: req.body.author,
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error adding plan comment:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/plans/:planId/comments/:commentId - Update a plan comment
planRouter.put('/:planId/comments/:commentId', async (req: Request, res: Response) => {
  try {
    const useCase = container.resolve(UpdatePlanCommentUseCase);
    const result = await useCase.execute({
      planId: req.params.planId,
      commentId: req.params.commentId,
      content: req.body.content,
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error updating plan comment:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE /api/plans/:planId/comments/:commentId - Delete a plan comment
planRouter.delete('/:planId/comments/:commentId', async (req: Request, res: Response) => {
  try {
    const useCase = container.resolve(DeletePlanCommentUseCase);
    const result = await useCase.execute({
      planId: req.params.planId,
      commentId: req.params.commentId,
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error deleting plan comment:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/plans/:planId/steps/:stepId/review - Set review status for a step
planRouter.post('/:planId/steps/:stepId/review', async (req: Request, res: Response) => {
  try {
    const useCase = container.resolve(SetStepReviewStatusUseCase);
    const result = await useCase.execute({
      planId: req.params.planId,
      stepId: req.params.stepId,
      decision: req.body.decision,
      reviewer: req.body.reviewer,
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error setting step review status:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/plans/:planId/context - Get plan context
planRouter.get('/:planId/context', async (req: Request, res: Response) => {
  try {
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
