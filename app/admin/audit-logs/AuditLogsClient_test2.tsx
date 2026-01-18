"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { LruCache } from "@/lib/client/lru";
import {
  getOverlayIndex,
  getTopOverlayKey,
  isTopOverlay,
  pushOverlay,
  removeOverlay,
  subscribeOverlayStack,
} from "@/lib/client/overlayStack";
import FormError from "@/components/form/FormError";
import EmptyState from "@/components/ui/EmptyState";
import SkeletonBlock from "@/components/ui/SkeletonBlock";
import { useAlert } from "@/context/AlertContext";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function tryParseJsonRecord(input: unknown): Record<string, unknown> | null {
  if (typeof input !== "string" || !input) return null;
  try {
    const parsed = JSON.parse(input) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function formatJsonPretty(input: string | null | undefined) {
  if (!input) return "";
  try {
    const parsed = JSON.parse(input) as unknown;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return input;
  }
}

function isSafeJsonIdentifier(key: string) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key);
}

function jsonPathJoin(path: string, key: string) {
  if (isSafeJsonIdentifier(key)) return `${path}.${key}`;
  // Use bracket notation for unsafe keys (spaces, dots, dashes, etc)
  return `${path}[${JSON.stringify(key)}]`;
}

function formatAgo(ts: number | null) {
  if (!ts) return "";
  const diffMs = Date.now() - ts;
  if (diffMs < 0) return "just now";
  const s = Math.round(diffMs / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);

  // calendar-ish: yesterday
  const now = new Date();
  const then = new Date(ts);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfThen = new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime();
  const dayDiff = Math.round((startOfToday - startOfThen) / (24 * 60 * 60 * 1000));
  if (dayDiff === 1) return "yesterday";

  if (h < 48) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

type JsonTreeProps = {
  value: unknown;
  name?: string;
  defaultOpen?: boolean;
  depth?: number;
  path?: string;
  onCopyPath?: (path: string) => void;
  onCopyValue?: (valueText: string) => void;
};

function JsonArrayNode(props: JsonTreeProps & { value: unknown[] }) {
  const depth = props.depth ?? 0;
  const path = props.path ?? "$";
  const [open, setOpen] = useState<boolean>(props.defaultOpen ?? depth < 1);

  const renderName = (name: string) => {
    const fullPath = path;
    return props.onCopyPath ? (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          props.onCopyPath?.(fullPath);
        }}
        style={{ padding: 0, border: 0, background: "transparent", color: "#1c7ed6", textDecoration: "underline", cursor: "pointer", fontSize: 12, lineHeight: 1.2 }}
        title={`Copy path: ${fullPath}`}
      >
        {name}
      </button>
    ) : (
      <b>{name}</b>
    );
  };

  return (
    <details open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span>{props.name ? renderName(props.name) : null} Array({props.value.length})</span>
        {props.onCopyValue ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              props.onCopyValue?.(JSON.stringify(props.value, null, 2));
            }}
            style={{ padding: 0, border: 0, background: "transparent", color: "#1c7ed6", textDecoration: "underline", cursor: "pointer", fontSize: 12 }}
            title="Copy subtree JSON"
          >
            copy subtree
          </button>
        ) : null}
      </summary>

      {open ? (
        <div style={{ paddingLeft: 14 }}>
          {props.value.map((item, i) => (
            <div key={i}>
              <JsonTree
                value={item}
                name={String(i)}
                depth={depth + 1}
                path={`${path}[${i}]`}
                onCopyPath={props.onCopyPath}
                onCopyValue={props.onCopyValue}
              />
            </div>
          ))}
        </div>
      ) : null}
    </details>
  );
}

function JsonObjectNode(props: JsonTreeProps & { value: Record<string, unknown> }) {
  const depth = props.depth ?? 0;
  const path = props.path ?? "$";
  const keys = Object.keys(props.value);
  const [open, setOpen] = useState<boolean>(props.defaultOpen ?? depth < 1);

  const renderName = (name: string) => {
    const fullPath = path;
    return props.onCopyPath ? (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          props.onCopyPath?.(fullPath);
        }}
        style={{ padding: 0, border: 0, background: "transparent", color: "#1c7ed6", textDecoration: "underline", cursor: "pointer", fontSize: 12, lineHeight: 1.2 }}
        title={`Copy path: ${fullPath}`}
      >
        {name}
      </button>
    ) : (
      <b>{name}</b>
    );
  };

  return (
    <details open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span>{props.name ? renderName(props.name) : null} Object({keys.length})</span>
        {props.onCopyValue ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              props.onCopyValue?.(JSON.stringify(props.value, null, 2));
            }}
            style={{ padding: 0, border: 0, background: "transparent", color: "#1c7ed6", textDecoration: "underline", cursor: "pointer", fontSize: 12 }}
            title="Copy subtree JSON"
          >
            copy subtree
          </button>
        ) : null}
      </summary>

      {open ? (
        <div style={{ paddingLeft: 14 }}>
          {keys.map((k) => (
            <div key={k}>
              <JsonTree
                value={props.value[k]}
                name={k}
                depth={depth + 1}
                path={jsonPathJoin(path, k)}
                onCopyPath={props.onCopyPath}
                onCopyValue={props.onCopyValue}
              />
            </div>
          ))}
        </div>
      ) : null}
    </details>
  );
}

function JsonTree(props: JsonTreeProps) {
  const depth = props.depth ?? 0;
  const maxDepth = 6;
  const path = props.path ?? "$";

  if (depth > maxDepth) {
    return <span style={{ opacity: 0.75 }}>(max depth)</span>;
  }

  const v = props.value;

  const renderLeaf = (text: string, color?: string) => {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <span style={color ? { color } : undefined}>{text}</span>
        {props.onCopyValue ? (
          <button
            type="button"
            className="secondary-btn"
            style={{ padding: "0 6px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", fontSize: 12 }}
            title="Copy value"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              props.onCopyValue?.(text);
            }}
          >
            copy
          </button>
        ) : null}
      </span>
    );
  };

  if (v === null) return renderLeaf("null", "#555");
  if (typeof v === "string") return renderLeaf(JSON.stringify(v), "#0b7285");
  if (typeof v === "number" || typeof v === "boolean") return renderLeaf(String(v), "#364fc7");

  if (Array.isArray(v)) {
    return <JsonArrayNode {...props} value={v} depth={depth} path={path} />;
  }

  if (typeof v === "object") {
    return <JsonObjectNode {...props} value={v as Record<string, unknown>} depth={depth} path={path} />;
  }

  return <span>{String(v)}</span>;
}

function highlightText(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);

  return (
    <>
      {before}
      <mark style={{ background: "#fff3bf", padding: "0 2px", borderRadius: 4 }}>{match}</mark>
      {after}
    </>
  );
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function Dialog(props: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const dialogKey = useId();
  const [stackVersion, setStackVersion] = useState(0);

  useEffect(() => {
    return subscribeOverlayStack(() => setStackVersion((v) => v + 1));
  }, []);

  useEffect(() => {
    if (!props.open) return;
    pushOverlay(dialogKey);
    return () => removeOverlay(dialogKey);
  }, [props.open, dialogKey]);

  const stackIndex = useMemo(() => getOverlayIndex(dialogKey), [dialogKey, stackVersion]);
  const isTopMost = useMemo(() => isTopOverlay(dialogKey), [dialogKey, stackVersion]);
  const baseZ = 200 + Math.max(0, stackIndex) * 20;

  useEffect(() => {
    if (!props.open) return;
    openerRef.current = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      const opener = openerRef.current;
      if (opener) window.setTimeout(() => opener.focus(), 0);
      openerRef.current = null;
    };
  }, [props.open]);

  const getFocusables = () => {
    const root = dialogRef.current;
    if (!root) return [] as HTMLElement[];
    return Array.from(
      root.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')
    ).filter((el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true");
  };

  useEffect(() => {
    if (!props.open) return;

    const t = window.setTimeout(() => {
      const focusables = getFocusables();
      (focusables[0] ?? dialogRef.current)?.focus();
    }, 0);

    return () => window.clearTimeout(t);
  }, [props.open]);

  if (!props.open) return null;

  return (
    <>
      <div
        role="presentation"
        onClick={() => {
          if (!isTopMost) return;
          props.onClose();
        }}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: baseZ }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: baseZ + 10, padding: 16 }}
      >
        <div
          ref={dialogRef}
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              if (!isTopMost) return;
              e.preventDefault();
              props.onClose();
              return;
            }

            if (e.key !== "Tab") return;
            const focusables = getFocusables();
            if (focusables.length === 0) return;

            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const active = document.activeElement as HTMLElement | null;

            if (e.shiftKey) {
              if (active === first || active === dialogRef.current) {
                e.preventDefault();
                last.focus();
              }
            } else {
              if (active === last) {
                e.preventDefault();
                first.focus();
              }
            }
          }}
          style={{
            width: "min(720px, 96vw)",
            maxHeight: "min(80vh, 720px)",
            overflow: "auto",
            background: "white",
            borderRadius: 16,
            border: "1px solid rgba(0,0,0,0.12)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
            padding: 14,
          }}
        >
          <div tabIndex={0} aria-hidden onFocus={() => getFocusables().slice(-1)[0]?.focus()} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <h3 id={titleId} style={{ margin: 0, fontSize: 16 }}>
              {props.title}
            </h3>
            <button className="secondary-btn" onClick={props.onClose}>
              Close
            </button>
          </div>

          {props.children}

          <div tabIndex={0} aria-hidden onFocus={() => getFocusables()[0]?.focus()} />
        </div>
      </div>
    </>
  );
}

