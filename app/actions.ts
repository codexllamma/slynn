'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { Channel } from '@prisma/client';
import { calculateOrderTotals, parseNumber } from '@/lib/orderMath';

export type OrderItemInput =
  | {
      isNew?: false;
      productId: string;
      hsnSac?: string;
      quantity: number | string;
      unit?: string;
      pricePerUnit?: number | string;
      price?: number | string;
    }
  | {
      isNew: true;
      name: string;
      description?: string;
      category?: string;
      color?: string;
      printName?: string;
      imageUrls?: string[];
      basePrice?: number | string;
      hsnSac?: string;
      unit?: string;
      variants: Array<{
        size: string;
        quantity: number | string;
        price?: number | string;
      }>;
    };

export async function createMultiItemOrder(data: {
  channel: Channel;
  customerDetails?: string;
  receivedAmount?: number | string;
  discount?: number | string;
  taxRate?: number | string;
  items: OrderItemInput[];
}) {
  const { channel, customerDetails, items } = data;

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('At least one item is required to create an order.');
  }

  const result = await prisma.$transaction(async (tx) => {
    const orderItemsToCreate: Array<{
      productId: string;
      hsnSac?: string;
      quantity: number;
      unit: string;
      pricePerUnit: number;
      totalPrice: number;
    }> = [];

    for (const item of items) {
      if (item.isNew) {
        const productName = item.name?.trim();
        if (!productName) {
          throw new Error('New product name is required.');
        }

        const basePrice = Math.max(0, parseNumber(item.basePrice, 0));
        const normalizedVariants = (Array.isArray(item.variants) ? item.variants : [])
          .map((v) => {
            const qty = Math.max(0, Math.trunc(parseNumber(v.quantity, 0)));
            const unitPrice = Math.max(0, parseNumber(v.price, 0) || basePrice);
            return {
              size: (v.size || 'Free').trim() || 'Free',
              quantity: qty,
              price: unitPrice,
            };
          })
          .filter((v) => v.quantity > 0);

        if (normalizedVariants.length === 0) {
          throw new Error(`Product "${productName}" must have at least one variant with quantity > 0.`);
        }

        const imageUrls = Array.isArray(item.imageUrls) ? item.imageUrls.filter(Boolean) : [];
        const createdProduct = await tx.product.create({
          data: {
            name: productName,
            description: item.description,
            category: item.category,
            salesCategory: channel,
            color: item.color,
            printName: item.printName,
            imageUrl: imageUrls[0],
            basePrice,
            variants: {
              create: normalizedVariants.map((v) => ({
                size: v.size,
                stock: v.quantity,
                price: v.price,
              })),
            },
            images: {
              create: imageUrls.map((url, i) => ({
                url,
                isPrimary: i === 0,
              })),
            },
          },
        });

        for (const variant of normalizedVariants) {
          const totalPrice = Number((variant.quantity * variant.price).toFixed(2));
          orderItemsToCreate.push({
            productId: createdProduct.id,
            hsnSac: item.hsnSac,
            quantity: variant.quantity,
            unit: item.unit || 'Pcs',
            pricePerUnit: variant.price,
            totalPrice,
          });
        }
      } else {
        if (!item.productId) {
          throw new Error('Product ID is missing for order item.');
        }

        const quantity = Math.max(0, Math.trunc(parseNumber(item.quantity, 0)));
        if (quantity <= 0) {
          throw new Error('Item quantity must be greater than 0.');
        }

        const pricePerUnit = Math.max(0, parseNumber(item.pricePerUnit ?? item.price, 0));
        const totalPrice = Number((quantity * pricePerUnit).toFixed(2));

        orderItemsToCreate.push({
          productId: item.productId,
          hsnSac: item.hsnSac,
          quantity,
          unit: item.unit || 'Pcs',
          pricePerUnit,
          totalPrice,
        });
      }
    }

    if (orderItemsToCreate.length === 0) {
      throw new Error('No valid order items to create.');
    }

    const {
      subTotal,
      discount,
      taxRate,
      taxAmount,
      totalAmount,
      receivedAmount,
      balance,
    } = calculateOrderTotals(orderItemsToCreate, {
      discount: data.discount ?? 0,
      taxRate: data.taxRate ?? 5.0,
      receivedAmount: data.receivedAmount ?? 0,
    });

    if (
      !Number.isFinite(subTotal) ||
      !Number.isFinite(taxAmount) ||
      !Number.isFinite(totalAmount) ||
      !Number.isFinite(balance)
    ) {
      throw new Error('Order totals evaluated to a non-finite number.');
    }

    const order = await tx.order.create({
      data: {
        channel,
        subTotal,
        discount,
        taxRate,
        taxAmount,
        totalAmount,
        receivedAmount,
        balance,
        customerDetails: customerDetails || null,
        items: {
          create: orderItemsToCreate,
        },
      },
    });

    await tx.invoice.create({
      data: {
        orderId: order.id,
        invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      },
    });

    return order;
  });

  revalidatePath('/');
  return { success: true, orderId: result.id };
}

