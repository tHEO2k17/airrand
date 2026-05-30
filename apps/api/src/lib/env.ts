export function getDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5433/airrand"
  );
}
