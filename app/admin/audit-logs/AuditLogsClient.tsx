"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LruCache } from "@/lib/client/lru";

const DEFAULT_PAGE_SIZE = 20;

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
    const f = JSON.parse(filtersJson) as any;
    const parts: string[] = [];
    if (f.action) parts.push(`action~${String(f.action)}`);
    if (f.q) parts.push(`q~${String(f.q)}`);
    if (f.meta) parts.push("meta=1");
    if (f.targetUserId) parts.push(`targetUserId=${String(f.targetUserId)}`);
    if (f.targetEmail) parts.push(`targetEmail~${String(f.targetEmail)}`);
    if (f.resource) parts.push(`resource~${String(f.resource)}`);
    if (f.statusCode) parts.push(`statusCode=${String(f.statusCode)}`);
    if (f.createdAtFrom) parts.push(`from=${String(f.createdAtFrom)}`);
    if (f.createdAtTo) parts.push(`to=${String(f.createdAtTo)}`);
    return parts.length ? parts.join(", ") : "-";
  } catch {
    return "-";
  }
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

export type AdminAuditInitialData = {
  query: QueryState;
  pageSize: number;
  total: number | null;
  rows: LogRow[];
  hasMore: boolean;
  nextCursor: string | null;
  prevCursor: string | null;
};

