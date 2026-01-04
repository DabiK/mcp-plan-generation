import { injectable } from 'tsyringe';
import { MongoClient, Db } from 'mongodb';
import { config } from '../../config/env';

@injectable()
export class MongoDBConnection {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      console.log('Already connected to MongoDB');
      return;
    }

    try {
      this.client = new MongoClient(config.mongodb.uri, {
        maxPoolSize: config.mongodb.maxPoolSize,
        minPoolSize: config.mongodb.minPoolSize,
      });

      await this.client.connect();
      this.db = this.client.db(config.mongodb.dbName);
      this.isConnected = true;

      console.log(`✅ Connected to MongoDB: ${config.mongodb.dbName}`);
      
      // Créer les indexes
      await this.createIndexes();
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.isConnected = false;
      console.log('✅ Disconnected from MongoDB');
    }
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }
    return this.db;
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.db) return false;
      await this.db.admin().ping();
      return true;
    } catch (error) {
      console.error('MongoDB health check failed:', error);
      return false;
    }
  }

  async createIndexes(): Promise<void> {
    if (!this.db) return;

    const plansCollection = this.db.collection('plans');

    await plansCollection.createIndex({ planId: 1 }, { unique: true });
    await plansCollection.createIndex({ planType: 1 });
    await plansCollection.createIndex({ 'metadata.createdAt': -1 });
    await plansCollection.createIndex({ 'steps.status': 1 });

    console.log('✅ MongoDB indexes created');
  }
}
