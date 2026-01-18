"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

type Direction = "ltr" | "rtl";

interface Locale {
  code: string;
  name: string;
  nativeName: string;
  direction: Direction;
  flag: string;
  dateFormat: string;
  numberFormat: {
    decimal: string;
    thousand: string;
    currency: string;
  };
}

const locales: Locale[] = [
  { code: "en", name: "English", nativeName: "English", direction: "ltr", flag: "🇺🇸", dateFormat: "MM/DD/YYYY", numberFormat: { decimal: ".", thousand: ",", currency: "$" } },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", direction: "ltr", flag: "🇮🇩", dateFormat: "DD/MM/YYYY", numberFormat: { decimal: ",", thousand: ".", currency: "Rp" } },
  { code: "ar", name: "Arabic", nativeName: "العربية", direction: "rtl", flag: "🇸🇦", dateFormat: "DD/MM/YYYY", numberFormat: { decimal: "٫", thousand: "٬", currency: "ر.س" } },
  { code: "he", name: "Hebrew", nativeName: "עברית", direction: "rtl", flag: "🇮🇱", dateFormat: "DD/MM/YYYY", numberFormat: { decimal: ".", thousand: ",", currency: "₪" } },
  { code: "zh", name: "Chinese", nativeName: "中文", direction: "ltr", flag: "🇨🇳", dateFormat: "YYYY/MM/DD", numberFormat: { decimal: ".", thousand: ",", currency: "¥" } },
  { code: "ja", name: "Japanese", nativeName: "日本語", direction: "ltr", flag: "🇯🇵", dateFormat: "YYYY/MM/DD", numberFormat: { decimal: ".", thousand: ",", currency: "¥" } },
  { code: "de", name: "German", nativeName: "Deutsch", direction: "ltr", flag: "🇩🇪", dateFormat: "DD.MM.YYYY", numberFormat: { decimal: ",", thousand: ".", currency: "€" } },
  { code: "fr", name: "French", nativeName: "Français", direction: "ltr", flag: "🇫🇷", dateFormat: "DD/MM/YYYY", numberFormat: { decimal: ",", thousand: " ", currency: "€" } },
  { code: "es", name: "Spanish", nativeName: "Español", direction: "ltr", flag: "🇪🇸", dateFormat: "DD/MM/YYYY", numberFormat: { decimal: ",", thousand: ".", currency: "€" } },
  { code: "pt", name: "Portuguese", nativeName: "Português", direction: "ltr", flag: "🇧🇷", dateFormat: "DD/MM/YYYY", numberFormat: { decimal: ",", thousand: ".", currency: "R$" } },
];

interface I18nContextType {
  locale: Locale;
  setLocale: (code: string) => void;
  direction: Direction;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatNumber: (value: number, options?: { decimals?: number; currency?: boolean }) => string;
  formatDate: (date: Date | string, format?: string) => string;
  formatCurrency: (value: number) => string;
  availableLocales: Locale[];
}

type Translations = Record<string, Record<string, string>>;

