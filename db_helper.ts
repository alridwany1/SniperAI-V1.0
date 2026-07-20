import { Client } from "pg";

export function buildConnectionString(dataSource: any) {
  const host = dataSource.host!.trim();
  const lowercaseHost = host.toLowerCase();
  
  if ((lowercaseHost.startsWith('postgresql://') || lowercaseHost.startsWith('postgres://')) && host.includes('@')) {
    if (!host.includes('sslmode=')) {
      const separator = host.includes('?') ? '&' : '?';
      return `${host}${separator}sslmode=require`;
    }
    return host;
  }
  
  let cleanHost = host;
  if (cleanHost.startsWith('postgresql://')) {
    cleanHost = cleanHost.slice('postgresql://'.length);
  } else if (cleanHost.startsWith('postgres://')) {
    cleanHost = cleanHost.slice('postgres://'.length);
  }

  let dbName = dataSource.databaseName || "";
  if (cleanHost.includes('/')) {
      const parts = cleanHost.split('/');
      cleanHost = parts[0];
      if (parts[1] && !dbName) {
          dbName = parts[1];
      }
  }
  const port = cleanHost.includes(':') ? '' : ':5432';
  const encodedUser = encodeURIComponent(dataSource.username || '');
  const encodedPass = encodeURIComponent(dataSource.apiKey || '');
  return `postgresql://${encodedUser}:${encodedPass}@${cleanHost}${port}/${dbName}?sslmode=require`;
}

/**
 * Execute a query on PostgreSQL database with automated client lifecycle management.
 */
export async function executeQuery<T = any>(
  dataSource: any,
  queryStr: string,
  params: any[] = []
): Promise<T[]> {
  const connectionString = buildConnectionString(dataSource);
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    await client.query("SET client_encoding TO 'UTF8'");
    const result = await client.query(queryStr, params);
    return result.rows;
  } finally {
    await client.end();
  }
}

/**
 * Provide a safely managed PostgreSQL client instance to callback function.
 */
export async function withPgClient<T>(
  dataSource: any,
  callback: (client: Client) => Promise<T>
): Promise<T> {
  const connectionString = buildConnectionString(dataSource);
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    await client.query("SET client_encoding TO 'UTF8'");
    return await callback(client);
  } finally {
    await client.end();
  }
}
