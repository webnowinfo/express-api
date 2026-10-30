import { describe, test, expect } from '@jest/globals';
import Joi from 'joi';
import { password } from '../../../src/validations/custom.validation';

const schema = Joi.object({ password: Joi.string().custom(password) }).prefs({
  errors: { label: 'key' }
});

describe('password validator', () => {
  test.each([
    ['short1', '"password" must be at least 8 characters'],
    ['onlyletters', '"password" must contain at least 1 letter and 1 number'],
    ['12345678', '"password" must contain at least 1 letter and 1 number']
  ])('rejects %j with a readable message', (value, message) => {
    expect(schema.validate({ password: value }).error?.message).toBe(message);
  });

  test('accepts a password with letters and numbers', () => {
    expect(schema.validate({ password: 'password1' }).error).toBeUndefined();
  });
});