function parsePositiveInt(value: string | null, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n <= 0) return fallback;
  return Math.floor(n);
}

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

  const [query, setQuery] = useState<QueryState>(initial.query);
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

  const [rows, setRows] = useState<LogRow[]>(initial.rows);
  const [total, setTotal] = useState<number | null>(initial.total);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [nextCursor, setNextCursor] = useState<string | null>(initial.nextCursor);
  const [prevCursor, setPrevCursor] = useState<string | null>(initial.prevCursor);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const metaCacheRef = useRef(new LruCache<string, string | null>(100));
  const [metaById, setMetaById] = useState<Record<string, string | null>>({});
  const [isLoadingMeta, setIsLoadingMeta] = useState<Record<string, boolean>>({});

  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [exportsHasMore, setExportsHasMore] = useState(false);
  const [exportsNextCursor, setExportsNextCursor] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [jobDetailId, setJobDetailId] = useState<string | null>(null);
  const [jobDetail, setJobDetail] = useState<any>(null);
  const [isLoadingJobDetail, setIsLoadingJobDetail] = useState(false);

  const pageSize = initial.pageSize ?? DEFAULT_PAGE_SIZE;

  // (canPrev/canNext removed: buttons already use prevCursor/nextCursor + hasMore)

  useEffect(() => {
    const apply = () => {
      const q = readQueryFromLocation();
      setQuery(q);
      setActionInput(q.action);
      setQInput(q.q);
      setTargetUserIdInput(q.targetUserId);
      setTargetEmailInput(q.targetEmail);
      setResourceInput(q.resource);
      setStatusCodeInput(q.statusCode);
      setCreatedAtFromInput(q.createdAtFrom);
      setCreatedAtToInput(q.createdAtTo);
      setCreatedAtFromLocal(isoToLocalInput(q.createdAtFrom));
      setCreatedAtToLocal(isoToLocalInput(q.createdAtTo));
    };

    window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
  }, []);

  const loadExportJobs = async (opts?: { cursor?: string; append?: boolean }) => {
    const url = new URL("/api/admin/audit-logs/exports", window.location.origin);
    if (opts?.cursor) url.searchParams.set("cursor", opts.cursor);
    const res = await fetch(url.toString());
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (!res.ok) return;
    const body = (await res.json().catch(() => null)) as any;
    const jobs = Array.isArray(body?.jobs) ? (body.jobs as ExportJob[]) : [];
    const hasMore = Boolean(body?.hasMore);
    const nextCursor = typeof body?.nextCursor === "string" ? body.nextCursor : null;

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
      targetUserId: typeof (next as any).targetUserId === "string" ? (next as any).targetUserId : query.targetUserId,
      targetEmail: typeof (next as any).targetEmail === "string" ? (next as any).targetEmail : query.targetEmail,
      resource: typeof (next as any).resource === "string" ? (next as any).resource : query.resource,
      statusCode: typeof (next as any).statusCode === "string" ? (next as any).statusCode : query.statusCode,
      createdAtFrom: typeof (next as any).createdAtFrom === "string" ? (next as any).createdAtFrom : query.createdAtFrom,
      createdAtTo: typeof (next as any).createdAtTo === "string" ? (next as any).createdAtTo : query.createdAtTo,
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
      query.cursor === initial.query.cursor &&
      query.dir === initial.query.dir
    ) {
      return;
    }

    void (async () => {
      setIsLoading(true);
      setError(null);

      const url = new URL("/api/admin/audit-logs", window.location.origin);
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

      const res = await fetch(url.toString());
      if (!mounted) return;

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        setError("Forbidden: kamu tidak punya akses admin.");
        setRows([]);
        setTotal(0);
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
    query.cursor,
    query.dir,
    pageSize,
    router,
    initial.query.action,
    initial.query.q,
    initial.query.meta,
    initial.query.cursor,
    initial.query.dir,
  ]);

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h3>Audit Logs</h3>
            <p>Total: {total ?? "(cursor)"}</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button
              className="primary-btn"
              disabled={isExporting}
              onClick={async () => {
                setIsExporting(true);
                try {
                  const filters = {
                    action: query.action,
                    q: query.q,
                    meta: query.meta,
                    targetUserId: query.targetUserId,
                    targetEmail: query.targetEmail,
                    resource: query.resource,
                    statusCode: query.statusCode,
                    createdAtFrom: query.createdAtFrom,
                    createdAtTo: query.createdAtTo,
                  };

                  const res = await fetch("/api/admin/audit-logs/exports", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ filters }),
                  });

                  if (res.status === 401) {
                    router.push("/login");
                    return;
                  }

                  if (!res.ok) {
                    const body = (await res.json().catch(() => null)) as any;
                    setError(body?.message ? String(body.message) : "Gagal membuat export job.");
                    return;
                  }

                  await loadExportJobs();
                } finally {
                  setIsExporting(false);
                }
              }}
            >
              {isExporting ? "Exporting..." : "Export CSV (async)"}
            </button>

            <div style={{ fontSize: 12, opacity: 0.8, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {exportJobs.length ? `Exports: ${exportJobs[0].status}` : "No exports"}
              {exportJobs.find((j) => j.status === "completed") ? (
                <a
                  className="secondary-btn"
                  href={`/api/admin/audit-logs/exports/${exportJobs.find((j) => j.status === "completed")!.id}/download`}
                >
                  Download latest completed
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {jobDetailId ? (
        <div
          className="card"
          style={{ marginTop: 12, border: "1px solid rgba(0,0,0,0.12)", background: "rgba(255,255,255,0.7)" }}
        >
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ margin: 0 }}>Export Job Detail</h4>
            <button className="secondary-btn" onClick={() => {
              setJobDetailId(null);
              setJobDetail(null);
            }}>
              Close
            </button>
          </div>
          <div style={{ padding: 12, fontSize: 13 }}>
            {isLoadingJobDetail ? (
              <p>Loading...</p>
            ) : jobDetail ? (
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
{JSON.stringify(jobDetail, null, 2)}
              </pre>
            ) : (
              <p>Not found.</p>
            )}
          </div>
        </div>
      ) : null}

      {exportJobs.length ? (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="card-header">
            <h4 style={{ margin: 0 }}>Export Jobs (latest 20)</h4>
          </div>
          <div style={{ padding: 12 }}>
            <table>
              <thead>
                <tr>
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
                {exportJobs.map((j) => (
                  <tr key={j.id}>
                    <td>{new Date(j.createdAt).toLocaleString()}</td>
                    <td>{j.status}</td>
                    <td>{j.fileName ?? "-"}</td>
                    <td style={{ maxWidth: 320, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {summarizeFilters(j.filters)}
                    </td>
                    <td style={{ fontSize: 12, opacity: 0.9 }}>
                      {j.status === "running" || j.status === "pending" ? `${j.rowsWritten ?? 0} rows` : "-"}
                    </td>
                    <td style={{ maxWidth: 260, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {j.error ?? "-"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {j.status === "completed" ? (
                          <>
                            <a className="secondary-btn" href={`/api/admin/audit-logs/exports/${j.id}/download`}>
                              Download
                            </a>
                            <button
                              className="secondary-btn"
                              onClick={async () => {
                                const url = `${window.location.origin}/api/admin/audit-logs/exports/${j.id}/download`;
                                try {
                                  await navigator.clipboard.writeText(url);
                                } catch {
                                  // fallback
                                  window.prompt("Copy link:", url);
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
                          <button
                            className="secondary-btn"
                            onClick={async () => {
                              await fetch(`/api/admin/audit-logs/exports/${j.id}/retry`, { method: "POST" });
                              await loadExportJobs();
                            }}
                          >
                            Retry
                          </button>
                        ) : null}

                        <button
                          className="secondary-btn"
                          onClick={async () => {
                            setIsLoadingJobDetail(true);
                            setJobDetailId(j.id);
                            try {
                              const res = await fetch(`/api/admin/audit-logs/exports/${j.id}`);
                              const body = (await res.json().catch(() => null)) as any;
                              setJobDetail(body?.job ?? null);
                            } finally {
                              setIsLoadingJobDetail(false);
                            }
                          }}
                        >
                          Detail
                        </button>

                        <button className="secondary-btn" onClick={() => void loadExportJobs()}>
                          Refresh
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
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
              <button className="secondary-btn" onClick={() => void loadExportJobs()}>
                Refresh list
              </button>
            </div>
            <p style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
              Untuk memproses job export, jalankan `npm run audit:exports` (atau jadwalkan via cron).
            </p>
          </div>
        </div>
      ) : null}

      <div className="action-bar" style={{ justifyContent: "space-between", marginTop: 12 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            style={{ padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)", minWidth: 220 }}
            placeholder="Filter action (contains)"
            value={actionInput}
            onChange={(e) => setActionInput(e.target.value)}
          />
          <input
            style={{ padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)", minWidth: 220 }}
            placeholder="Cari (ip/action, meta opsional)"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
          />
          <input
            style={{ padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)", minWidth: 200 }}
            placeholder="targetUserId"
            value={targetUserIdInput}
            onChange={(e) => setTargetUserIdInput(e.target.value)}
          />
          <input
            style={{ padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)", minWidth: 200 }}
            placeholder="targetEmail"
            value={targetEmailInput}
            onChange={(e) => setTargetEmailInput(e.target.value)}
          />
          <input
            style={{ padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)", minWidth: 200 }}
            placeholder="resource"
            value={resourceInput}
            onChange={(e) => setResourceInput(e.target.value)}
          />
          <input
            style={{ padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)", minWidth: 140 }}
            placeholder="statusCode"
            value={statusCodeInput}
            onChange={(e) => setStatusCodeInput(e.target.value)}
          />
          <input
            type="datetime-local"
            style={{ padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)", minWidth: 220 }}
            value={createdAtFromLocal}
            onChange={(e) => {
              const v = e.target.value;
              setCreatedAtFromLocal(v);
              setCreatedAtFromInput(localInputToIso(v));
            }}
          />
          <input
            type="datetime-local"
            style={{ padding: 10, borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)", minWidth: 220 }}
            value={createdAtToLocal}
            onChange={(e) => {
              const v = e.target.value;
              setCreatedAtToLocal(v);
              setCreatedAtToInput(localInputToIso(v));
            }}
          />
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
          <button
            className="secondary-btn"
            onClick={() =>
              setUrlQuery({
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
              })
            }
            disabled={isLoading}
          >
            Filter
          </button>
          <button
            className="secondary-btn"
            onClick={() =>
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
              })
            }
            disabled={isLoading}
          >
            Reset
          </button>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            className="secondary-btn"
            onClick={() => {
              // to go prev, use the first row as cursor and dir=prev
              const cursor = prevCursor;
              if (!cursor) return;
              setUrlQuery({ cursor, dir: "prev" });
            }}
            disabled={isLoading || !prevCursor}
          >
            Prev
          </button>
          <span style={{ fontSize: 13, opacity: 0.8 }}>Cursor pagination</span>
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

      {error ? <div className="auth-form-error">{error}</div> : null}

      {isLoading ? (
        <p style={{ marginTop: 12 }}>Loading...</p>
      ) : rows.length === 0 ? (
        <p style={{ marginTop: 12, opacity: 0.8 }}>Belum ada audit log yang cocok.</p>
      ) : (
        <div className="table-container" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Action</th>
                <th>UserId</th>
                <th>IP</th>
                <th>Meta</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.createdAt).toLocaleString()}</td>
                  <td>{r.action}</td>
                  <td>{r.userId ?? "-"}</td>
                  <td>{r.ip ?? "-"}</td>
                  <td style={{ maxWidth: 520 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 360 }}>
                        {(expandedId === r.id ? metaById[r.id] ?? r.meta : r.metaPreview) ?? "-"}
                      </span>
                      <button
                        className="secondary-btn"
                        style={{ padding: "6px 10px", borderRadius: 10 }}
                        onClick={async () => {
                          if (expandedId === r.id) {
                            setExpandedId(null);
                            return;
                          }

                          setExpandedId(r.id);

                          // LRU cache lookup
                          const cached = metaCacheRef.current.get(r.id);
                          if (cached !== undefined) {
                            setMetaById((prev) => ({ ...prev, [r.id]: cached }));
                            return;
                          }

                          setIsLoadingMeta((prev) => ({ ...prev, [r.id]: true }));
                          try {
                            const res = await fetch(`/api/admin/audit-logs/${r.id}`);
                            if (res.status === 401) {
                              router.push("/login");
                              return;
                            }
                            if (!res.ok) {
                              metaCacheRef.current.set(r.id, null);
                              setMetaById((prev) => ({ ...prev, [r.id]: null }));
                              return;
                            }
                            const body = (await res.json().catch(() => null)) as any;
                            const meta = body?.log?.meta ?? body?.log?.metaPreview ?? null;
                            const value = typeof meta === "string" ? meta : null;
                            metaCacheRef.current.set(r.id, value);
                            setMetaById((prev) => ({ ...prev, [r.id]: value }));
                          } finally {
                            setIsLoadingMeta((prev) => ({ ...prev, [r.id]: false }));
                          }
                        }}
                        disabled={Boolean(isLoadingMeta[r.id])}
                      >
                        {expandedId === r.id ? "Hide" : isLoadingMeta[r.id] ? "Loading..." : "View"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
