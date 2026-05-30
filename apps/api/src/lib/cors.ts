const DEFAULT_CORS_ORIGINS = [
  "http://localhost:3001",
  "http://localhost:3002",
];

export function getCorsAllowedOrigins(
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  const raw = env.CORS_ALLOWED_ORIGINS;
  if (!raw?.trim()) {
    return DEFAULT_CORS_ORIGINS;
  }

  const origins = raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : DEFAULT_CORS_ORIGINS;
}
