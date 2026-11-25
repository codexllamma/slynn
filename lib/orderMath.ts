/**
 * Safely parses numeric inputs (including comma-formatted strings like "42,600.00").
 * Returns `fallback` when the input is empty, nullish, or non-finite.
 */
export function parseNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    if (!cleaned) return fallback;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export interface OrderLineInput {
  quantity: unknown;
  pricePerUnit?: unknown;
  price?: unknown;
}

export interface OrderTotalsInput {
  discount?: unknown;
  taxRate?: unknown;
  receivedAmount?: unknown;
}

export interface OrderTotals {
  subTotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  receivedAmount: number;
  balance: number;
}

/**
 * Computes order financial totals on the server from line items.
 * Guarantees finite numbers and matches the invoice rounding rule.
 */
export function calculateOrderTotals(
  items: OrderLineInput[],
  input: OrderTotalsInput = {}
): OrderTotals {
  const rawSubTotal = items.reduce((sum, item) => {
    const price = parseNumber(item.pricePerUnit ?? item.price, 0);
    const qty = Math.max(0, Math.trunc(parseNumber(item.quantity, 0)));
    return sum + price * qty;
  }, 0);

  const subTotal = Number(rawSubTotal.toFixed(2));
  const taxRate = Math.max(0, parseNumber(input.taxRate, 5.0));
  const discount = Math.max(0, parseNumber(input.discount, 0));
  const taxable = Math.max(0, subTotal - discount);
  const taxAmount = Number(((taxable * taxRate) / 100).toFixed(2));
  const totalAmount = Math.round(taxable + taxAmount);
  const receivedAmount = Math.max(0, parseNumber(input.receivedAmount, 0));
  const balance = Number((totalAmount - receivedAmount).toFixed(2));

  return {
    subTotal,
    discount,
    taxRate,
    taxAmount,
    totalAmount,
    receivedAmount,
    balance,
  };
}

/**
 * Computes the pre-tax subtotal for UI cart items (both existing and inline new products).
 */
export function computeCartSubTotal(cartItems: Array<any>): number {
  const total = cartItems.reduce((acc, item) => {
    if (item.isNew) {
      const variants = Array.isArray(item.variants) ? item.variants : [];
      const base = parseNumber(item.basePrice, 0);
      const itemTotal = variants.reduce((sum: number, v: any) => {
        const qty = Math.max(0, Math.trunc(parseNumber(v.quantity, 0)));
        const price = parseNumber(v.price, 0) || base;
        return sum + qty * price;
      }, 0);
      return acc + itemTotal;
    }

    const qty = Math.max(0, Math.trunc(parseNumber(item.quantity, 0)));
    const price = parseNumber(item.price ?? item.pricePerUnit, 0);
    return acc + qty * price;
  }, 0);

  return Number(total.toFixed(2));
}
