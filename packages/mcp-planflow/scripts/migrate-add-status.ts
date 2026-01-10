#!/usr/bin/env ts-node
/**
 * Migration script: Add status field to existing plans
 * 
 * This script adds the 'status' field to all plans in MongoDB that don't have one.
 * Plans without a status field will be set to 'active' (the previous default behavior).
 * 
 * Usage:
 *   ts-node scripts/migrate-add-status.ts
 *   or
 *   npm run migrate:add-status
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = process.env.MONGODB_DATABASE || 'planflow';
const COLLECTION_NAME = 'plans';

async function migrate() {
  console.log('🔄 Starting migration: Add status field to plans');
  console.log(`📦 Database: ${DATABASE_NAME}`);
  console.log(`📋 Collection: ${COLLECTION_NAME}`);
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Find plans without a status field
    const plansWithoutStatus = await collection.find({
      status: { $exists: false }
    }).toArray();
    
    console.log(`\n📊 Found ${plansWithoutStatus.length} plans without status field`);
    
    if (plansWithoutStatus.length === 0) {
      console.log('✨ No migration needed! All plans already have a status.');
      return;
    }
    
    // Show sample of plans that will be updated
    console.log('\n📝 Sample plans to update:');
    plansWithoutStatus.slice(0, 5).forEach((plan: any) => {
      console.log(`  - ${plan.planId}: "${plan.metadata?.title || 'Untitled'}"`);
    });
    
    if (plansWithoutStatus.length > 5) {
      console.log(`  ... and ${plansWithoutStatus.length - 5} more`);
    }
    
    // Update all plans without status to 'active'
    const result = await collection.updateMany(
      { status: { $exists: false } },
      { 
        $set: { 
          status: 'active',
          updatedAt: new Date()
        } 
      }
    );
    
    console.log(`\n✅ Migration completed!`);
    console.log(`   - Matched: ${result.matchedCount} documents`);
    console.log(`   - Modified: ${result.modifiedCount} documents`);
    
    // Verify the migration
    const remaining = await collection.countDocuments({
      status: { $exists: false }
    });
    
    if (remaining === 0) {
      console.log('\n✨ Verification passed! All plans now have a status field.');
    } else {
      console.warn(`\n⚠️  Warning: ${remaining} plans still missing status field`);
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run migration
migrate().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
