import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { prisma } from "@/lib/server/prisma";

const DISPLAY_STATUSES = ["settlement", "capture", "success", "paid", "pending"] as const;

type Period = "week" | "month" | "year";

type ChartData = {
  labels: string[];
  values: number[];
  period: Period;
  totalPeriodRevenue: number;
};

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

function emptyChart(period: Period): ChartData {
  let labels: string[] = [];
  let values: number[] = [];

  if (period === "week") {
    labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    values = Array(7).fill(0);
  } else if (period === "month") {
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }));
      values.push(0);
    }
  } else {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    for (let i = 11; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      labels.push(monthNames[monthIndex]);
      values.push(0);
    }
  }

  return { labels, values, period, totalPeriodRevenue: 0 };
}

async function getChartData(userId: string, period: Period): Promise<ChartData> {
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  let startDate: Date;
  let labels: string[] = [];
  const dateMap: Map<string, number> = new Map();

  if (period === "week") {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      labels.push(weekDays[d.getDay()]);
      dateMap.set(d.toDateString(), 0);
    }
  } else if (period === "month") {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 29);
    startDate.setHours(0, 0, 0, 0);
    for (let i = 0; i < 30; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      labels.push(d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }));
      dateMap.set(d.toDateString(), 0);
    }
  } else {
    startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - 11);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let i = 0; i < 12; i++) {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + i);
      labels.push(monthNames[d.getMonth()]);
      dateMap.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
    }
  }

  const txs = await prisma.transaction.findMany({
    where: {
      userId,
      status: { in: DISPLAY_STATUSES as any },
      createdAt: { gte: startDate, lte: now },
    },
    select: { createdAt: true, grossAmount: true, price: true },
    orderBy: { createdAt: "asc" },
  });

  for (const tx of txs) {
    const amount = tx.grossAmount ?? tx.price ?? 0;
    const d = new Date(tx.createdAt);
    if (period === "year") {
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      dateMap.set(key, (dateMap.get(key) ?? 0) + amount);
    } else {
      const key = d.toDateString();
      if (dateMap.has(key)) dateMap.set(key, (dateMap.get(key) ?? 0) + amount);
    }
  }

  const values: number[] = [];
  if (period === "year") {
    for (let i = 0; i < 12; i++) {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + i);
      values.push(dateMap.get(`${d.getFullYear()}-${d.getMonth()}`) ?? 0);
    }
  } else if (period === "month") {
    for (let i = 0; i < 30; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      values.push(dateMap.get(d.toDateString()) ?? 0);
    }
  } else {
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      values.push(dateMap.get(d.toDateString()) ?? 0);
    }
  }

  return { labels, values, period, totalPeriodRevenue: values.reduce((s, v) => s + v, 0) };
}

export async function GET(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) return errorResponse("Unauthorized", 401, "Please login to access dashboard data");

  const url = new URL(req.url);
  const period = (url.searchParams.get("period") as Period) || "week";
  if (!["week", "month", "year"].includes(period)) {
    return errorResponse("Invalid period parameter", 400, "Period must be 'week', 'month', or 'year'");
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalOrders = await prisma.transaction.count({
      where: { userId: session.sub, status: { in: DISPLAY_STATUSES as any } },
    });

    if (totalOrders === 0) {
      const chart = emptyChart(period);
      return NextResponse.json({
        success: true,
        metrics: {
          ordersToday: 0,
          revenue: 0,
          topDish: "-",
          avgOrderValue: 0,
          pendingOrders: 0,
        },
        recentOrders: [],
        chart,
        popularItems: [],
      });
    }

    const ordersToday = await prisma.transaction.count({
      where: {
        userId: session.sub,
        status: { in: DISPLAY_STATUSES as any },
        createdAt: { gte: today, lt: tomorrow },
      },
    });

    const todaySpendingAgg = await prisma.transaction.aggregate({
      where: {
        userId: session.sub,
        status: { in: DISPLAY_STATUSES as any },
        createdAt: { gte: today, lt: tomorrow },
      },
      _sum: { grossAmount: true, price: true },
    });

    const recentOrders = await prisma.transaction.findMany({
      where: { userId: session.sub, status: { in: DISPLAY_STATUSES as any } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        customerName: true,
        productName: true,
        price: true,
        grossAmount: true,
        status: true,
        createdAt: true,
        items: true,
      },
    });

    const itemCounts: Record<string, number> = {};
    const itemRevenue: Record<string, number> = {};
    for (const tx of recentOrders) {
      const items = (tx.items as any[]) || [];
      for (const it of items) {
        const key = it.name ?? "Item";
        itemCounts[key] = (itemCounts[key] ?? 0) + (Number(it.qty) || 1);
        itemRevenue[key] = (itemRevenue[key] ?? 0) + (Number(it.qty) || 1) * (Number(it.price) || 0);
      }
    }
    const topDish = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
    const popularItems = Object.entries(itemCounts)
      .map(([name, orders]) => ({
        name,
        orders,
        revenue: itemRevenue[name] ?? 0,
      }))
      .sort((a, b) => b.orders - a.orders || b.revenue - a.revenue)
      .slice(0, 5);

    const chartData = await getChartData(session.sub, period);

    const totalSpendingAgg = await prisma.transaction.aggregate({
      where: { userId: session.sub, status: { in: DISPLAY_STATUSES as any } },
      _sum: { grossAmount: true, price: true },
    });

    const pendingOrders = await prisma.transaction.count({
      where: { userId: session.sub, status: "pending" },
    });

    return NextResponse.json({
      success: true,
      metrics: {
        ordersToday,
        revenue:
          todaySpendingAgg._sum.grossAmount ??
          todaySpendingAgg._sum.price ??
          totalSpendingAgg._sum.grossAmount ??
          totalSpendingAgg._sum.price ??
          0,
        topDish,
        periodRevenue: chartData.totalPeriodRevenue,
        pendingOrders,
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id.slice(-3).padStart(3, "0"),
        customerName: o.customerName ?? "You",
        item: (Array.isArray(o.items) && (o.items as any[])[0]?.name) || o.productName,
        total: o.grossAmount ?? o.price ?? 0,
        status: o.status ?? "pending",
        createdAt: o.createdAt,
      })),
      chart: {
        labels: chartData.labels,
        values: chartData.values,
        period: chartData.period,
      },
      popularItems,
      isDemo: false,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Dashboard API Error]", errorMessage);
    return errorResponse(
      "Failed to fetch dashboard data",
      500,
      process.env.NODE_ENV === "development" ? errorMessage : undefined
    );
  }
}
