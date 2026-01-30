"use client";

import { useState, useEffect } from "react";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { useAlert } from "@/context/AlertContext";

type AuditLog = {
  id: string;
  action: string;
  status: string;
  timestamp: string;
  userEmail: string | null;
  ipAddress: string | null;
};

export default function AuditLogsClientNew() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/audit-logs");
      if (response.ok) {
        const data = await response.json();
        setLogs(
          data.logs.map((log: { id: string; action: string; status: string; timestamp: string; user: { email: string } | null; ipAddress: string | null }) => ({
            id: log.id,
            action: log.action,
            status: log.status,
            timestamp: new Date(log.timestamp).toLocaleString("id-ID"),
            userEmail: log.user?.email || null,
            ipAddress: log.ipAddress,
          }))
        );
      } else {
        showAlert("Failed to fetch audit logs", { variant: "error" });
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      showAlert("An error occurred while fetching logs", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleExportLogs = async () => {
    try {
      const response = await fetch("/api/admin/audit-logs/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: "csv",
          filters: {},
        }),
      });

      if (response.ok) {
        showAlert("Export job created successfully", { variant: "success" });
      } else {
        showAlert("Failed to create export job", { variant: "error" });
      }
    } catch (error) {
      console.error("Error creating export:", error);
      showAlert("An error occurred while creating export", { variant: "error" });
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      "auth:login": "Login",
      "auth:logout": "Logout",
      "auth:register": "Register",
      "auth:password_reset": "Password Reset",
      "user:update": "Update Profile",
      "user:delete": "Delete User",
    };
    return labels[action] || action;
  };

  const columns: ColumnDef<AuditLog>[] = [
    {
      key: "action",
      label: "Action",
      sortable: true,
      filterable: true,
      filterOptions: [
        { value: "auth:login", label: "Login" },
        { value: "auth:logout", label: "Logout" },
        { value: "auth:register", label: "Register" },
        { value: "auth:password_reset", label: "Password Reset" },
      ],
      render: (value) => getActionLabel(value),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      filterable: true,
      filterOptions: [
        { value: "success", label: "Success" },
        { value: "failure", label: "Failure" },
      ],
      render: (value) => (
        <Badge variant={value === "success" ? "success" : "danger"} size="sm">
          {value}
        </Badge>
      ),
    },
    {
      key: "userEmail",
      label: "User",
      sortable: true,
      render: (value) => value || <span style={{ color: "var(--color-text-tertiary)" }}>System</span>,
    },
    {
      key: "ipAddress",
      label: "IP Address",
      sortable: false,
      render: (value) => value || "-",
    },
    {
      key: "timestamp",
      label: "Timestamp",
      sortable: true,
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card variant="flat" padding="none">
        <CardHeader
          title="Audit Logs"
          description="System activity and security logs"
          action={
            <Button size="sm" variant="secondary" onClick={handleExportLogs}>
              📥 Export Logs
            </Button>
          }
        />
        <div style={{ padding: "16px" }}>
          <DataTable
            data={logs}
            columns={columns}
            keyField="id"
            isLoading={loading}
            searchPlaceholder="Search logs by action, user, or IP..."
            pageSize={20}
            emptyState={
              <div style={{ textAlign: "center", padding: "48px" }}>
                <p>No audit logs found</p>
              </div>
            }
          />
        </div>
      </Card>
    </div>
  );
}
