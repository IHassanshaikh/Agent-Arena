import test from 'node:test';
import assert from 'node:assert/strict';
import { redactObject, redactString } from '../src/services/redaction';

test('redacts known sensitive keys recursively', () => {
  const input = {
    user: 'alice',
    password: 'super-secret-password-123',
    nested: {
      api_key: 'sk-abcdef12345678901234567890',
      token: 'secret-token-xyz',
      safe_field: 'public information'
    },
    array: [
      { authorization: 'Bearer abc.def.ghi' },
      { normal_item: 42 }
    ]
  };

  const output = redactObject(input);

  assert.equal(output.user, 'alice');
  assert.equal(output.password, '[REDACTED:CREDENTIAL]');
  assert.equal(output.nested.api_key, '[REDACTED:CREDENTIAL]');
  assert.equal(output.nested.token, '[REDACTED:CREDENTIAL]');
  assert.equal(output.nested.safe_field, 'public information');
  assert.equal(output.array[0].authorization, '[REDACTED:CREDENTIAL]');
  assert.equal(output.array[1].normal_item, 42);
});

test('redacts secret patterns in strings', () => {
  const textWithBearer = 'Connecting using Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc123def456';
  const redacted = redactString(textWithBearer);

  assert.ok(!redacted.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'));
  assert.ok(redacted.includes('[REDACTED:'));
});

test('preserves non-sensitive data and primitive types', () => {
  assert.equal(redactObject(123), 123);
  assert.equal(redactObject(true), true);
  assert.equal(redactObject(null), null);
  assert.equal(redactObject('plain harmless text'), 'plain harmless text');
});

