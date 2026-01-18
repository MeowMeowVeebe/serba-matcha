"use client";

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";

type CelebrationType = "confetti" | "fireworks" | "stars" | "hearts" | "balloons";

interface Celebration {
  id: string;
  type: CelebrationType;
  message?: string;
  duration: number;
}

interface CelebrationContextType {
  celebrate: (type: CelebrationType, message?: string, duration?: number) => void;
  celebrateAchievement: (title: string, description?: string) => void;
  celebrateStreak: (days: number) => void;
  triggerEasterEgg: (code: string) => void;
}

const CelebrationContext = createContext<CelebrationContextType | null>(null);

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [achievement, setAchievement] = useState<{ title: string; description?: string } | null>(null);

  const celebrate = useCallback((type: CelebrationType, message?: string, duration = 3000) => {
    const id = `celebration-${Date.now()}`;
    setCelebrations(prev => [...prev, { id, type, message, duration }]);
    
    setTimeout(() => {
      setCelebrations(prev => prev.filter(c => c.id !== id));
    }, duration);
  }, []);

  const celebrateAchievement = useCallback((title: string, description?: string) => {
    setAchievement({ title, description });
    celebrate("stars", undefined, 4000);
    
    setTimeout(() => setAchievement(null), 4000);
  }, [celebrate]);

  const celebrateStreak = useCallback((days: number) => {
    const messages: Record<number, { emoji: string; message: string }> = {
      7: { emoji: "🔥", message: "1 Week Streak!" },
      14: { emoji: "⚡", message: "2 Week Streak!" },
      30: { emoji: "🏆", message: "1 Month Streak!" },
      100: { emoji: "💯", message: "100 Day Streak!" },
      365: { emoji: "👑", message: "1 Year Streak!" },
    };

    const milestone = messages[days];
    if (milestone) {
      celebrateAchievement(`${milestone.emoji} ${milestone.message}`, `You've been active for ${days} days!`);
    }
  }, [celebrateAchievement]);

  // Easter egg handler - Konami code
  useEffect(() => {
    const konamiCode = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let konamiIndex = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
          celebrate("fireworks", "🎮 Konami Code Activated!", 5000);
          konamiIndex = 0;
        }
      } else {
        konamiIndex = 0;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [celebrate]);

  const triggerEasterEgg = useCallback((code: string) => {
    const easterEggs: Record<string, () => void> = {
      "matcha": () => celebrate("confetti", "🍵 You found the Matcha Easter Egg!", 4000),
      "party": () => celebrate("balloons", "🎉 Party Time!", 4000),
      "love": () => celebrate("hearts", "💕 Spread the Love!", 4000),
    };

    easterEggs[code.toLowerCase()]?.();
  }, [celebrate]);

  return (
    <CelebrationContext.Provider value={{ celebrate, celebrateAchievement, celebrateStreak, triggerEasterEgg }}>
      {children}
      
      {/* Render celebrations */}
      {celebrations.map(c => (
        <CelebrationOverlay key={c.id} type={c.type} message={c.message} />
      ))}

      {/* Achievement popup */}
      {achievement && (
        <AchievementPopup title={achievement.title} description={achievement.description} />
      )}
    </CelebrationContext.Provider>
  );
}

export function useCelebration() {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error("useCelebration must be used within CelebrationProvider");
  }
  return context;
}

// Celebration Overlay
function CelebrationOverlay({ type, message }: { type: CelebrationType; message?: string }) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    rotation: number;
    velocityX: number;
    velocityY: number;
  }>>([]);

  useEffect(() => {
    const colors = {
      confetti: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"],
      fireworks: ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#9400D3"],
      stars: ["#FFD700", "#FFA500", "#FFFF00", "#FFFACD"],
      hearts: ["#FF69B4", "#FF1493", "#DC143C", "#FF6B6B"],
      balloons: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD"],
    };

    const newParticles = Array.from({ length: type === "fireworks" ? 100 : 50 }, (_, i) => ({
      id: i,
      x: type === "fireworks" ? 50 : Math.random() * 100,
      y: type === "balloons" ? 110 : type === "fireworks" ? 50 : -10,
      color: colors[type][Math.floor(Math.random() * colors[type].length)],
      size: type === "balloons" ? 30 + Math.random() * 20 : 8 + Math.random() * 8,
      rotation: Math.random() * 360,
      velocityX: (Math.random() - 0.5) * (type === "fireworks" ? 8 : 4),
      velocityY: type === "balloons" ? -(2 + Math.random() * 2) : type === "fireworks" ? (Math.random() - 0.5) * 8 : 2 + Math.random() * 3,
    }));

    setParticles(newParticles);
  }, [type]);

  return (
    <div className="celebration-overlay">
      <svg className="celebration-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {particles.map(p => (
          <g key={p.id} className="celebration-particle" style={{
            "--start-x": `${p.x}%`,
            "--start-y": `${p.y}%`,
            "--velocity-x": p.velocityX,
            "--velocity-y": p.velocityY,
            "--rotation": `${p.rotation}deg`,
            "--size": `${p.size}px`,
            "--color": p.color,
            animationDelay: `${Math.random() * 0.5}s`,
          } as React.CSSProperties}>
            {type === "confetti" && (
              <rect
                x={p.x}
                y={p.y}
                width={p.size / 10}
                height={p.size / 5}
                fill={p.color}
              />
            )}
            {type === "stars" && (
              <text x={p.x} y={p.y} fontSize={p.size / 5} fill={p.color}>★</text>
            )}
            {type === "hearts" && (
              <text x={p.x} y={p.y} fontSize={p.size / 5} fill={p.color}>❤</text>
            )}
            {type === "balloons" && (
              <text x={p.x} y={p.y} fontSize={p.size / 3}>🎈</text>
            )}
            {type === "fireworks" && (
              <circle cx={p.x} cy={p.y} r={p.size / 15} fill={p.color} />
            )}
          </g>
        ))}
      </svg>
      
      {message && (
        <div className="celebration-message">
          {message}
        </div>
      )}
    </div>
  );
}

