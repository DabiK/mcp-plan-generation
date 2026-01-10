import { injectable, inject } from 'tsyringe';
import { Collection } from 'mongodb';
import { IPlanRepository, PlanFilters } from '../../../application/ports/out/IPlanRepository';
import { Plan } from '../../../domain/entities/Plan';
import { PlanId } from '../../../domain/value-objects/PlanId';
import { MongoDBConnection } from './MongoDBConnection';
import { PlanMapper, MongoDBPlanDocument } from './mappers/PlanMapper';
import { PlanNotFoundError } from '../../../domain/errors/PlanNotFoundError';
import { StepCommentDTO } from '../../../application/dtos/PlanDTO';
import { StepReviewStatus } from '../../../domain/entities/Step';

interface PlanCommentDTO {
  id: string;
  content: string;
  author?: string;
  createdAt: string;
  updatedAt?: string;
}

@injectable()
export class MongoDBPlanRepository implements IPlanRepository {
  private readonly collectionName = 'plans';

  constructor(@inject(MongoDBConnection) private connection: MongoDBConnection) {}

  private getCollection(): Collection<MongoDBPlanDocument> {
    return this.connection.getDb().collection<MongoDBPlanDocument>(this.collectionName);
  }

  async save(plan: Plan): Promise<void> {
    try {
      const collection = this.getCollection();
      const document = PlanMapper.toPersistence(plan);

      await collection.insertOne(document as any);
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error(`Plan with ID ${plan.id.getValue()} already exists`);
      }
      throw error;
    }
  }

  async findById(id: PlanId): Promise<Plan | null> {
    const collection = this.getCollection();
    const document = await collection.findOne({ planId: id.getValue() });

    if (!document) {
      return null;
    }

    return PlanMapper.toDomain(document);
  }

  async findAll(filters?: PlanFilters): Promise<Plan[]> {
    const collection = this.getCollection();
    const query: any = {};

    if (filters?.planType) {
      query.planType = filters.planType;
    }

    if (filters?.status) {
      query['steps.status'] = filters.status;
    }

    if (filters?.search) {
      query.$or = [
        { 'metadata.title': { $regex: filters.search, $options: 'i' } },
        { 'metadata.description': { $regex: filters.search, $options: 'i' } }
      ];
    }

    if (filters?.createdAfter || filters?.createdBefore) {
      query['metadata.createdAt'] = {};
      if (filters.createdAfter) {
        query['metadata.createdAt'].$gte = filters.createdAfter;
      }
      if (filters.createdBefore) {
        query['metadata.createdAt'].$lte = filters.createdBefore;
      }
    }

    let cursor = collection.find(query).sort({ 'metadata.createdAt': -1 });

    if (filters?.offset) {
      cursor = cursor.skip(filters.offset);
    }

    if (filters?.limit) {
      cursor = cursor.limit(filters.limit);
    }

    const documents = await cursor.toArray();
    return documents.map((doc) => PlanMapper.toDomain(doc));
  }

  async update(id: PlanId, plan: Plan): Promise<void> {
    const collection = this.getCollection();
    const document = PlanMapper.toPersistence(plan);

    const result = await collection.updateOne(
      { planId: id.getValue() },
      { $set: document }
    );

    if (result.matchedCount === 0) {
      throw new PlanNotFoundError(id.getValue());
    }
  }

  async delete(id: PlanId): Promise<void> {
    const collection = this.getCollection();
    const result = await collection.deleteOne({ planId: id.getValue() });

    if (result.deletedCount === 0) {
      throw new PlanNotFoundError(id.getValue());
    }
  }

  async exists(id: PlanId): Promise<boolean> {
    const collection = this.getCollection();
    const count = await collection.countDocuments({ planId: id.getValue() });
    return count > 0;
  }

  async addStepComment(planId: string, stepId: string, comment: StepCommentDTO): Promise<boolean> {
    try {
      const collection = this.getCollection();
      
      const result = await collection.updateOne(
        { 
          planId,
          'steps.id': stepId 
        },
        {
          $push: {
            'steps.$.comments': {
              id: comment.id,
              content: comment.content,
              author: comment.author,
              createdAt: new Date(comment.createdAt),
              updatedAt: comment.updatedAt ? new Date(comment.updatedAt) : undefined,
            }
          }
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error adding step comment:', error);
      return false;
    }
  }

  async deleteStepComment(planId: string, stepId: string, commentId: string): Promise<boolean> {
    try {
      const collection = this.getCollection();
      
      const result = await collection.updateOne(
        { 
          planId,
          'steps.id': stepId 
        },
        {
          $pull: {
            'steps.$.comments': { $or: [{ id: commentId }, { _id: commentId }] }
          }
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error deleting step comment:', error);
      return false;
    }
  }

  async updateStepComment(planId: string, stepId: string, commentId: string, content: string): Promise<boolean> {
    try {
      const collection = this.getCollection();
      
      const result = await collection.updateOne(
        { 
          planId,
          'steps.id': stepId,
          'steps.comments.id': commentId
        },
        {
          $set: {
            'steps.$[step].comments.$[comment].content': content,
            'steps.$[step].comments.$[comment].updatedAt': new Date(),
          }
        },
        {
          arrayFilters: [
            { 'step.id': stepId },
            { 'comment.id': commentId }
          ]
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error updating step comment:', error);
      return false;
    }
  }

  async getPlanComments(planId: string): Promise<PlanCommentDTO[]> {
    try {
      const collection = this.getCollection();
      
      const plan = await collection.findOne(
        { planId },
        { projection: { comments: 1 } }
      );

      const commentsArr = (plan as any)?.comments;
      if (!plan || !commentsArr) {
        return [];
      }

      return commentsArr.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        author: comment.author,
        createdAt: comment.createdAt instanceof Date 
          ? comment.createdAt.toISOString() 
          : comment.createdAt,
        updatedAt: comment.updatedAt 
          ? (comment.updatedAt instanceof Date 
            ? comment.updatedAt.toISOString() 
            : comment.updatedAt)
          : undefined,
      }));
    } catch (error) {
      console.error('Error getting plan comments:', error);
      return [];
    }
  }

  async setStepReviewStatus(planId: string, stepId: string, reviewStatus: StepReviewStatus): Promise<boolean> {
    try {
      const collection = this.getCollection();
      
      const result = await collection.updateOne(
        { planId, 'steps.id': stepId },
        { 
          $set: { 
            'steps.$.reviewStatus': {
              decision: reviewStatus.decision,
              timestamp: reviewStatus.timestamp,
              reviewer: reviewStatus.reviewer,
            },
            updatedAt: new Date()
          } 
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error setting step review status:', error);
      return false;
    }
  }

  // ========== Plan Comment Management ==========

  async addPlanComment(planId: string, comment: any): Promise<boolean> {
    try {
      const collection = this.getCollection();
      
      const result = await collection.updateOne(
        { planId },
        {
          $push: {
            comments: {
              id: comment.id,
              content: comment.content,
              author: comment.author,
              createdAt: new Date(comment.createdAt),
              updatedAt: comment.updatedAt ? new Date(comment.updatedAt) : undefined,
            }
          },
          $set: { updatedAt: new Date() }
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error adding plan comment:', error);
      return false;
    }
  }

  async updatePlanComment(planId: string, commentId: string, content: string): Promise<boolean> {
    try {
      const collection = this.getCollection();
      
      const result = await collection.updateOne(
        { 
          planId,
          'comments.id': commentId
        },
        {
          $set: {
            'comments.$.content': content,
            'comments.$.updatedAt': new Date(),
            updatedAt: new Date()
          }
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error updating plan comment:', error);
      return false;
    }
  }

  async deletePlanComment(planId: string, commentId: string): Promise<boolean> {
    try {
      const collection = this.getCollection();
      
      const result = await collection.updateOne(
        { planId },
        {
          $pull: {
            comments: { $or: [{ id: commentId }, { _id: commentId }] }
          },
          $set: { updatedAt: new Date() }
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error deleting plan comment:', error);
      return false;
    }
  }
}
