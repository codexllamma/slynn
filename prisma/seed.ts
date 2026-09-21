import { PrismaClient, Channel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.invoice.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();

  const customer1 = await prisma.customer.create({
    data: { name: 'Rahul Sharma', email: 'rahul.s@example.com', phone: '+91 9876543210', address: '12 MG Road, Bengaluru' }
  });
  
  const customer2 = await prisma.customer.create({
    data: { name: 'Priya Patel (Walk-in)', phone: '+91 9123456789' }
  });
  
  const customer3 = await prisma.customer.create({
    data: { name: 'Urban Men Boutique', email: 'wholesale@urbanmen.in', phone: '+91 8901234567', address: 'Sector 14, Gurugram' }
  });

  const productsData = [
    { skuBase: 'TS-BLK-SOLID', name: 'Premium Solid T-Shirt', description: 'Essential black crewneck t-shirt made with 100% organic cotton', category: 'T-Shirts', color: 'Black', printName: null, imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=200&q=80', basePrice: 699.00 },
    { skuBase: 'TS-WHT-WOLF', name: 'Lone Wolf Graphic Tee', description: 'White t-shirt with a minimalist wolf line-art print on the chest', category: 'T-Shirts', color: 'White', printName: 'Lone Wolf', imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=200&q=80', basePrice: 899.00 },
    { skuBase: 'HD-NVY-SOLID', name: 'Heavyweight Pullover Hoodie', description: 'Premium heavyweight unprinted hoodie for winter', category: 'Hoodies', color: 'Navy Blue', printName: null, imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=200&q=80', basePrice: 1499.00 },
  ];

  for (const p of productsData) {
    const product = await prisma.product.create({
      data: {
        sku: p.skuBase,
        name: p.name,
        description: p.description,
        category: p.category,
        color: p.color,
        printName: p.printName,
        imageUrl: p.imageUrl,
        basePrice: p.basePrice,
        variants: {
          create: [
            { size: 'S', stock: 20 },
            { size: 'M', stock: 50 },
            { size: 'L', stock: 50 },
            { size: 'XL', stock: 30 },
          ]
        }
      },
      include: { variants: true }
    });

    const mVariant = product.variants.find(v => v.size === 'M')!;

    const order = await prisma.order.create({
      data: {
        channel: Channel.ONLINE_RETAIL,
        customerId: customer1.id,
        totalAmount: p.basePrice * 1,
        items: {
          create: [
            {
              productVariantId: mVariant.id,
              quantity: 1,
              soldPricePerUnit: p.basePrice,
              totalAmount: p.basePrice * 1,
            }
          ]
        }
      },
    });

    await prisma.invoice.create({
      data: {
        orderId: order.id,
        invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      },
    });
  }

  // Offline Retail Order (Multiple items)
  const product2 = await prisma.product.findFirst({ where: { sku: 'TS-BLK-SOLID' }, include: { variants: true } });
  const product2Wolf = await prisma.product.findFirst({ where: { sku: 'TS-WHT-WOLF' }, include: { variants: true } });
  
  if (product2 && product2Wolf) {
    const variant1 = product2.variants.find(v => v.size === 'L')!;
    const variant2 = product2Wolf.variants.find(v => v.size === 'M')!;
    
    await prisma.order.create({
      data: {
        channel: Channel.OFFLINE_RETAIL,
        customerId: customer2.id,
        totalAmount: (product2.basePrice! * 2) + (product2Wolf.basePrice! * 1),
        items: {
          create: [
            {
              productVariantId: variant1.id,
              quantity: 2,
              soldPricePerUnit: product2.basePrice!,
              totalAmount: product2.basePrice! * 2,
            },
            {
              productVariantId: variant2.id,
              quantity: 1,
              soldPricePerUnit: product2Wolf.basePrice!,
              totalAmount: product2Wolf.basePrice! * 1,
            }
          ]
        }
      },
    });
  }

  // Wholesale Order
  const product3 = await prisma.product.findFirst({ where: { sku: 'HD-NVY-SOLID' }, include: { variants: true } });
  if (product3) {
    const variantM = product3.variants.find(v => v.size === 'M')!;
    const variantL = product3.variants.find(v => v.size === 'L')!;
    const variantXL = product3.variants.find(v => v.size === 'XL')!;

    const wholesaleOrder = await prisma.order.create({
      data: {
        channel: Channel.WHOLESALE,
        customerId: customer3.id,
        totalAmount: 36000.00,
        items: {
          create: [
            {
              productVariantId: variantM.id,
              quantity: 10,
              soldPricePerUnit: 1200.00,
              totalAmount: 12000.00,
            },
            {
              productVariantId: variantL.id,
              quantity: 10,
              soldPricePerUnit: 1200.00,
              totalAmount: 12000.00,
            },
            {
              productVariantId: variantXL.id,
              quantity: 10,
              soldPricePerUnit: 1200.00,
              totalAmount: 12000.00,
            }
          ]
        }
      },
    });
    
    await prisma.invoice.create({
      data: {
        orderId: wholesaleOrder.id,
        invoiceNumber: `INV-WS-${Date.now()}`,
      },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
