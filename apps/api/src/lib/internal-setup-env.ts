export function getInternalSetupSecret(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const secret = env.INTERNAL_SETUP_SECRET?.trim();
  return secret || undefined;
}
