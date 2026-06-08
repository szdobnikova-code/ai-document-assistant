import 'server-only';

import { Pool } from 'pg';

// Stashed on globalThis so Next dev/HMR module re-evals reuse the same Pool
// instead of leaking an idle one per reload.
const globalPg = globalThis as unknown as { __pgPool?: Pool };

export function getPostgresPool(): Pool {
  if (globalPg.__pgPool) return globalPg.__pgPool;

  const connectionURL = process.env.DATABASE_URL;

  if (!connectionURL) {
    throw new Error('DATABASE_URL is required to connect to Postgres.');
  }

  globalPg.__pgPool = new Pool({
    connectionString: connectionURL,
    ssl: { rejectUnauthorized: false },
  });
  return globalPg.__pgPool;
}
