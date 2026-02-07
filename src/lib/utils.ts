// Generate unique ID
export const generateId = (): string => Math.random().toString(36).substring(2, 9);

// === camelCase <-> snake_case conversion ===
export const toSnake = (str: string): string =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

export const toCamel = (str: string): string =>
  str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toSnakeKeys = (obj: Record<string, any>): Record<string, any> =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [toSnake(k), v]));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toCamelKeys = <T>(obj: Record<string, any>): T =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [toCamel(k), v])) as T;
