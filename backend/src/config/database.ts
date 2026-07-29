import mongoose from 'mongoose';

import config from './env.js';

export const connectDatabase = async (): Promise<void> => {
  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(config.mongodb_uri, {
    dbName: config.mongodb_db_name,
  });

  // Drop stale unique index on kycDocuments that causes duplicate key errors
  try {
    const kycDocsCollection = conn.connection.db.collection('kycdocuments');
    const indexes = (await kycDocsCollection.indexes()) as Array<{ name: string }>;
    const staleIndex = indexes.find((idx) => idx.name === 'storageKey_1');
    if (staleIndex) {
      await kycDocsCollection.dropIndex('storageKey_1');
      console.log('[database] Dropped stale storageKey_1 index from kycdocuments');
    }
  } catch {
    // collection may not exist yet — ignore
  }

  console.log(`[database] Connected to MongoDB (${config.mongodb_db_name})`);
};
