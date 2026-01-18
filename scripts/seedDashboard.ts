import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding dashboard data...");

  // Create sample orders
  const orders = [
    { customerName: "Alice", item: "Nasi Goreng", total: 45000, status: "delivered" as const },
    { customerName: "Bob", item: "Burger", total: 60000, status: "preparing" as const },
    { customerName: "Clara", item: "Salad", total: 35000, status: "delivered" as const },
    { customerName: "David", item: "Nasi Goreng", total: 45000, status: "delivered" as const },
    { customerName: "Eva", item: "Pizza", total: 85000, status: "pending" as const },
    { customerName: "Frank", item: "Nasi Goreng", total: 45000, status: "delivered" as const },
    { customerName: "Grace", item: "Sushi", total: 120000, status: "preparing" as const },
    { customerName: "Henry", item: "Burger", total: 60000, status: "delivered" as const },
    { customerName: "Ivy", item: "Salad", total: 35000, status: "cancelled" as const },
    { customerName: "Jack", item: "Nasi Goreng", total: 45000, status: "delivered" as const },
  ];

  for (const order of orders) {
    await prisma.order.create({
      data: order,
    });
  }

  console.log(`Created ${orders.length} orders`);

  // Create weekly revenue data
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weeklyData = [
    { daysAgo: 6, revenue: 500000, orders: 12 },
    { daysAgo: 5, revenue: 650000, orders: 15 },
    { daysAgo: 4, revenue: 700000, orders: 18 },
    { daysAgo: 3, revenue: 450000, orders: 10 },
    { daysAgo: 2, revenue: 800000, orders: 20 },
    { daysAgo: 1, revenue: 750000, orders: 17 },
    { daysAgo: 0, revenue: 575000, orders: 14 },
  ];

  for (const data of weeklyData) {
    const date = new Date(today);
    date.setDate(date.getDate() - data.daysAgo);

    await prisma.dailyRevenue.upsert({
      where: { date },
      update: { revenue: data.revenue, orders: data.orders },
      create: { date, revenue: data.revenue, orders: data.orders },
    });
  }

  console.log("Created weekly revenue data");
  console.log("Dashboard seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
