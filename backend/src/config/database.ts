import mongoose from 'mongoose';

import config from './env.js';

export const connectDatabase = async (): Promise<void> => {
  mongoose.set('strictQuery', true);

  await mongoose.connect(config.mongodb_uri, {
    dbName: config.mongodb_db_name,
  });

  console.log(`[database] Connected to MongoDB (${config.mongodb_db_name})`);
};
