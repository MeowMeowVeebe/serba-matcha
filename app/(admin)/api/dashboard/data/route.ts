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

// Empty data when database is empty
function getEmptyData(period: "week" | "month" | "year" = "week") {
  let labels: string[] = [];
  let values: number[] = [];
  
  if (period === "week") {
    labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    values = [0, 0, 0, 0, 0, 0, 0];
  } else if (period === "month") {
    // Last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }));
      values.push(0);
    }
  } else {
    // Last 12 months
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    for (let i = 11; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      labels.push(monthNames[monthIndex]);
      values.push(0);
    }
  }
  
  return {
    metrics: {
      ordersToday: 0,
      revenue: 0,
      topDish: "-",
      totalCustomers: 0,
      avgOrderValue: 0,
      pendingOrders: 0,
    },
    recentOrders: [],
    chart: {
      labels,
      values,
      period,
    },
    popularItems: [],
    isEmpty: true,
  };
}

// Get chart data based on period from DailyRevenue table
async function getChartData(period: "week" | "month" | "year") {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  
  let startDate: Date;
  let labels: string[] = [];
  let dateMap: Map<string, number> = new Map();
  
  if (period === "week") {
    // Last 7 days
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
    
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toDateString();
      labels.push(weekDays[d.getDay()]);
      dateMap.set(key, 0);
    }
  } else if (period === "month") {
    // Last 30 days
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 29);
    startDate.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toDateString();
      labels.push(d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }));
      dateMap.set(key, 0);
    }
  } else {
    // Last 12 months - aggregate by month
    startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - 11);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let i = 0; i < 12; i++) {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + i);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      labels.push(monthNames[d.getMonth()]);
      dateMap.set(key, 0);
    }
  }
  
  // Fetch data from DailyRevenue table
  const dailyRevenues = await prisma.dailyRevenue.findMany({
    where: {
      date: {
        gte: startDate,
        lte: now,
      },
    },
    orderBy: { date: "asc" },
  });
  
  // Map revenue data
  for (const dr of dailyRevenues) {
    const d = new Date(dr.date);
    if (period === "year") {
      // Aggregate by month
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const current = dateMap.get(key) ?? 0;
      dateMap.set(key, current + dr.revenue);
    } else {
      // Daily
      const key = d.toDateString();
      if (dateMap.has(key)) {
        dateMap.set(key, dr.revenue);
      }
    }
  }
  
  // Convert map to values array (maintain order)
  const values: number[] = [];
  if (period === "year") {
    for (let i = 0; i < 12; i++) {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + i);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      values.push(dateMap.get(key) ?? 0);
    }
  } else if (period === "month") {
    for (let i = 0; i < 30; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toDateString();
      values.push(dateMap.get(key) ?? 0);
    }
  } else {
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toDateString();
      values.push(dateMap.get(key) ?? 0);
    }
  }
  
  // Calculate total revenue for period
  const totalPeriodRevenue = values.reduce((sum, v) => sum + v, 0);
  
  return { labels, values, totalPeriodRevenue, period };
}

export async function GET(req: Request) {
  // Auth check
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return errorResponse("Unauthorized", 401, "Please login to access dashboard data");
  }

  try {
    // Parse period from URL query params
    const url = new URL(req.url);
    const period = (url.searchParams.get("period") as "week" | "month" | "year") || "week";
    
    // Validate period
    if (!["week", "month", "year"].includes(period)) {
      return errorResponse("Invalid period parameter", 400, "Period must be 'week', 'month', or 'year'");
    }
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if we have any data in database
    const totalOrders = await prisma.order.count();
    
    // If no data, return empty data
    if (totalOrders === 0) {
      return NextResponse.json({
        success: true,
        ...getEmptyData(period),
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

    // Get chart data based on period
    const chartData = await getChartData(period);

    // Calculate total revenue from delivered orders (all time)
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
        periodRevenue: chartData.totalPeriodRevenue,
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id.slice(-3).padStart(3, "0"),
        customerName: o.customerName,
        item: o.item,
        total: o.total,
        status: o.status,
      })),
      chart: {
        labels: chartData.labels,
        values: chartData.values,
        period: chartData.period,
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
