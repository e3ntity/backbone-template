import "dotenv/config";

/**
 * Access environment variables.
 * @param key The key of the environment variable.
 * @param alt An alternative value to return if the environment variable is not found.
 * @returns The value of the environment variable.
 * @throws {Error} An error if the environment variable is not found and no alternative value is provided.
 */
function accessEnv(key: string, alt?: any): any {
  const value: any = process.env[key];

  if (value !== undefined) return value;
  if (alt !== undefined) return alt;

  throw new Error(`Environment variable ${key} not found.`);
}

export default accessEnv;
