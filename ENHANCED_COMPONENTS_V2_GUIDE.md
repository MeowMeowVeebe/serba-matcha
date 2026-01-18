# 🚀 Enhanced UI Components Guide V2

Dokumentasi untuk 10 rekomendasi peningkatan frontend batch kedua di Serba Matcha.

## 📦 Import

```tsx
import {
  // 11. Mobile Gestures
  SwipeableCard, SwipeableCardStack, PullToRefresh, PinchZoom,
  
  // 12. Sound Feedback
  SoundProvider, useSound, SoundSettingsPanel, SoundButton, SoundInput,
  
  // 13. Dashboard Builder
  DashboardBuilder, LayoutPresets,
  
  // 14. Comparison Mode
  ComparisonPanel, TimePeriodComparison, DiffHighlighter, ExportComparisonButton,
  
  // 15. Avatar System
  Avatar, AvatarGroup, ProfileCard, TeamPresence,
  
  // 16. Vim Navigation
  VimNavigationProvider, useVimNavigation, VimModeToggle, VimList, VimListItem,
  
  // 17. Inline Editing
  InlineEdit, EditableRow, BatchEditor, AutoSaveIndicator,
  
  // 18. i18n & RTL
  I18nProvider, useI18n, LanguageSwitcher, RTLFlex, FormattedNumber, FormattedCurrency, FormattedDate, Trans,
  
  // 19. Celebrations
  CelebrationProvider, useCelebration, MilestoneTracker, SeasonalDecorations,
} from "@/components/ui";
```

---

## 11. 📱 Swipeable Cards & Mobile Gestures

### SwipeableCard
```tsx
<SwipeableCard
  onSwipeLeft={() => handleReject()}
  onSwipeRight={() => handleAccept()}
  onSwipeUp={() => handleDismiss()}
  onLongPress={() => showMenu()}
  threshold={50}
>
  <YourContent />
</SwipeableCard>
```

### SwipeableCardStack
```tsx
<SwipeableCardStack 
  cards={[<Card1 />, <Card2 />, <Card3 />]}
  onCardSwipe={(index, direction) => console.log(index, direction)}
/>
```

### PullToRefresh
```tsx
<PullToRefresh onRefresh={async () => { await fetchData(); }}>
  <YourScrollableContent />
</PullToRefresh>
```

### PinchZoom
```tsx
<PinchZoom minScale={1} maxScale={4}>
  <img src="image.jpg" alt="" />
</PinchZoom>
```

---

## 12. 🎵 Sound Design & Audio Feedback

### Setup Provider
```tsx
<SoundProvider>
  <App />
</SoundProvider>
```

### useSound Hook
```tsx
const { playSound, settings, toggleSound, setVolume } = useSound();

playSound("success"); // Types: click, success, error, warning, notification, typing, swoosh, pop
```

### Sound-enabled Components
```tsx
<SoundButton soundType="click" onClick={handleClick}>
  Click Me
</SoundButton>

<SoundInput enableTypingSound onChange={handleChange} />

<SoundSettingsPanel /> // Settings UI
```

---

## 13. 📋 Drag & Drop Dashboard Builder

```tsx
const [widgets, setWidgets] = useState<Widget[]>([
  { id: "w1", type: "metric", title: "Revenue", x: 0, y: 0, width: 3, height: 2, content: <MetricCard /> },
  { id: "w2", type: "chart", title: "Analytics", x: 3, y: 0, width: 6, height: 4, content: <Chart /> },
]);

<DashboardBuilder
  widgets={widgets}
  onLayoutChange={setWidgets}
  columns={12}
  rowHeight={80}
  gap={16}
  editable
/>

<LayoutPresets
  currentLayout={widgets}
  onApplyPreset={setWidgets}
/>
```

---

## 14. 📊 Comparison Mode / Split View

