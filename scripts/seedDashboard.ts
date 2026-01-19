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

  // Create revenue data for the past 365 days (to support week/month/year views)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  console.log("Creating daily revenue data for the past 365 days...");

  // Generate realistic revenue data with some variance
  const baseRevenue = 500000; // Base daily revenue
  const variance = 300000; // Random variance up/down
  
  for (let daysAgo = 364; daysAgo >= 0; daysAgo--) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    
    // Add some patterns: weekends have higher revenue, seasonal trends
    const dayOfWeek = date.getDay();
    const month = date.getMonth();
    
    // Weekend boost (Sat=6, Sun=0)
    const weekendBoost = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.3 : 1.0;
    
    // Seasonal trends (higher in Dec, lower in Feb)
    const seasonalMultiplier = 1 + (Math.sin((month - 2) * Math.PI / 6) * 0.2);
    
    // Random variance with seed based on date for consistency
    const seed = date.getTime();
    const randomFactor = 0.7 + ((seed % 1000) / 1000) * 0.6; // 0.7 to 1.3
    
    const revenue = Math.floor(baseRevenue * weekendBoost * seasonalMultiplier * randomFactor);
    const ordersCount = Math.floor(revenue / 40000) + Math.floor((seed % 10)); // Approx orders based on revenue

    await prisma.dailyRevenue.upsert({
      where: { date },
      update: { revenue, orders: ordersCount },
      create: { date, revenue, orders: ordersCount },
    });
  }

  console.log("Created 365 days of revenue data");
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
