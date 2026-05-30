export function getRequiredRedisUrl(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const url = env.REDIS_URL?.trim();
  if (!url) {
    throw new Error("REDIS_URL is required for background jobs");
  }
  return url;
}
