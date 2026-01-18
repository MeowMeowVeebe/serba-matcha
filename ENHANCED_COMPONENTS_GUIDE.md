# 🎨 Enhanced UI Components Guide

Dokumentasi untuk 10 rekomendasi peningkatan frontend yang telah diimplementasikan di Serba Matcha.

## 📦 Instalasi & Import

Semua komponen dapat diimport dari `@/components/ui`:

```tsx
import {
  // 1. Parallax
  ParallaxContainer, ParallaxLayer, ParallaxCard, FloatingElement,
  
  // 2. Interactive Cards
  InteractiveCard, MetricCard,
  
  // 3. Glassmorphism
  GlassModal, GlassDropdown, GlassCard, GlassTooltip,
  
  // 4. Animated Data
  AnimatedCounter, AnimatedRing, AnimatedLineChart, AnimatedBarChart,
  
  // 5. Theme Generator
  ThemeGenerator,
  
  // 6. Journey Map
  JourneyMap,
  
  // 7. Skeleton Loading
  BrandedSkeleton, CardSkeleton, TableSkeleton, DashboardSkeleton, LoadingWrapper,
  
  // 8. Command Bar
  SmartCommandBar, useCommandBar,
  
  // 9. Ambient Background
  AmbientBackground, AmbientToggle,
  
  // 10. Onboarding Tour
  OnboardingTour, useTour, dashboardTourSteps,
} from "@/components/ui";
```

---

## 1. 🌊 Parallax Effects

### ParallaxCard
Card dengan efek parallax saat scroll.

```tsx
<ParallaxCard index={0}>
  <YourContent />
</ParallaxCard>
```

### ParallaxLayer
Layer dengan kecepatan scroll berbeda.

```tsx
<ParallaxContainer>
  <ParallaxLayer speed={0.3}>Background</ParallaxLayer>
  <ParallaxLayer speed={0.7}>Foreground</ParallaxLayer>
</ParallaxContainer>
```

---

## 2. 🎭 Interactive Cards (Micro-interactions)

### InteractiveCard
Card dengan efek hover 3D tilt, glow, dan lift.

```tsx
<InteractiveCard 
  variant="glass"  // "default" | "elevated" | "bordered" | "glass"
  hoverEffect="all"  // "tilt" | "lift" | "glow" | "all"
  onClick={() => {}}
  actions={<button>Save</button>}  // Hidden actions on hover
>
  <Content />
</InteractiveCard>
```

### MetricCard
Kartu metrik dengan animasi dan sparkline.

```tsx
<MetricCard
  icon="📈"
  title="Revenue"
  value={<AnimatedCounter value={125000} prefix="$" />}
  change="+12%"
  changeType="positive"  // "positive" | "negative" | "neutral"
  trend={[10, 20, 15, 30, 25, 40]}
/>
```

---

## 3. 🔮 Glassmorphism

### GlassModal
Modal dengan efek glassmorphism.

```tsx
<GlassModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="md"  // "sm" | "md" | "lg" | "xl" | "full"
  footer={<Button>Confirm</Button>}
>
  <Content />
</GlassModal>
```

### GlassCard
Card dengan backdrop blur.

```tsx
<GlassCard intensity="medium">  // "light" | "medium" | "heavy"
  <Content />
</GlassCard>
```

### GlassDropdown & GlassTooltip
```tsx
<GlassDropdown trigger={<Button>Menu</Button>} isOpen={open} onToggle={toggle}>
  <MenuItem />
</GlassDropdown>

<GlassTooltip content="Tooltip text" position="top">
  <Button>Hover me</Button>
</GlassTooltip>
```

---

## 4. 📊 Animated Data Visualization

### AnimatedCounter
Angka dengan animasi count-up.

```tsx
<AnimatedCounter 
  value={12500}
  duration={1500}
  prefix="$"
  suffix=" USD"
  decimals={2}
  easing="easeOut"  // "linear" | "easeOut" | "easeInOut" | "spring"
/>
```

### AnimatedRing
Progress ring dengan animasi.

```tsx
<AnimatedRing 
  value={75}
  size={100}
  strokeWidth={8}
  color="var(--color-primary)"
  showValue
/>
```

### AnimatedLineChart & AnimatedBarChart
Chart dengan animasi draw/grow.

```tsx
<AnimatedLineChart 
  data={[
    { label: "Jan", value: 100 },
    { label: "Feb", value: 150 },
  ]}
  width={400}
  height={200}
  showDots
  showLabels
  fillGradient
  duration={1500}
/>

<AnimatedBarChart 
  data={data}
  stagger={100}  // Delay antar bar
/>
```

---

## 5. 🎨 Theme Generator

Customizer tema dengan color picker dan auto-generate palette.

```tsx
<ThemeGenerator onThemeChange={(colors) => console.log(colors)} />
```

