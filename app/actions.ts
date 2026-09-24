'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { Channel } from '@prisma/client';

export async function createMultiItemOrder(data: {
  channel: Channel;
  customerDetails?: string;
  receivedAmount?: number;
  items: Array<{
    productId: string;
    hsnSac?: string;
    quantity: number;
    unit?: string;
    pricePerUnit: number;
  }>;
}) {
  const { channel, customerDetails, receivedAmount = 0, items } = data;

  const result = await prisma.$transaction(async (tx) => {
    let subTotal = 0;
    const orderItemsToCreate = [];

    for (const item of items) {
      const totalPrice = item.quantity * item.pricePerUnit;
      subTotal += totalPrice;
      
      orderItemsToCreate.push({
        productId: item.productId,
        hsnSac: item.hsnSac,
        quantity: item.quantity,
        unit: item.unit || 'Pcs',
        pricePerUnit: item.pricePerUnit,
        totalPrice: totalPrice,
      });
    }

    const discount = 0;
    const taxRate = 5.0;
    const taxableAmount = subTotal - discount;
    const taxAmount = (taxableAmount * taxRate) / 100;
    const totalAmount = Math.round(taxableAmount + taxAmount);
    const balance = totalAmount - receivedAmount;

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
        }
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
  imageUrl?: string;
  basePrice: number;
  variants: Array<{ size: string; stock: number; price?: number }>;
}) {
  await prisma.product.create({
    data: {
      name: data.name,
      sku: data.sku || undefined,
      description: data.description,
      category: data.category,
      color: data.color,
      printName: data.printName,
      imageUrl: data.imageUrl,
      basePrice: data.basePrice,
      variants: {
        create: data.variants.map(v => ({
          size: v.size,
          stock: v.stock,
          price: v.price || data.basePrice,
        }))
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