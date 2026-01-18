import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { prisma } from "@/lib/server/prisma";

// Error response helper for consistent error formatting
function errorResponse(message: string, status: number, details?: string) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        details: details ?? null,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

// Demo/fallback data when database is empty
function getDemoData() {
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return {
    metrics: {
      ordersToday: 120,
      revenue: 15000000,
      topDish: "Nasi Goreng",
    },
    recentOrders: [
      { id: "001", customerName: "Alice", item: "Nasi Goreng", total: 45000, status: "delivered" },
      { id: "002", customerName: "Bob", item: "Burger", total: 60000, status: "preparing" },
      { id: "003", customerName: "Clara", item: "Salad", total: 35000, status: "delivered" },
    ],
    chart: {
      labels: weekDays,
      values: [500000, 650000, 700000, 450000, 800000, 750000, 900000],
    },
    isDemo: true,
  };
}

export async function GET(req: Request) {
  // Auth check
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return errorResponse("Unauthorized", 401, "Please login to access dashboard data");
  }

  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if we have any data in database
    const totalOrders = await prisma.order.count();
    
    // If no data, return demo data
    if (totalOrders === 0) {
      return NextResponse.json({
        success: true,
        ...getDemoData(),
      });
    }

    // Get orders today count
    const ordersToday = await prisma.order.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Get today's revenue
    const todayRevenue = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        status: "delivered",
      },
      _sum: {
        total: true,
      },
    });

    // Get top dish (most ordered item - all time if no orders today)
    const topDish = await prisma.order.groupBy({
      by: ["item"],
      _count: {
        item: true,
      },
      orderBy: {
        _count: {
          item: "desc",
        },
      },
      take: 1,
    });

    // Get recent orders (last 10)
    const recentOrders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        customerName: true,
        item: true,
        total: true,
        status: true,
        createdAt: true,
      },
    });

    // Get weekly revenue data (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyRevenues = await prisma.dailyRevenue.findMany({
      where: {
        date: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: { date: "asc" },
    });

    // Format weekly data for chart
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const chartLabels: string[] = [];
    const chartValues: number[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);
      const dayName = weekDays[date.getDay()];
      chartLabels.push(dayName);

      const dayData = dailyRevenues.find((d) => {
        const dDate = new Date(d.date);
        return dDate.toDateString() === date.toDateString();
      });

      chartValues.push(dayData?.revenue ?? 0);
    }

    // Calculate total revenue from delivered orders
    const totalRevenue = await prisma.order.aggregate({
      where: { status: "delivered" },
      _sum: { total: true },
    });

    return NextResponse.json({
      success: true,
      metrics: {
        ordersToday,
        revenue: todayRevenue._sum.total ?? totalRevenue._sum.total ?? 0,
        topDish: topDish[0]?.item ?? "-",
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id.slice(-3).padStart(3, "0"),
        customerName: o.customerName,
        item: o.item,
        total: o.total,
        status: o.status,
      })),
      chart: {
        labels: chartLabels,
        values: chartValues,
      },
      isDemo: false,
    });
  } catch (error) {
    // Log error with context for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("[Dashboard API Error]", {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
      userId: session?.sub,
    });

    // Return professional error response
    return errorResponse(
      "Failed to fetch dashboard data",
      500,
      process.env.NODE_ENV === "development" ? errorMessage : undefined
    );
  }
}
