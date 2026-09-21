import { expect, test, describe, beforeAll, afterAll } from 'vitest';
import prisma from '../lib/prisma';

describe('Database Connection', () => {
  beforeAll(async () => {
    // Attempt a connection to make sure it's valid
    await prisma.$connect();
  });

  afterAll(async () => {
    // Disconnect when tests are done
    await prisma.$disconnect();
  });

  test('can query products', async () => {
    const products = await prisma.product.findMany({ take: 1 });
    expect(Array.isArray(products)).toBe(true);
  });
});
