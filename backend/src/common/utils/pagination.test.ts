import { describe, expect, it } from 'vitest';

import { createErrorResponse } from '../errors/errorResponse.js';
import { getPagination } from './pagination.js';

describe('getPagination', () => {
  it('uses defaults for missing or invalid values', () => {
    expect(getPagination({})).toEqual({ page: 1, limit: 20, skip: 0 });
    expect(getPagination({ page: '-1', limit: 'zero' })).toEqual({
      page: 1,
      limit: 20,
      skip: 0,
    });
  });

  it('calculates offsets and caps limit at 100', () => {
    expect(getPagination({ page: '3', limit: '250' })).toEqual({
      page: 3,
      limit: 100,
      skip: 200,
    });
  });
});

describe('createErrorResponse', () => {
  it('returns the shared error envelope and preserves defined details', () => {
    expect(
      createErrorResponse('VALIDATION_ERROR', 'Invalid input', {
        field: 'email',
      }),
    ).toEqual({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: { field: 'email' },
      },
    });
  });
});
