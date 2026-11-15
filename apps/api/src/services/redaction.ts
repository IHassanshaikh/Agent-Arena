const SENSITIVE_KEY_NAMES = new Set([
  'api_key',
  'apikey',
  'access_token',
  'auth_token',
  'refresh_token',
  'session_token',
  'bearer_token',
  'secret_token',
  'token',
  'password',
  'authorization',
  'secret',
  'client_secret',
  'private_key',
  'cookie',
  'set-cookie',
  'session_id',
  'auth_header'
]);

const TOKEN_METRIC_KEYS = new Set([
  'input_tokens',
  'output_tokens',
  'total_tokens',
  'tokens',
  'bytes_or_tokens'
]);

const SECRET_PATTERNS: Array<{ regex: RegExp; label: string }> = [
  { regex: /bearer\s+[a-zA-Z0-9_\-\.=:_+/]+/gi, label: 'BEARER_TOKEN' },
  { regex: /sk-[a-zA-Z0-9]{20,}/g, label: 'OPENAI_KEY' },
  { regex: /sk-ant-[a-zA-Z0-9_\-]{20,}/g, label: 'ANTHROPIC_KEY' },
  { regex: /AIza[0-9A-Za-z\-_]{35}/g, label: 'GOOGLE_KEY' },
  { regex: /ghp_[0-9a-zA-Z]{36}/g, label: 'GITHUB_PAT' },
  { regex: /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, label: 'JWT_TOKEN' },
  { regex: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g, label: 'PRIVATE_KEY' }
];

export function redactString(val: string): string {
  let redacted = val;
  for (const { regex, label } of SECRET_PATTERNS) {
    redacted = redacted.replace(regex, `[REDACTED:${label}]`);
  }
  return redacted;
}

export function redactObject<T = any>(data: T, maxDepth = 10): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return redactString(data) as unknown as T;
  }

  if (typeof data !== 'object' || maxDepth <= 0) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => redactObject(item, maxDepth - 1)) as unknown as T;
  }

  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isMetricKey = TOKEN_METRIC_KEYS.has(lowerKey);
    const isSensitiveKey = !isMetricKey && (
      SENSITIVE_KEY_NAMES.has(lowerKey) ||
      (lowerKey.includes('key') && !lowerKey.includes('keyboard')) ||
      lowerKey.includes('secret') ||
      lowerKey.includes('password') ||
      lowerKey.includes('auth') ||
      lowerKey.endsWith('_token') ||
      lowerKey.startsWith('token_') ||
      lowerKey === 'token'
    );

    if (isSensitiveKey) {
      result[key] = '[REDACTED:CREDENTIAL]';
    } else if (typeof value === 'string') {
      result[key] = redactString(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactObject(value, maxDepth - 1);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

