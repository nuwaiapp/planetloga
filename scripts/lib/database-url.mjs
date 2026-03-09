const REQUIRED_DB_URL_ENV = 'SUPABASE_DB_URL';

export function getDatabaseUrl(scriptName) {
  const value = process.env[REQUIRED_DB_URL_ENV]?.trim();

  if (!value) {
    throw new Error(
      `${scriptName} requires ${REQUIRED_DB_URL_ENV}. Copy .env.example, set the database URL explicitly, and rerun the script.`,
    );
  }

  if (!value.startsWith('postgresql://') && !value.startsWith('postgres://')) {
    throw new Error(
      `${scriptName} expected ${REQUIRED_DB_URL_ENV} to start with postgresql:// or postgres://.`,
    );
  }

  return value;
}
