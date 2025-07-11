
import knex, { Knex } from 'knex';
import config from '../../knexfile';
import { logger } from '../utils/logger';

const environment = process.env.NODE_ENV || 'development';
const knexConfig = config[environment];

let db: Knex;

export const connectDatabase = async (): Promise<Knex> => {
  try {
    db = knex(knexConfig);
    
    // Test the connection
    await db.raw('SELECT 1+1 as result');
    
    // Run migrations
    await db.migrate.latest();
    
    logger.info('Database connected and migrations completed');
    return db;
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

export const getDatabase = (): Knex => {
  if (!db) {
    throw new Error('Database not initialized. Call connectDatabase first.');
  }
  return db;
};

export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.destroy();
    logger.info('Database connection closed');
  }
};
