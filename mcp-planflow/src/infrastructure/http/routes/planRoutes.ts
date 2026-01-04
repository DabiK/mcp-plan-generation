import { Router, Request, Response } from 'express';
import { container } from 'tsyringe';
import {
  GetPlanFormatUseCase,
  ValidatePlanUseCase,
  CreatePlanUseCase,
  GetPlanUseCase,
  UpdatePlanUseCase,
  ListPlansUseCase,
} from '../../../application/use-cases';
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
