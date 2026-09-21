'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { Channel } from '@prisma/client';

export async function createOrderFlow(data: {
  channel: Channel;
  customerDetails?: { name: string; email?: string; phone?: string; address?: string; };
  items: Array<{
    isNewProduct: boolean;
    productVariantId?: string; // If existing product
    newProductDetails?: {
      name: string;
      description?: string;
      category?: string;
      color?: string;
      printName?: string;
      imageUrl?: string;
      basePrice: number;
      variants: Array<{ size: string; quantity: number; price: number }>;
    };
    // For existing products:
    quantity?: number;
    soldPricePerUnit?: number;
  }>;
}) {
  const { channel, customerDetails, items } = data;

  await prisma.$transaction(async (tx) => {
    let customerId = null;
    if (customerDetails?.name) {
      const customer = await tx.customer.create({
        data: {
          name: customerDetails.name,
          email: customerDetails.email || null,
          phone: customerDetails.phone || null,
          address: customerDetails.address || null,
        }
      });
      customerId = customer.id;
    }

    let totalOrderAmount = 0;
    const orderItemsToCreate = [];

    for (const item of items) {
      if (item.isNewProduct && item.newProductDetails) {
        const p = item.newProductDetails;
        
        // 1. Create Product
        const newProduct = await tx.product.create({
          data: {
            name: p.name,
            description: p.description,
            category: p.category,
            color: p.color,
            printName: p.printName,
            imageUrl: p.imageUrl,
            basePrice: p.basePrice,
          },
        });

        // 2. Create Variants & deduct stock (since it's a sale/consignment of these new items)
        for (const v of p.variants) {
          const variant = await tx.productVariant.create({
            data: {
              productId: newProduct.id,
              size: v.size,
              stock: 0, // Consignment logic: it starts at 0, goes negative, or starts at quantity and drops to 0. Let's just set to 0.
              price: v.price,
            }
          });

          orderItemsToCreate.push({
            productVariantId: variant.id,
            quantity: v.quantity,
            soldPricePerUnit: v.price,
            totalAmount: v.quantity * v.price,
          });
          totalOrderAmount += (v.quantity * v.price);
        }
      } else if (!item.isNewProduct && item.productVariantId && item.quantity && item.soldPricePerUnit) {
        // Existing product variant
        orderItemsToCreate.push({
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          soldPricePerUnit: item.soldPricePerUnit,
          totalAmount: item.quantity * item.soldPricePerUnit,
        });
        totalOrderAmount += (item.quantity * item.soldPricePerUnit);

        // Deduct stock
        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { stock: { decrement: item.quantity } }
        });
      }
    }

    const order = await tx.order.create({
      data: {
        channel,
        customerId,
        totalAmount: totalOrderAmount,
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
  });

  revalidatePath('/');
  return { success: true };
}

export async function fetchLedger(filters?: { searchTerm?: string; channel?: Channel | 'ALL'; }) {
  let whereClause: any = {};

  if (filters?.channel && filters.channel !== 'ALL') {
    whereClause.channel = filters.channel;
  }

  if (filters?.searchTerm) {
    whereClause.OR = [
      { items: { some: { productVariant: { product: { name: { contains: filters.searchTerm, mode: 'insensitive' } } } } } },
      { items: { some: { productVariant: { product: { printName: { contains: filters.searchTerm, mode: 'insensitive' } } } } } },
      { customer: { name: { contains: filters.searchTerm, mode: 'insensitive' } } },
      { invoice: { invoiceNumber: { contains: filters.searchTerm, mode: 'insensitive' } } }
    ];
  }

  const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      customer: true,
      invoice: true,
      items: {
        include: {
          productVariant: {
            include: { product: true }
          }
        }
      }
    },
    orderBy: { orderDate: 'desc' },
  });

  return orders;
}

export async function updateProductStock(variantId: string, newStock: number) {
  await prisma.productVariant.update({
    where: { id: variantId },
    data: { stock: newStock },
  });
  revalidatePath('/');
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
