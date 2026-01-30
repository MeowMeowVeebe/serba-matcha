"use client";

import { Suspense, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AccountShell from "@/components/AccountShell";
import { useAlert } from "@/context/AlertContext";
import { useConfirm } from "@/components/ui/GlobalConfirmDialog";

// Secret key - must match API
const UPGRADE_SECRET = "matcha-secret-2026";

// Types
type UserProfile = {
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  joinedAt?: string;
};

type AppSettings = {
  notifications: {
    email: boolean;
    push: boolean;
    orderUpdates: boolean;
    promotions: boolean;
  };
  appearance: {
    theme: "light" | "dark" | "system";
    language: string;
    compactMode: boolean;
  };
  privacy: {
    showProfile: boolean;
    shareAnalytics: boolean;
  };
};

// Icons
const Icons = {
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
  palette: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="8" r="2" fill="currentColor" />
      <circle cx="8" cy="14" r="2" fill="currentColor" />
      <circle cx="16" cy="14" r="2" fill="currentColor" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  save: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <polyline points="17,21 17,13 7,13 7,21" />
      <polyline points="7,3 7,8 15,8" />
    </svg>
  ),
  camera: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
  sun: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  moon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  ),
  monitor: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3,6 5,6 21,6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  ),
};

// Toggle Component
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="matcha-toggle">
      <input
        type="checkbox"
        className="matcha-toggle__input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="matcha-toggle__track">
        <span className="matcha-toggle__thumb" />
      </span>
    </label>
  );
}

