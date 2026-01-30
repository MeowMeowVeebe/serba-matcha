// Enhanced UI Components Export
// Rekomendasi Frontend untuk Serba Matcha

// ============ BATCH 1 ============

// 1. Parallax Effects
export { ParallaxContainer, ParallaxLayer, ParallaxCard, FloatingElement } from "./ParallaxContainer";

// 2. Interactive Cards with Micro-interactions
export { InteractiveCard, MetricCard } from "./InteractiveCard";

// 3. Glassmorphism Components
export { GlassModal, GlassDropdown, GlassCard, GlassTooltip } from "./GlassModal";

// 4. Animated Data Visualization
export { AnimatedCounter, AnimatedRing } from "./AnimatedCounter";
export { AnimatedLineChart, AnimatedBarChart } from "./AnimatedChart";

// 5. Theme Generator
export { ThemeGenerator, defaultPresets, generateComplementaryPalette, hexToHSL, hslToHex } from "./ThemeGenerator";
export type { ThemeColors, ThemePreset, ColorHSL } from "./ThemeGenerator";

// 6. Journey Map
export { JourneyMap } from "./JourneyMap";
export type { JourneyNode, JourneyConnection } from "./JourneyMap";

// 7. Branded Skeleton Loading
export { 
  BrandedSkeleton, 
  CardSkeleton, 
  TableSkeleton, 
  ChartSkeleton, 
  MetricSkeleton, 
  DashboardSkeleton,
  LoadingWrapper 
} from "./BrandedSkeleton";

// 8. Smart Command Bar
export { SmartCommandBar, useCommandBar } from "./SmartCommandBar";
export type { CommandItem } from "./SmartCommandBar";

// 9. Ambient Background
export { AmbientBackground, AmbientToggle } from "./AmbientBackground";

// 10. Onboarding Tour
export { OnboardingTour, useTour, dashboardTourSteps } from "./OnboardingTour";
export type { TourStep } from "./OnboardingTour";

// ============ BATCH 2 ============

// 11. Swipeable Cards & Mobile Gestures
export { SwipeableCard, SwipeableCardStack, PullToRefresh, PinchZoom } from "./SwipeableCards";

// 12. Sound Design & Audio Feedback
export { SoundProvider, useSound, SoundSettingsPanel, SoundButton, SoundInput } from "./SoundFeedback";
export type { SoundType, SoundSettings } from "./SoundFeedback";

// 13. Drag & Drop Dashboard Builder
export { DashboardBuilder, LayoutPresets } from "./DashboardBuilder";
export type { Widget, LayoutPreset } from "./DashboardBuilder";

// 14. Comparison Mode / Split View
export { ComparisonPanel, TimePeriodComparison, DiffHighlighter, ExportComparisonButton } from "./ComparisonMode";

// 15. Avatar & Profile Customization
export { Avatar, AvatarGroup, ProfileCard, TeamPresence } from "./AvatarSystem";
export type { AvatarStatus } from "./AvatarSystem";

// 16. Vim-like Keyboard Navigation
export { VimNavigationProvider, useVimNavigation, VimModeToggle, VimList, VimListItem } from "./VimNavigation";
export type { KeyBinding } from "./VimNavigation";

// 17. Inline Editing & Quick Edit Mode
export { InlineEdit, EditableRow, BatchEditor, AutoSaveIndicator } from "./InlineEditor";

// 18. Multi-language RTL Support
export { I18nProvider, useI18n, LanguageSwitcher, RTLFlex, FormattedNumber, FormattedCurrency, FormattedDate, Trans } from "./I18nRTL";
export type { Locale, Direction } from "./I18nRTL";

// 19. Celebration & Delight Moments
export { CelebrationProvider, useCelebration, MilestoneTracker, SeasonalDecorations, useSeasonalTheme } from "./Celebrations";
export type { CelebrationType } from "./Celebrations";