function useVirtualWindow(opts: {
  count: number;
  rowHeight: number;
  overscan?: number;
  containerRef: RefObject<HTMLElement | null>;
}) {
  const overscan = opts.overscan ?? 6;
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(300);

  useEffect(() => {
    const el = opts.containerRef.current;
    if (!el) return;

    const onScroll = () => setScrollTop(el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => {
      setContainerHeight(el.clientHeight || 300);
    });
    ro.observe(el);

    // Initialize measurements asynchronously to avoid setState directly in effect body
    const raf = window.requestAnimationFrame(() => {
      setScrollTop(el.scrollTop);
      setContainerHeight(el.clientHeight || 300);
    });

    return () => {
      window.cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [opts.containerRef]);

  const maxVisible = Math.max(1, Math.ceil(containerHeight / opts.rowHeight));
  const start = Math.max(0, Math.floor(scrollTop / opts.rowHeight) - overscan);
  const end = Math.min(opts.count, start + maxVisible + overscan * 2);

  const topPad = start * opts.rowHeight;
  const bottomPad = Math.max(0, (opts.count - end) * opts.rowHeight);

  return { start, end, topPad, bottomPad, containerHeight };
}

const DEFAULT_PAGE_SIZE = 20;

const AUDIT_ROW_HEIGHT = 44;
const EXPORT_ROW_HEIGHT = 44;

type LogRow = {
  id: string;
  action: string;
  userId: string | null;
  ip: string | null;
  metaPreview: string | null;
  meta: string | null;
  createdAt: string;
};

type ApiResponse = {
  logs: LogRow[];
  total: number | null;
  pageSize: number;
  action?: string;
  q?: string;
  metaSearch?: boolean;
  includeMeta?: boolean;
  hasMore: boolean;
  nextCursor: string | null;
  prevCursor: string | null;
};

type ExportJob = {
  id: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  createdAt: string;
  updatedAt: string;
  fileName: string | null;
  mimeType: string | null;
  error: string | null;
  rowsWritten?: number;
  filters?: string;
};

function summarizeFilters(filtersJson: string | undefined) {
  if (!filtersJson) return "-";
  try {
    const f = JSON.parse(filtersJson) as Record<string, unknown>;
    const parts: string[] = [];
    if (typeof f.action === "string" && f.action) parts.push(`action~${f.action}`);
    if (typeof f.q === "string" && f.q) parts.push(`q~${f.q}`);
    if (f.meta === true) parts.push("meta=1");
    if (typeof f.targetUserId === "string" && f.targetUserId) parts.push(`targetUserId=${f.targetUserId}`);
    if (typeof f.targetEmail === "string" && f.targetEmail) parts.push(`targetEmail~${f.targetEmail}`);
    if (typeof f.resource === "string" && f.resource) parts.push(`resource~${f.resource}`);
    if (typeof f.statusCode === "string" && f.statusCode) parts.push(`statusCode=${f.statusCode}`);
    if (typeof f.createdAtFrom === "string" && f.createdAtFrom) parts.push(`from=${f.createdAtFrom}`);
    if (typeof f.createdAtTo === "string" && f.createdAtTo) parts.push(`to=${f.createdAtTo}`);
    return parts.length ? parts.join(", ") : "-";
  } catch {
    return "-";
  }
}

function renderPadRow(heightPx: number, colSpan: number) {
  if (heightPx <= 0) return null;
  return (
    <tr aria-hidden="true">
      <td style={{ padding: 0, height: heightPx }} colSpan={colSpan} />
    </tr>
  );
}

function StatusBadge({ status }: { status: ExportJob["status"] }) {
  const variant =
    status === "completed"
      ? "success"
      : status === "running"
        ? "info"
        : status === "failed"
          ? "danger"
          : status === "pending"
            ? "warning"
            : "info";
  return <span className={`badge badge--${variant}`}>{status.toUpperCase()}</span>;
}
type QueryState = {
  action: string;
  q: string;
  meta: boolean;
  targetUserId: string;
  targetEmail: string;
  resource: string;
  statusCode: string;
  createdAtFrom: string;
  createdAtTo: string;
  cursor: string;
  dir: "next" | "prev";
};

type SavedView = {
  id: string;
  name: string;
  createdAt: number;
  query: Omit<QueryState, "cursor" | "dir">;
};

export type AdminAuditInitialData = {
  query: QueryState;
  pageSize: number;
  total: number | null;
  rows: LogRow[];
  hasMore: boolean;
  nextCursor: string | null;
  prevCursor: string | null;
};

function readQueryFromLocation(): QueryState {
  if (typeof window === "undefined") {
    return {
      action: "",
      q: "",
      meta: false,
      targetUserId: "",
      targetEmail: "",
      resource: "",
      statusCode: "",
      createdAtFrom: "",
      createdAtTo: "",
      cursor: "",
      dir: "next",
    };
  }
  const sp = new URLSearchParams(window.location.search);
  return {
    action: (sp.get("action") ?? "").trim(),
    q: (sp.get("q") ?? "").trim(),
    meta: (sp.get("meta") ?? "0") === "1",
    targetUserId: (sp.get("targetUserId") ?? "").trim(),
    targetEmail: (sp.get("targetEmail") ?? "").trim(),
    resource: (sp.get("resource") ?? "").trim(),
    statusCode: (sp.get("statusCode") ?? "").trim(),
    createdAtFrom: (sp.get("createdAtFrom") ?? "").trim(),
    createdAtTo: (sp.get("createdAtTo") ?? "").trim(),
    cursor: (sp.get("cursor") ?? "").trim(),
    dir: (sp.get("dir") ?? "next") === "prev" ? "prev" : "next",
  };
}

function buildSearch(params: QueryState) {
  const sp = new URLSearchParams();
  if (params.action.trim()) sp.set("action", params.action.trim());
  if (params.q.trim()) sp.set("q", params.q.trim());
  if (params.meta) sp.set("meta", "1");
  if (params.targetUserId.trim()) sp.set("targetUserId", params.targetUserId.trim());
  if (params.targetEmail.trim()) sp.set("targetEmail", params.targetEmail.trim());
  if (params.resource.trim()) sp.set("resource", params.resource.trim());
  if (params.statusCode.trim()) sp.set("statusCode", params.statusCode.trim());
  if (params.createdAtFrom.trim()) sp.set("createdAtFrom", params.createdAtFrom.trim());
  if (params.createdAtTo.trim()) sp.set("createdAtTo", params.createdAtTo.trim());
  if (params.cursor.trim()) sp.set("cursor", params.cursor.trim());
  if (params.dir !== "next") sp.set("dir", params.dir);

  const s = sp.toString();
  return s ? `?${s}` : "";
}

export default function AuditLogsClient({ initial }: { initial: AdminAuditInitialData }) {
  const router = useRouter();
  const { showAlert } = useAlert();

  // Applied query state (source of truth for list fetch + exports)
  const [query, setQuery] = useState<QueryState>(initial.query);

  // Draft UI input state (may differ from applied query when autoApply is off)
  const [actionInput, setActionInput] = useState(initial.query.action);
  const [qInput, setQInput] = useState(initial.query.q);
  const [metaInput, setMetaInput] = useState(initial.query.meta);
  const [targetUserIdInput, setTargetUserIdInput] = useState(initial.query.targetUserId);
  const [targetEmailInput, setTargetEmailInput] = useState(initial.query.targetEmail);
  const [resourceInput, setResourceInput] = useState(initial.query.resource);
  const [statusCodeInput, setStatusCodeInput] = useState(initial.query.statusCode);
  const [createdAtFromInput, setCreatedAtFromInput] = useState(initial.query.createdAtFrom);
  const [createdAtToInput, setCreatedAtToInput] = useState(initial.query.createdAtTo);

  const isoToLocalInput = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const localInputToIso = (v: string) => {
    if (!v) return "";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString();
  };

  const [createdAtFromLocal, setCreatedAtFromLocal] = useState(isoToLocalInput(initial.query.createdAtFrom));
  const [createdAtToLocal, setCreatedAtToLocal] = useState(isoToLocalInput(initial.query.createdAtTo));

  const setRangePreset = (msBack: number) => {
    const toIso = new Date().toISOString();
    const fromIso = new Date(Date.now() - msBack).toISOString();

    setCreatedAtFromInput(fromIso);
    setCreatedAtToInput(toIso);
    setCreatedAtFromLocal(isoToLocalInput(fromIso));
    setCreatedAtToLocal(isoToLocalInput(toIso));
  };

  const applyOnlyErrorsPreset = () => {
    // API supports equality only; 400 is a good proxy for "errors" in most cases.
    setStatusCodeInput("400");
  };

  const applyAuthActionsPreset = () => {
    // action filter is "contains". Using a common prefix (if used) gives good results.
    // Keep it editable.
    setActionInput("auth.");
  };

  const [rows, setRows] = useState<LogRow[]>(initial.rows);
  const [total, setTotal] = useState<number | null>(initial.total);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [nextCursor, setNextCursor] = useState<string | null>(initial.nextCursor);
  const [prevCursor, setPrevCursor] = useState<string | null>(initial.prevCursor);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
  const [lastFetchDurationMs, setLastFetchDurationMs] = useState<number | null>(null);
  const [lastFetchStatus, setLastFetchStatus] = useState<number | null>(null);
  const [lastAuditRequestUrl, setLastAuditRequestUrl] = useState<string | null>(null);
  const [lastAuditErrorPayload, setLastAuditErrorPayload] = useState<string | null>(null);
  const [showAuditErrorPreview, setShowAuditErrorPreview] = useState(false);
  const [auditErrorPreviewMode, setAuditErrorPreviewMode] = useState<"pretty" | "raw">("pretty");

  const pushToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const variant = type === "success" ? "success" : type === "error" ? "error" : "info";
    showAlert(message, { variant });
  };

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isMetaDrawerClosing, setIsMetaDrawerClosing] = useState(false);
  const metaCacheRef = useRef(new LruCache<string, string | null>(100));
  const [metaById, setMetaById] = useState<Record<string, string | null>>({});
  const [isLoadingMeta, setIsLoadingMeta] = useState<Record<string, boolean>>({});

  const [metaViewMode, setMetaViewMode] = useState<"pretty" | "raw">(() => {
    if (typeof window === "undefined") return "pretty";
    const v = window.localStorage.getItem("auditLogs.metaViewMode");
    return v === "raw" ? "raw" : "pretty";
  });

  useEffect(() => {
    try {
      window.localStorage.setItem("auditLogs.metaViewMode", metaViewMode);
    } catch {
      // ignore
    }
  }, [metaViewMode]);

  const closeMetaDrawer = () => {
    if (!expandedId) return;
    setIsMetaDrawerClosing(true);
    window.setTimeout(() => {
      setExpandedId(null);
      setIsMetaDrawerClosing(false);
    }, 180);
  };

  const openAuditLog = async (id: string) => {
    if (expandedId === id) {
      closeMetaDrawer();
      return;
    }

    lastFocusedElRef.current = document.activeElement as HTMLElement | null;
    setExpandedId(id);

    // LRU cache lookup
    const cached = metaCacheRef.current.get(id);
    if (cached !== undefined) {
      setMetaById((prev) => ({ ...prev, [id]: cached }));
      return;
    }

    setIsLoadingMeta((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/admin/audit-logs/${id}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        metaCacheRef.current.set(id, null);
        setMetaById((prev) => ({ ...prev, [id]: null }));
        return;
      }
      const body = (await res.json().catch(() => null)) as unknown;
      const record = isRecord(body) ? body : null;
      const log = record && isRecord(record.log) ? record.log : null;
      const meta = log?.meta ?? log?.metaPreview ?? null;
      const value = typeof meta === "string" ? meta : null;
      metaCacheRef.current.set(id, value);
      setMetaById((prev) => ({ ...prev, [id]: value }));
    } finally {
      setIsLoadingMeta((prev) => ({ ...prev, [id]: false }));
    }
  };

  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [exportsHasMore, setExportsHasMore] = useState(false);
  const [exportsNextCursor, setExportsNextCursor] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [jobDetailId, setJobDetailId] = useState<string | null>(null);
  const [jobDetail, setJobDetail] = useState<unknown>(null);
  const [isLoadingJobDetail, setIsLoadingJobDetail] = useState(false);

  const [autoApply, setAutoApply] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [shortcutsSearch, setShortcutsSearch] = useState("");
  const [shortcutsCategory, setShortcutsCategory] = useState<"All" | "Navigation" | "Export" | "UI" | "Search">("All");
  const [showOnlyConflicts, setShowOnlyConflicts] = useState(false);
  const [showConflictsPanel, setShowConflictsPanel] = useState(false);
  const [conflictsSearch, setConflictsSearch] = useState("");
  const [conflictActionChoice, setConflictActionChoice] = useState<string>("");
  const [conflictSuggestedKey, setConflictSuggestedKey] = useState<string>("");
  const [lastCopiedKey, setLastCopiedKey] = useState<string | null>(null);
  const [lastCopiedKeyAt, setLastCopiedKeyAt] = useState<number | null>(null);
  const [lastCopiedTemplate, setLastCopiedTemplate] = useState<string | null>(null);
  const [lastCopiedTemplateAt, setLastCopiedTemplateAt] = useState<number | null>(null);
  const [showFullLastTemplate, setShowFullLastTemplate] = useState(false);
  const [lastTemplateTruncate, setLastTemplateTruncate] = useState<120 | 300 | "full">(120);
  const [bugReportIncludeUsedKeys, setBugReportIncludeUsedKeys] = useState(true);
  const [bugReportIncludeConflicts, setBugReportIncludeConflicts] = useState(true);
  const [reportPreviewOpen, setReportPreviewOpen] = useState(false);
  const [reportPreviewMode, setReportPreviewMode] = useState<"text" | "json" | "issue" | "markdown">("text");
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(() => new Set());
  const [nowTick, setNowTick] = useState(0);
  // Force re-render for relative time labels while shortcuts dialog is open
  void nowTick;

  const [savedViewsOpen, setSavedViewsOpen] = useState(false);
  const [savedViewsSearch, setSavedViewsSearch] = useState("");
  const savedViewsRef = useRef<HTMLDivElement>(null);
  const [activeSavedViewId, setActiveSavedViewId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem("auditLogs.activeSavedViewId") || null;
    } catch {
      return null;
    }
  });

  type ViewsModalState =
    | { kind: "save"; initialName: string }
    | { kind: "delete"; id: string }
    | { kind: "update"; id: string }
    | null;
  const [viewsModal, setViewsModal] = useState<ViewsModalState>(null);
  const [viewsModalName, setViewsModalName] = useState("");

  const [manageViewsOpen, setManageViewsOpen] = useState(false);
  const [manageViewsImportText, setManageViewsImportText] = useState("");
  const [manageViewsImportFileName, setManageViewsImportFileName] = useState<string | null>(null);
  const [manageViewsImportStatus, setManageViewsImportStatus] = useState<{ kind: "ok" | "error"; message: string } | null>(null);
  const manageViewsImportFileRef = useRef<HTMLInputElement>(null);

  const [manageViewsImportMode, setManageViewsImportMode] = useState<"merge" | "replace">("merge");
  const [pendingImport, setPendingImport] = useState<{
    mode: "merge" | "replace";
    incoming: SavedView[];
    summary: string;
    stats: { incoming: number; result: number; newCount: number; overwriteCount: number; removedCount: number };
    samples: { newItems: string[]; overwriteItems: string[]; removedItems: string[] };
  } | null>(null);
  const [manageViewsSelected, setManageViewsSelected] = useState<Record<string, boolean>>({});
  const [manageViewsNameDrafts, setManageViewsNameDrafts] = useState<Record<string, string>>({});

  const [savedViews, setSavedViews] = useState<SavedView[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("auditLogs.savedViews");
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as SavedView[]) : [];
    } catch {
      return [];
    }
  });

  const persistSavedViews = (next: SavedView[]) => {
    setSavedViews(next);
    try {
      window.localStorage.setItem("auditLogs.savedViews", JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const setActiveSavedView = (id: string | null) => {
    setActiveSavedViewId(id);
    try {
      if (!id) window.localStorage.removeItem("auditLogs.activeSavedViewId");
      else window.localStorage.setItem("auditLogs.activeSavedViewId", id);
    } catch {
      // ignore
    }
  };

  const metaDrawerRef = useRef<HTMLDivElement>(null);
  const lastFocusedElRef = useRef<HTMLElement | null>(null);
  const metaDrawerKeyRef = useRef<string>("meta-drawer");

  const getMetaDrawerFocusables = () => {
    const root = metaDrawerRef.current;
    if (!root) return [] as HTMLElement[];
    return Array.from(
      root.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')
    ).filter((el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true");
  };

  const focusFirstInMetaDrawer = () => {
    const items = getMetaDrawerFocusables();
    const first = items[0];
    (first ?? metaDrawerRef.current)?.focus();
  };

  const focusLastInMetaDrawer = () => {
    const items = getMetaDrawerFocusables();
    const last = items[items.length - 1];
    (last ?? metaDrawerRef.current)?.focus();
  };

  const debouncedActionInput = useDebouncedValue(actionInput, 400);
  const debouncedQInput = useDebouncedValue(qInput, 400);
  const debouncedTargetEmailInput = useDebouncedValue(targetEmailInput, 400);
  const debouncedResourceInput = useDebouncedValue(resourceInput, 400);
  const debouncedStatusCodeInput = useDebouncedValue(statusCodeInput, 400);
  const debouncedTargetUserIdInput = useDebouncedValue(targetUserIdInput, 400);
  // For datetime-local, debounce not necessary (user picks from UI), but keep immediate.

  const persistDraftDebounced = useDebouncedValue(draftQuery, 600);

  const auditTableRef = useRef<HTMLDivElement>(null);
  const exportTableRef = useRef<HTMLDivElement>(null);
  const qInputRef = useRef<HTMLInputElement>(null);

  const pageSize = initial.pageSize ?? DEFAULT_PAGE_SIZE;

  const auditWindow = useVirtualWindow({ count: rows.length, rowHeight: AUDIT_ROW_HEIGHT, containerRef: auditTableRef });

  const [showActiveExportsOnly, setShowActiveExportsOnly] = useState(false);
  const visibleExportJobs = useMemo(() => {
    const base = exportJobs;
    if (!showActiveExportsOnly) return base;
    return base.filter((j) => j.status === "pending" || j.status === "running");
  }, [exportJobs, showActiveExportsOnly]);

  type FilterChip = { key: keyof QueryState; label: string; value: string };
  const activeFilterChips = useMemo((): FilterChip[] => {
    const chips: FilterChip[] = [];
    if (query.action) chips.push({ key: "action", label: "action", value: query.action });
    if (query.q) chips.push({ key: "q", label: "q", value: query.q });
    if (query.meta) chips.push({ key: "meta", label: "meta", value: "1" });
    if (query.targetUserId) chips.push({ key: "targetUserId", label: "targetUserId", value: query.targetUserId });
    if (query.targetEmail) chips.push({ key: "targetEmail", label: "targetEmail", value: query.targetEmail });
    if (query.resource) chips.push({ key: "resource", label: "resource", value: query.resource });
    if (query.statusCode) chips.push({ key: "statusCode", label: "statusCode", value: query.statusCode });
    if (query.createdAtFrom) chips.push({ key: "createdAtFrom", label: "from", value: new Date(query.createdAtFrom).toLocaleString() });
    if (query.createdAtTo) chips.push({ key: "createdAtTo", label: "to", value: new Date(query.createdAtTo).toLocaleString() });
    return chips;
  }, [
    query.action,
    query.q,
    query.meta,
    query.targetUserId,
    query.targetEmail,
    query.resource,
    query.statusCode,
    query.createdAtFrom,
    query.createdAtTo,
  ]);

  const clearFilterChip = (key: keyof QueryState) => {
    const reset: Partial<QueryState> = { cursor: "", dir: "next" };
    if (key === "meta") reset.meta = false;
    else reset[key] = "" as any;
    setUrlQuery(reset);
  };
  const exportWindow = useVirtualWindow({
    count: visibleExportJobs.length,
    rowHeight: EXPORT_ROW_HEIGHT,
    containerRef: exportTableRef,
  });

  // (canPrev/canNext removed: buttons already use prevCursor/nextCursor + hasMore)

  const syncDraftFromQuery = (q: QueryState) => {
    setActionInput(q.action);
    setQInput(q.q);
    setMetaInput(q.meta);
    setTargetUserIdInput(q.targetUserId);
    setTargetEmailInput(q.targetEmail);
    setResourceInput(q.resource);
    setStatusCodeInput(q.statusCode);
    setCreatedAtFromInput(q.createdAtFrom);
    setCreatedAtToInput(q.createdAtTo);
    setCreatedAtFromLocal(isoToLocalInput(q.createdAtFrom));
    setCreatedAtToLocal(isoToLocalInput(q.createdAtTo));
  };

  useEffect(() => {
    const apply = () => {
      const q = readQueryFromLocation();
      setQuery(q);
      syncDraftFromQuery(q);
    };

    window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore last draft filters if URL is empty (so we don't override explicit links)
  useEffect(() => {
    try {
      const q = readQueryFromLocation();
      const isUrlEmpty =
        !q.action &&
        !q.q &&
        !q.meta &&
        !q.targetUserId &&
        !q.targetEmail &&
        !q.resource &&
        !q.statusCode &&
        !q.createdAtFrom &&
        !q.createdAtTo;
      if (!isUrlEmpty) return;

      const raw = window.localStorage.getItem("auditLogs.lastDraft.v1");
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!isRecord(parsed)) return;
      const dq = parsed.query;
      if (!isRecord(dq)) return;

      const restored: QueryState = {
        action: typeof dq.action === "string" ? dq.action : "",
        q: typeof dq.q === "string" ? dq.q : "",
        meta: typeof dq.meta === "boolean" ? dq.meta : false,
        targetUserId: typeof dq.targetUserId === "string" ? dq.targetUserId : "",
        targetEmail: typeof dq.targetEmail === "string" ? dq.targetEmail : "",
        resource: typeof dq.resource === "string" ? dq.resource : "",
        statusCode: typeof dq.statusCode === "string" ? dq.statusCode : "",
        createdAtFrom: typeof dq.createdAtFrom === "string" ? dq.createdAtFrom : "",
        createdAtTo: typeof dq.createdAtTo === "string" ? dq.createdAtTo : "",
        cursor: "",
        dir: "next",
      };

      // Only restore if something meaningful exists
      const hasAny =
        restored.action ||
        restored.q ||
        restored.meta ||
        restored.targetUserId ||
        restored.targetEmail ||
        restored.resource ||
        restored.statusCode ||
        restored.createdAtFrom ||
        restored.createdAtTo;
      if (!hasAny) return;

      syncDraftFromQuery(restored);
      pushToast("Draft filters restored", "info");
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist last draft filters (debounced)
  useEffect(() => {
    try {
      const payload = {
        savedAt: Date.now(),
        query: {
          action: persistDraftDebounced.action,
          q: persistDraftDebounced.q,
          meta: persistDraftDebounced.meta,
          targetUserId: persistDraftDebounced.targetUserId,
          targetEmail: persistDraftDebounced.targetEmail,
          resource: persistDraftDebounced.resource,
          statusCode: persistDraftDebounced.statusCode,
          createdAtFrom: persistDraftDebounced.createdAtFrom,
          createdAtTo: persistDraftDebounced.createdAtTo,
        },
      };
      window.localStorage.setItem("auditLogs.lastDraft.v1", JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [persistDraftDebounced]);

  const appliedSavedViewId = useMemo(() => {
    const isSame = (a: string, b: string) => a.trim() === b.trim();
    const match = savedViews.find((v) => {
      const q = v.query;
      return (
        isSame(q.action, query.action) &&
        isSame(q.q, query.q) &&
        q.meta === query.meta &&
        isSame(q.targetUserId, query.targetUserId) &&
        isSame(q.targetEmail, query.targetEmail) &&
        isSame(q.resource, query.resource) &&
        isSame(q.statusCode, query.statusCode) &&
        isSame(q.createdAtFrom, query.createdAtFrom) &&
        isSame(q.createdAtTo, query.createdAtTo)
      );
    });
    return match?.id ?? null;
  }, [
    savedViews,
    query.action,
    query.q,
    query.meta,
    query.targetUserId,
    query.targetEmail,
    query.resource,
    query.statusCode,
    query.createdAtFrom,
    query.createdAtTo,
  ]);

  useEffect(() => {
    // Keep active view in sync with currently applied filters when possible
    if (appliedSavedViewId) {
      if (activeSavedViewId !== appliedSavedViewId) setActiveSavedView(appliedSavedViewId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedSavedViewId]);

  // Saved views dropdown: click-outside + Esc to close
  useEffect(() => {
    if (!savedViewsOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      const root = savedViewsRef.current;
      if (!root) return;
      if (!root.contains(e.target as Node)) {
        setSavedViewsOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setSavedViewsOpen(false);
    };
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [savedViewsOpen]);

  const draftQuery = useMemo<QueryState>(() => {
    return {
      action: actionInput,
      q: qInput,
      meta: metaInput,
      targetUserId: targetUserIdInput,
      targetEmail: targetEmailInput,
      resource: resourceInput,
      statusCode: statusCodeInput,
      createdAtFrom: createdAtFromInput,
      createdAtTo: createdAtToInput,
      cursor: "",
      dir: "next",
    };
  }, [
    actionInput,
    qInput,
    metaInput,
    targetUserIdInput,
    targetEmailInput,
    resourceInput,
    statusCodeInput,
    createdAtFromInput,
    createdAtToInput,
  ]);

  const dateRangeError = useMemo(() => {
    if (!createdAtFromInput || !createdAtToInput) return null;
    const from = new Date(createdAtFromInput);
    const to = new Date(createdAtToInput);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
    if (from.getTime() > to.getTime()) return "Range waktu tidak valid: From harus <= To";
    return null;
  }, [createdAtFromInput, createdAtToInput]);

  const isDraftDirty = useMemo(() => {
    const normalize = (s: string) => s.trim();
    const same = (a: string, b: string) => normalize(a) === normalize(b);

    return (
      !same(draftQuery.action, query.action) ||
      !same(draftQuery.q, query.q) ||
      draftQuery.meta !== query.meta ||
      !same(draftQuery.targetUserId, query.targetUserId) ||
      !same(draftQuery.targetEmail, query.targetEmail) ||
      !same(draftQuery.resource, query.resource) ||
      !same(draftQuery.statusCode, query.statusCode) ||
      !same(draftQuery.createdAtFrom, query.createdAtFrom) ||
      !same(draftQuery.createdAtTo, query.createdAtTo)
    );
  }, [draftQuery, query]);

  const applyDraftToUrl = (opts?: { cursor?: string; dir?: QueryState["dir"] }) => {
    if (dateRangeError) {
      pushToast(dateRangeError, "error");
      return;
    }
    lastFocusedElRef.current = document.activeElement as HTMLElement | null;
    setUrlQuery({
      ...draftQuery,
      cursor: opts?.cursor ?? "",
      dir: opts?.dir ?? "next",
    });
  };

  const resetFiltersToQuery = () => {
    syncDraftFromQuery(query);
    pushToast("Draft reset to applied filters", "info");
  };

  const resetAllFilters = () => {
    lastFocusedElRef.current = document.activeElement as HTMLElement | null;
    setUrlQuery({
      action: "",
      q: "",
      meta: false,
      targetUserId: "",
      targetEmail: "",
      resource: "",
      statusCode: "",
      createdAtFrom: "",
      createdAtTo: "",
      cursor: "",
      dir: "next",
    });
  };

  const applySavedView = (view: SavedView, opts?: { applyNow?: boolean }) => {
    setActionInput(view.query.action);
    setQInput(view.query.q);
    setMetaInput(view.query.meta);
    setTargetUserIdInput(view.query.targetUserId);
    setTargetEmailInput(view.query.targetEmail);
    setResourceInput(view.query.resource);
    setStatusCodeInput(view.query.statusCode);
    setCreatedAtFromInput(view.query.createdAtFrom);
    setCreatedAtToInput(view.query.createdAtTo);
    setCreatedAtFromLocal(isoToLocalInput(view.query.createdAtFrom));
    setCreatedAtToLocal(isoToLocalInput(view.query.createdAtTo));

    if (opts?.applyNow) {
      setUrlQuery({ ...view.query, cursor: "", dir: "next" });
    }

    pushToast(`Loaded view: ${view.name}`, "success");
  };

  const saveCurrentDraftAsView = () => {
    setViewsModal({ kind: "save", initialName: "" });
    setViewsModalName("");
  };

  const requestDeleteSavedView = (id: string) => {
    setViewsModal({ kind: "delete", id });
    setViewsModalName("");
  };

  const requestUpdateSavedView = (id: string) => {
    setViewsModal({ kind: "update", id });
    setViewsModalName("");
  };

  const confirmSaveView = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      pushToast("Name required", "error");
      return;
    }

    const view: SavedView = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: trimmed,
      createdAt: Date.now(),
      query: {
        action: draftQuery.action,
        q: draftQuery.q,
        meta: draftQuery.meta,
        targetUserId: draftQuery.targetUserId,
        targetEmail: draftQuery.targetEmail,
        resource: draftQuery.resource,
        statusCode: draftQuery.statusCode,
        createdAtFrom: draftQuery.createdAtFrom,
        createdAtTo: draftQuery.createdAtTo,
      },
    };

    const next = [view, ...savedViews].slice(0, 30);
    persistSavedViews(next);
    setViewsModal(null);
    pushToast("View saved", "success");
  };

  const confirmDeleteView = (id: string) => {
    persistSavedViews(savedViews.filter((x) => x.id !== id));
    if (activeSavedViewId === id) setActiveSavedView(null);
    setViewsModal(null);
    pushToast("View deleted", "info");
  };

  const confirmUpdateView = (id: string) => {
    const idx = savedViews.findIndex((x) => x.id === id);
    if (idx === -1) {
      setViewsModal(null);
      return;
    }
    const updated: SavedView = {
      ...savedViews[idx],
      query: {
        action: draftQuery.action,
        q: draftQuery.q,
        meta: draftQuery.meta,
        targetUserId: draftQuery.targetUserId,
        targetEmail: draftQuery.targetEmail,
        resource: draftQuery.resource,
        statusCode: draftQuery.statusCode,
        createdAtFrom: draftQuery.createdAtFrom,
        createdAtTo: draftQuery.createdAtTo,
      },
    };

    const next = [...savedViews];
    next[idx] = updated;
    persistSavedViews(next);
    setViewsModal(null);
    pushToast("View updated", "success");
  };

  const renameSavedView = (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const idx = savedViews.findIndex((v) => v.id === id);
    if (idx === -1) return;
    const next = [...savedViews];
    next[idx] = { ...next[idx], name: trimmed };
    persistSavedViews(next);
  };

  const moveSavedView = (id: string, dir: -1 | 1) => {
    const idx = savedViews.findIndex((v) => v.id === id);
    const j = idx + dir;
    if (idx === -1 || j < 0 || j >= savedViews.length) return;
    const next = [...savedViews];
    const tmp = next[idx];
    next[idx] = next[j];
    next[j] = tmp;
    persistSavedViews(next);
  };

  const exportSavedViewsJson = async () => {
    const text = JSON.stringify(savedViews, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      pushToast("Views JSON copied", "success");
    } catch {
      // fallback download
      const blob = new Blob([text], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-views-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      pushToast("Download started", "success");
    }
  };

  const importSavedViewsJsonFromText = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    try {
      setManageViewsImportStatus(null);
      const parsed = JSON.parse(trimmed) as unknown;
      if (!Array.isArray(parsed)) {
        pushToast("Invalid JSON: expected array", "error");
        return;
      }
      const incoming: SavedView[] = [];
      for (const item of parsed) {
        if (!isRecord(item)) continue;
        const id = typeof item.id === "string" ? item.id : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const name = typeof item.name === "string" ? item.name : "Imported";
        const createdAt = typeof item.createdAt === "number" ? item.createdAt : Date.now();
        const q = isRecord(item.query) ? item.query : {};
        incoming.push({
          id,
          name,
          createdAt,
          query: {
            action: typeof q.action === "string" ? q.action : "",
            q: typeof q.q === "string" ? q.q : "",
            meta: typeof q.meta === "boolean" ? q.meta : false,
            targetUserId: typeof q.targetUserId === "string" ? q.targetUserId : "",
            targetEmail: typeof q.targetEmail === "string" ? q.targetEmail : "",
            resource: typeof q.resource === "string" ? q.resource : "",
            statusCode: typeof q.statusCode === "string" ? q.statusCode : "",
            createdAtFrom: typeof q.createdAtFrom === "string" ? q.createdAtFrom : "",
            createdAtTo: typeof q.createdAtTo === "string" ? q.createdAtTo : "",
          },
        });
      }

      if (!incoming.length) {
        pushToast("No valid views found in JSON", "error");
        return;
      }

      // Validate duplicates inside incoming
      const ids = new Set<string>();
      const names = new Set<string>();
      const dupIds: string[] = [];
      const dupNames: string[] = [];
      for (const v of incoming) {
        if (ids.has(v.id)) dupIds.push(v.id);
        ids.add(v.id);
        const key = v.name.trim().toLowerCase();
        if (key && names.has(key)) dupNames.push(v.name);
        if (key) names.add(key);
      }
      if (dupIds.length) {
        pushToast(`Duplicate ids in import: ${Array.from(new Set(dupIds)).slice(0, 5).join(", ")}`, "error");
        return;
      }
      if (dupNames.length) {
        pushToast(`Duplicate names in import: ${Array.from(new Set(dupNames)).slice(0, 5).join(", ")}`, "error");
        return;
      }

      // Validate collisions with existing (names) in replace mode only as warning
      if (manageViewsImportMode === "merge") {
        const existingNames = new Set(savedViews.map((v) => v.name.trim().toLowerCase()).filter(Boolean));
        const colliding = incoming.filter((v) => existingNames.has(v.name.trim().toLowerCase())).map((v) => v.name);
        if (colliding.length) {
          pushToast(`Name collision (merge): ${Array.from(new Set(colliding)).slice(0, 5).join(", ")}`, "info");
        }
      }

      let next: SavedView[];
      if (manageViewsImportMode === "replace") {
        next = incoming;
      } else {
        // merge by id (incoming first)
        const map = new Map<string, SavedView>();
        for (const v of incoming) map.set(v.id, v);
        for (const v of savedViews) if (!map.has(v.id)) map.set(v.id, v);
        next = Array.from(map.values());
      }

      next = next.slice(0, 30);

      const existingById = new Map(savedViews.map((v) => [v.id, v] as const));
      const newItems = incoming.filter((v) => !existingById.has(v.id)).map((v) => `${v.name} (${v.id})`);
      const overwriteItems = incoming.filter((v) => existingById.has(v.id)).map((v) => `${v.name} (${v.id})`);
      const removedItems =
        manageViewsImportMode === "replace"
          ? savedViews
              .filter((v) => !incoming.some((x) => x.id === v.id))
              .map((v) => `${v.name} (${v.id})`)
          : [];

      const newCount = newItems.length;
      const overwriteCount = overwriteItems.length;
      const removedCount = removedItems.length;

      const summary = `Incoming: ${incoming.length}. Mode: ${manageViewsImportMode}. Result: ${next.length} views.`;
      setPendingImport({
        mode: manageViewsImportMode,
        incoming,
        summary,
        stats: { incoming: incoming.length, result: next.length, newCount, overwriteCount, removedCount },
        samples: {
          newItems: newItems.slice(0, 5),
          overwriteItems: overwriteItems.slice(0, 5),
          removedItems: removedItems.slice(0, 5),
        },
      });
      setManageViewsImportStatus({ kind: "ok", message: "Parsed OK. Review confirmation panel then Apply import." });
    } catch {
      setManageViewsImportStatus({ kind: "error", message: "Invalid JSON" });
      pushToast("Invalid JSON", "error");
    }
  };

  const importSavedViewsJson = () => {
    importSavedViewsJsonFromText(manageViewsImportText);
  };

  const confirmImportSavedViews = () => {
    if (!pendingImport) return;
    const incoming = pendingImport.incoming;
    let next: SavedView[];

    if (pendingImport.mode === "replace") {
      next = incoming;
    } else {
      const map = new Map<string, SavedView>();
      for (const v of incoming) map.set(v.id, v);
      for (const v of savedViews) if (!map.has(v.id)) map.set(v.id, v);
      next = Array.from(map.values());
    }

    next = next.slice(0, 30);
    persistSavedViews(next);
    setManageViewsNameDrafts(Object.fromEntries(next.map((v) => [v.id, v.name])));
    setManageViewsImportText("");
    setPendingImport(null);
    pushToast(`Views imported (${pendingImport.mode})`, "success");
  };

  const bulkDeleteSelectedViews = () => {
    const ids = Object.entries(manageViewsSelected)
      .filter(([, v]) => v)
      .map(([id]) => id);
    if (!ids.length) return;
    const remaining = savedViews.filter((v) => !ids.includes(v.id));
    persistSavedViews(remaining);
    setManageViewsSelected({});
    if (activeSavedViewId && ids.includes(activeSavedViewId)) setActiveSavedView(null);
    pushToast("Selected views deleted", "info");
  };

  const saveAllDirtyViewNames = () => {
    const updates: Array<{ id: string; name: string }> = [];
    for (const v of savedViews) {
      const draft = (manageViewsNameDrafts[v.id] ?? v.name).trim();
      if (draft && draft !== v.name.trim()) updates.push({ id: v.id, name: draft });
    }
    if (!updates.length) return;

    const next = [...savedViews];
    for (const u of updates) {
      const idx = next.findIndex((x) => x.id === u.id);
      if (idx !== -1) next[idx] = { ...next[idx], name: u.name };
    }
    persistSavedViews(next);
    pushToast(`Saved ${updates.length} view name(s)`, "success");
  };

  const revertAllViewNameDrafts = () => {
    setManageViewsNameDrafts(Object.fromEntries(savedViews.map((v) => [v.id, v.name])));
    pushToast("Draft names reverted", "info");
  };

  useEffect(() => {
    if (!autoApply) return;
    if (dateRangeError) return;
    // Use debounced values for typing fields to reduce URL churn.
    setUrlQuery({
      action: debouncedActionInput,
      q: debouncedQInput,
      meta: metaInput,
      targetUserId: debouncedTargetUserIdInput,
      targetEmail: debouncedTargetEmailInput,
      resource: debouncedResourceInput,
      statusCode: debouncedStatusCodeInput,
      createdAtFrom: createdAtFromInput,
      createdAtTo: createdAtToInput,
      cursor: "",
      dir: "next",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    autoApply,
    dateRangeError,
    debouncedActionInput,
    debouncedQInput,
    metaInput,
    debouncedTargetUserIdInput,
    debouncedTargetEmailInput,
    debouncedResourceInput,
    debouncedStatusCodeInput,
    createdAtFromInput,
    createdAtToInput,
  ]);

  // Keep the expanded row visible inside the scroll container
  useEffect(() => {
    if (!expandedId) return;
    const container = auditTableRef.current;
    const rowEl = document.getElementById(`audit-row-${expandedId}`);
    if (!container || !rowEl) return;

    const cTop = container.scrollTop;
    const cBottom = cTop + container.clientHeight;

    // rowEl.offsetTop is relative to offsetParent; in a simple table container it maps well.
    const rTop = rowEl.offsetTop;
    const rBottom = rTop + rowEl.clientHeight;

    if (rTop < cTop) {
      container.scrollTo({ top: Math.max(0, rTop - AUDIT_ROW_HEIGHT), behavior: "smooth" });
    } else if (rBottom > cBottom) {
      container.scrollTo({ top: Math.max(0, rBottom - container.clientHeight + AUDIT_ROW_HEIGHT), behavior: "smooth" });
    }
  }, [expandedId]);

  // Close export job drawer on Esc
  useEffect(() => {
    if (!jobDetailId) return;
    const key = exportJobDrawerKeyRef.current;
    pushOverlay(key);
    return () => removeOverlay(key);
  }, [jobDetailId]);

  useEffect(() => {
    if (!jobDetailId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const top = getTopOverlayKey();
      if (top && top !== exportJobDrawerKeyRef.current) return;
      e.preventDefault();
      setJobDetailId(null);
      setJobDetail(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [jobDetailId]);

  // Lock scroll when meta drawer is open and register into overlay stack
  useEffect(() => {
    if (!expandedId) return;

    // Register in the same stack as Dialog so topmost behavior is consistent.
    const key = metaDrawerKeyRef.current;
    pushOverlay(key);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      removeOverlay(key);
    };
  }, [expandedId]);

  // Meta drawer: focus management + Esc
  useEffect(() => {
    if (!expandedId) return;

    // Store last focused element (if not already stored by openAuditLog/applyDraftToUrl)
    if (!lastFocusedElRef.current) {
      lastFocusedElRef.current = document.activeElement as HTMLElement | null;
    }

    const t = window.setTimeout(() => {
      // Prefer focusing the first actionable element
      focusFirstInMetaDrawer();
    }, 0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // If any overlay (dialog or drawer) is on top, let it handle ESC.
      const top = getTopOverlayKey();
      if (top && top !== metaDrawerKeyRef.current) return;
      e.preventDefault();
      closeMetaDrawer();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [expandedId]);

  // Restore focus when meta drawer closes
  useEffect(() => {
    if (expandedId) return;
    const el = lastFocusedElRef.current;
    if (el) {
      window.setTimeout(() => el.focus(), 0);
    }
    lastFocusedElRef.current = null;
  }, [expandedId]);

  const shortcuts = useMemo(
    () =>
      [
        { action: "Search", key: "/", category: "Search" as const },
        { action: "Close Selected log", key: "Esc", category: "UI" as const },
        { action: "Next / Prev page", key: "n / p", category: "Navigation" as const },
        { action: "Locate selected row", key: "l", category: "Navigation" as const },
        { action: "Help", key: "?", category: "UI" as const },
        { action: "Export CSV", key: "e", category: "Export" as const },
        { action: "Reload data", key: "r", category: "UI" as const },
        { action: "Toggle export jobs", key: "j", category: "UI" as const },
      ] as const,
    []
  );

  const conflictKeySet = useMemo(() => new Set(shortcutConflicts.map((c) => c.key)), [shortcutConflicts]);

  useEffect(() => {
    if (!showOnlyConflicts) return;
    if (!shortcutConflicts.length) return;
    setShowConflictsPanel(true);
  }, [showOnlyConflicts, shortcutConflicts.length]);

  const filteredShortcuts = useMemo(() => {
    const q = shortcutsSearch.trim().toLowerCase();
    return shortcuts.filter((s) => {
      const catOk = shortcutsCategory === "All" ? true : s.category === shortcutsCategory;
      if (!catOk) return false;

      if (showOnlyConflicts) {
        const hasConflict = splitAlternatives(s.key).some((alt) => conflictKeySet.has(canonicalizeShortcutCombo(alt)));
        if (!hasConflict) return false;
      }

      if (!q) return true;
      return `${s.action} ${s.key} ${s.category}`.toLowerCase().includes(q);
    });
  }, [shortcuts, shortcutsSearch, shortcutsCategory, showOnlyConflicts, conflictKeySet]);

  useEffect(() => {
    if (!showShortcutsHelp) return;

    const normalize = (k: string) => {
      if (k === "Escape") return "esc";
      if (k === "Control") return "ctrl";
      if (k === "Alt") return "alt";
      if (k === "Shift") return "shift";
      if (k === "Meta") return "cmd";
      if (k === " ") return "space";
      return k.length === 1 ? k.toLowerCase() : k.toLowerCase();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      setPressedKeys((prev) => {
        const next = new Set(prev);
        next.add(normalize(e.key));
        return next;
      });
    };

    const onKeyUp = (e: KeyboardEvent) => {
      setPressedKeys((prev) => {
        const next = new Set(prev);
        next.delete(normalize(e.key));
        return next;
      });
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // Live refresh for relative timestamps
    const t = window.setInterval(() => {
      // force rerender for relative time labels
      setNowTick((v) => v + 1);
    }, 30_000);

    return () => {
      window.clearInterval(t);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      setPressedKeys(new Set());
    };
  }, [showShortcutsHelp]);

  const normalizeShortcutKey = (k: string) => {
    const t = k.trim();
    if (!t) return "";
    const lower = t.toLowerCase();
    if (lower === "escape" || lower === "esc") return "esc";
    if (lower === "control" || lower === "ctrl") return "ctrl";
    if (lower === "meta" || lower === "cmd" || lower === "command") return "cmd";
    if (lower === "alt" || lower === "option") return "alt";
    if (lower === "shift") return "shift";
    if (lower === "space" || lower === " ") return "space";
    return lower;
  };

  const canonicalizeShortcutCombo = (key: string) => {
    // Normalize combos like "Ctrl+K" -> "ctrl+k"
    const parts = key
      .split("+")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => normalizeShortcutKey(p));
    return parts.join("+");
  };

  const splitAlternatives = (key: string) => {
    // alternatives are expressed as "a / b" in this UI
    return key
      .split("/")
      .map((x) => x.trim())
      .filter(Boolean);
  };

  const shortcutConflicts = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const s of shortcuts) {
      for (const alt of splitAlternatives(s.key)) {
        const nk = canonicalizeShortcutCombo(alt);
        if (!nk) continue;
        const arr = map.get(nk) ?? [];
        arr.push(s.action);
        map.set(nk, arr);
      }
    }
    const conflicts = Array.from(map.entries())
      .filter(([, actions]) => new Set(actions).size > 1)
      .map(([key, actions]) => ({ key, actions: Array.from(new Set(actions)) }));
    return conflicts;
  }, [shortcuts]);

  const usedCanonicalKeys = useMemo(() => {
    const set = new Set<string>();
    for (const s of shortcuts) {
      for (const alt of splitAlternatives(s.key)) {
        const nk = canonicalizeShortcutCombo(alt);
        if (nk) set.add(nk);
      }
    }
    return set;
  }, [shortcuts]);

  const buildBugReportData = () => {
    const usedKeysArr = Array.from(usedCanonicalKeys).sort();
    const base: Record<string, unknown> = {
      time: new Date().toISOString(),
      lastTemplate: lastCopiedTemplate,
    };

    if (bugReportIncludeConflicts) base.conflicts = shortcutConflicts;
    if (bugReportIncludeUsedKeys) base.usedCanonicalKeys = usedKeysArr;

    return base;
  };

  const buildBugReportText = () => {
    const data = buildBugReportData();
    const lines: string[] = [];
    lines.push("Audit Logs Shortcuts Bug Report");
    lines.push(`Time: ${data.time}`);
    lines.push("");
    lines.push("Last template:");
    lines.push(data.lastTemplate ?? "-");

    if (bugReportIncludeConflicts) {
      lines.push("");
      lines.push("Conflicts:");
      lines.push(data.conflicts.length ? data.conflicts.map((c) => `${c.key}: ${c.actions.join(", ")}`).join("\n") : "(no conflicts)");
    }

    if (bugReportIncludeUsedKeys) {
      lines.push("");
      lines.push("Used canonical keys:");
      lines.push(data.usedCanonicalKeys.join(", "));
    }

    return lines.join("\n");
  };

  const selectedConflictCategory = useMemo(() => {
    if (!conflictActionChoice) return null;
    const found = shortcuts.find((s) => s.action === conflictActionChoice);
    return found?.category ?? null;
  }, [conflictActionChoice, shortcuts]);

  const suggestedUnusedKeys = useMemo(() => {
    // Candidate pools per category (avoid browser/common reserved combos)
    const pools: Record<string, string[]> = {
      Navigation: ["[", "]", "-", "=", "ctrl+shift+n", "ctrl+shift+p", "cmd+shift+n", "cmd+shift+p"],
      Export: ["ctrl+e", "ctrl+shift+e", "cmd+e", "cmd+shift+e"],
      Search: ["ctrl+k", "ctrl+shift+k", "cmd+k", "cmd+shift+k"],
      UI: ["g", "h", "i", "m", "o", "u", "v", "w", "x", "y", "z"],
      All: ["a", "b", "c", "d", "g", "h", "i", "k", "m", "o", "t", "u", "v", "w", "x", "y", "z"],
    };

    const base = selectedConflictCategory ? pools[selectedConflictCategory] ?? pools.All : pools.All;
    const cleaned = base.map((k) => canonicalizeShortcutCombo(k));
    return cleaned.filter((c) => c && !usedCanonicalKeys.has(c)).slice(0, 10);
  }, [usedCanonicalKeys, selectedConflictCategory]);

  useEffect(() => {
    // Keep suggested key selection in sync
    if (!conflictSuggestedKey || !suggestedUnusedKeys.includes(conflictSuggestedKey)) {
      setConflictSuggestedKey(suggestedUnusedKeys[0] ?? "");
    }
  }, [suggestedUnusedKeys, conflictSuggestedKey]);

  useEffect(() => {
    if (!showShortcutsHelp) return;
    try {
      const raw = window.localStorage.getItem("auditLogs.shortcutsSearch");
      if (raw != null) setShortcutsSearch(raw);
      const cat = window.localStorage.getItem("auditLogs.shortcutsCategory");
      if (cat && ["All", "Navigation", "Export", "UI", "Search"].includes(cat)) {
        setShortcutsCategory(cat as any);
      }
      // Backward compatible restore
      const lastKey = window.localStorage.getItem("auditLogs.lastCopiedKey");
      const lastKeyAt = window.localStorage.getItem("auditLogs.lastCopiedKeyAt");
      const lastTemplate = window.localStorage.getItem("auditLogs.lastCopiedTemplate");
      const lastTemplateAt = window.localStorage.getItem("auditLogs.lastCopiedTemplateAt");
      if (lastKey) setLastCopiedKey(lastKey);
      if (lastKeyAt && !Number.isNaN(Number(lastKeyAt))) setLastCopiedKeyAt(Number(lastKeyAt));
      if (lastTemplate) setLastCopiedTemplate(lastTemplate);
      if (lastTemplateAt && !Number.isNaN(Number(lastTemplateAt))) setLastCopiedTemplateAt(Number(lastTemplateAt));

      const legacy = window.localStorage.getItem("auditLogs.lastCopiedSuggestion");
      if (legacy) {
        // best-effort migration
        if (legacy.startsWith("Copied key:")) {
          setLastCopiedKey(legacy.replace(/^Copied key:\s*/, "").trim());
          setLastCopiedKeyAt(Date.now());
        } else {
          setLastCopiedTemplate(legacy);
          setLastCopiedTemplateAt(Date.now());
        }
      }

      const savedAction = window.localStorage.getItem("auditLogs.conflictActionChoice");
      if (savedAction) setConflictActionChoice(savedAction);
      const savedKey = window.localStorage.getItem("auditLogs.conflictSuggestedKey");
      if (savedKey) setConflictSuggestedKey(savedKey);

      const savedPanel = window.localStorage.getItem("auditLogs.showConflictsPanel");
      if (savedPanel === "true" && showOnlyConflicts) setShowConflictsPanel(true);

      const pm = window.localStorage.getItem("auditLogs.reportPreviewMode");
      if (pm && ["text", "json", "issue", "markdown"].includes(pm)) setReportPreviewMode(pm as any);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showShortcutsHelp]);

  useEffect(() => {
    try {
      window.localStorage.setItem("auditLogs.shortcutsSearch", shortcutsSearch);
    } catch {
      // ignore
    }
  }, [shortcutsSearch]);

  useEffect(() => {
    try {
      window.localStorage.setItem("auditLogs.shortcutsCategory", shortcutsCategory);
    } catch {
      // ignore
    }
  }, [shortcutsCategory]);

  useEffect(() => {
    try {
      if (lastCopiedKey) window.localStorage.setItem("auditLogs.lastCopiedKey", lastCopiedKey);
      if (lastCopiedKeyAt) window.localStorage.setItem("auditLogs.lastCopiedKeyAt", String(lastCopiedKeyAt));
      if (lastCopiedTemplate) window.localStorage.setItem("auditLogs.lastCopiedTemplate", lastCopiedTemplate);
      if (lastCopiedTemplateAt) window.localStorage.setItem("auditLogs.lastCopiedTemplateAt", String(lastCopiedTemplateAt));
    } catch {
      // ignore
    }
  }, [lastCopiedKey, lastCopiedKeyAt, lastCopiedTemplate, lastCopiedTemplateAt]);

  useEffect(() => {
    try {
      window.localStorage.setItem("auditLogs.conflictActionChoice", conflictActionChoice);
    } catch {
      // ignore
    }
  }, [conflictActionChoice]);

  useEffect(() => {
    try {
      window.localStorage.setItem("auditLogs.conflictSuggestedKey", conflictSuggestedKey);
    } catch {
      // ignore
    }
  }, [conflictSuggestedKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem("auditLogs.showConflictsPanel", String(showConflictsPanel));
    } catch {
      // ignore
    }
  }, [showConflictsPanel]);

  useEffect(() => {
    try {
      window.localStorage.setItem("auditLogs.reportPreviewMode", reportPreviewMode);
    } catch {
      // ignore
    }
  }, [reportPreviewMode]);

  useEffect(() => {
    try {
      window.localStorage.setItem("auditLogs.reportPreviewMode", reportPreviewMode);
    } catch {
      // ignore
    }
  }, [reportPreviewMode]);

  // Keyboard shortcuts
  // - '/' focuses q search
  // - Esc closes selected log panel
  // - n/p go Next/Prev page (when available)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTypingTarget =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        (target && (target as any).isContentEditable);

      if (e.key === "/" && !isTypingTarget) {
        e.preventDefault();
        qInputRef.current?.focus();
        return;
      }

      if (e.key === "Escape") {
        if (showShortcutsHelp) {
          e.preventDefault();
          setShowShortcutsHelp(false);
          return;
        }
        if (expandedId) {
          e.preventDefault();
          closeMetaDrawer();
        }
        return;
      }

      if (isTypingTarget) return;

      if ((e.key === "n" || e.key === "N") && nextCursor && hasMore && !isLoading) {
        e.preventDefault();
        setUrlQuery({ cursor: nextCursor, dir: "next" });
        return;
      }

      if ((e.key === "p" || e.key === "P") && prevCursor && !isLoading) {
        e.preventDefault();
        setUrlQuery({ cursor: prevCursor, dir: "prev" });
        return;
      }

      if ((e.key === "l" || e.key === "L") && expandedId) {
        e.preventDefault();
        const container = auditTableRef.current;
        const rowEl = document.getElementById(`audit-row-${expandedId}`);
        if (container && rowEl) {
          container.scrollTo({ top: Math.max(0, rowEl.offsetTop - AUDIT_ROW_HEIGHT), behavior: "smooth" });
        }
        return;
      }

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShowShortcutsHelp(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expandedId, hasMore, isLoading, nextCursor, prevCursor]);

  const loadExportJobs = async (opts?: { cursor?: string; append?: boolean }) => {
    const url = new URL("/api/admin/audit-logs/exports", window.location.origin);
    if (opts?.cursor) url.searchParams.set("cursor", opts.cursor);
    const res = await fetch(url.toString());
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (!res.ok) return;
    const body = (await res.json().catch(() => null)) as unknown;
    const record = isRecord(body) ? body : null;
    const jobs = Array.isArray(record?.jobs) ? (record.jobs as ExportJob[]) : [];
    const hasMore = Boolean(record?.hasMore);
    const nextCursor = typeof record?.nextCursor === "string" ? record.nextCursor : null;

    setExportsHasMore(hasMore);
    setExportsNextCursor(nextCursor);

    const sortJobs = (arr: ExportJob[]) => {
      const prio = (s: ExportJob["status"]) => {
        if (s === "running") return 0;
        if (s === "pending") return 1;
        if (s === "failed") return 2;
        if (s === "completed") return 3;
        return 4; // cancelled
      };
      return arr.slice().sort((a, b) => {
        const p = prio(a.status) - prio(b.status);
        if (p !== 0) return p;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    };

    if (opts?.append) {
      setExportJobs((prev) => sortJobs([...prev, ...jobs]));
    } else {
      setExportJobs(sortJobs(jobs));
    }
  };

  useEffect(() => {
    void loadExportJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll while there are pending/running jobs (only refresh first page).
  useEffect(() => {
    const hasActive = exportJobs.some((j) => j.status === "pending" || j.status === "running");
    if (!hasActive) return;

    const t = window.setInterval(() => {
      void loadExportJobs();
    }, 3000);

    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportJobs]);

  const setUrlQuery = (next: Partial<QueryState>) => {
    const merged: QueryState = {
      action: typeof next.action === "string" ? next.action : query.action,
      q: typeof next.q === "string" ? next.q : query.q,
      meta: typeof next.meta === "boolean" ? next.meta : query.meta,
      targetUserId: typeof next.targetUserId === "string" ? next.targetUserId : query.targetUserId,
      targetEmail: typeof next.targetEmail === "string" ? next.targetEmail : query.targetEmail,
      resource: typeof next.resource === "string" ? next.resource : query.resource,
      statusCode: typeof next.statusCode === "string" ? next.statusCode : query.statusCode,
      createdAtFrom: typeof next.createdAtFrom === "string" ? next.createdAtFrom : query.createdAtFrom,
      createdAtTo: typeof next.createdAtTo === "string" ? next.createdAtTo : query.createdAtTo,
      cursor: typeof next.cursor === "string" ? next.cursor : query.cursor,
      dir: next.dir === "prev" || next.dir === "next" ? next.dir : query.dir,
    };
    router.replace(`/admin/audit-logs${buildSearch(merged)}`);
    setQuery(merged);
  };

  useEffect(() => {
    let mounted = true;

    if (
      query.action === initial.query.action &&
      query.q === initial.query.q &&
      query.meta === initial.query.meta &&
      query.targetUserId === initial.query.targetUserId &&
      query.targetEmail === initial.query.targetEmail &&
      query.resource === initial.query.resource &&
      query.statusCode === initial.query.statusCode &&
      query.createdAtFrom === initial.query.createdAtFrom &&
      query.createdAtTo === initial.query.createdAtTo &&
      query.cursor === initial.query.cursor &&
      query.dir === initial.query.dir
    ) {
      return;
    }

    void (async () => {
      const started = typeof performance !== "undefined" ? performance.now() : Date.now();
      setIsLoading(true);
      setError(null);

      const url = new URL("/api/admin/audit-logs", window.location.origin);
      setLastAuditErrorPayload(null);
      if (query.action) url.searchParams.set("action", query.action);
      if (query.q) url.searchParams.set("q", query.q);
      if (query.meta) url.searchParams.set("meta", "1");
      if (query.targetUserId) url.searchParams.set("targetUserId", query.targetUserId);
      if (query.targetEmail) url.searchParams.set("targetEmail", query.targetEmail);
      if (query.resource) url.searchParams.set("resource", query.resource);
      if (query.statusCode) url.searchParams.set("statusCode", query.statusCode);
      if (query.createdAtFrom) url.searchParams.set("createdAtFrom", query.createdAtFrom);
      if (query.createdAtTo) url.searchParams.set("createdAtTo", query.createdAtTo);
      if (query.cursor) url.searchParams.set("cursor", query.cursor);
      if (query.dir !== "next") url.searchParams.set("dir", query.dir);
      url.searchParams.set("pageSize", String(pageSize));
      // ask total only on first page load (no cursor) to avoid expensive count each time
      if (!query.cursor) url.searchParams.set("total", "1");
      // default: do NOT include full meta payload
      // url.searchParams.set("includeMeta", "1");

      const requestUrl = url.toString();
      setLastAuditRequestUrl(requestUrl);
      const res = await fetch(requestUrl);
      if (!mounted) return;

      setLastFetchStatus(res.status);
      setLastFetchedAt(Date.now());
      const ended = typeof performance !== "undefined" ? performance.now() : Date.now();
      setLastFetchDurationMs(Math.max(0, Math.round(ended - started)));

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        const bodyText = await res.text().catch(() => "");
        setLastAuditErrorPayload(bodyText || null);
        setError("Forbidden: kamu tidak punya akses admin.");
        setRows([]);
        setTotal(0);
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        const bodyText = await res.text().catch(() => "");
        setLastAuditErrorPayload(bodyText || null);
        setError(`Request failed: ${res.status}`);
        setRows([]);
        setIsLoading(false);
        return;
      }

      const data = (await res.json().catch(() => null)) as ApiResponse | null;
      setRows(Array.isArray(data?.logs) ? data!.logs : []);
      setTotal(typeof data?.total === "number" ? data.total : null);
      setHasMore(Boolean(data?.hasMore));
      setNextCursor(typeof data?.nextCursor === "string" ? data.nextCursor : null);
      setPrevCursor(typeof data?.prevCursor === "string" ? data.prevCursor : null);
      setIsLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [
    query.action,
    query.q,
    query.meta,
    query.targetUserId,
    query.targetEmail,
    query.resource,
    query.statusCode,
    query.createdAtFrom,
    query.createdAtTo,
    query.cursor,
    query.dir,
    pageSize,
    router,
    initial.query.action,
    initial.query.q,
    initial.query.meta,
    initial.query.targetUserId,
    initial.query.targetEmail,
    initial.query.resource,
    initial.query.statusCode,
    initial.query.createdAtFrom,
    initial.query.createdAtTo,
    initial.query.cursor,
    initial.query.dir,
    reloadTick,
  ]);

  return (
    <div className="card">
      <Dialog open={Boolean(viewsModal)} title="Saved view" onClose={() => setViewsModal(null)}>
        {viewsModal?.kind === "save" ? (
                <>
                  <h4 style={{ margin: "0 0 10px" }}>Save view</h4>
                  <label style={{ display: "block", fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Name</label>
                  <input
                    autoFocus
                    value={viewsModalName}
                    onChange={(e) => setViewsModalName(e.target.value)}
                    placeholder="e.g. Auth errors last 24h"
                    style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)" }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                    <button className="secondary-btn" onClick={() => setViewsModal(null)}>
                      Cancel
                    </button>
                    <button className="primary-btn" onClick={() => confirmSaveView(viewsModalName)} disabled={Boolean(dateRangeError)}>
                      Save
                    </button>
                  </div>
                </>
              ) : null}

        {viewsModal?.kind === "delete" ? (
                <>
                  <h4 style={{ margin: "0 0 10px" }}>Delete view</h4>
                  <p style={{ margin: "0 0 12px", fontSize: 13 }}>
                    Delete <b>{savedViews.find((v) => v.id === viewsModal.id)?.name ?? viewsModal.id}</b>?
                  </p>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <button className="secondary-btn" onClick={() => setViewsModal(null)}>
                      Cancel
                    </button>
                    <button className="primary-btn" onClick={() => confirmDeleteView(viewsModal.id)} style={{ background: "#b00020" }}>
                      Delete
                    </button>
                  </div>
                </>
              ) : null}

        {viewsModal?.kind === "update" ? (
                <>
                  <h4 style={{ margin: "0 0 10px" }}>Update view</h4>
                  <p style={{ margin: "0 0 12px", fontSize: 13 }}>
                    Overwrite <b>{savedViews.find((v) => v.id === viewsModal.id)?.name ?? viewsModal.id}</b> with current draft filters?
                  </p>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <button className="secondary-btn" onClick={() => setViewsModal(null)}>
                      Cancel
                    </button>
                    <button className="primary-btn" onClick={() => confirmUpdateView(viewsModal.id)} disabled={Boolean(dateRangeError)}>
                      Update
                    </button>
                  </div>
                </>
              ) : null}
      </Dialog>

     <Dialog open={manageViewsOpen} title="Manage saved views" onClose={() => setManageViewsOpen(false)}>
       <div className="btn-row btn-row--between" style={{ marginBottom: 10 }}>
         <h4 style={{ margin: 0 }}>Manage saved views</h4>
         <div className="btn-row">
           <button className="secondary-btn" onClick={() => saveAllDirtyViewNames()} title="Save all dirty name edits">
             Save all dirty
           </button>
           <button className="secondary-btn" onClick={() => revertAllViewNameDrafts()} title="Revert all name edits">
             Revert all
           </button>
           <button className="secondary-btn" onClick={() => void exportSavedViewsJson()}>
             Export JSON
           </button>
           <button
             className="secondary-btn"
             onClick={() => {
               const text = JSON.stringify(savedViews, null, 2);
               const blob = new Blob([text], { type: "application/json;charset=utf-8" });
               const url = URL.createObjectURL(blob);
               const a = document.createElement("a");
               a.href = url;
               a.download = `audit-log-views-${new Date().toISOString().slice(0, 10)}.json`;
               document.body.appendChild(a);
               a.click();
               a.remove();
               URL.revokeObjectURL(url);
             }}
             title="Download saved views JSON file"
           >
             Export file
           </button>
           <button
             className="secondary-btn"
             onClick={() => manageViewsImportFileRef.current?.click()}
             title="Import saved views from a .json file"
           >
             Import file
           </button>
           <input
             ref={manageViewsImportFileRef}
             type="file"
             accept="application/json,.json"
             style={{ display: "none" }}
             onChange={(e) => {
               const f = e.target.files?.[0];
               if (!f) return;
               setManageViewsImportFileName(f.name);
               setManageViewsImportStatus(null);
               const reader = new FileReader();
               reader.onload = () => {
                 const text = String(reader.result ?? "");
                 setManageViewsImportText(text);
                 importSavedViewsJsonFromText(text);
               };
               reader.onerror = () => {
                 setManageViewsImportStatus({ kind: "error", message: "Failed to read file" });
               };
               reader.readAsText(f);
               e.currentTarget.value = "";
             }}
           />
           <div className="segmented" role="group" aria-label="Import mode" title="Choose import strategy">
             <button
               type="button"
               className={`segmented__btn ${manageViewsImportMode === "merge" ? "active" : ""}`}
               onClick={() => setManageViewsImportMode("merge")}
               aria-pressed={manageViewsImportMode === "merge"}
             >
               Merge
             </button>
             <button
               type="button"
               className={`segmented__btn ${manageViewsImportMode === "replace" ? "active" : ""}`}
               onClick={() => setManageViewsImportMode("replace")}
               aria-pressed={manageViewsImportMode === "replace"}
             >
               Replace
             </button>
           </div>

           <button className="secondary-btn" onClick={() => importSavedViewsJson()} disabled={!manageViewsImportText.trim()}>
             Import JSON
           </button>
           <button
             className="secondary-btn"
             onClick={() => bulkDeleteSelectedViews()}
             disabled={!Object.values(manageViewsSelected).some(Boolean)}
             title="Delete selected views"
           >
             Delete selected
           </button>
         </div>
       </div>

       <div className="stack" style={{ marginTop: 10 }}>
         {savedViews.length ? (
           savedViews.map((v, idx) => (
             <div key={v.id} className="btn-row" style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: 10 }}>
               <input
                 type="checkbox"
                 checked={Boolean(manageViewsSelected[v.id])}
                 onChange={(e) => setManageViewsSelected((prev) => ({ ...prev, [v.id]: e.target.checked }))}
                 aria-label={`Select view ${v.name}`}
               />

               <input
                 value={manageViewsNameDrafts[v.id] ?? v.name}
                 onChange={(e) => setManageViewsNameDrafts((prev) => ({ ...prev, [v.id]: e.target.value }))}
                 className="ghost-btn"
                 style={{ flex: 1, padding: 8 }}
               />

               {(manageViewsNameDrafts[v.id] ?? v.name).trim() !== v.name.trim() ? (
                 <span className="badge badge--warning">dirty</span>
               ) : null}

               <button
                 className="secondary-btn secondary-btn--sm"
                 onClick={() => renameSavedView(v.id, manageViewsNameDrafts[v.id] ?? v.name)}
                 disabled={(manageViewsNameDrafts[v.id] ?? v.name).trim() === v.name.trim()}
                 title="Save name"
               >
                 Save
               </button>

               <button className="secondary-btn secondary-btn--sm" onClick={() => moveSavedView(v.id, -1)} disabled={idx === 0} title="Move up">
                 Ã¢â€ â€˜
               </button>
               <button
                 className="secondary-btn secondary-btn--sm"
                 onClick={() => moveSavedView(v.id, 1)}
                 disabled={idx === savedViews.length - 1}
                 title="Move down"
               >
                 Ã¢â€ â€œ
               </button>

               <button className="secondary-btn secondary-btn--sm" onClick={() => requestDeleteSavedView(v.id)} title="Delete">
                 Delete
               </button>
             </div>
           ))
         ) : (
           <div style={{ fontSize: 13, opacity: 0.75 }}>No saved views.</div>
         )}
       </div>

       <div style={{ marginTop: 14 }}>
         <label style={{ display: "block", fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Import JSON (array of SavedView)</label>
         {manageViewsImportFileName || manageViewsImportStatus ? (
           <div style={{ marginBottom: 8, fontSize: 12, opacity: 0.85 }}>
             {manageViewsImportFileName ? (
               <div>
                 File: <b>{manageViewsImportFileName}</b>
               </div>
             ) : null}
             {manageViewsImportStatus ? (
               <div style={{ color: manageViewsImportStatus.kind === "ok" ? "#2b8a3e" : "#b00020" }}>
                 {manageViewsImportStatus.message}
               </div>
             ) : null}
           </div>
         ) : null}

         {pendingImport ? (
           <div style={{ marginBottom: 10, padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.10)", background: "rgba(0,0,0,0.03)" }}>
             <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Confirm import</div>
             <div style={{ fontSize: 13 }}>{pendingImport.summary}</div>
             <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>
               <div>New: {pendingImport.stats.newCount}</div>
               <div>Overwrite (by id): {pendingImport.stats.overwriteCount}</div>
               {pendingImport.mode === "replace" ? <div>Removed: {pendingImport.stats.removedCount}</div> : null}

               {pendingImport.samples.newItems.length ? (
                 <div style={{ marginTop: 8 }}>
                   <div style={{ fontWeight: 600, marginBottom: 4 }}>Sample new</div>
                   <ul style={{ margin: 0, paddingLeft: 18 }}>
                     {pendingImport.samples.newItems.map((s) => (
                       <li key={s}>{s}</li>
                     ))}
                   </ul>
                 </div>
               ) : null}

               {pendingImport.samples.overwriteItems.length ? (
                 <div style={{ marginTop: 8 }}>
                   <div style={{ fontWeight: 600, marginBottom: 4 }}>Sample overwrite</div>
                   <ul style={{ margin: 0, paddingLeft: 18 }}>
                     {pendingImport.samples.overwriteItems.map((s) => (
                       <li key={s}>{s}</li>
                     ))}
                   </ul>
                 </div>
               ) : null}

               {pendingImport.mode === "replace" && pendingImport.samples.removedItems.length ? (
                 <div style={{ marginTop: 8 }}>
                   <div style={{ fontWeight: 600, marginBottom: 4 }}>Sample removed</div>
                   <ul style={{ margin: 0, paddingLeft: 18 }}>
                     {pendingImport.samples.removedItems.map((s) => (
                       <li key={s}>{s}</li>
                     ))}
                   </ul>
                 </div>
               ) : null}
             </div>
             <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
               <button className="secondary-btn" onClick={() => setPendingImport(null)}>
                 Cancel
               </button>
               <button className="primary-btn" onClick={() => confirmImportSavedViews()}>
                 Apply import
               </button>
             </div>
           </div>
         ) : null}

         <textarea
           value={manageViewsImportText}
           onChange={(e) => setManageViewsImportText(e.target.value)}
           placeholder='Paste JSON here: [{"id":"...","name":"...","createdAt":123,"query":{...}}]'
           style={{ width: "100%", minHeight: 120, padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace", fontSize: 12 }}
         />
         <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
           <button className="secondary-btn" onClick={() => setManageViewsOpen(false)}>
             Close
           </button>
         </div>
       </div>
     </Dialog>

     <div className="card-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: 0 }}>Daftar</h3>
            <p style={{ marginBottom: 6 }}>Total: {total ?? "(cursor)"}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 12, opacity: 0.75 }}>
                Last fetch: {lastFetchedAt ? new Date(lastFetchedAt).toLocaleTimeString() : "-"}
                {lastFetchDurationMs != null ? ` (${lastFetchDurationMs}ms)` : ""}
                {lastFetchStatus != null ? ` [${lastFetchStatus}]` : ""}
              </span>
              <button className="secondary-btn" onClick={() => setReloadTick((v) => v + 1)} disabled={isLoading}>
                Retry
              </button>
              <button
                className="secondary-btn"
                onClick={async () => {
                  if (!lastAuditRequestUrl) return;
                  try {
                    await navigator.clipboard.writeText(lastAuditRequestUrl);
                    pushToast("Request URL copied", "success");
                  } catch {
                    window.prompt("Copy request URL:", lastAuditRequestUrl);
                  }
                }}
                disabled={!lastAuditRequestUrl}
                title="Copy last request URL"
              >
                Copy URL
              </button>
              <div
                role="group"
                aria-label="Error preview mode"
                style={{ display: "inline-flex", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 999, overflow: "hidden" }}
              >
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setAuditErrorPreviewMode("pretty")}
                  style={{ border: 0, borderRadius: 0, padding: "6px 10px", background: auditErrorPreviewMode === "pretty" ? "rgba(0,0,0,0.08)" : "transparent" }}
                  aria-pressed={auditErrorPreviewMode === "pretty"}
                  disabled={!lastAuditErrorPayload}
                >
                  Pretty
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setAuditErrorPreviewMode("raw")}
                  style={{ border: 0, borderRadius: 0, padding: "6px 10px", background: auditErrorPreviewMode === "raw" ? "rgba(0,0,0,0.08)" : "transparent" }}
                  aria-pressed={auditErrorPreviewMode === "raw"}
                  disabled={!lastAuditErrorPayload}
                >
                  Raw
                </button>
              </div>
            </div>

            <div className="audit-alerts">
              {[
                {
                  title: "Suspicious pattern",
                  detail: "Login gagal berturut-turut dari IP baru.",
                  badge: "High",
                },
                {
                  title: "Elevated access",
                  detail: "Perubahan role admin di luar jam kerja.",
                  badge: "Medium",
                },
                {
                  title: "API spike",
                  detail: "Lonjakan request auth/reset-password.",
                  badge: "Watch",
                },
              ].map((alert) => (
                <div key={alert.title} className="audit-alerts__card">
                  <div>
                    <p className="audit-alerts__title">{alert.title}</p>
                    <p className="audit-alerts__detail">{alert.detail}</p>
                  </div>
                  <span className="audit-alerts__badge">{alert.badge}</span>
                </div>
              ))}
            </div>

            <div className="export-health">
              <div>
                <p className="export-health__title">Export health monitor</p>
                <p className="export-health__note">Last export: CSV 2m ago Ã‚Â· Success</p>
              </div>
              <div className="export-health__status">
                <span>Queue: 3</span>
                <span>Failed: 0</span>
              </div>
            </div>

              <button
                className="secondary-btn"
                onClick={() => setShowAuditErrorPreview((v) => !v)}
                disabled={!lastAuditErrorPayload}
                title="Toggle error payload preview"
              >
                {showAuditErrorPreview ? "Hide error" : "Show error"}
              </button>

              <button
                className="secondary-btn"
                onClick={() => {
                  if (!lastAuditErrorPayload) return;
                  const text = auditErrorPreviewMode === "raw" ? lastAuditErrorPayload : formatJsonPretty(lastAuditErrorPayload);
                  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `audit-log-error-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                }}
                disabled={!lastAuditErrorPayload}
                title="Download error payload"
              >
                Download error
              </button>
              <button
                className="secondary-btn"
                onClick={async () => {
                  const report = [
                    "Audit Logs Bug Report",
                    `Time: ${new Date().toISOString()}`,
                    `Request URL: ${lastAuditRequestUrl ?? "-"}`,
                    `Status: ${lastFetchStatus ?? "-"}`,
                    "",
                    "Error payload:",
                    lastAuditErrorPayload ?? "-",
                  ].join("\n");
                  try {
                    await navigator.clipboard.writeText(report);
                    pushToast("Bug report copied", "success");
                  } catch {
                    window.prompt("Copy bug report:", report);
                  }
                }}
                title="Copy a bug report template"
              >
        <div>Placeholder</div>
      {showShortcutsHelp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
          className="modal-overlay"
          onClick={() => setShowShortcutsHelp(false)}
        >
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="card-header modal-header">
              <h4 style={{ margin: 0 }}>Keyboard shortcuts</h4>
              <button
                className="secondary-btn secondary-btn--sm"
                onClick={() => setShowShortcutsHelp(false)}
                title="Close"
              >
                Close
              </button>
            </div>
            <div style={{ padding: 12, fontSize: 13 }}>
              <p style={{ margin: 0, opacity: 0.8 }}>
                Shortcuts helper sedang dinonaktifkan sementara untuk merapihkan parsing/TypeScript.
                Akan diaktifkan lagi setelah refactor.
              </p>
            </div>
          </div>
        </div>
      )}

      {jobDetailId ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Export job detail"
          onClick={() => {
            const top = getTopOverlayKey();
            if (top && top !== exportJobDrawerKeyRef.current) return;
            setJobDetailId(null);
            setJobDetail(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "stretch",
            justifyContent: "flex-end",
            padding: 0,
            zIndex: 200 + Math.max(0, getOverlayIndex(exportJobDrawerKeyRef.current)) * 20,
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(520px, 100vw)",
              height: "100vh",
              overflow: "auto",
              borderLeft: "1px solid rgba(0,0,0,0.12)",
              background: "white",
              borderRadius: 0,
            }}
          >
            <div className="card-header" style={{ position: "sticky", top: 0, background: "white", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <h4 style={{ margin: 0 }}>Export Job Detail</h4>
              <button
                className="secondary-btn"
                onClick={() => {
                  setJobDetailId(null);
                  setJobDetail(null);
                }}
                title="Close (Esc)"
              >
                Close
              </button>
            </div>
            <div style={{ padding: 12, fontSize: 13 }}>
              {isLoadingJobDetail ? (
                <p>Loading...</p>
              ) : jobDetail ? (
                (() => {
                  const job = isRecord(jobDetail) ? jobDetail : null;
                  const filtersObj = tryParseJsonRecord(job?.filters);

                  const fmtDate = (iso: string | null | undefined) => {
                    if (!iso) return "-";
                    const d = new Date(iso);
                    if (Number.isNaN(d.getTime())) return String(iso);
                    return d.toLocaleString();
                  };

                  const renderFilterRow = (label: string, value: unknown) => {
                    if (value == null || value === "") return null;
                    return (
                      <tr>
                        <td style={{ whiteSpace: "nowrap", opacity: 0.75 }}>{label}</td>
                        <td style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}>
                          {typeof value === "string" ? value : JSON.stringify(value)}
                        </td>
                      </tr>
                    );
                  };

                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                      <div>
                        <h5 style={{ margin: "0 0 6px 0" }}>Summary</h5>
                        <table>
                          <tbody>
                            <tr>
                              <td style={{ whiteSpace: "nowrap", opacity: 0.75 }}>ID</td>
                              <td style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}>
                                {typeof job?.id === "string" || typeof job?.id === "number" ? String(job.id) : "-"}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ whiteSpace: "nowrap", opacity: 0.75 }}>Status</td>
                              <td>{job?.status as any}</td>
                            </tr>
                            <tr>
                              <td style={{ whiteSpace: "nowrap", opacity: 0.75 }}>Created</td>
                              <td>{fmtDate((job?.createdAt as any) ?? null)}</td>
                            </tr>
                            <tr>
                              <td style={{ whiteSpace: "nowrap", opacity: 0.75 }}>Updated</td>
                              <td>{fmtDate((job?.updatedAt as any) ?? null)}</td>
                            </tr>
                            <tr>
                              <td style={{ whiteSpace: "nowrap", opacity: 0.75 }}>Attempts</td>
                              <td>{typeof (job?.attempts as any) === "number" ? (job?.attempts as any) : (job?.attempts as any) ?? "-"}</td>
                            </tr>
                            <tr>
                              <td style={{ whiteSpace: "nowrap", opacity: 0.75 }}>Rows written</td>
                              <td>{typeof (job?.rowsWritten as any) === "number" ? (job?.rowsWritten as any) : (job?.rowsWritten as any) ?? "-"}</td>
                            </tr>
                            <tr>
                              <td style={{ whiteSpace: "nowrap", opacity: 0.75 }}>Lease until</td>
                              <td>{fmtDate((job?.leaseUntil as any) ?? null)}</td>
                            </tr>
                            <tr>
                              <td style={{ whiteSpace: "nowrap", opacity: 0.75 }}>Error</td>
                              <td style={{ color: (job?.error as any) ? "#b00020" : undefined }}>{(job?.error as any) ?? "-"}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div>
                        <h5 style={{ margin: "0 0 6px 0" }}>Filters</h5>
                        {filtersObj ? (
                          <table>
                            <tbody>
                              {renderFilterRow("action", filtersObj.action)}
                              {renderFilterRow("q", filtersObj.q)}
                              {renderFilterRow("meta", filtersObj.meta ? "1" : "0")}
                              {renderFilterRow("targetUserId", filtersObj.targetUserId)}
                              {renderFilterRow("targetEmail", filtersObj.targetEmail)}
                              {renderFilterRow("resource", filtersObj.resource)}
                              {renderFilterRow("statusCode", filtersObj.statusCode)}
                              {renderFilterRow("createdAtFrom", fmtDate((filtersObj.createdAtFrom as any) ?? null))}
                              {renderFilterRow("createdAtTo", fmtDate((filtersObj.createdAtTo as any) ?? null))}
                            </tbody>
                          </table>
                        ) : (
                          <p style={{ margin: 0, opacity: 0.75 }}>{job?.filters ? "(Invalid filters JSON)" : "-"}</p>
                        )}
                      </div>

                      <details>
                        <summary style={{ cursor: "pointer" }}>Raw JSON</summary>
                        <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{JSON.stringify(jobDetail, null, 2)}</pre>
                      </details>
                    </div>
                  );
                })()
              ) : (
                <p>Not found.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {exportJobs.length ? (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="card-header">
            <div className="btn-row btn-row--between" style={{ alignItems: "baseline" }}>
              <h4 style={{ margin: 0 }}>Export Jobs (latest 20)</h4>
              <label className="check-row" style={{ fontSize: 13, opacity: 0.9 }}>
                <input
                  type="checkbox"
                  checked={showActiveExportsOnly}
                  onChange={(e) => setShowActiveExportsOnly(e.target.checked)}
                />
                Show only active (pending/running)
              </label>
            </div>
          </div>
          <div style={{ padding: 12 }}>
            <div
              ref={exportTableRef}
              className="table-container"
              style={{ maxHeight: 360, overflow: "auto", borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)" }}
            >
              <table>
                <thead>
                  <tr style={{ position: "sticky", top: 0, background: "white", zIndex: 1 }}>
                    <th>Created</th>
                    <th>Status</th>
                    <th>File</th>
                    <th>Filters</th>
                    <th>Progress</th>
                    <th>Error</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {renderPadRow(exportWindow.topPad, 7)}
                  {visibleExportJobs.slice(exportWindow.start, exportWindow.end).map((j) => (
                    <tr key={j.id} style={{ height: EXPORT_ROW_HEIGHT }}>
                      <td style={{ whiteSpace: "nowrap" }}>{new Date(j.createdAt).toLocaleString()}</td>
                      <td>
                        <StatusBadge status={j.status} />
                      </td>
                      <td style={{ maxWidth: 240, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.fileName ?? "-"}</td>
                      <td style={{ maxWidth: 320, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {summarizeFilters(j.filters)}
                      </td>
                      <td style={{ fontSize: 12, opacity: 0.9, whiteSpace: "nowrap" }}>
                        {j.status === "running" || j.status === "pending" ? `${j.rowsWritten ?? 0} rows` : "-"}
                      </td>
                      <td style={{ maxWidth: 260, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: j.error ? "#b00020" : undefined }}>
                        {j.error ?? "-"}
                      </td>
                      <td>
                        <div className="btn-row">
                          {j.status === "completed" ? (
                            <>
                              <a className="secondary-btn secondary-btn--sm" href={`/api/admin/audit-logs/exports/${j.id}/download`}>
                                Download
                              </a>
                              <button
                                className="secondary-btn"
                                onClick={async () => {
                                  const url = `${window.location.origin}/api/admin/audit-logs/exports/${j.id}/download`;
                                  try {
                                    await navigator.clipboard.writeText(url);
                                    pushToast("Link copied", "success");
                                  } catch {
                                    window.prompt("Copy link:", url);
                                    pushToast("Copy failed; please copy manually", "error");
                                  }
                                }}
                              >
                                Copy link
                              </button>
                            </>
                          ) : null}

                          {j.status === "pending" || j.status === "running" ? (
                            <button
                              className="secondary-btn"
                              onClick={async () => {
                                await fetch(`/api/admin/audit-logs/exports/${j.id}/cancel`, { method: "POST" });
                                await loadExportJobs();
                              }}
                            >
                              Cancel
                            </button>
                          ) : null}

                          {j.status === "failed" ? (
                            <>
                              <button
                                className="secondary-btn"
                                onClick={async () => {
                                  await fetch(`/api/admin/audit-logs/exports/${j.id}/retry`, { method: "POST" });
                                  await loadExportJobs();
                                }}
                              >
                                Retry
                              </button>
                              {j.error ? (
                                <button
                                  className="secondary-btn"
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(j.error ?? "");
                                      pushToast("Error copied", "success");
                                    } catch {
                                      window.prompt("Copy error:", j.error ?? "");
                                      pushToast("Copy failed; please copy manually", "error");
                                    }
                                  }}
                                >
                                  Copy error
                                </button>
                              ) : null}
                            </>
                          ) : null}

                          <button
                            className="secondary-btn"
                            onClick={async () => {
                              setIsLoadingJobDetail(true);
                              setJobDetailId(j.id);
                              try {
                                const res = await fetch(`/api/admin/audit-logs/exports/${j.id}`);
                                const body = (await res.json().catch(() => null)) as unknown;
                                const record = isRecord(body) ? body : null;
                                setJobDetail(record?.job ?? null);
                              } finally {
                                setIsLoadingJobDetail(false);
                              }
                            }}
                          >
                            Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {renderPadRow(exportWindow.bottomPad, 7)}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
              <button
                className="secondary-btn"
                onClick={async () => {
                  const ok = window.confirm("Cancel semua export job yang sedang pending/running?");
                  if (!ok) return;
                  await fetch("/api/admin/audit-logs/exports/cancel-all", { method: "POST" });
                  await loadExportJobs();
                }}
              >
                Cancel All
              </button>

              <button
                className="secondary-btn"
                onClick={async () => {
                  await fetch("/api/admin/audit-logs/exports/retry-all-failed", { method: "POST" });
                  await loadExportJobs();
                }}
              >
                Requeue All Failed
              </button>

              {exportsHasMore ? (
                <button
                  className="secondary-btn"
                  onClick={() => {
                    if (!exportsNextCursor) return;
                    void loadExportJobs({ cursor: exportsNextCursor, append: true });
                  }}
                  disabled={!exportsNextCursor}
                >
                  Load more
                </button>
              ) : null}
              <button className="secondary-btn secondary-btn--sm" onClick={() => void loadExportJobs()}>
                Refresh list
              </button>
            </div>
            <p style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
              Untuk memproses job export, jalankan `npm run audit:exports` (atau jadwalkan via cron).
            </p>
          </div>
        </div>
      ) : null}

      <div className="action-bar" style={{ justifyContent: "space-between", marginTop: 12, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Presets:</span>
            <button className="secondary-btn secondary-btn--sm" onClick={() => setRangePreset(15 * 60 * 1000)}>
              Last 15m
            </button>
            <button className="secondary-btn secondary-btn--sm" onClick={() => setRangePreset(60 * 60 * 1000)}>
              Last 1h
            </button>
            <button
              className="secondary-btn"
              style={{ padding: "6px 10px", borderRadius: 10 }}
              onClick={() => {
                setRangePreset(24 * 60 * 60 * 1000);
                if (autoApply) {
                  // Apply immediately when autoApply is enabled.
                  setUrlQuery({
                    createdAtFrom: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    createdAtTo: new Date().toISOString(),
                    cursor: "",
                    dir: "next",
                  });
                }
              }}
              title="Set date range to last 24 hours"
            >
              Last 24h
            </button>
            <button className="secondary-btn secondary-btn--sm" onClick={() => setRangePreset(7 * 24 * 60 * 60 * 1000)}>
              Last 7d
            </button>

            <button
              className="secondary-btn"
              style={{ padding: "6px 10px", borderRadius: 10 }}
              onClick={() => {
                // Clear draft inputs
                setActionInput("");
                setQInput("");
                setMetaInput(false);
                setTargetUserIdInput("");
                setTargetEmailInput("");
                setResourceInput("");
                setStatusCodeInput("");
                // Keep a sensible default date range
                setRangePreset(24 * 60 * 60 * 1000);

                // Apply cleared filters
                const toIso = new Date().toISOString();
                const fromIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
                setUrlQuery({
                  action: "",
                  q: "",
                  meta: false,
                  targetUserId: "",
                  targetEmail: "",
                  resource: "",
                  statusCode: "",
                  createdAtFrom: fromIso,
                  createdAtTo: toIso,
                  cursor: "",
                  dir: "next",
                });

                pushToast("Filters cleared (Last 24h)", "info");
              }}
              title="Clear all filters and reset to last 24h"
            >
              Clear filters
            </button>
            <button
              className="secondary-btn"
              style={{ padding: "6px 10px", borderRadius: 10 }}
              onClick={() => {
                applyOnlyErrorsPreset();
                // If user didn't set a range yet, keep list bounded.
                if (!createdAtFromInput && !createdAtToInput) setRangePreset(24 * 60 * 60 * 1000);
              }}
              title="Sets statusCode=400"
            >
              Only errors
            </button>
            <button
              className="secondary-btn"
              style={{ padding: "6px 10px", borderRadius: 10 }}
              onClick={() => {
                applyAuthActionsPreset();
                if (!createdAtFromInput && !createdAtToInput) setRangePreset(24 * 60 * 60 * 1000);
              }}
              title="Sets action contains: auth."
            >
              Auth events
            </button>

            <span style={{ width: 1, height: 18, background: "rgba(0,0,0,0.12)", margin: "0 4px" }} />

            <button
              className="secondary-btn"
              style={{ padding: "6px 10px", borderRadius: 10 }}
              onClick={() => saveCurrentDraftAsView()}
              disabled={Boolean(dateRangeError)}
              title={dateRangeError ? dateRangeError : "Save current draft filters as a view"}
            >
              Save view
            </button>

            <button
              className="secondary-btn"
              style={{ padding: "6px 10px", borderRadius: 10 }}
              onClick={() => {
                setManageViewsOpen(true);
                setManageViewsSelected({});
                setManageViewsImportText("");
                setManageViewsImportMode("merge");
                setManageViewsNameDrafts(Object.fromEntries(savedViews.map((v) => [v.id, v.name])));
              }}
              title="Rename/reorder/export/import saved views"
            >
              Manage views
            </button>

            <div style={{ position: "relative" }} ref={savedViewsRef}>
              <button
                className="secondary-btn"
                style={{ padding: "6px 10px", borderRadius: 10 }}
                onClick={() => setSavedViewsOpen((v) => !v)}
                aria-expanded={savedViewsOpen}
                aria-haspopup="dialog"
                title="Open saved views"
              >
                Saved views ({savedViews.length})
              </button>

              {savedViewsOpen ? (
                <div
                  role="dialog"
                  aria-label="Saved views"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    minWidth: 320,
                    maxWidth: "min(520px, 90vw)",
                    background: "white",
                    border: "1px solid rgba(0,0,0,0.12)",
                    borderRadius: 12,
                    boxShadow: "0 12px 36px rgba(0,0,0,0.12)",
                    padding: 10,
                    zIndex: 60,
                  }}
                >
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      value={savedViewsSearch}
                      onChange={(e) => setSavedViewsSearch(e.target.value)}
                      placeholder="Search views..."
                      style={{
                        padding: 8,
                        borderRadius: 10,
                        border: "1px solid rgba(0,0,0,0.14)",
                        width: "100%",
                      }}
                    />
                    <button className="secondary-btn" onClick={() => setSavedViewsOpen(false)} title="Close">
                      Close
                    </button>
                  </div>

                  <div style={{ marginTop: 8, maxHeight: 260, overflow: "auto" }}>
                    {savedViews
                      .filter((v) => v.name.toLowerCase().includes(savedViewsSearch.trim().toLowerCase()))
                      .slice(0, 50)
                      .map((v) => (
                        <div
                          key={v.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 4px",
                            borderBottom: "1px solid rgba(0,0,0,0.06)",
                          }}
                        >
                          <button
                            className="secondary-btn"
                            style={{
                              flex: 1,
                              textAlign: "left",
                              borderRadius: 10,
                              padding: "6px 10px",
                              background: v.id === activeSavedViewId ? "rgba(0,0,0,0.08)" : undefined,
                            }}
                            onClick={() => {
                              applySavedView(v, { applyNow: autoApply });
                              setActiveSavedView(v.id);
                              if (autoApply) setSavedViewsOpen(false);
                            }}
                            title={v.name}
                          >
                            {v.name}{v.id === activeSavedViewId ? " (active)" : ""}
                          </button>
                          <button
                            className="secondary-btn"
                            onClick={() => requestUpdateSavedView(v.id)}
                            title={`Update view with current draft: ${v.name}`}
                            disabled={Boolean(dateRangeError)}
                          >
                            Update
                          </button>
                          <button
                            className="secondary-btn"
                            onClick={() => requestDeleteSavedView(v.id)}
                            title={`Delete view: ${v.name}`}
                          >
                            Delete
                          </button>
                        </div>
                      ))}

                    {!savedViews.length ? <div style={{ padding: 8, fontSize: 12, opacity: 0.75 }}>No saved views yet.</div> : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="audit-quick-presets">
            {[
              {
                label: "Today",
                onClick: () => {
                  const fromIso = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
                  const toIso = new Date().toISOString();
                  setCreatedAtFromInput(fromIso);
                  setCreatedAtToInput(toIso);
                  setCreatedAtFromLocal(isoToLocalInput(fromIso));
                  setCreatedAtToLocal(isoToLocalInput(toIso));
                  if (autoApply) applyDraftToUrl();
                },
              },
              {
                label: "Last 7 Days",
                onClick: () => {
                  const fromIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
                  const toIso = new Date().toISOString();
                  setCreatedAtFromInput(fromIso);
                  setCreatedAtToInput(toIso);
                  setCreatedAtFromLocal(isoToLocalInput(fromIso));
                  setCreatedAtToLocal(isoToLocalInput(toIso));
                  if (autoApply) applyDraftToUrl();
                },
              },
              {
                label: "Critical",
                onClick: () => {
                  setStatusCodeInput("400");
                  setActionInput("auth.");
                  if (autoApply) applyDraftToUrl();
                },
              },
            ].map((preset) => (
              <button key={preset.label} className="secondary-btn" type="button" onClick={preset.onClick}>
                {preset.label}
              </button>
            ))}
          </div>

          <div className="saved-searches">
            <div>
              <p className="saved-searches__title">Saved search highlights</p>
              <p className="saved-searches__note">Akses cepat ke filter populer tim.</p>
            </div>
            <div className="saved-searches__chips">
              <button className="secondary-btn" type="button">Failed logins</button>
              <button className="secondary-btn" type="button">Admin changes</button>
              <button className="secondary-btn" type="button">High latency</button>
            </div>
          </div>

          <div className="noise-toggle">
            <div>
              <p className="noise-toggle__title">Noise reduction</p>
              <p className="noise-toggle__note">Tampilkan hanya severity tinggi.</p>
            </div>
            <button className="secondary-btn" type="button">Toggle high severity</button>
          </div>

          <div className="retention-reminder">
            <div>
              <p className="retention-reminder__title">Retention policy reminder</p>
              <p className="retention-reminder__note">Policy default 90 hari. Review sebelum 31 Jan.</p>
            </div>
            <button className="secondary-btn" type="button">Review policy</button>
          </div>

          <div className="integrity-score">
            <div>
              <p className="integrity-score__title">Log integrity score</p>
              <p className="integrity-score__note">Skor konsistensi log: 94% (Good)</p>
            </div>
            <button className="secondary-btn" type="button">View details</button>
          </div>

          <div className="compliance-snapshot">
            <div>
              <p className="compliance-snapshot__title">Compliance snapshot</p>
              <p className="compliance-snapshot__note">2 policy perlu audit ulang minggu ini.</p>
            </div>
            <button className="secondary-btn" type="button">Open checklist</button>
          </div>

          {activeFilterChips.length ? (
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 12, opacity: 0.75 }}>Active filters:</span>
              {activeFilterChips.map((c) => (
                <span
                  key={`${c.key}:${c.value}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "4px 8px",
                    borderRadius: 999,
                    border: "1px solid rgba(0,0,0,0.12)",
                    background: "rgba(0,0,0,0.03)",
                    fontSize: 12,
                  }}
                >
                  <span style={{ opacity: 0.8 }}>{c.label}:</span>
                  <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}>{c.value}</span>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => clearFilterChip(c.key)}
                    style={{ padding: "2px 8px", borderRadius: 999 }}
                    title={`Remove ${c.label}`}
                  >
                    Ãƒâ€”
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 10,
              alignItems: "end",
              marginTop: 10,
            }}
          >
            <input
              style={{ padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)", width: "100%" }}
              placeholder="Action (contains)"
              value={actionInput}
              onChange={(e) => setActionInput(e.target.value)}
            />
            <input
              ref={qInputRef}
              style={{ padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)", width: "100%" }}
              placeholder="Search q (ip/action, meta optional)"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
            />
            <input
              style={{ padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)", width: "100%" }}
              placeholder="targetUserId"
              value={targetUserIdInput}
              onChange={(e) => setTargetUserIdInput(e.target.value)}
            />
            <input
              style={{ padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)", width: "100%" }}
              placeholder="targetEmail"
              value={targetEmailInput}
              onChange={(e) => setTargetEmailInput(e.target.value)}
            />
            <input
              style={{ padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)", width: "100%" }}
              placeholder="resource"
              value={resourceInput}
              onChange={(e) => setResourceInput(e.target.value)}
            />
            <input
              style={{ padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)", width: "100%" }}
              placeholder="statusCode (e.g. 200/400)"
              value={statusCodeInput}
              onChange={(e) => setStatusCodeInput(e.target.value)}
            />

            <div>
              <label style={{ display: "block", fontSize: 12, opacity: 0.75, marginBottom: 4 }}>From</label>
              <input
                type="datetime-local"
                style={{ padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)", width: "100%" }}
                value={createdAtFromLocal}
                onChange={(e) => {
                  const v = e.target.value;
                  setCreatedAtFromLocal(v);
                  setCreatedAtFromInput(localInputToIso(v));
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, opacity: 0.75, marginBottom: 4 }}>To</label>
              <input
                type="datetime-local"
                style={{
                  padding: 10,
                  borderRadius: 12,
                  border: dateRangeError ? "1px solid rgba(176,0,32,0.55)" : "1px solid rgba(0,0,0,0.14)",
                  width: "100%",
                }}
                value={createdAtToLocal}
                onChange={(e) => {
                  const v = e.target.value;
                  setCreatedAtToLocal(v);
                  setCreatedAtToInput(localInputToIso(v));
                }}
              />
              {dateRangeError ? <div style={{ marginTop: 6, fontSize: 12, color: "#b00020" }}>{dateRangeError}</div> : null}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, opacity: 0.9 }}>
                <input
                  type="checkbox"
                  checked={metaInput}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setMetaInput(next);
                    // Auto-suggest date range for meta search if user hasn't provided one.
                    if (next && !createdAtFromInput && !createdAtToInput) {
                      const fromIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
                      setCreatedAtFromInput(fromIso);
                      setCreatedAtFromLocal(isoToLocalInput(fromIso));
                    }
                  }}
                />
                Search meta (lebih berat)
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, opacity: 0.9 }}>
                <input type="checkbox" checked={autoApply} onChange={(e) => setAutoApply(e.target.checked)} />
                Auto apply (debounced)
              </label>

              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowShortcutsHelp(true)}
                title="Keyboard shortcuts (?)"
                style={{ padding: "6px 10px", borderRadius: 10 }}
              >
                ?
              </button>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                {!autoApply && isDraftDirty ? (
                  <span
                    style={{
                      fontSize: 12,
                      padding: "4px 8px",
                      borderRadius: 999,
                      border: "1px solid rgba(0,0,0,0.12)",
                      background: "rgba(255, 193, 7, 0.18)",
                      color: "rgba(0,0,0,0.78)",
                      whiteSpace: "nowrap",
                    }}
                    title="Draft filters differ from applied filters"
                  >
                    Draft changes
                  </span>
                ) : null}

                <button
                  className="secondary-btn"
                  onClick={() => applyDraftToUrl()}
                  disabled={isLoading || autoApply || !isDraftDirty || Boolean(dateRangeError)}
                  title={
                    autoApply
                      ? "Disable auto apply to use manual Apply"
                      : dateRangeError
                        ? dateRangeError
                        : !isDraftDirty
                          ? "No draft changes"
                          : undefined
                  }
                >
                  Apply
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => resetFiltersToQuery()}
                  disabled={isLoading || autoApply || !isDraftDirty}
                  title={autoApply ? "Disable auto apply to edit draft" : undefined}
                >
                  Undo draft
                </button>
                <button className="secondary-btn" onClick={() => resetAllFilters()} disabled={isLoading}>
                  Reset all
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            className="secondary-btn"
            onClick={() => {
              const cursor = prevCursor;
              if (!cursor) return;
              setUrlQuery({ cursor, dir: "prev" });
            }}
            disabled={isLoading || !prevCursor}
          >
            Prev
          </button>
          <span style={{ fontSize: 13, opacity: 0.8, whiteSpace: "nowrap" }}>Cursor pagination</span>
          <button
            className="secondary-btn"
            onClick={() => {
              const cursor = nextCursor;
              if (!cursor) return;
              setUrlQuery({ cursor, dir: "next" });
            }}
            disabled={isLoading || !nextCursor || !hasMore}
          >
            Next
          </button>
        </div>
      </div>

      <FormError
        message={error ?? undefined}
        action={
          error ? (
            <button className="secondary-btn" onClick={() => setReloadTick((n) => n + 1)} disabled={isLoading}>
              Retry
            </button>
          ) : null
        }
      />

      {isLoading ? (
        <div
          className="table-container table-container--bordered"
          style={{ marginTop: 12, borderRadius: 12, overflow: "hidden" }}
          aria-busy="true"
          aria-label="Loading audit logs"
        >
          <table>
            <thead>
              <tr style={{ background: "white" }}>
                <th style={{ width: 190 }}>Waktu</th>
                <th style={{ width: 240 }}>Action</th>
                <th style={{ width: 240 }}>UserId</th>
                <th style={{ width: 140 }}>IP</th>
                <th>Meta</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} style={{ height: AUDIT_ROW_HEIGHT }}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j}>
                      <SkeletonBlock height={12} width={j === 4 ? "90%" : "60%"} radius={8} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : rows.length === 0 ? (
        <div style={{ marginTop: 12 }}>
          <EmptyState
            title="Tidak ada audit log"
            description={
              query.action ||
              query.q ||
              query.targetUserId ||
              query.targetEmail ||
              query.resource ||
              query.statusCode ||
              query.createdAtFrom ||
              query.createdAtTo ||
              query.meta
                ? "Belum ada audit log yang cocok. Coba longgarkan filter / ubah range waktu."
                : "Belum ada audit log."
            }
            action={
              query.action ||
              query.q ||
              query.targetUserId ||
              query.targetEmail ||
              query.resource ||
              query.statusCode ||
              query.createdAtFrom ||
              query.createdAtTo ||
              query.meta ? (
                <button className="secondary-btn" onClick={() => setUrlQuery({ action: "", q: "", meta: false, targetUserId: "", targetEmail: "", resource: "", statusCode: "", createdAtFrom: "", createdAtTo: "", cursor: "", dir: "next" })}>
                  Reset filter
                </button>
              ) : null
            }
          />
        </div>
      ) : (
        <>
          {expandedId ? (
            <>
              <div
                role="presentation"
                onClick={() => {
                  const top = getTopOverlayKey();
                  if (top && top !== metaDrawerKeyRef.current) return;
                  closeMetaDrawer();
                }}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.35)",
                  zIndex: 200 + Math.max(0, getOverlayIndex(metaDrawerKeyRef.current)) * 20,
                  opacity: isMetaDrawerClosing ? 0 : 1,
                  transition: "opacity 180ms ease",

                }}
              />

              <aside
                ref={metaDrawerRef}
                role="dialog"
                aria-modal="true"
                aria-label="Audit log meta"
                aria-describedby="audit-log-meta-help"
                tabIndex={-1}
                style={{
                  position: "fixed",
                  top: 0,
                  right: 0,
                  height: "100vh",
                  width: "min(560px, 92vw)",
                  background: "white",
                  zIndex: 210 + Math.max(0, getOverlayIndex(metaDrawerKeyRef.current)) * 20,
                  borderLeft: "1px solid rgba(0,0,0,0.12)",
                  boxShadow: "-12px 0 36px rgba(0,0,0,0.18)",
                  display: "flex",
                  flexDirection: "column",
                  transform: isMetaDrawerClosing ? "translateX(20px)" : "translateX(0)",
                  opacity: isMetaDrawerClosing ? 0 : 1,
                  transition: "transform 180ms ease, opacity 180ms ease",

                }}
              >
                <div tabIndex={0} aria-hidden onFocus={() => focusLastInMetaDrawer()} />
                <div id="audit-log-meta-help" style={{ position: "absolute", left: -9999, top: "auto", width: 1, height: 1, overflow: "hidden" }}>
                  Press Escape to close. Tab and Shift+Tab to move between controls.
                </div>
                <div
                  style={{
                    padding: 12,
                    borderBottom: "1px solid rgba(0,0,0,0.10)",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>Selected log</div>
                    <div style={{ fontSize: 13, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}>
                      {expandedId}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <div
                      role="group"
                      aria-label="Meta view mode"
                      style={{ display: "inline-flex", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 999, overflow: "hidden" }}
                    >
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => setMetaViewMode("pretty")}
                        style={{
                          border: 0,
                          borderRadius: 0,
                          padding: "6px 10px",
                          background: metaViewMode === "pretty" ? "rgba(0,0,0,0.08)" : "transparent",
                        }}
                        aria-pressed={metaViewMode === "pretty"}
                        title="Pretty JSON"
                      >
                        Pretty
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => setMetaViewMode("raw")}
                        style={{
                          border: 0,
                          borderRadius: 0,
                          padding: "6px 10px",
                          background: metaViewMode === "raw" ? "rgba(0,0,0,0.08)" : "transparent",
                        }}
                        aria-pressed={metaViewMode === "raw"}
                        title="Raw string"
                      >
                        Raw
                      </button>
                    </div>

                    <button
                      className="secondary-btn"
                      onClick={() => {
                        const container = auditTableRef.current;
                        const rowEl = document.getElementById(`audit-row-${expandedId}`);
                        if (!container || !rowEl) return;
                        container.scrollTo({ top: Math.max(0, rowEl.offsetTop - AUDIT_ROW_HEIGHT), behavior: "smooth" });
                      }}
                      title="Locate selected row"
                    >
                      Locate
                    </button>

                    <button
                      className="secondary-btn"
                      onClick={async () => {
                        const row = rows.find((x) => x.id === expandedId);
                        const raw = metaById[expandedId] ?? row?.meta ?? row?.metaPreview ?? "";
                        const pretty = formatJsonPretty(raw);
                        const text = metaViewMode === "raw" ? raw : pretty || raw;
                        try {
                          await navigator.clipboard.writeText(text);
                          pushToast("Meta copied", "success");
                        } catch {
                          window.prompt("Copy meta:", text);
                          pushToast("Copy failed; please copy manually", "error");
                        }
                      }}
                      disabled={Boolean(isLoadingMeta[expandedId])}
                      title="Copy meta to clipboard"
                    >
                      Copy
                    </button>

                    <button
                      className="secondary-btn"
                      onClick={() => {
                        const row = rows.find((x) => x.id === expandedId);
                        const raw = metaById[expandedId] ?? row?.meta ?? row?.metaPreview ?? "";
                        const pretty = formatJsonPretty(raw);
                        const text = metaViewMode === "raw" ? raw : pretty || raw;

                        const blob = new Blob([text], { type: "application/json;charset=utf-8" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `audit-log-${expandedId}.json`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(url);
                        pushToast("Download started", "success");
                      }}
                      disabled={Boolean(isLoadingMeta[expandedId])}
                      title="Download meta as .json"
                    >
                      Download
                    </button>

                    <button className="secondary-btn" onClick={() => closeMetaDrawer()} title="Close (Esc)">
                      Close
                    </button>
                  </div>
                </div>

                <div style={{ padding: 12, overflow: "auto" }}>
                  <pre
                    aria-live="polite"
                    style={{
                      margin: 0,
                      whiteSpace: "pre-wrap",
                      fontSize: 12,
                      lineHeight: 1.4,
                      background: "rgba(0,0,0,0.03)",
                      padding: 12,
                      borderRadius: 12,
                      border: "1px solid rgba(0,0,0,0.08)",
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                    }}
                  >
                    {(() => {
                      const row = rows.find((x) => x.id === expandedId);
                      const raw = metaById[expandedId] ?? row?.meta ?? row?.metaPreview ?? "";

                      if (isLoadingMeta[expandedId]) return "Loading meta...";
                      if (!raw) return "(meta tidak tersedia)";

                      const pretty = formatJsonPretty(raw);
                      if (metaViewMode === "raw") return raw;
                      return pretty || raw;
                    })()}
                  </pre>
                </div>

                <div tabIndex={0} aria-hidden onFocus={() => focusFirstInMetaDrawer()} />
              </aside>
            </>
          ) : null}

          <div
            ref={auditTableRef}
            className="table-container table-container--bounded table-container--bordered"
            style={{ marginTop: 12, borderRadius: 12 }}
          >
            <table>
            <thead>
              <tr>
                <th style={{ width: 190 }}>Waktu</th>
                <th style={{ width: 240 }}>Action</th>
                <th style={{ width: 240 }}>UserId</th>
                <th style={{ width: 140 }}>IP</th>
                <th>Meta</th>
              </tr>
            </thead>
            <tbody>
              {renderPadRow(auditWindow.topPad, 5)}
              {rows.slice(auditWindow.start, auditWindow.end).map((r) => (
                <tr
                  key={r.id}
                  id={`audit-row-${r.id}`}
                  style={{
                    height: AUDIT_ROW_HEIGHT,
                    background: expandedId === r.id ? "rgba(0,0,0,0.04)" : undefined,
                  }}
                >
                  <td style={{ whiteSpace: "nowrap" }}>{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="text-truncate" style={{ maxWidth: 240 }}>{highlightText(r.action, qInput)}</td>
                  <td className="mono text-truncate" style={{ maxWidth: 240 }}>{r.userId ?? "-"}</td>
                  <td className="mono" style={{ whiteSpace: "nowrap" }}>{r.ip ?? "-"}</td>
                  <td style={{ maxWidth: 520 }}>
                    <div className="btn-row">
                      <span className="text-truncate" style={{ maxWidth: 420 }}>
                        {(() => {
                          const v = (expandedId === r.id ? metaById[r.id] ?? r.meta : r.metaPreview) ?? "-";
                          return typeof v === "string" ? highlightText(v, qInput) : v;
                        })()}
                      </span>
                      <button
                        className="secondary-btn secondary-btn--sm"
                        onClick={() => void openAuditLog(r.id)}
                        disabled={Boolean(isLoadingMeta[r.id])}
                        aria-expanded={expandedId === r.id}
                        aria-controls={`audit-row-${r.id}`}
                      >
                        {expandedId === r.id ? "Hide" : isLoadingMeta[r.id] ? "Loading..." : "View"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {renderPadRow(auditWindow.bottomPad, 5)}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}

