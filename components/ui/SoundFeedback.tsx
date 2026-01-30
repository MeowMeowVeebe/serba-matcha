"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";

type SoundType = "click" | "success" | "error" | "warning" | "notification" | "typing" | "swoosh" | "pop";

interface SoundSettings {
  enabled: boolean;
  volume: number;
  enabledSounds: Record<SoundType, boolean>;
}

interface SoundContextType {
  settings: SoundSettings;
  playSound: (type: SoundType) => void;
  toggleSound: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  toggleSoundType: (type: SoundType, enabled: boolean) => void;
}

const defaultSettings: SoundSettings = {
  enabled: false, // Disabled by default for accessibility
  volume: 0.3,
  enabledSounds: {
    click: true,
    success: true,
    error: true,
    warning: true,
    notification: true,
    typing: false,
    swoosh: true,
    pop: true,
  },
};

const SoundContext = createContext<SoundContextType | null>(null);

// Web Audio API sound generator
function createOscillatorSound(
  audioContext: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume: number = 0.3
) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

// Sound definitions using Web Audio API
const soundDefinitions: Record<SoundType, (ctx: AudioContext, volume: number) => void> = {
  click: (ctx, vol) => {
    createOscillatorSound(ctx, 800, 0.05, "square", vol * 0.3);
  },
  success: (ctx, vol) => {
    createOscillatorSound(ctx, 523.25, 0.1, "sine", vol);
    setTimeout(() => createOscillatorSound(ctx, 659.25, 0.1, "sine", vol), 100);
    setTimeout(() => createOscillatorSound(ctx, 783.99, 0.15, "sine", vol), 200);
  },
  error: (ctx, vol) => {
    createOscillatorSound(ctx, 200, 0.15, "sawtooth", vol * 0.4);
    setTimeout(() => createOscillatorSound(ctx, 150, 0.2, "sawtooth", vol * 0.3), 150);
  },
  warning: (ctx, vol) => {
    createOscillatorSound(ctx, 440, 0.1, "triangle", vol);
    setTimeout(() => createOscillatorSound(ctx, 440, 0.1, "triangle", vol), 200);
  },
  notification: (ctx, vol) => {
    createOscillatorSound(ctx, 880, 0.08, "sine", vol * 0.5);
    setTimeout(() => createOscillatorSound(ctx, 1108.73, 0.12, "sine", vol * 0.4), 80);
  },
  typing: (ctx, vol) => {
    createOscillatorSound(ctx, 1200 + Math.random() * 200, 0.02, "square", vol * 0.1);
  },
  swoosh: (ctx, vol) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(vol * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  },
  pop: (ctx, vol) => {
    createOscillatorSound(ctx, 600, 0.05, "sine", vol * 0.5);
  },
};

export function SoundProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SoundSettings>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("matcha-sound-settings");
      if (saved) return JSON.parse(saved);
    }
    return defaultSettings;
  });

  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize AudioContext on first interaction
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem("matcha-sound-settings", JSON.stringify(settings));
  }, [settings]);

  const playSound = useCallback((type: SoundType) => {
    if (!settings.enabled || !settings.enabledSounds[type]) return;

    try {
      const ctx = getAudioContext();
      soundDefinitions[type](ctx, settings.volume);
    } catch (e) {
      console.warn("Sound playback failed:", e);
    }
  }, [settings, getAudioContext]);

  const toggleSound = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, enabled }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setSettings(prev => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  const toggleSoundType = useCallback((type: SoundType, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      enabledSounds: { ...prev.enabledSounds, [type]: enabled },
    }));
  }, []);

  return (
    <SoundContext.Provider value={{ settings, playSound, toggleSound, setVolume, toggleSoundType }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error("useSound must be used within a SoundProvider");
  }
  return context;
}

// Sound Settings Panel
export function SoundSettingsPanel({ className = "" }: { className?: string }) {
  const { settings, toggleSound, setVolume, toggleSoundType, playSound } = useSound();

  const soundTypes: { type: SoundType; label: string; icon: string }[] = [
    { type: "click", label: "Button Clicks", icon: "👆" },
    { type: "success", label: "Success", icon: "✅" },
    { type: "error", label: "Errors", icon: "❌" },
    { type: "warning", label: "Warnings", icon: "⚠️" },
    { type: "notification", label: "Notifications", icon: "🔔" },
    { type: "typing", label: "Typing", icon: "⌨️" },
    { type: "swoosh", label: "Transitions", icon: "💨" },
    { type: "pop", label: "Pop Effects", icon: "🎈" },
  ];

  return (
    <div className={`sound-settings ${className}`}>
      <div className="sound-settings__header">
        <h3>🔊 Sound Settings</h3>
        <label className="sound-settings__toggle">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={e => toggleSound(e.target.checked)}
          />
          <span className="sound-settings__toggle-slider" />
        </label>
      </div>

      {settings.enabled && (
        <>
          <div className="sound-settings__volume">
            <label>Volume</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
            />
            <span>{Math.round(settings.volume * 100)}%</span>
          </div>

          <div className="sound-settings__types">
            {soundTypes.map(({ type, label, icon }) => (
              <div key={type} className="sound-settings__type">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.enabledSounds[type]}
                    onChange={e => toggleSoundType(type, e.target.checked)}
                  />
                  <span>{icon} {label}</span>
                </label>
                <button
                  className="sound-settings__preview"
                  onClick={() => playSound(type)}
                  title="Preview"
                >
                  ▶
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Sound-enabled Button wrapper
interface SoundButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  soundType?: SoundType;
  children: ReactNode;
}

export function SoundButton({ soundType = "click", children, onClick, ...props }: SoundButtonProps) {
  const { playSound } = useSound();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playSound(soundType);
    onClick?.(e);
  };

  return (
    <button {...props} onClick={handleClick}>
      {children}
    </button>
  );
}

// Sound-enabled Input wrapper
interface SoundInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  enableTypingSound?: boolean;
}

export function SoundInput({ enableTypingSound = false, onChange, ...props }: SoundInputProps) {
  const { playSound } = useSound();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (enableTypingSound) {
      playSound("typing");
    }
    onChange?.(e);
  };

  return <input {...props} onChange={handleChange} />;
}

export type { SoundType, SoundSettings };
