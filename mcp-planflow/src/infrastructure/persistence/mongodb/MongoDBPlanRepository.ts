import { injectable, inject } from 'tsyringe';
import { Collection } from 'mongodb';
import { IPlanRepository, PlanFilters } from '../../../domain/repositories/IPlanRepository';
import { Plan } from '../../../domain/entities/Plan';
import { PlanId } from '../../../domain/value-objects/PlanId';
import { MongoDBConnection } from './MongoDBConnection';
import { PlanMapper, MongoDBPlanDocument } from './mappers/PlanMapper';
import { PlanNotFoundError } from '../../../domain/errors/PlanNotFoundError';

@injectable()
export class MongoDBPlanRepository implements IPlanRepository {
  private readonly collectionName = 'plans';

  constructor(private connection: MongoDBConnection) {}

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
}