### Side-by-Side Comparison
```tsx
<ComparisonPanel
  leftTitle="Version A"
  rightTitle="Version B"
  leftContent={<OldDesign />}
  rightContent={<NewDesign />}
  syncScroll  // Sync scroll between panels
/>
```

### Time Period Comparison
```tsx
<TimePeriodComparison
  data={[
    { date: "W1", valueA: 1200, valueB: 1000, label: "Week 1" },
    { date: "W2", valueA: 1500, valueB: 1200, label: "Week 2" },
  ]}
  periodALabel="This Month"
  periodBLabel="Last Month"
/>
```

### Diff Highlighter
```tsx
<DiffHighlighter
  oldData={{ name: "John", age: 25 }}
  newData={{ name: "John", age: 26, city: "NYC" }}
/>
```

---

## 15. 🎭 Avatar & Profile Customization

### Avatar
```tsx
<Avatar 
  src="/avatar.jpg"
  name="John Doe"
  size="md"  // xs, sm, md, lg, xl
  status="online"  // online, away, busy, focusing, offline
  showBadge
  badgeContent={3}
/>
```

### Avatar Group
```tsx
<AvatarGroup
  users={[
    { name: "Alice", status: "online" },
    { name: "Bob", status: "away" },
  ]}
  max={4}
/>
```

### Profile Card
```tsx
<ProfileCard
  name="John Doe"
  role="Developer"
  email="john@example.com"
  status="online"
  statusMessage="Working on features"
  stats={[{ label: "Projects", value: 24 }]}
  badges={[{ icon: "🏆", label: "Top Performer" }]}
  onStatusChange={(status) => updateStatus(status)}
/>
```

### Team Presence
```tsx
<TeamPresence members={[
  { name: "Alice", status: "online" },
  { name: "Bob", status: "away", lastSeen: new Date() },
]} />
```

---

## 16. ⌨️ Vim-like Keyboard Navigation

### Setup Provider
```tsx
<VimNavigationProvider>
  <App />
</VimNavigationProvider>
```

### Default Shortcuts
| Key | Action |
|-----|--------|
| `j` | Move down |
| `k` | Move up |
| `gg` | Go to top |
| `G` | Go to bottom |
| `/` | Search |
| `?` | Show cheatsheet |
| `i` | Insert mode |
| `Esc` | Normal mode |

### Components
```tsx
<VimModeToggle />

<VimList>
  <VimListItem index={0}>Item 1</VimListItem>
  <VimListItem index={1}>Item 2</VimListItem>
</VimList>
```

### Custom Bindings
```tsx
const { registerBinding } = useVimNavigation();

registerBinding({
  key: "dd",
  description: "Delete item",
  action: () => deleteSelectedItem(),
  category: "action",
});
```

---

## 17. 📝 Inline Editing & Quick Edit Mode

### InlineEdit
```tsx
<InlineEdit
  value={text}
  onSave={(newValue) => saveText(newValue)}
  onCancel={() => console.log("Cancelled")}
  type="text"  // text, number, email, url, textarea
  validation={(v) => v.length < 3 ? "Too short" : null}
  formatDisplay={(v) => <strong>{v}</strong>}
/>
```

### Batch Editor
```tsx
<BatchEditor
  items={[
    { id: "1", name: "John", email: "john@example.com" },
  ]}
  columns={[
    { key: "name", label: "Name", editable: true },
    { key: "email", label: "Email", editable: true },
  ]}
  onBatchSave={(items) => saveAll(items)}
/>
```

### Auto-save Indicator
```tsx
<AutoSaveIndicator 
  isSaving={saving}
  lastSaved={lastSavedDate}
  isDirty={hasChanges}
/>
```

---

## 18. 🌐 Multi-language & RTL Support

### Setup Provider
```tsx
<I18nProvider>
  <App />
</I18nProvider>
```

