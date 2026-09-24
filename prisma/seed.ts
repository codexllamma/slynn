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

    const subTotal = p.basePrice;
    const gst = subTotal * 0.05;
    const finalTotal = Math.round(subTotal + gst);

    const order = await prisma.order.create({
      data: {
        channel: Channel.ONLINE_RETAIL,
        customerDetails: customer1.name,
        subTotal: subTotal,
        discount: 0,
        taxRate: 5.0,
        taxAmount: gst,
        totalAmount: finalTotal,
        receivedAmount: finalTotal,
        balance: 0,
        items: {
          create: [
            {
              productId: product.id,
              quantity: 1,
              pricePerUnit: p.basePrice,
              totalPrice: subTotal,
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