// Achievement Popup
function AchievementPopup({ title, description }: { title: string; description?: string }) {
  return (
    <div className="achievement-popup">
      <div className="achievement-popup__icon">🏆</div>
      <div className="achievement-popup__content">
        <h4 className="achievement-popup__title">{title}</h4>
        {description && <p className="achievement-popup__description">{description}</p>}
      </div>
    </div>
  );
}

// Milestone Tracker Component
interface MilestoneTrackerProps {
  current: number;
  milestones: { value: number; label: string; icon: string }[];
  onMilestoneReached?: (milestone: { value: number; label: string }) => void;
  className?: string;
}

export function MilestoneTracker({ current, milestones, onMilestoneReached, className = "" }: MilestoneTrackerProps) {
  const { celebrateAchievement } = useCelebration();
  const [lastCelebrated, setLastCelebrated] = useState<number>(0);

  useEffect(() => {
    const reached = milestones.filter(m => m.value <= current && m.value > lastCelebrated);
    if (reached.length > 0) {
      const latest = reached[reached.length - 1];
      celebrateAchievement(`${latest.icon} ${latest.label}`, `You've reached ${latest.value}!`);
      onMilestoneReached?.(latest);
      setLastCelebrated(latest.value);
    }
  }, [current, milestones, lastCelebrated, celebrateAchievement, onMilestoneReached]);

  const nextMilestone = milestones.find(m => m.value > current);
  const progress = nextMilestone ? (current / nextMilestone.value) * 100 : 100;

  return (
    <div className={`milestone-tracker ${className}`}>
      <div className="milestone-tracker__progress">
        <div className="milestone-tracker__bar" style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>
      <div className="milestone-tracker__markers">
        {milestones.map(m => (
          <div
            key={m.value}
            className={`milestone-tracker__marker ${current >= m.value ? "reached" : ""}`}
            style={{ left: `${(m.value / milestones[milestones.length - 1].value) * 100}%` }}
            title={m.label}
          >
            <span className="milestone-tracker__marker-icon">{m.icon}</span>
          </div>
        ))}
      </div>
      {nextMilestone && (
        <div className="milestone-tracker__next">
          Next: {nextMilestone.icon} {nextMilestone.label} ({nextMilestone.value - current} to go)
        </div>
      )}
    </div>
  );
}

// Seasonal Theme Provider
interface SeasonalTheme {
  name: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  className: string;
  decorations: string[];
}

const seasonalThemes: SeasonalTheme[] = [
  { name: "Christmas", startMonth: 12, startDay: 1, endMonth: 12, endDay: 31, className: "theme-christmas", decorations: ["🎄", "⭐", "🎅", "❄️", "🎁"] },
  { name: "New Year", startMonth: 1, startDay: 1, endMonth: 1, endDay: 7, className: "theme-newyear", decorations: ["🎆", "🎊", "🥳", "✨"] },
  { name: "Valentine", startMonth: 2, startDay: 10, endMonth: 2, endDay: 14, className: "theme-valentine", decorations: ["❤️", "💕", "💘", "🌹"] },
  { name: "Halloween", startMonth: 10, startDay: 25, endMonth: 10, endDay: 31, className: "theme-halloween", decorations: ["🎃", "👻", "🦇", "🕷️"] },
];

export function useSeasonalTheme() {
  const [theme, setTheme] = useState<SeasonalTheme | null>(null);

  useEffect(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    const activeTheme = seasonalThemes.find(t => {
      if (t.startMonth === t.endMonth) {
        return month === t.startMonth && day >= t.startDay && day <= t.endDay;
      }
      if (t.startMonth < t.endMonth) {
        return (month === t.startMonth && day >= t.startDay) || 
               (month === t.endMonth && day <= t.endDay) ||
               (month > t.startMonth && month < t.endMonth);
      }
      return false;
    });

    if (activeTheme) {
      setTheme(activeTheme);
      document.body.classList.add(activeTheme.className);
    }

    return () => {
      if (activeTheme) {
        document.body.classList.remove(activeTheme.className);
      }
    };
  }, []);

  return theme;
}

// Seasonal Decorations Component
export function SeasonalDecorations() {
  const theme = useSeasonalTheme();

  if (!theme) return null;

  return (
    <div className="seasonal-decorations">
      {theme.decorations.map((d, i) => (
        <span
          key={i}
          className="seasonal-decoration"
          style={{
            left: `${(i / theme.decorations.length) * 100}%`,
            animationDelay: `${i * 0.5}s`,
          }}
        >
          {d}
        </span>
      ))}
    </div>
  );
}

export type { CelebrationType };