### useI18n Hook
```tsx
const { locale, setLocale, t, formatNumber, formatDate, formatCurrency, direction } = useI18n();

t("dashboard.welcome", { name: "John" }); // "Welcome back, John!"
formatCurrency(1250.99); // "$1,250.99" or "Rp1.250,99"
formatDate(new Date()); // "01/18/2026" or "18/01/2026"
```

### Components
```tsx
<LanguageSwitcher variant="dropdown" />  // dropdown, flags, full

<Trans id="common.save" />  // Translated text

<FormattedNumber value={12500} decimals={2} currency />
<FormattedCurrency value={99.99} />
<FormattedDate date={new Date()} />

<RTLFlex>  // Auto-reverses in RTL
  <Left />
  <Right />
</RTLFlex>
```

### Supported Locales
- 🇺🇸 English (en) - LTR
- 🇮🇩 Indonesian (id) - LTR
- 🇸🇦 Arabic (ar) - RTL
- 🇮🇱 Hebrew (he) - RTL
- 🇨🇳 Chinese (zh) - LTR
- 🇯🇵 Japanese (ja) - LTR
- 🇩🇪 German (de) - LTR
- 🇫🇷 French (fr) - LTR
- 🇪🇸 Spanish (es) - LTR
- 🇧🇷 Portuguese (pt) - LTR

---

## 19. 🎪 Celebration & Delight Moments

### Setup Provider
```tsx
<CelebrationProvider>
  <App />
</CelebrationProvider>
```

### useCelebration Hook
```tsx
const { celebrate, celebrateAchievement, celebrateStreak, triggerEasterEgg } = useCelebration();

celebrate("confetti", "🎉 Success!", 3000);  // Types: confetti, fireworks, stars, hearts, balloons
celebrateAchievement("Level Up!", "You've unlocked new features");
celebrateStreak(7);  // Auto-celebrates milestones: 7, 14, 30, 100, 365 days
triggerEasterEgg("matcha");  // Hidden easter eggs
```

### Milestone Tracker
```tsx
<MilestoneTracker
  current={35}
  milestones={[
    { value: 25, label: "Bronze", icon: "🥉" },
    { value: 50, label: "Silver", icon: "🥈" },
    { value: 75, label: "Gold", icon: "🥇" },
    { value: 100, label: "Platinum", icon: "💎" },
  ]}
  onMilestoneReached={(m) => console.log("Reached:", m)}
/>
```

### Seasonal Decorations
```tsx
<SeasonalDecorations />  // Auto-shows decorations for holidays
```

### Easter Eggs
- **Konami Code**: ↑↑↓↓←→←→BA → Fireworks!
- Type "matcha" → Confetti
- Type "party" → Balloons
- Type "love" → Hearts

---

## 🎯 Demo Pages

- `/enhanced-demo` - Batch 1 components
- `/enhanced-demo-v2` - Batch 2 components

---

## 📁 File Structure

```
components/ui/
├── SwipeableCards.tsx      # Mobile gestures
├── SoundFeedback.tsx       # Audio feedback
├── DashboardBuilder.tsx    # Drag & drop builder
├── ComparisonMode.tsx      # Split view comparison
├── AvatarSystem.tsx        # Avatar & profiles
├── VimNavigation.tsx       # Keyboard navigation
├── InlineEditor.tsx        # Inline editing
├── I18nRTL.tsx             # Internationalization
├── Celebrations.tsx        # Celebrations & delight
└── index.ts                # Exports

styles/
├── swipeable-gestures.css
├── sound-dashboard.css
├── notification-comparison.css
├── avatar-vim-inline.css
└── i18n-celebrations.css
```

---

## 💡 Tips

1. **Performance**: Sound & celebrations disabled by default for accessibility
2. **Mobile**: Gesture components work best on touch devices
3. **RTL**: Test with Arabic/Hebrew to verify RTL layout
4. **Vim Mode**: Press `?` for cheatsheet, `Esc` to exit modes
5. **Celebrations**: Use sparingly for maximum impact!