// Sample translations
const translations: Translations = {
  en: {
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.search": "Search",
    "common.loading": "Loading...",
    "common.noData": "No data available",
    "dashboard.title": "Dashboard",
    "dashboard.welcome": "Welcome back, {name}!",
    "settings.title": "Settings",
    "settings.language": "Language",
    "notifications.title": "Notifications",
    "notifications.empty": "No notifications",
  },
  id: {
    "common.save": "Simpan",
    "common.cancel": "Batal",
    "common.delete": "Hapus",
    "common.edit": "Edit",
    "common.search": "Cari",
    "common.loading": "Memuat...",
    "common.noData": "Tidak ada data",
    "dashboard.title": "Dasbor",
    "dashboard.welcome": "Selamat datang kembali, {name}!",
    "settings.title": "Pengaturan",
    "settings.language": "Bahasa",
    "notifications.title": "Notifikasi",
    "notifications.empty": "Tidak ada notifikasi",
  },
  ar: {
    "common.save": "حفظ",
    "common.cancel": "إلغاء",
    "common.delete": "حذف",
    "common.edit": "تعديل",
    "common.search": "بحث",
    "common.loading": "جاري التحميل...",
    "common.noData": "لا توجد بيانات",
    "dashboard.title": "لوحة القيادة",
    "dashboard.welcome": "مرحبًا بعودتك، {name}!",
    "settings.title": "الإعدادات",
    "settings.language": "اللغة",
    "notifications.title": "الإشعارات",
    "notifications.empty": "لا توجد إشعارات",
  },
  he: {
    "common.save": "שמור",
    "common.cancel": "ביטול",
    "common.delete": "מחק",
    "common.edit": "ערוך",
    "common.search": "חיפוש",
    "common.loading": "טוען...",
    "common.noData": "אין נתונים",
    "dashboard.title": "לוח בקרה",
    "dashboard.welcome": "ברוך שובך, {name}!",
    "settings.title": "הגדרות",
    "settings.language": "שפה",
    "notifications.title": "התראות",
    "notifications.empty": "אין התראות",
  },
  zh: {
    "common.save": "保存",
    "common.cancel": "取消",
    "common.delete": "删除",
    "common.edit": "编辑",
    "common.search": "搜索",
    "common.loading": "加载中...",
    "common.noData": "暂无数据",
    "dashboard.title": "仪表板",
    "dashboard.welcome": "欢迎回来，{name}！",
    "settings.title": "设置",
    "settings.language": "语言",
    "notifications.title": "通知",
    "notifications.empty": "没有通知",
  },
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("matcha-locale");
      if (saved) {
        const found = locales.find(l => l.code === saved);
        if (found) return found;
      }
      // Auto-detect browser language
      const browserLang = navigator.language.split("-")[0];
      const found = locales.find(l => l.code === browserLang);
      if (found) return found;
    }
    return locales[0];
  });

  // Apply direction to document
  useEffect(() => {
    document.documentElement.dir = locale.direction;
    document.documentElement.lang = locale.code;
    document.body.classList.toggle("rtl", locale.direction === "rtl");
    localStorage.setItem("matcha-locale", locale.code);
  }, [locale]);

  const setLocale = useCallback((code: string) => {
    const found = locales.find(l => l.code === code);
    if (found) setLocaleState(found);
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let text = translations[locale.code]?.[key] || translations.en?.[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    
    return text;
  }, [locale.code]);

  const formatNumber = useCallback((value: number, options?: { decimals?: number; currency?: boolean }): string => {
    const { decimal, thousand, currency } = locale.numberFormat;
    const decimals = options?.decimals ?? 0;
    
    const [int, dec] = value.toFixed(decimals).split(".");
    const formattedInt = int.replace(/\B(?=(\d{3})+(?!\d))/g, thousand);
    
    let result = dec ? `${formattedInt}${decimal}${dec}` : formattedInt;
    
    if (options?.currency) {
      result = locale.direction === "rtl" 
        ? `${result} ${currency}`
        : `${currency}${result}`;
    }
    
    return result;
  }, [locale]);

  const formatCurrency = useCallback((value: number): string => {
    return formatNumber(value, { decimals: 2, currency: true });
  }, [formatNumber]);

  const formatDate = useCallback((date: Date | string, format?: string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    const fmt = format || locale.dateFormat;
    
    const pad = (n: number) => n.toString().padStart(2, "0");
    
    return fmt
      .replace("YYYY", d.getFullYear().toString())
      .replace("MM", pad(d.getMonth() + 1))
      .replace("DD", pad(d.getDate()));
  }, [locale.dateFormat]);

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        direction: locale.direction,
        t,
        formatNumber,
        formatDate,
        formatCurrency,
        availableLocales: locales,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

// Language Switcher Component
interface LanguageSwitcherProps {
  variant?: "dropdown" | "flags" | "full";
  className?: string;
}

export function LanguageSwitcher({ variant = "dropdown", className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale, availableLocales } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  if (variant === "flags") {
    return (
      <div className={`language-switcher language-switcher--flags ${className}`}>
        {availableLocales.map(l => (
          <button
            key={l.code}
            className={`language-switcher__flag ${locale.code === l.code ? "active" : ""}`}
            onClick={() => setLocale(l.code)}
            title={l.nativeName}
          >
            {l.flag}
          </button>
        ))}
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div className={`language-switcher language-switcher--full ${className}`}>
        {availableLocales.map(l => (
          <button
            key={l.code}
            className={`language-switcher__item ${locale.code === l.code ? "active" : ""}`}
            onClick={() => setLocale(l.code)}
          >
            <span className="language-switcher__flag">{l.flag}</span>
            <span className="language-switcher__name">{l.nativeName}</span>
            {l.direction === "rtl" && <span className="language-switcher__rtl">RTL</span>}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`language-switcher language-switcher--dropdown ${className}`}>
      <button
        className="language-switcher__trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{locale.flag}</span>
        <span>{locale.code.toUpperCase()}</span>
        <span className="language-switcher__arrow">▼</span>
      </button>

      {isOpen && (
        <div className="language-switcher__menu">
          {availableLocales.map(l => (
            <button
              key={l.code}
              className={`language-switcher__option ${locale.code === l.code ? "active" : ""}`}
              onClick={() => {
                setLocale(l.code);
                setIsOpen(false);
              }}
            >
              <span>{l.flag}</span>
              <span>{l.nativeName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// RTL-aware components
interface RTLFlexProps {
  children: ReactNode;
  className?: string;
  reverse?: boolean;
}

export function RTLFlex({ children, className = "", reverse = false }: RTLFlexProps) {
  const { direction } = useI18n();
  const shouldReverse = (direction === "rtl") !== reverse;

  return (
    <div className={`rtl-flex ${shouldReverse ? "rtl-flex--reverse" : ""} ${className}`}>
      {children}
    </div>
  );
}

// Formatted components
export function FormattedNumber({ value, decimals, currency }: { value: number; decimals?: number; currency?: boolean }) {
  const { formatNumber } = useI18n();
  return <span>{formatNumber(value, { decimals, currency })}</span>;
}

export function FormattedCurrency({ value }: { value: number }) {
  const { formatCurrency } = useI18n();
  return <span>{formatCurrency(value)}</span>;
}

export function FormattedDate({ date, format }: { date: Date | string; format?: string }) {
  const { formatDate } = useI18n();
  return <span>{formatDate(date, format)}</span>;
}

export function Trans({ id, params }: { id: string; params?: Record<string, string | number> }) {
  const { t } = useI18n();
  return <>{t(id, params)}</>;
}

export type { Locale, Direction };
