import { describe, expect, test, vi, beforeEach } from 'vitest';
import { calculateOrderTotals, computeCartSubTotal, parseNumber } from '../lib/orderMath';

const mocks = vi.hoisted(() => ({
  orderCreate: vi.fn(),
  invoiceCreate: vi.fn(),
  productCreate: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    $transaction: vi.fn(async (cb: any) =>
      cb({
        order: { create: mocks.orderCreate },
        invoice: { create: mocks.invoiceCreate },
        product: { create: mocks.productCreate },
      })
    ),
    product: { create: mocks.productCreate },
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock('@/lib/orderMath', async () => await import('../lib/orderMath'));

import { createMultiItemOrder } from '../app/actions';

describe('orderMath helpers', () => {
  test('parseNumber strips commas and handles invalid/empty inputs', () => {
    expect(parseNumber('42,600.00')).toBe(42600);
    expect(parseNumber(' 1,250.50 ')).toBe(1250.5);
    expect(parseNumber(500)).toBe(500);
    expect(parseNumber(NaN)).toBe(0);
    expect(parseNumber(undefined)).toBe(0);
    expect(parseNumber(null)).toBe(0);
    expect(parseNumber('')).toBe(0);
    expect(parseNumber('abc')).toBe(0);
  });

  test('calculateOrderTotals matches 42,600.00 + 5% GST = 44,730.00 and never yields NaN', () => {
    const totals = calculateOrderTotals(
      [{ quantity: '2', pricePerUnit: '21,300.00' }],
      { taxRate: 5, discount: 0, receivedAmount: 0 }
    );

    expect(totals).toEqual({
      subTotal: 42600,
      discount: 0,
      taxRate: 5,
      taxAmount: 2130,
      totalAmount: 44730,
      receivedAmount: 0,
      balance: 44730,
    });
  });

  test('computeCartSubTotal handles both existing items and inline new products', () => {
    const subTotal = computeCartSubTotal([
      { isNew: false, productId: 'p1', quantity: '2', price: '1,300.00' },
      {
        isNew: true,
        name: 'New Hoodie',
        basePrice: '2,000',
        variants: [
          { size: 'M', quantity: 10, price: 0 },
          { size: 'L', quantity: 10, price: '2,000' },
        ],
      },
    ]);

    expect(subTotal).toBe(42600);
  });
});

describe('createMultiItemOrder server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.orderCreate.mockResolvedValue({ id: 'order-123' });
    mocks.invoiceCreate.mockResolvedValue({ id: 'inv-123' });
    mocks.productCreate.mockResolvedValue({ id: 'prod-new-1' });
  });

  test('computes finite totals for comma-formatted strings and never passes NaN to prisma.order.create', async () => {
    const res = await createMultiItemOrder({
      channel: 'WHOLESALE',
      customerDetails: 'Acme Store',
      items: [
        {
          productId: 'prod-1',
          quantity: '10' as any,
          pricePerUnit: '4,260.00' as any,
        },
      ],
    });

    expect(res).toEqual({ success: true, orderId: 'order-123' });
    expect(mocks.orderCreate).toHaveBeenCalledTimes(1);
    const createArg = mocks.orderCreate.mock.calls[0][0].data;
    expect(createArg.subTotal).toBe(42600);
    expect(createArg.taxAmount).toBe(2130);
    expect(createArg.totalAmount).toBe(44730);
    expect(createArg.balance).toBe(44730);
    expect(Number.isFinite(createArg.subTotal)).toBe(true);
    expect(Number.isFinite(createArg.taxAmount)).toBe(true);
    expect(Number.isFinite(createArg.totalAmount)).toBe(true);
    expect(Number.isFinite(createArg.balance)).toBe(true);
  });

  test('creates inline new products and calculates order totals cleanly', async () => {
    const res = await createMultiItemOrder({
      channel: 'OFFLINE_RETAIL',
      customerDetails: 'Walk-in',
      items: [
        {
          isNew: true,
          name: 'Wolf Tee',
          basePrice: '1,420.00',
          variants: [{ size: 'M', quantity: 30, price: 0 }],
        },
      ],
    });

    expect(res).toEqual({ success: true, orderId: 'order-123' });
    expect(mocks.productCreate).toHaveBeenCalledTimes(1);
    const orderData = mocks.orderCreate.mock.calls[0][0].data;
    expect(orderData.subTotal).toBe(42600);
    expect(orderData.taxAmount).toBe(2130);
    expect(orderData.totalAmount).toBe(44730);
    expect(orderData.items.create).toEqual([
      {
        productId: 'prod-new-1',
        hsnSac: undefined,
        quantity: 30,
        unit: 'Pcs',
        pricePerUnit: 1420,
        totalPrice: 42600,
      },
    ]);
  });

  test('rejects empty items instead of passing NaN or missing subTotal', async () => {
    await expect(
      createMultiItemOrder({
        channel: 'ONLINE_RETAIL',
        items: [],
      })
    ).rejects.toThrow(/At least one item/);
    expect(mocks.orderCreate).not.toHaveBeenCalled();
  });
});
