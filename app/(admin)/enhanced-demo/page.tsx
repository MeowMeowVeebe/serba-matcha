"use client";

import { useState } from "react";
import AccountShell from "@/components/AccountShell";
import {
  ParallaxCard,
  InteractiveCard,
  MetricCard,
  GlassModal,
  GlassCard,
  AnimatedCounter,
  AnimatedRing,
  AnimatedLineChart,
  AnimatedBarChart,
  ThemeGenerator,
  JourneyMap,
  DashboardSkeleton,
  LoadingWrapper,
  SmartCommandBar,
  AmbientBackground,
  AmbientToggle,
  OnboardingTour,
  dashboardTourSteps,
} from "@/components/ui";
import type { JourneyNode, JourneyConnection, CommandItem } from "@/components/ui";

export default function EnhancedDemoPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ambientEnabled, setAmbientEnabled] = useState(false);
  const [ambientVariant, setAmbientVariant] = useState<"gradient" | "particles" | "geometric" | "waves" | "aurora">("gradient");

  // Sample data for charts
  const lineChartData = [
    { label: "Jan", value: 120 },
    { label: "Feb", value: 190 },
    { label: "Mar", value: 150 },
    { label: "Apr", value: 280 },
    { label: "May", value: 220 },
    { label: "Jun", value: 350 },
    { label: "Jul", value: 310 },
  ];

  const barChartData = [
    { label: "Mon", value: 45, color: "var(--color-primary)" },
    { label: "Tue", value: 72, color: "var(--color-secondary)" },
    { label: "Wed", value: 58, color: "var(--color-accent)" },
    { label: "Thu", value: 89, color: "var(--color-primary)" },
    { label: "Fri", value: 63, color: "var(--color-secondary)" },
  ];

  // Journey Map data
  const journeyNodes: JourneyNode[] = [
    { id: "start", label: "Visit Site", x: 100, y: 200, type: "start", status: "completed", metrics: { users: 10000, conversionRate: 100 } },
    { id: "browse", label: "Browse", x: 250, y: 150, type: "action", status: "completed", metrics: { users: 7500, conversionRate: 75 } },
    { id: "search", label: "Search", x: 250, y: 250, type: "action", status: "completed", metrics: { users: 5000, conversionRate: 50 } },
    { id: "product", label: "View Product", x: 400, y: 200, type: "action", status: "active", metrics: { users: 4000, conversionRate: 40 } },
    { id: "cart", label: "Add to Cart", x: 550, y: 200, type: "milestone", status: "pending", metrics: { users: 2000, conversionRate: 20 } },
    { id: "checkout", label: "Checkout", x: 700, y: 200, type: "decision", status: "pending", metrics: { users: 1500, conversionRate: 15 } },
    { id: "purchase", label: "Purchase", x: 850, y: 200, type: "end", status: "pending", metrics: { users: 1000, conversionRate: 10 } },
  ];

  const journeyConnections: JourneyConnection[] = [
    { from: "start", to: "browse", weight: 75 },
    { from: "start", to: "search", weight: 50 },
    { from: "browse", to: "product", weight: 40 },
    { from: "search", to: "product", weight: 30 },
    { from: "product", to: "cart", weight: 20 },
    { from: "cart", to: "checkout", weight: 15 },
    { from: "checkout", to: "purchase", label: "Success", weight: 10 },
  ];

  // Command bar items
  const commands: CommandItem[] = [
    { id: "dashboard", label: "Go to Dashboard", icon: "📊", category: "navigation", action: () => window.location.href = "/dashboard", keywords: ["home", "main"] },
    { id: "settings", label: "Open Settings", icon: "⚙️", category: "navigation", action: () => window.location.href = "/settings", keywords: ["config", "preferences"] },
    { id: "export", label: "Export Data", icon: "📥", category: "action", action: () => alert("Exporting..."), shortcut: "⌘E" },
    { id: "refresh", label: "Refresh Data", icon: "🔄", category: "action", action: () => window.location.reload(), shortcut: "⌘R" },
    { id: "theme", label: "Toggle Dark Mode", icon: "🌙", category: "action", action: () => document.body.classList.toggle("dark") },
    { id: "help", label: "Help & Documentation", icon: "❓", category: "navigation", action: () => alert("Help center") },
  ];

  return (
    <AccountShell title="Enhanced Demo" description="Demo of enhanced components">
      {/* Ambient Background */}
      <AmbientBackground 
        enabled={ambientEnabled} 
        variant={ambientVariant}
        intensity="subtle"
        interactive
      />
      
      {/* Command Bar (Ctrl+K to open) */}
      <SmartCommandBar commands={commands} />
      
      {/* Onboarding Tour */}
      <OnboardingTour />

      <div className="dashboard-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            ✨ Enhanced Components Demo
          </h1>
          <p style={{ color: "var(--color-text-muted)" }}>
            10 Rekomendasi Frontend yang telah diimplementasikan
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <ThemeGenerator />
          <AmbientToggle 
            enabled={ambientEnabled}
            onToggle={setAmbientEnabled}
            variant={ambientVariant}
            onVariantChange={(v) => v && setAmbientVariant(v)}
          />
        </div>
      </div>

      {/* Section 1: Parallax Cards with Metrics */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>1. Parallax Cards & Micro-interactions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          {[
            { icon: "📈", title: "Total Revenue", value: 125430, change: "+12.5%", changeType: "positive" as const, trend: [20, 35, 28, 45, 52, 48, 65] },
            { icon: "👥", title: "Active Users", value: 8420, change: "+8.2%", changeType: "positive" as const, trend: [100, 120, 115, 140, 138, 155, 170] },
            { icon: "🛒", title: "Orders", value: 1284, change: "-2.4%", changeType: "negative" as const, trend: [50, 48, 52, 45, 42, 38, 35] },
            { icon: "⭐", title: "Satisfaction", value: "4.8", change: "Stable", changeType: "neutral" as const, trend: [4.5, 4.6, 4.7, 4.7, 4.8, 4.8, 4.8] },
          ].map((metric, i) => (
            <ParallaxCard key={i} index={i}>
              <MetricCard
                icon={metric.icon}
                title={metric.title}
                value={typeof metric.value === "number" ? (metric.title.includes("Revenue") ? `$${metric.value.toLocaleString()}` : metric.value) : metric.value}
                change={metric.change}
                changeType={metric.changeType}
                trend={metric.trend}
              />
            </ParallaxCard>
          ))}
        </div>
      </section>

      {/* Section 2: Glass Cards */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>2 & 3. Interactive & Glassmorphism Cards</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
          <InteractiveCard variant="glass" hoverEffect="all">
            <h3 style={{ marginBottom: "0.5rem" }}>Glass Card Effect</h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
              Hover untuk melihat efek glow dan tilt 3D yang smooth
            </p>
          </InteractiveCard>
          <InteractiveCard 
            variant="elevated" 
            hoverEffect="all"
            actions={
              <>
                <button className="btn btn--ghost btn--sm">Cancel</button>
                <button className="btn btn--primary btn--sm">Save</button>
              </>
            }
          >
            <h3 style={{ marginBottom: "0.5rem" }}>Card with Actions</h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
              Hover untuk reveal action buttons
            </p>
          </InteractiveCard>
          <GlassCard intensity="medium">
            <h3 style={{ marginBottom: "0.5rem" }}>Pure Glass Card</h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
              Dengan backdrop blur dan gradient overlay
            </p>
          </GlassCard>
        </div>
        <button 
          className="btn btn--primary" 
          style={{ marginTop: "1rem" }}
          onClick={() => setIsModalOpen(true)}
        >
          Open Glass Modal
        </button>
      </section>

      {/* Section 3: Animated Charts */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>4. Animated Data Visualization</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
          <GlassCard intensity="light">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3>Revenue Trend</h3>
              <span className="live-indicator">Live</span>
            </div>
            <AnimatedLineChart 
              data={lineChartData} 
              height={200}
              showDots
              showLabels
              fillGradient
            />
          </GlassCard>
          <GlassCard intensity="light">
            <h3 style={{ marginBottom: "1rem" }}>Weekly Performance</h3>
            <AnimatedBarChart 
              data={barChartData} 
              height={200}
              stagger={150}
            />
          </GlassCard>
        </div>
        <div style={{ display: "flex", gap: "2rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <AnimatedRing value={78} size={100} color="var(--color-primary)" />
            <p style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>Completion Rate</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <AnimatedRing value={92} size={100} color="var(--color-success)" />
            <p style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>Success Rate</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <AnimatedRing value={45} size={100} color="var(--color-warning)" />
            <p style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>Pending Tasks</p>
          </div>
        </div>
      </section>

      {/* Section 4: Journey Map */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>6. Interactive Journey Map</h2>
        <JourneyMap 
          nodes={journeyNodes}
          connections={journeyConnections}
          width={950}
          height={400}
          showFlow
          onNodeClick={(node) => console.log("Clicked:", node)}
        />
      </section>

      {/* Section 5: Skeleton Loading */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>7. Branded Skeleton Loading</h2>
        <button 
          className="btn btn--secondary" 
          style={{ marginBottom: "1rem" }}
          onClick={() => {
            setIsLoading(true);
            setTimeout(() => setIsLoading(false), 3000);
          }}
        >
          Simulate Loading (3s)
        </button>
        <LoadingWrapper isLoading={isLoading} showTips>
          <GlassCard>
            <h3>Content Loaded Successfully!</h3>
            <p style={{ color: "var(--color-text-muted)" }}>
              This content appears after loading with a smooth transition.
            </p>
          </GlassCard>
        </LoadingWrapper>
      </section>

      {/* Section 6: Command Bar Info */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>8. Smart Command Bar</h2>
        <GlassCard>
          <p>Press <kbd style={{ padding: "0.25rem 0.5rem", background: "var(--color-bg)", borderRadius: "4px", border: "1px solid var(--color-border)" }}>⌘K</kbd> or <kbd style={{ padding: "0.25rem 0.5rem", background: "var(--color-bg)", borderRadius: "4px", border: "1px solid var(--color-border)" }}>Ctrl+K</kbd> to open the command palette</p>
          <ul style={{ marginTop: "1rem", paddingLeft: "1.5rem", color: "var(--color-text-muted)" }}>
            <li>Fuzzy search dengan smart matching</li>
            <li>Recent commands tracking</li>
            <li>Context-aware suggestions</li>
            <li>Keyboard navigation support</li>
          </ul>
        </GlassCard>
      </section>

      {/* Section 7: Feature List */}
      <section>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>Fitur Lainnya</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
          <InteractiveCard variant="bordered" hoverEffect="lift">
            <h4>5. Theme Generator</h4>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
              Klik tombol Theme di header untuk customize warna
            </p>
          </InteractiveCard>
          <InteractiveCard variant="bordered" hoverEffect="lift">
            <h4>9. Ambient Background</h4>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
              Toggle di pojok kiri bawah untuk animasi background
            </p>
          </InteractiveCard>
          <InteractiveCard variant="bordered" hoverEffect="lift">
            <h4>10. Onboarding Tour</h4>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
              Guided tour dengan spotlight dan gamification
            </p>
          </InteractiveCard>
        </div>
      </section>

      {/* Glass Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Glass Modal Demo"
        size="md"
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn btn--primary" onClick={() => setIsModalOpen(false)}>Confirm</button>
          </>
        }
      >
        <p>This is a glassmorphism modal with:</p>
        <ul style={{ marginTop: "1rem", paddingLeft: "1.5rem" }}>
          <li>Backdrop blur effect</li>
          <li>Gradient overlay</li>
          <li>Noise texture</li>
          <li>Smooth animations</li>
          <li>Focus trap & ESC to close</li>
        </ul>
      </GlassModal>
    </AccountShell>
  );
}
