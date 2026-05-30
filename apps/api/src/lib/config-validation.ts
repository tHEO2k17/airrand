export const MIN_SECRET_LENGTH = 32;

const REQUIRED_SECRETS = [
  { name: "AUTH_SESSION_SECRET", minLength: MIN_SECRET_LENGTH },
  { name: "QR_SIGNING_SECRET", minLength: MIN_SECRET_LENGTH },
] as const;

export interface SecretValidationResult {
  valid: boolean;
  issues: string[];
}

export function validateRequiredSecrets(
  env: NodeJS.ProcessEnv = process.env,
): SecretValidationResult {
  const issues: string[] = [];

  for (const { name, minLength } of REQUIRED_SECRETS) {
    const value = env[name];
    if (!value) {
      issues.push(`${name} is not set`);
      continue;
    }
    if (value.length < minLength) {
      issues.push(`${name} must be at least ${minLength} characters`);
    }
  }

  return { valid: issues.length === 0, issues };
}
