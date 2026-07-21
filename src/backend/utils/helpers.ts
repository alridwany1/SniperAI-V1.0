export function cleanObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return null as any;
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    return value === undefined ? undefined : value;
  }));
}
