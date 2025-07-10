import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10,
  maxUses: 7500,
  allowExitOnIdle: true
});
export const db = drizzle({ client: pool, schema });

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Closing database connections...');
  pool.end();
});

process.on('SIGINT', () => {
  console.log('Closing database connections...');
  pool.end();
});