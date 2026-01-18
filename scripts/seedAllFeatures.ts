import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding all feature data...\n");

  // ===== ANALYTICS DATA =====
  console.log("📊 Seeding Analytics data...");

  // Insights
  await prisma.insight.deleteMany();
  await prisma.insight.createMany({
    data: [
      { icon: "📊", title: "Revenue Analysis", description: "Analisis pendapatan per periode", value: "+12%", change: "+2.5%", category: "revenue", sortOrder: 1 },
      { icon: "👥", title: "User Growth", description: "Pertumbuhan pengguna aktif", value: "+8.5%", change: "+1.2%", category: "users", sortOrder: 2 },
      { icon: "🎯", title: "Conversion Rate", description: "Tingkat konversi funnel", value: "4.2%", change: "+0.3%", category: "conversion", sortOrder: 3 },
      { icon: "⏱️", title: "Avg Session", description: "Rata-rata durasi sesi", value: "5m 32s", change: "+45s", category: "engagement", sortOrder: 4 },
    ],
  });

  // Usage Trends
  await prisma.usageTrend.deleteMany();
  await prisma.usageTrend.createMany({
    data: [
      { label: "Active Users", value: "12.4k", change: "+8%" },
      { label: "Session Depth", value: "4.3", change: "+0.7" },
      { label: "Retention", value: "78%", change: "+4%" },
      { label: "Page Views", value: "45.2k", change: "+12%" },
    ],
  });

  // Daily Usage
  await prisma.dailyUsage.deleteMany();
  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - (6 - i));
    await prisma.dailyUsage.create({
      data: {
        day: days[i],
        date,
        users: 5200 + i * 600 + Math.floor(Math.random() * 500),
        sessions: 8400 + i * 800 + Math.floor(Math.random() * 700),
        pageViews: 12000 + i * 1000 + Math.floor(Math.random() * 1000),
      },
    });
  }

  // Engagement Pulse
  await prisma.engagementPulse.deleteMany();
  await prisma.engagementPulse.createMany({
    data: [
      { time: "09:00", label: "Morning Peak", change: "+18%", icon: "🌅" },
      { time: "12:30", label: "Lunch Rush", change: "+24%", icon: "🍽️" },
      { time: "15:00", label: "Afternoon", change: "+12%", icon: "☀️" },
      { time: "18:45", label: "Evening Dip", change: "-9%", icon: "🌆" },
    ],
  });

  // Top CTAs
  await prisma.topCTA.deleteMany();
  await prisma.topCTA.createMany({
    data: [
      { label: "Upgrade Plan", clicks: 342, rate: "7.4%" },
      { label: "Invite Team", clicks: 218, rate: "5.2%" },
      { label: "Download Report", clicks: 156, rate: "3.8%" },
    ],
  });

  // Customer Journeys
  await prisma.customerJourney.deleteMany();
  await prisma.customerJourney.createMany({
    data: [
      { persona: "New User", icon: "👤", steps: JSON.stringify(["Signup", "Setup", "First Success"]), completion: 72 },
      { persona: "Ops Lead", icon: "👔", steps: JSON.stringify(["Trial", "Adoption", "Scale"]), completion: 64 },
      { persona: "Security Analyst", icon: "🔒", steps: JSON.stringify(["Awareness", "Trial", "Convert"]), completion: 42 },
    ],
  });

  // ===== FEATURES DATA =====
  console.log("🧪 Seeding Features data...");

  // Feature Experiments
  await prisma.featureExperiment.deleteMany();
  await prisma.featureExperiment.createMany({
    data: [
      { name: "Gradient Cards", icon: "🎨", status: "testing", result: "+14% CTR", owner: "Design", progress: 65 },
      { name: "Compact Tables", icon: "📊", status: "winner", result: "+22% engagement", owner: "Product", progress: 100 },
      { name: "Dark Mode v2", icon: "🌙", status: "planning", result: "-", owner: "Design", progress: 10 },
      { name: "New CTA Button", icon: "🔘", status: "running", result: "+8% clicks", owner: "Growth", progress: 45 },
      { name: "Sidebar Density", icon: "📐", status: "paused", result: "-", owner: "Design", progress: 30 },
      { name: "Search v2", icon: "🔍", status: "planning", result: "-", owner: "Product", progress: 5 },
    ],
  });

  // Component Library
  await prisma.componentLib.deleteMany();
  await prisma.componentLib.createMany({
    data: [
      { name: "Smart Skeleton", description: "Loading placeholder adaptif", status: "stable" },
      { name: "Toast Manager", description: "Notifikasi sistem", status: "stable" },
      { name: "Data Table", description: "Tabel dengan sorting & filter", status: "beta" },
      { name: "Date Picker", description: "Pemilih tanggal dengan range", status: "stable" },
      { name: "Command Palette", description: "Quick actions keyboard", status: "beta" },
    ],
  });

  // Feature Spotlight
  await prisma.featureSpotlight.deleteMany();
  await prisma.featureSpotlight.createMany({
    data: [
      { icon: "✨", name: "Auto Insights", description: "Ringkasan otomatis dari data", adoption: 87 },
      { icon: "📊", name: "Smart Charts", description: "Grafik interaktif dengan drill-down", adoption: 72 },
      { icon: "🔔", name: "Alert Rules", description: "Notifikasi berbasis threshold", adoption: 64 },
    ],
  });

  // Team Testimonials
  await prisma.teamTestimonial.deleteMany();
  await prisma.teamTestimonial.createMany({
    data: [
      { team: "Ops Team", quote: "Auto-summary menghemat 3 jam/hari." },
      { team: "Security", quote: "Anomaly detection 2x lebih cepat." },
      { team: "Finance", quote: "Forecast jadi lebih presisi." },
    ],
  });

  // Feature Flags
  await prisma.featureFlag.deleteMany();
  await prisma.featureFlag.createMany({
    data: [
      { name: "dark_mode_v2", enabled: true, users: "100%" },
      { name: "new_dashboard", enabled: true, users: "50%" },
      { name: "ai_insights", enabled: false, users: "0%" },
      { name: "beta_exports", enabled: true, users: "25%" },
    ],
  });

  // Alert Rules
  await prisma.alertRule.deleteMany();
  await prisma.alertRule.createMany({
    data: [
      { name: "Login failures > 5", condition: "login_failures > 5", channel: "Slack", status: "active", triggered: 12 },
      { name: "Export job stuck", condition: "export_duration > 30m", channel: "Email", status: "draft", triggered: 0 },
      { name: "Latency spike > 500ms", condition: "p95_latency > 500", channel: "SMS", status: "active", triggered: 3 },
      { name: "Error rate > 5%", condition: "error_rate > 0.05", channel: "Slack", status: "active", triggered: 8 },
    ],
  });

  // ===== OPERATIONS DATA =====
  console.log("⚙️ Seeding Operations data...");

  // Services
  await prisma.service.deleteMany();
  await prisma.service.createMany({
    data: [
      { name: "API Server", status: "operational", uptime: "99.98%" },
      { name: "Database", status: "operational", uptime: "99.95%" },
      { name: "Auth Service", status: "operational", uptime: "99.99%" },
      { name: "Export Queue", status: "degraded", uptime: "98.50%" },
      { name: "Email Service", status: "operational", uptime: "99.90%" },
    ],
  });

  // Queue Metrics
  await prisma.queueMetric.deleteMany();
  await prisma.queueMetric.createMany({
    data: [
      { name: "Audit Queue", count: 12, status: "stable" },
      { name: "Export Jobs", count: 4, status: "healthy" },
      { name: "Alerts", count: 3, status: "watch" },
      { name: "Email Queue", count: 8, status: "healthy" },
    ],
  });

  // Incidents
  await prisma.incident.deleteMany();
  await prisma.incident.createMany({
    data: [
      { incidentId: "INC-001", time: "09:10", detail: "Login spike from new IP range", severity: "high", status: "investigating" },
      { incidentId: "INC-002", time: "10:25", detail: "Rate limit threshold reached", severity: "medium", status: "mitigated" },
      { incidentId: "INC-003", time: "11:40", detail: "Export backlog cleared", severity: "low", status: "resolved" },
      { incidentId: "INC-004", time: "14:30", detail: "Database connection pool exhausted", severity: "high", status: "resolved" },
    ],
  });

  // Action Items
  await prisma.actionItem.deleteMany();
  await prisma.actionItem.createMany({
    data: [
      { title: "Follow-up ticket drop", description: "Tingkatkan CTA di jam makan siang", owner: "Growth", priority: "high" },
      { title: "Audit log spikes", description: "Review pattern login 19:00-21:00", owner: "Security", priority: "high" },
      { title: "Ops throughput", description: "Kurangi langkah manual approval", owner: "Ops", priority: "medium" },
      { title: "Feature adoption", description: "Push notifikasi fitur baru", owner: "Product", priority: "low" },
    ],
  });

  // Playbook Steps
  await prisma.playbookStep.deleteMany();
  await prisma.playbookStep.createMany({
    data: [
      { title: "Morning Checks", description: "Review audit log & session anomalies", sortOrder: 1 },
      { title: "Midday Sync", description: "Update action planner priorities", sortOrder: 2 },
      { title: "End-of-Day Wrap", description: "Export metrics + log incidents", sortOrder: 3 },
    ],
  });

  // ===== FEEDBACK & GROWTH DATA =====
  console.log("💬 Seeding Feedback & Growth data...");

  // Feedbacks
  await prisma.feedback.deleteMany();
  await prisma.feedback.createMany({
    data: [
      { title: "Onboarding flow", detail: "User suka tutorial ringkas dan CTA jelas.", sentiment: "positive", source: "survey" },
      { title: "Audit log filters", detail: "Butuh quick filter yang lebih terlihat di mobile.", sentiment: "mixed", source: "support" },
      { title: "Dashboard charts", detail: "Grafik baru memudahkan insight harian.", sentiment: "positive", source: "interview" },
    ],
  });

  // Pricing Experiments
  await prisma.pricingExperiment.deleteMany();
  await prisma.pricingExperiment.createMany({
    data: [
      { title: "Starter +5%", value: "CTR 6.2%", change: "+0.8%" },
      { title: "Pro trial extend", value: "Conv 12%", change: "+1.4%" },
      { title: "Annual discount", value: "Upgrade 4%", change: "+0.6%" },
    ],
  });

  // Release Notes
  await prisma.releaseNote.deleteMany();
  await prisma.releaseNote.createMany({
    data: [
      { version: "v1.8.0", date: new Date("2026-01-17"), items: JSON.stringify(["New Action Planner dashboard", "Audit log quick presets", "Matcha theme refresh"]), category: "feature" },
      { version: "v1.7.4", date: new Date("2026-01-12"), items: JSON.stringify(["Security heatmap playback", "RBAC role coverage", "Performance tuning"]), category: "improvement" },
      { version: "v1.7.0", date: new Date("2026-01-05"), items: JSON.stringify(["Insights Studio updates", "Usage Trends page", "Password storyline"]), category: "feature" },
    ],
  });

  // Campaigns
  await prisma.campaign.deleteMany();
  await prisma.campaign.createMany({
    data: [
      { date: "Mon", title: "Lunch promo", note: "Push via email + in-app" },
      { date: "Wed", title: "Trial reminder", note: "Segment: SMB" },
      { date: "Fri", title: "Referral boost", note: "Social + banner" },
    ],
  });

  // Team Rituals
  await prisma.teamRitual.deleteMany();
  await prisma.teamRitual.createMany({
    data: [
      { title: "Morning ops sync", detail: "Cek audit log dan KPI utama sebelum 10:00.", sortOrder: 1 },
      { title: "Security pulse", detail: "Review anomaly dan revoke session mencurigakan.", sortOrder: 2 },
      { title: "Growth focus", detail: "Eksperimen CTA baru dan update campaign.", sortOrder: 3 },
    ],
  });

  // Customer Success Metrics
  await prisma.customerSuccessMetric.deleteMany();
  await prisma.customerSuccessMetric.createMany({
    data: [
      { title: "NPS", value: "48", change: "+6" },
      { title: "Renewal", value: "92%", change: "+2%" },
      { title: "Expansion", value: "14%", change: "+1%" },
    ],
  });

  // Revenue Metrics
  await prisma.revenueMetric.deleteMany();
  await prisma.revenueMetric.createMany({
    data: [
      { title: "MRR", value: "$128k", change: "+6%" },
      { title: "ARPU", value: "$48", change: "+2%" },
      { title: "Churn", value: "2.4%", change: "-0.4%" },
    ],
  });

  // ===== HEATMAP DATA =====
  console.log("🔥 Seeding Heatmap data...");

  // Heatmap Hotspots
  await prisma.heatmapHotspot.deleteMany();
  await prisma.heatmapHotspot.createMany({
    data: [
      { area: "Header CTA", clicks: 1240, rate: "12.4%" },
      { area: "Sidebar Menu", clicks: 890, rate: "8.9%" },
      { area: "Main Content", clicks: 2100, rate: "21.0%" },
      { area: "Footer Links", clicks: 340, rate: "3.4%" },
    ],
  });

  // Device Stats
  await prisma.deviceStat.deleteMany();
  await prisma.deviceStat.createMany({
    data: [
      { deviceType: "Desktop", percentage: 58 },
      { deviceType: "Mobile", percentage: 32 },
      { deviceType: "Tablet", percentage: 10 },
    ],
  });

  // Heatmap Summary
  await prisma.heatmapSummary.deleteMany();
  await prisma.heatmapSummary.create({
    data: {
      totalClicks: 4570,
      avgSession: "2m 34s",
      scrollDepth: 78,
      date: new Date(),
    },
  });

  // ===== SECURITY DATA =====
  console.log("🔐 Seeding Security data...");

  // Security Events
  await prisma.securityEvent.deleteMany();
  const now = new Date();
  await prisma.securityEvent.createMany({
    data: [
      { event: "Login berhasil", severity: "info", createdAt: now },
      { event: "Password diubah", severity: "warning", createdAt: new Date(now.getTime() - 3600000) },
      { event: "Session expired", severity: "info", createdAt: new Date(now.getTime() - 7200000) },
      { event: "Login gagal (3x)", severity: "danger", createdAt: new Date(now.getTime() - 86400000) },
      { event: "New device login", severity: "warning", createdAt: new Date(now.getTime() - 172800000) },
    ],
  });

  // User Sessions
  await prisma.userSession.deleteMany();
  await prisma.userSession.createMany({
    data: [
      { userId: "current", device: "Current Device", location: "Jakarta", isActive: true, lastSeenAt: now },
      { userId: "current", device: "Chrome on Windows", location: "Jakarta", isActive: true, lastSeenAt: new Date(now.getTime() - 172800000) },
      { userId: "current", device: "Safari on iPhone", location: "Bandung", isActive: false, lastSeenAt: new Date(now.getTime() - 604800000) },
    ],
  });

  console.log("\n✅ All feature data seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