export async function fetchLedger(filters?: { searchTerm?: string; channel?: Channel | 'ALL'; }) {
  let whereClause: any = {};

  if (filters?.channel && filters.channel !== 'ALL') {
    whereClause.channel = filters.channel;
  }

  if (filters?.searchTerm) {
    whereClause.OR = [
      { items: { some: { product: { name: { contains: filters.searchTerm, mode: 'insensitive' } } } } },
      { items: { some: { product: { printName: { contains: filters.searchTerm, mode: 'insensitive' } } } } },
      { customerDetails: { contains: filters.searchTerm, mode: 'insensitive' } },
      { invoice: { invoiceNumber: { contains: filters.searchTerm, mode: 'insensitive' } } }
    ];
  }

  const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      invoice: true,
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: { orderDate: 'desc' },
  });

  return orders;
}

export async function createProduct(data: {
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  color?: string;
  printName?: string;
  imageUrls?: string[];
  basePrice: number | string;
  variants: Array<{ size: string; stock: number | string; price?: number | string }>;
}) {
  const basePrice = Math.max(0, parseNumber(data.basePrice, 0));
  await prisma.product.create({
    data: {
      name: data.name,
      sku: data.sku || undefined,
      description: data.description,
      category: data.category,
      color: data.color,
      printName: data.printName,
      imageUrl: data.imageUrls && data.imageUrls.length > 0 ? data.imageUrls[0] : undefined,
      basePrice,
      variants: {
        create: data.variants.map(v => ({
          size: v.size,
          stock: Math.max(0, Math.trunc(parseNumber(v.stock, 0))),
          price: Math.max(0, parseNumber(v.price, 0)) || basePrice,
        }))
      },
      images: {
        create: data.imageUrls?.map((url, i) => ({
          url,
          isPrimary: i === 0,
        })) || []
      }
    }
  });
  revalidatePath('/');
}

export async function updateProductStock(variantId: string, newStock: number) {
  await prisma.productVariant.update({
    where: { id: variantId },
    data: { stock: newStock },
  });
  revalidatePath('/');
}

export async function updateProduct(id: string, data: {
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  salesCategory?: Channel;
  color?: string;
  printName?: string;
  basePrice: number;
}) {
  await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      sku: data.sku || null,
      description: data.description,
      category: data.category,
      salesCategory: data.salesCategory,
      color: data.color,
      printName: data.printName,
      basePrice: data.basePrice,
    },
  });
  revalidatePath('/');
}

export async function addProductImageRecord(productId: string, url: string) {
  await prisma.productImage.create({
    data: {
      productId,
      url,
    }
  });
  revalidatePath('/');
}

export async function deleteProductImageRecord(imageId: string) {
  await prisma.productImage.delete({
    where: { id: imageId }
  });
  revalidatePath('/');
}