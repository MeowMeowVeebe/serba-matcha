"use client";

import { useState, useCallback, type ReactNode } from "react";

type AvatarStatus = "online" | "away" | "busy" | "focusing" | "offline";

interface AvatarProps {
  src?: string;
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: AvatarStatus;
  statusMessage?: string;
  showBadge?: boolean;
  badgeContent?: ReactNode;
  onClick?: () => void;
  className?: string;
}

const statusColors: Record<AvatarStatus, string> = {
  online: "#22C55E",
  away: "#F59E0B",
  busy: "#EF4444",
  focusing: "#8B5CF6",
  offline: "#6B7280",
};

const statusLabels: Record<AvatarStatus, string> = {
  online: "Online",
  away: "Away",
  busy: "Do not disturb",
  focusing: "Focusing",
  offline: "Offline",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "#7FB783", "#60A5FA", "#F472B6", "#FBBF24", 
    "#A78BFA", "#34D399", "#FB923C", "#F87171"
  ];
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({
  src,
  name,
  size = "md",
  status,
  statusMessage,
  showBadge = false,
  badgeContent,
  onClick,
  className = "",
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(name);
  const bgColor = stringToColor(name);

  const sizeClasses = {
    xs: "avatar--xs",
    sm: "avatar--sm",
    md: "avatar--md",
    lg: "avatar--lg",
    xl: "avatar--xl",
  };

  return (
    <div
      className={`avatar ${sizeClasses[size]} ${onClick ? "avatar--clickable" : ""} ${className}`}
      onClick={onClick}
      title={statusMessage || statusLabels[status || "offline"]}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={name}
          className="avatar__image"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="avatar__initials" style={{ backgroundColor: bgColor }}>
          {initials}
        </div>
      )}

      {status && (
        <span
          className="avatar__status"
          style={{ backgroundColor: statusColors[status] }}
          title={statusLabels[status]}
        />
      )}

      {showBadge && badgeContent && (
        <span className="avatar__badge">{badgeContent}</span>
      )}
    </div>
  );
}

// Avatar Group
interface AvatarGroupProps {
  users: { name: string; src?: string; status?: AvatarStatus }[];
  max?: number;
  size?: AvatarProps["size"];
  className?: string;
}

export function AvatarGroup({ users, max = 4, size = "sm", className = "" }: AvatarGroupProps) {
  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  return (
    <div className={`avatar-group ${className}`}>
      {visibleUsers.map((user, i) => (
        <Avatar key={i} {...user} size={size} />
      ))}
      {remainingCount > 0 && (
        <div className={`avatar avatar--${size} avatar__overflow`}>
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

// Profile Card
interface ProfileCardProps {
  name: string;
  role?: string;
  email?: string;
  avatar?: string;
  status?: AvatarStatus;
  statusMessage?: string;
  stats?: { label: string; value: string | number }[];
  badges?: { icon: string; label: string; color?: string }[];
  onStatusChange?: (status: AvatarStatus) => void;
  className?: string;
}

export function ProfileCard({
  name,
  role,
  email,
  avatar,
  status = "online",
  statusMessage,
  stats = [],
  badges = [],
  onStatusChange,
  className = "",
}: ProfileCardProps) {
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [customStatus, setCustomStatus] = useState(statusMessage || "");

  return (
    <div className={`profile-card ${className}`}>
      <div className="profile-card__header">
        <Avatar src={avatar} name={name} size="xl" status={status} />
        <div className="profile-card__info">
          <h3 className="profile-card__name">{name}</h3>
          {role && <p className="profile-card__role">{role}</p>}
          {email && <p className="profile-card__email">{email}</p>}
        </div>
      </div>

      <div className="profile-card__status-section">
        <button
          className="profile-card__status-btn"
          onClick={() => setIsStatusOpen(!isStatusOpen)}
        >
          <span
            className="profile-card__status-dot"
            style={{ backgroundColor: statusColors[status] }}
          />
          <span>{statusMessage || statusLabels[status]}</span>
          <span className="profile-card__status-arrow">▼</span>
        </button>

        {isStatusOpen && (
          <div className="profile-card__status-dropdown">
            {(Object.keys(statusColors) as AvatarStatus[]).map(s => (
              <button
                key={s}
                className={`profile-card__status-option ${status === s ? "active" : ""}`}
                onClick={() => {
                  onStatusChange?.(s);
                  setIsStatusOpen(false);
                }}
              >
                <span style={{ backgroundColor: statusColors[s] }} className="profile-card__status-dot" />
                {statusLabels[s]}
              </button>
            ))}
            <div className="profile-card__custom-status">
              <input
                type="text"
                placeholder="Set custom status..."
                value={customStatus}
                onChange={e => setCustomStatus(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {stats.length > 0 && (
        <div className="profile-card__stats">
          {stats.map((stat, i) => (
            <div key={i} className="profile-card__stat">
              <span className="profile-card__stat-value">{stat.value}</span>
              <span className="profile-card__stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      )}

      {badges.length > 0 && (
        <div className="profile-card__badges">
          {badges.map((badge, i) => (
            <span
              key={i}
              className="profile-card__badge"
              style={{ backgroundColor: badge.color }}
              title={badge.label}
            >
              {badge.icon}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Team Presence
interface TeamPresenceProps {
  members: { name: string; avatar?: string; status: AvatarStatus; lastSeen?: Date }[];
  className?: string;
}

export function TeamPresence({ members, className = "" }: TeamPresenceProps) {
  const grouped = members.reduce((acc, m) => {
    if (!acc[m.status]) acc[m.status] = [];
    acc[m.status].push(m);
    return acc;
  }, {} as Record<AvatarStatus, typeof members>);

  const statusOrder: AvatarStatus[] = ["online", "focusing", "away", "busy", "offline"];

  return (
    <div className={`team-presence ${className}`}>
      <h4 className="team-presence__title">Team ({members.length})</h4>
      {statusOrder.map(status => {
        const group = grouped[status];
        if (!group?.length) return null;

        return (
          <div key={status} className="team-presence__group">
            <div className="team-presence__group-header">
              <span style={{ backgroundColor: statusColors[status] }} className="team-presence__dot" />
              <span>{statusLabels[status]} ({group.length})</span>
            </div>
            <div className="team-presence__members">
              {group.map((member, i) => (
                <div key={i} className="team-presence__member">
                  <Avatar src={member.avatar} name={member.name} size="sm" status={member.status} />
                  <span className="team-presence__member-name">{member.name}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export type { AvatarStatus };