// Settings Section Component  
function SettingsSection({ icon, title, description, children }: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="settings-section">
      <div className="settings-section__header">
        <div className="settings-section__icon">{icon}</div>
        <div className="settings-section__titles">
          <h3 className="settings-section__title">{title}</h3>
          {description && <p className="settings-section__desc">{description}</p>}
        </div>
      </div>
      <div className="settings-section__body">{children}</div>
      
      <style jsx>{`
        .settings-section {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 16px;
          overflow: hidden;
        }
        .settings-section__header {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 20px 24px;
          border-bottom: 1px solid var(--card-border);
        }
        .settings-section__icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: var(--matcha-100);
          color: var(--matcha-600);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        :global(body.dark) .settings-section__icon {
          background: rgba(34, 197, 94, 0.15);
          color: var(--matcha-400);
        }
        .settings-section__icon :global(svg) {
          width: 20px;
          height: 20px;
        }
        .settings-section__titles {
          flex: 1;
          min-width: 0;
        }
        .settings-section__title {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.4;
        }
        .settings-section__desc {
          margin: 4px 0 0 0;
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .settings-section__body {
          padding: 20px 24px;
        }
        @media (max-width: 640px) {
          .settings-section__header {
            padding: 16px;
          }
          .settings-section__body {
            padding: 16px;
          }
          .settings-section__icon {
            width: 36px;
            height: 36px;
          }
          .settings-section__title {
            font-size: 0.95rem;
          }
          .settings-section__desc {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
}

// Settings Row Component
function SettingsRow({ label, description, children }: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="settings-row">
      <div className="settings-row__info">
        <div className="settings-row__label">{label}</div>
        {description && <div className="settings-row__desc">{description}</div>}
      </div>
      <div className="settings-row__action">{children}</div>
      
      <style jsx>{`
        .settings-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 0;
          border-bottom: 1px solid var(--card-border);
        }
        .settings-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .settings-row:first-child {
          padding-top: 0;
        }
        .settings-row__info {
          flex: 1;
          min-width: 0;
        }
        .settings-row__label {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.4;
        }
        .settings-row__desc {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-top: 2px;
          line-height: 1.4;
        }
        .settings-row__action {
          flex-shrink: 0;
        }
        @media (max-width: 480px) {
          .settings-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          .settings-row__action {
            align-self: flex-end;
          }
        }
      `}</style>
    </div>
  );
}

// Separate component for role upgrade that uses useSearchParams
function RoleUpgradeHandler() {
  const searchParams = useSearchParams();
  const { showAlert } = useAlert();
  const [upgradeProcessed, setUpgradeProcessed] = useState(false);

  useEffect(() => {
    if (upgradeProcessed) return;
    
    const roleupgrade = searchParams.get("roleupgrade");
    const email = searchParams.get("email");
    
    if (roleupgrade && email) {
      setUpgradeProcessed(true);
      
      fetch("/api/user/role-upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          role: roleupgrade,
          secret: UPGRADE_SECRET,
        }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (res.ok && data.success) {
            showAlert(data.message, { variant: "success" });
            
            // Check if upgraded to seller role - redirect to seller dashboard
            const isSeller = roleupgrade.toLowerCase() === "seller" || roleupgrade.toLowerCase() === "penjual";
            if (isSeller) {
              // Redirect to seller dashboard after short delay
              setTimeout(() => {
                window.location.href = "/dashboard/seller/dashboard";
              }, 1500);
            } else {
              window.history.replaceState({}, "", "/dashboard/settings");
              setTimeout(() => window.location.reload(), 1500);
            }
          } else {
            showAlert(data.error || "Gagal upgrade role", { variant: "error" });
          }
        })
        .catch(() => {
          showAlert("Gagal upgrade role", { variant: "error" });
        });
    }
  }, [searchParams, upgradeProcessed, showAlert]);

  return null;
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <RoleUpgradeHandler />
      <SettingsPageContent />
    </Suspense>
  );
}

function SettingsPageContent() {
  const { showAlert } = useAlert();
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "appearance" | "privacy">("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({ name: "", email: "" });
  const [settings, setSettings] = useState<AppSettings>({
    notifications: { email: true, push: true, orderUpdates: true, promotions: false },
    appearance: { theme: "dark", language: "en", compactMode: false },
    privacy: { showProfile: true, shareAnalytics: false },
  });

  // Apply theme when it changes
  useEffect(() => {
    const applyTheme = (theme: "light" | "dark" | "system") => {
      if (theme === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.body.className = prefersDark ? "dark" : "light";
      } else {
        document.body.className = theme;
      }
      localStorage.setItem("theme", theme);
    };
    applyTheme(settings.appearance.theme);
  }, [settings.appearance.theme]);

  // Load saved settings on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    if (savedTheme) {
      setSettings(prev => ({
        ...prev,
        appearance: { ...prev.appearance, theme: savedTheme }
      }));
    }
  }, []);

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: Icons.user },
    { id: "notifications" as const, label: "Notifications", icon: Icons.bell },
    { id: "appearance" as const, label: "Appearance", icon: Icons.palette },
    { id: "privacy" as const, label: "Privacy", icon: Icons.shield },
  ];

  // Track if there are unsaved changes
  const [originalProfile, setOriginalProfile] = useState<UserProfile>({ name: "", email: "" });
  const hasChanges = useMemo(() => {
    return (
      profile.name.trim() !== (originalProfile.name || "").trim() ||
      (profile.phone || "") !== (originalProfile.phone || "") ||
      (profile.avatar || "") !== (originalProfile.avatar || "")
    );
  }, [profile, originalProfile]);

  const handleSave = async () => {
    // Validasi
    if (!profile.name || profile.name.trim().length < 2) {
      showAlert("Name must be at least 2 characters", { variant: "error" });
      return;
    }

    // Validasi phone jika diisi
    if (profile.phone && profile.phone.length > 0 && profile.phone.length < 10) {
      showAlert("Phone number must be at least 10 digits", { variant: "error" });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: profile.name.trim(),
          phone: profile.phone || null,
          avatar: profile.avatar || null,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Update original profile to match saved data
        const savedProfile = {
          ...profile,
          name: data.user?.name || profile.name,
          phone: data.user?.phone || profile.phone,
          avatar: data.user?.avatar || profile.avatar,
        };
        setOriginalProfile(savedProfile);
        setProfile(savedProfile);
        showAlert("Profile saved successfully!", { variant: "success" });
      } else {
        throw new Error(data.message || "Failed to save");
      }
    } catch (err) {
      showAlert(err instanceof Error ? err.message : "Failed to save settings", { variant: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);

  // Callback when user data is loaded from AccountShell
  const handleUserLoaded = useCallback((user: { name: string; email: string; phone?: string | null; avatar?: string | null }) => {
    const userProfile = { 
      name: user.name, 
      email: user.email,
      phone: user.phone || "",
      avatar: user.avatar || "",
    };
    setProfile(userProfile);
    setOriginalProfile(userProfile);
  }, []);

  const handleDeleteAccount = async () => {
    const confirmed = await confirm({
      title: "Delete account?",
      message: "All your data will be permanently deleted and cannot be recovered. Type 'DELETE' to confirm.",
      confirmText: "Yes, delete account",
      cancelText: "Cancel",
      variant: "danger",
    });
    
    if (confirmed) {
      // Second confirmation
      const doubleConfirm = await confirm({
        title: "Final Confirmation",
        message: "Are you absolutely sure? This action CANNOT be undone.",
        confirmText: "Delete Permanently",
        cancelText: "Cancel",
        variant: "danger",
      });

      if (doubleConfirm) {
        setIsDeleting(true);
        try {
          const res = await fetch("/api/user/profile", {
            method: "DELETE",
          });
          
          if (res.ok) {
            showAlert("Account deleted successfully. You will be redirected...", { variant: "success" });
            // Logout and redirect after 2 seconds
            setTimeout(async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/dashboard/login";
            }, 2000);
          } else {
            const data = await res.json();
            throw new Error(data.error || "Failed to delete account");
          }
        } catch (err) {
          showAlert(err instanceof Error ? err.message : "Failed to delete account", { variant: "error" });
        } finally {
          setIsDeleting(false);
        }
      }
    }
  };

  return (
    <AccountShell
      title="Settings"
      description="Manage your profile and account preferences."
      breadcrumbs={[{ label: "Settings" }]}
      onUserLoaded={handleUserLoaded}
      actions={
        <button 
          onClick={handleSave} 
          disabled={isSaving || !hasChanges} 
          className="matcha-btn matcha-btn--primary save-btn"
        >
          {isSaving ? (
            <span className="save-spinner"></span>
          ) : (
            Icons.save
          )}
          <span>Save</span>
        </button>
      }
    >
      {({ user, isLoadingUser }) => {
        if (isLoadingUser) return <SettingsSkeleton />;
        if (!user) {
          return (
            <div className="matcha-empty">
              <div className="matcha-empty__icon">{Icons.user}</div>
              <h3 className="matcha-empty__title">Restricted Access</h3>
              <p className="matcha-empty__text">Please sign in to access settings.</p>
              <Link href="/dashboard/login" className="matcha-btn matcha-btn--primary">Sign In</Link>
            </div>
          );
        }

        return (
          <div className="settings-page">
            {/* Tabs */}
            <div className="settings-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`settings-tab ${activeTab === tab.id ? "settings-tab--active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="settings-tab__icon">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="settings-content">
              {activeTab === "profile" && (
                <ProfileSettings profile={profile} setProfile={setProfile} />
              )}
              {activeTab === "notifications" && (
                <NotificationSettings settings={settings} setSettings={setSettings} />
              )}
              {activeTab === "appearance" && (
                <AppearanceSettings settings={settings} setSettings={setSettings} />
              )}
              {activeTab === "privacy" && (
                <PrivacySettings settings={settings} setSettings={setSettings} onDeleteAccount={handleDeleteAccount} isDeleting={isDeleting} />
              )}
            </div>

            <style jsx>{`
              .settings-page { display: flex; flex-direction: column; gap: 24px; }
              .settings-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
              .settings-tab {
                display: flex; align-items: center; gap: 8px;
                padding: 12px 20px; border-radius: 10px;
                background: var(--hover-bg); border: 1px solid transparent;
                color: var(--text-secondary); font-weight: 500;
                cursor: pointer; transition: all 0.2s ease;
              }
              .settings-tab:hover { color: var(--text-primary); background: var(--card-bg); }
              .settings-tab--active {
                background: var(--card-bg); color: var(--matcha-600);
                border-color: var(--matcha-400); box-shadow: var(--shadow-sm);
              }
              :global(body.dark) .settings-tab--active { color: var(--matcha-400); }
              .settings-tab__icon { width: 18px; height: 18px; }
              .settings-content { display: flex; flex-direction: column; gap: 20px; }
              @media (max-width: 640px) {
                .settings-tabs { gap: 6px; }
                .settings-tab { padding: 10px 14px; font-size: 0.85rem; }
                .settings-tab span:last-child { display: none; }
              }
              
              :global(.save-btn) {
                min-width: 120px !important;
              }
              :global(.save-spinner) {
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-top-color: white;
                border-radius: 50%;
                animation: save-spin 0.8s linear infinite;
              }
              @keyframes save-spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        );
      }}
    </AccountShell>
  );
}

// Profile Settings Tab
function ProfileSettings({ profile, setProfile }: { profile: UserProfile; setProfile: (p: UserProfile) => void }) {
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Maximum file size is 2MB");
      return;
    }

    setIsUploadingPhoto(true);
    
    // Convert to base64 for preview (in real app, upload to server)
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile({ ...profile, avatar: reader.result as string });
      setIsUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const formatPhoneNumber = (value: string) => {
    // Remove non-numeric characters except +
    const cleaned = value.replace(/[^\d+]/g, "");
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setProfile({ ...profile, phone: formatted });
  };

  return (
    <>
      <SettingsSection icon={Icons.user} title="Profile Information" description="Manage your basic account information.">
        <div className="profile-avatar-section">
          <div className="profile-avatar" onClick={handlePhotoClick} style={{ cursor: "pointer" }}>
            {profile.avatar ? (
              <img src={profile.avatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            ) : (
              <span>{profile.name?.charAt(0)?.toUpperCase() || "U"}</span>
            )}
            {isUploadingPhoto && (
              <div className="avatar-loading">
                <span className="avatar-spinner"></span>
              </div>
            )}
          </div>
          <div className="profile-avatar-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: "none" }}
            />
            <button 
              className="matcha-btn matcha-btn--secondary matcha-btn--sm"
              onClick={handlePhotoClick}
              disabled={isUploadingPhoto}
            >
              {isUploadingPhoto ? (
                <span className="btn-spinner-sm"></span>
              ) : (
                Icons.camera
              )}
              <span>{isUploadingPhoto ? "Uploading..." : "Change Photo"}</span>
            </button>
            <span className="photo-hint">JPG, PNG. Max 2MB</span>
          </div>
        </div>
        <div className="settings-form">
          <div className="matcha-input-group">
            <label className="matcha-input-label">Full Name</label>
            <input
              type="text"
              className="matcha-input"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Enter your name"
            />
          </div>
          <div className="matcha-input-group">
            <label className="matcha-input-label">Email</label>
            <input type="email" className="matcha-input" value={profile.email} disabled />
            <span className="matcha-input-hint">Email cannot be changed</span>
          </div>
          <div className="matcha-input-group">
            <label className="matcha-input-label">Phone Number</label>
            <input
              type="tel"
              className="matcha-input"
              value={profile.phone || ""}
              onChange={handlePhoneChange}
              placeholder="+62812345678"
              maxLength={15}
            />
            <span className="matcha-input-hint">Example: +1234567890</span>
          </div>
        </div>
      </SettingsSection>

      <style jsx>{`
        .profile-avatar-section {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .profile-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--matcha-400), var(--matcha-600));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .profile-avatar:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .avatar-loading {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .avatar-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: avatar-spin 0.8s linear infinite;
        }
        @keyframes avatar-spin {
          to { transform: rotate(360deg); }
        }
        .profile-avatar-actions {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .photo-hint {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .btn-spinner-sm {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(0, 0, 0, 0.2);
          border-top-color: var(--text-primary);
          border-radius: 50%;
          animation: avatar-spin 0.8s linear infinite;
        }
        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        @media (max-width: 480px) {
          .profile-avatar-section {
            flex-direction: column;
            text-align: center;
          }
          .profile-avatar {
            width: 64px;
            height: 64px;
            font-size: 1.5rem;
          }
          .profile-avatar-actions {
            align-items: center;
          }
        }
      `}</style>
    </>
  );
}

// Notification Settings Tab
function NotificationSettings({ settings, setSettings }: { settings: AppSettings; setSettings: (s: AppSettings) => void }) {
  const update = (key: keyof AppSettings["notifications"], value: boolean) => {
    setSettings({ ...settings, notifications: { ...settings.notifications, [key]: value } });
  };

  return (
    <SettingsSection icon={Icons.bell} title="Notifications" description="Manage your notification preferences.">
      <SettingsRow label="Email Notifications" description="Receive notifications via email">
        <Toggle checked={settings.notifications.email} onChange={(v) => update("email", v)} />
      </SettingsRow>
      <SettingsRow label="Push Notifications" description="Receive push notifications in your browser">
        <Toggle checked={settings.notifications.push} onChange={(v) => update("push", v)} />
      </SettingsRow>
      <SettingsRow label="Order Updates" description="Get notified about order status changes">
        <Toggle checked={settings.notifications.orderUpdates} onChange={(v) => update("orderUpdates", v)} />
      </SettingsRow>
      <SettingsRow label="Promotions & Offers" description="Get updates on the latest deals">
        <Toggle checked={settings.notifications.promotions} onChange={(v) => update("promotions", v)} />
      </SettingsRow>
    </SettingsSection>
  );
}

// Appearance Settings Tab
function AppearanceSettings({ settings, setSettings }: { settings: AppSettings; setSettings: (s: AppSettings) => void }) {
  const themes = [
    { id: "light" as const, label: "Light", icon: Icons.sun },
    { id: "dark" as const, label: "Dark", icon: Icons.moon },
    { id: "system" as const, label: "System", icon: Icons.monitor },
  ];

  return (
    <SettingsSection icon={Icons.palette} title="Appearance" description="Customize the look and feel of the app.">
      <div className="theme-selector">
        <label className="matcha-input-label">Theme</label>
        <div className="theme-options">
          {themes.map((t) => (
            <button
              key={t.id}
              className={`theme-option ${settings.appearance.theme === t.id ? "theme-option--active" : ""}`}
              onClick={() => setSettings({ ...settings, appearance: { ...settings.appearance, theme: t.id } })}
            >
              <span className="theme-option__icon">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .theme-selector { margin-bottom: 20px; }
        .theme-options { display: flex; gap: 12px; margin-top: 8px; }
        .theme-option {
          flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;
          padding: 16px; border-radius: 12px; background: var(--hover-bg);
          border: 2px solid transparent; cursor: pointer; transition: all 0.2s ease;
          color: var(--text-secondary);
        }
        .theme-option:hover { background: var(--card-bg); color: var(--text-primary); }
        .theme-option--active {
          border-color: var(--matcha-500); background: var(--matcha-50);
          color: var(--matcha-700);
        }
        :global(body.dark) .theme-option--active {
          background: rgba(34, 197, 94, 0.1); color: var(--matcha-400);
        }
        .theme-option__icon { width: 24px; height: 24px; }
      `}</style>
    </SettingsSection>
  );
}

// Privacy Settings Tab
function PrivacySettings({ settings, setSettings, onDeleteAccount, isDeleting }: {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  onDeleteAccount: () => void;
  isDeleting?: boolean;
}) {
  return (
    <>
      <SettingsSection icon={Icons.shield} title="Privacy" description="Manage your account privacy settings.">
        <SettingsRow label="Show Profile" description="Allow others to view your profile">
          <Toggle
            checked={settings.privacy.showProfile}
            onChange={(v) => setSettings({ ...settings, privacy: { ...settings.privacy, showProfile: v } })}
          />
        </SettingsRow>
        <SettingsRow label="Share Analytics" description="Help us improve the service">
          <Toggle
            checked={settings.privacy.shareAnalytics}
            onChange={(v) => setSettings({ ...settings, privacy: { ...settings.privacy, shareAnalytics: v } })}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection icon={Icons.trash} title="Danger Zone" description="Actions that cannot be undone">
        <div className="danger-zone">
          <div className="danger-zone__info">
            <h4>Delete Account</h4>
            <p>Once deleted, all your data will be permanently removed.</p>
          </div>
          <button className="matcha-btn matcha-btn--danger" onClick={onDeleteAccount} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <span className="btn-spinner"></span>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                {Icons.trash}<span>Delete Account</span>
              </>
            )}
          </button>
        </div>
      </SettingsSection>

      <style jsx>{`
        .danger-zone {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: var(--danger-light);
          border-radius: 12px;
        }
        .danger-zone__info {
          flex: 1;
          min-width: 0;
        }
        .danger-zone__info h4 {
          margin: 0 0 4px;
          color: var(--danger);
          font-size: 0.95rem;
          font-weight: 600;
        }
        .danger-zone__info p {
          margin: 0;
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }
        .btn-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: btn-spin 0.8s linear infinite;
        }
        @keyframes btn-spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 640px) {
          .danger-zone {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            padding: 12px;
          }
          .danger-zone__info h4 {
            font-size: 0.85rem;
          }
          .danger-zone__info p {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </>
  );
}

// Skeleton
function SettingsSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ width: 120, height: 44, background: "var(--hover-bg)", borderRadius: 10 }} />
        ))}
      </div>
      <div style={{ height: 300, background: "var(--hover-bg)", borderRadius: 14 }} />
    </div>
  );
}



