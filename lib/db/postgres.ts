import 'server-only';

import { Pool } from 'pg';

export function getPostgresPool(): Pool {
  const connectionURL = process.env.DATABASE_URL;

  if (!connectionURL) {
    throw new Error('DATABASE_URL is required to connect to Postgres.');
  }

  return new Pool({
    connectionString: connectionURL,
    ssl: { rejectUnauthorized: false },
  });
}