Features:
- Preset themes (Matcha, Ocean, Sunset, Purple, Light)
- Auto-generate complementary colors
- Dark/Light mode toggle
- Export CSS variables
- Save custom presets

---

## 6. 🗺️ Journey Map

Visualisasi customer journey interaktif.

```tsx
const nodes: JourneyNode[] = [
  { id: "start", label: "Visit", x: 100, y: 200, type: "start", status: "completed" },
  { id: "browse", label: "Browse", x: 250, y: 200, type: "action", status: "active" },
  // ...
];

const connections: JourneyConnection[] = [
  { from: "start", to: "browse", weight: 75 },
];

<JourneyMap 
  nodes={nodes}
  connections={connections}
  width={800}
  height={400}
  showFlow  // Animated particles
  onNodeClick={(node) => console.log(node)}
/>
```

---

## 7. 💀 Branded Skeleton Loading

Skeleton dengan shimmer effect dan brand colors.

```tsx
// Basic skeleton
<BrandedSkeleton width={200} height={20} variant="text" animation="shimmer" />

// Pre-built skeletons
<CardSkeleton />
<TableSkeleton rows={5} cols={4} />
<ChartSkeleton type="bar" />
<DashboardSkeleton />

// Loading wrapper with tips
<LoadingWrapper isLoading={loading} showTips>
  <YourContent />
</LoadingWrapper>
```

---

## 8. 🎯 Smart Command Bar

Command palette dengan fuzzy search (Cmd+K).

```tsx
const commands: CommandItem[] = [
  { 
    id: "dashboard", 
    label: "Go to Dashboard", 
    icon: "📊", 
    category: "navigation",
    action: () => router.push("/dashboard"),
    shortcut: "⌘D",
    keywords: ["home", "main"]
  },
];

<SmartCommandBar 
  commands={commands}
  placeholder="Search commands..."
  maxResults={10}
/>
```

Features:
- Fuzzy matching
- Recent commands tracking
- Context-aware suggestions
- Keyboard navigation

---

## 9. 🌈 Ambient Background

Animated background effects.

```tsx
<AmbientBackground 
  enabled={true}
  variant="gradient"  // "gradient" | "particles" | "geometric" | "waves" | "aurora"
  colorScheme="primary"  // "primary" | "secondary" | "warm" | "cool" | "rainbow"
  intensity="subtle"  // "subtle" | "medium" | "vibrant"
  speed="slow"  // "slow" | "normal" | "fast"
  interactive  // Responds to mouse
/>

// Toggle control
<AmbientToggle 
  enabled={enabled}
  onToggle={setEnabled}
  variant={variant}
  onVariantChange={setVariant}
/>
```

---

## 10. 🎬 Onboarding Tour

Guided tour dengan spotlight dan gamification.

```tsx
const steps: TourStep[] = [
  {
    id: "welcome",
    target: ".dashboard-header",  // CSS selector
    title: "Welcome!",
    content: "Let's take a quick tour...",
    position: "bottom",  // "top" | "bottom" | "left" | "right" | "auto"
  },
  {
    id: "search",
    target: "[data-tour='search']",
    title: "Search",
    content: "Press Cmd+K to search",
    challenge: {
      instruction: "Try pressing Cmd+K now!",
      validator: () => document.querySelector(".command-bar") !== null,
    },
  },
];

<OnboardingTour 
  steps={steps}
  tourId="main-tour"
  gamification  // Show badges
  onComplete={() => console.log("Tour complete!")}
/>

// Hook for control
const { isComplete, startTour, resetTour } = useTour("main-tour");
```

---

## 🎯 Demo Page

Kunjungi `/enhanced-demo` untuk melihat semua komponen dalam aksi.

---

## 📁 File Structure

```
components/ui/
├── ParallaxContainer.tsx    # Parallax effects
├── InteractiveCard.tsx      # Micro-interactions
├── GlassModal.tsx           # Glassmorphism
├── AnimatedCounter.tsx      # Animated numbers & rings
├── AnimatedChart.tsx        # Animated charts
├── ThemeGenerator.tsx       # Theme customizer
├── JourneyMap.tsx           # Journey visualization
├── BrandedSkeleton.tsx      # Skeleton loading
├── SmartCommandBar.tsx      # Command palette
├── AmbientBackground.tsx    # Background animations
├── OnboardingTour.tsx       # Guided tours
└── index.ts                 # Exports

styles/
├── parallax.css
├── glassmorphism.css
├── animated-data.css
├── theme-generator.css
├── journey-map.css
├── branded-skeleton.css
├── smart-command.css
└── ambient-onboarding.css
```

---

## ✨ Tips

1. **Performance**: Gunakan `intensity="subtle"` untuk ambient background di production
2. **Accessibility**: Semua modal support ESC to close dan focus trap
3. **Mobile**: Komponen responsive, touch-friendly
4. **Dark Mode**: Semua komponen menggunakan CSS variables untuk theming

