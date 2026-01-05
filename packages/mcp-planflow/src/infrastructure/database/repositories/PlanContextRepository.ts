import { injectable } from 'tsyringe';
import { Collection, InsertOneResult } from 'mongodb';
import { PlanContext } from '../../../domain/entities/PlanContext';
import { MongoDBConnection } from '../../../infrastructure/persistence/mongodb/MongoDBConnection';

@injectable()
export class PlanContextRepository {
  private readonly collectionName = 'plan_contexts';

  constructor(private connection: MongoDBConnection) {}

  private getCollection(): Collection<PlanContext> {
    return this.connection.getDb().collection<PlanContext>(this.collectionName);
  }

  async create(context: Omit<PlanContext, 'createdAt' | 'updatedAt'>): Promise<PlanContext> {
    const collection = this.getCollection();
    const now = new Date();
    const document = { ...context, createdAt: now, updatedAt: now };

    const result: InsertOneResult = await collection.insertOne(document);
    return { ...document, planId: context.planId }; // planId is already in context
  }

  async findByPlanId(planId: string): Promise<PlanContext | null> {
    const collection = this.getCollection();
    return collection.findOne({ planId });
  }

  async update(planId: string, files: PlanContext['files']): Promise<PlanContext | null> {
    const collection = this.getCollection();
    const now = new Date();

    const result = await collection.findOneAndUpdate(
      { planId },
      { $set: { files, updatedAt: now } },
      { returnDocument: 'after' }
    );

    return result;
  }

  async delete(planId: string): Promise<boolean> {
    const collection = this.getCollection();
    const result = await collection.deleteOne({ planId });
    return result.deletedCount > 0;
  }
}