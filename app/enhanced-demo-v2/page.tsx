"use client";

import { useState } from "react";
import { AccountShell } from "@/components/AccountShell";
import {
  // Batch 2 Components
  SwipeableCard,
  SwipeableCardStack,
  PullToRefresh,
  SoundProvider,
  SoundSettingsPanel,
  SoundButton,
  DashboardBuilder,
  LayoutPresets,
  ComparisonPanel,
  TimePeriodComparison,
  DiffHighlighter,
  Avatar,
  AvatarGroup,
  ProfileCard,
  TeamPresence,
  VimNavigationProvider,
  VimModeToggle,
  VimList,
  VimListItem,
  InlineEdit,
  BatchEditor,
  AutoSaveIndicator,
  I18nProvider,
  LanguageSwitcher,
  FormattedCurrency,
  FormattedDate,
  Trans,
  CelebrationProvider,
  useCelebration,
  MilestoneTracker,
  SeasonalDecorations,
  // Batch 1 for layout
  GlassCard,
  InteractiveCard,
} from "@/components/ui";
import type { Widget, AvatarStatus } from "@/components/ui";

function DemoContent() {
  const { celebrate, celebrateAchievement } = useCelebration();
  const [milestoneProgress, setMilestoneProgress] = useState(35);

  // Dashboard Builder state
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: "w1", type: "metric", title: "Revenue", x: 0, y: 0, width: 3, height: 2, content: <div className="text-2xl font-bold">$125,430</div> },
    { id: "w2", type: "metric", title: "Users", x: 3, y: 0, width: 3, height: 2, content: <div className="text-2xl font-bold">8,420</div> },
    { id: "w3", type: "metric", title: "Orders", x: 6, y: 0, width: 3, height: 2, content: <div className="text-2xl font-bold">1,284</div> },
    { id: "w4", type: "chart", title: "Analytics", x: 0, y: 2, width: 6, height: 3, content: <div className="h-full flex items-center justify-center text-gray-500">Chart Widget</div> },
    { id: "w5", type: "list", title: "Activity", x: 6, y: 2, width: 3, height: 3, content: <div className="h-full flex items-center justify-center text-gray-500">Activity Feed</div> },
  ]);

  // Inline edit state
  const [editableData, setEditableData] = useState([
    { id: "1", name: "John Doe", email: "john@example.com", role: "Admin" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", role: "Editor" },
    { id: "3", name: "Bob Wilson", email: "bob@example.com", role: "Viewer" },
  ]);

  // Comparison data
  const comparisonData = [
    { date: "Week 1", valueA: 1200, valueB: 1000, label: "W1" },
    { date: "Week 2", valueA: 1500, valueB: 1200, label: "W2" },
    { date: "Week 3", valueA: 1300, valueB: 1400, label: "W3" },
    { date: "Week 4", valueA: 1800, valueB: 1500, label: "W4" },
  ];

  // Team members
  const teamMembers = [
    { name: "Alice Johnson", avatar: undefined, status: "online" as AvatarStatus },
    { name: "Bob Smith", avatar: undefined, status: "online" as AvatarStatus },
    { name: "Carol White", avatar: undefined, status: "away" as AvatarStatus },
    { name: "David Brown", avatar: undefined, status: "busy" as AvatarStatus },
    { name: "Eve Davis", avatar: undefined, status: "focusing" as AvatarStatus },
    { name: "Frank Miller", avatar: undefined, status: "offline" as AvatarStatus },
  ];

  // Swipeable cards
  const cardContents = [
    <GlassCard key="1"><h3>Card 1</h3><p>Swipe me left or right!</p></GlassCard>,
    <GlassCard key="2"><h3>Card 2</h3><p>Interactive swipe gesture</p></GlassCard>,
    <GlassCard key="3"><h3>Card 3</h3><p>Mobile-friendly UI</p></GlassCard>,
  ];

  return (
    <div className="space-y-8">
      <SeasonalDecorations />

      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">🚀 Enhanced Components Demo V2</h1>
          <p className="text-gray-500">10 Rekomendasi Frontend Baru - Batch 2</p>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <LanguageSwitcher variant="dropdown" />
          <VimModeToggle />
        </div>
      </div>

      {/* Section 1: Mobile Gestures */}
      <section>
        <h2 className="text-xl font-semibold mb-4">1. Swipeable Cards & Mobile Gestures</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium mb-2 text-gray-500">Swipeable Card Stack</h3>
            <div className="h-64">
              <SwipeableCardStack 
                cards={cardContents}
                onCardSwipe={(index, direction) => console.log(`Card ${index} swiped ${direction}`)}
              />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2 text-gray-500">Pull to Refresh (Mobile)</h3>
            <PullToRefresh onRefresh={async () => { await new Promise(r => setTimeout(r, 1500)); }}>
              <GlassCard>
                <p>Pull down to refresh on mobile devices</p>
                <p className="text-sm text-gray-500 mt-2">Touch and drag down to trigger refresh</p>
              </GlassCard>
            </PullToRefresh>
          </div>
        </div>
      </section>

      {/* Section 2: Sound Settings */}
      <section>
        <h2 className="text-xl font-semibold mb-4">2. Sound Design & Audio Feedback</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <SoundSettingsPanel />
          <GlassCard>
            <h3 className="font-medium mb-4">Test Sound Buttons</h3>
            <div className="flex flex-wrap gap-2">
              <SoundButton className="btn btn--primary" soundType="success">Success Sound</SoundButton>
              <SoundButton className="btn btn--secondary" soundType="click">Click Sound</SoundButton>
              <SoundButton className="btn btn--ghost" soundType="notification">Notification</SoundButton>
            </div>
            <p className="text-sm text-gray-500 mt-4">Enable sounds in settings first!</p>
          </GlassCard>
        </div>
      </section>

      {/* Section 3: Dashboard Builder */}
      <section>
        <h2 className="text-xl font-semibold mb-4">3. Drag & Drop Dashboard Builder</h2>
        <div className="flex justify-end mb-4">
          <LayoutPresets 
            currentLayout={widgets}
            onApplyPreset={(newWidgets) => setWidgets(newWidgets as Widget[])}
          />
        </div>
        <DashboardBuilder
          widgets={widgets}
          onLayoutChange={setWidgets}
          columns={9}
          rowHeight={60}
          editable
        />
      </section>

      {/* Section 4: Comparison Mode */}
      <section>
        <h2 className="text-xl font-semibold mb-4">5. Comparison Mode / Split View</h2>
        <div className="space-y-6">
          <TimePeriodComparison
            data={comparisonData}
            periodALabel="This Month"
            periodBLabel="Last Month"
          />
          <ComparisonPanel
            leftTitle="Version A"
            rightTitle="Version B"
            leftContent={<div className="p-4"><h3>Original Design</h3><p>Lorem ipsum dolor sit amet...</p></div>}
            rightContent={<div className="p-4"><h3>New Design</h3><p>Consectetur adipiscing elit...</p></div>}
            syncScroll
          />
          <DiffHighlighter
            oldData={{ name: "John", age: 25, city: "NYC" }}
            newData={{ name: "John", age: 26, city: "LA", country: "USA" }}
          />
        </div>
      </section>

      {/* Section 5: Avatar & Profile */}
      <section>
        <h2 className="text-xl font-semibold mb-4">6. Avatar & Profile Customization</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <ProfileCard
            name="John Doe"
            role="Senior Developer"
            email="john@example.com"
            status="online"
            statusMessage="Working on new features"
            stats={[
              { label: "Projects", value: 24 },
              { label: "Tasks", value: 156 },
              { label: "Streak", value: "14d" },
            ]}
            badges={[
              { icon: "🏆", label: "Top Performer" },
              { icon: "🔥", label: "On Fire" },
              { icon: "⭐", label: "All Star" },
            ]}
          />
          <div className="space-y-4">
            <h3 className="font-medium">Avatar Sizes</h3>
            <div className="flex items-end gap-2">
              <Avatar name="XS User" size="xs" status="online" />
              <Avatar name="SM User" size="sm" status="away" />
              <Avatar name="MD User" size="md" status="busy" />
              <Avatar name="LG User" size="lg" status="focusing" />
              <Avatar name="XL User" size="xl" status="offline" />
            </div>
            <h3 className="font-medium mt-4">Avatar Group</h3>
            <AvatarGroup users={teamMembers} max={4} />
          </div>
          <TeamPresence members={teamMembers} />
        </div>
      </section>

      {/* Section 6: Vim Navigation */}
      <section>
        <h2 className="text-xl font-semibold mb-4">7. Vim-like Keyboard Navigation</h2>
        <GlassCard>
          <p className="mb-4">Press <kbd className="px-2 py-1 bg-gray-800 rounded">?</kbd> to show keyboard shortcuts</p>
          <p className="text-sm text-gray-500">Navigate with j/k, go to top with gg, bottom with G</p>
          <VimList className="mt-4">
            {["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"].map((item, i) => (
              <VimListItem key={i} index={i} className="p-2 border-b border-gray-700">
                {item} - Press j/k to navigate, Enter to select
              </VimListItem>
            ))}
          </VimList>
        </GlassCard>
      </section>

      {/* Section 7: Inline Editing */}
      <section>
        <h2 className="text-xl font-semibold mb-4">8. Inline Editing & Quick Edit Mode</h2>
        <div className="space-y-4">
          <GlassCard>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-gray-500">Click to edit:</span>
              <InlineEdit
                value="Editable Text"
                onSave={(v) => console.log("Saved:", v)}
              />
            </div>
            <AutoSaveIndicator isSaving={false} lastSaved={new Date()} isDirty={false} />
          </GlassCard>
          <BatchEditor
            items={editableData}
            columns={[
              { key: "name", label: "Name", editable: true },
              { key: "email", label: "Email", editable: true },
              { key: "role", label: "Role", editable: true },
            ]}
            onBatchSave={(items) => {
              setEditableData(items as typeof editableData);
              console.log("Batch saved:", items);
            }}
          />
        </div>
      </section>

      {/* Section 8: i18n & RTL */}
      <section>
        <h2 className="text-xl font-semibold mb-4">9. Multi-language & RTL Support</h2>
        <GlassCard>
          <div className="space-y-4">
            <div>
              <span className="text-gray-500">Formatted Currency: </span>
              <FormattedCurrency value={12500.99} />
            </div>
            <div>
              <span className="text-gray-500">Formatted Date: </span>
              <FormattedDate date={new Date()} />
            </div>
            <div>
              <span className="text-gray-500">Translation: </span>
              <Trans id="dashboard.welcome" params={{ name: "User" }} />
            </div>
            <LanguageSwitcher variant="full" />
          </div>
        </GlassCard>
      </section>

      {/* Section 9: Celebrations */}
      <section>
        <h2 className="text-xl font-semibold mb-4">10. Celebration & Delight Moments</h2>
        <GlassCard>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button className="btn btn--primary" onClick={() => celebrate("confetti", "🎉 Confetti!")}>
                Confetti
              </button>
              <button className="btn btn--secondary" onClick={() => celebrate("fireworks", "🎆 Fireworks!")}>
                Fireworks
              </button>
              <button className="btn btn--ghost" onClick={() => celebrate("stars", "⭐ Stars!")}>
                Stars
              </button>
              <button className="btn btn--ghost" onClick={() => celebrate("hearts", "💕 Hearts!")}>
                Hearts
              </button>
              <button className="btn btn--ghost" onClick={() => celebrate("balloons", "🎈 Balloons!")}>
                Balloons
              </button>
            </div>
            <button 
              className="btn btn--primary"
              onClick={() => celebrateAchievement("Level Up!", "You've unlocked new features")}
            >
              Trigger Achievement
            </button>
            <div>
              <h4 className="font-medium mb-2">Milestone Tracker</h4>
              <MilestoneTracker
                current={milestoneProgress}
                milestones={[
                  { value: 25, label: "Bronze", icon: "🥉" },
                  { value: 50, label: "Silver", icon: "🥈" },
                  { value: 75, label: "Gold", icon: "🥇" },
                  { value: 100, label: "Platinum", icon: "💎" },
                ]}
              />
              <div className="flex gap-2 mt-2">
                <button className="btn btn--sm btn--ghost" onClick={() => setMilestoneProgress(p => Math.max(0, p - 10))}>-10</button>
                <button className="btn btn--sm btn--ghost" onClick={() => setMilestoneProgress(p => Math.min(100, p + 10))}>+10</button>
              </div>
            </div>
            <p className="text-sm text-gray-500">Try the Konami Code: ↑↑↓↓←→←→BA</p>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}

export default function EnhancedDemoV2Page() {
  return (
    <I18nProvider>
      <SoundProvider>
        <VimNavigationProvider>
          <CelebrationProvider>
            <AccountShell>
              <DemoContent />
            </AccountShell>
          </CelebrationProvider>
        </VimNavigationProvider>
      </SoundProvider>
    </I18nProvider>
  );
}
