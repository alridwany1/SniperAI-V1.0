export function buildConnectionString(dataSource: any) {
  let host = dataSource.host.trim();
  let dbName = dataSource.databaseName;
  if (host.includes('/')) {
      const parts = host.split('/');
      host = parts[0];
      if (parts[1] && !dbName) {
          dbName = parts[1];
      }
  }
  const port = host.includes(':') ? '' : ':5432';
  const encodedUser = encodeURIComponent(dataSource.username || '');
  const encodedPass = encodeURIComponent(dataSource.apiKey || '');
  return `postgresql://${encodedUser}:${encodedPass}@${host}${port}/${dbName}?sslmode=require`;
}
