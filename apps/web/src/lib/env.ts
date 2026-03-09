export interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseSecretKey: string;
}

function required(keys: string[], label: string): string {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  throw new Error(
    `[env] Missing required variable: ${label}. Checked: ${keys.join(', ')}`,
  );
}

let cached: EnvConfig | undefined;

export function getEnvConfig(): EnvConfig {
  if (cached) return cached;

  cached = {
    supabaseUrl: required(
      ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'],
      'Supabase URL',
    ),
    supabaseAnonKey: required(
      ['SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
      'Supabase anon key',
    ),
    supabaseSecretKey: required(
      ['SUPABASE_SECRET_KEY'],
      'Supabase service role key',
    ),
  };

  return cached;
}

export function validateEnvOrDie(): void {
  try {
    getEnvConfig();
  } catch (error) {
    console.error(String(error));
    process.exit(1);
  }
}
