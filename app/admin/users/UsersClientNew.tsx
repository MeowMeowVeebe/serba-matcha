"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { useAlert } from "@/context/AlertContext";

type User = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  roles: string[];
};

export default function UsersClientNew() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(
          data.users.map((user: { id: string; email: string; name: string | null; createdAt: string; userRoles: Array<{ role: { name: string } }> }) => ({
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: new Date(user.createdAt).toLocaleDateString("id-ID"),
            roles: user.userRoles.map((ur: any) => ur.role.name),
          }))
        );
      } else {
        showAlert("Failed to fetch users", { variant: "error" });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      showAlert("An error occurred while fetching users", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUsers = async (selectedUsers: User[]) => {
    if (!confirm(`Delete ${selectedUsers.length} user(s)?`)) return;

    try {
      const results = await Promise.all(
        selectedUsers.map((user) =>
          fetch(`/api/admin/users`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id }),
          })
        )
      );

      const allSuccess = results.every((r) => r.ok);
      if (allSuccess) {
        showAlert("Users deleted successfully", { variant: "success" });
        fetchUsers();
      } else {
        showAlert("Some users could not be deleted", { variant: "error" });
      }
    } catch (error) {
      console.error("Error deleting users:", error);
      showAlert("An error occurred while deleting users", { variant: "error" });
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (value, row) => value || <span style={{ color: "var(--color-text-tertiary)" }}>No name</span>,
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      filterable: false,
    },
    {
      key: "roles",
      label: "Roles",
      filterable: true,
      filterOptions: [
        { value: "admin", label: "Admin" },
        { value: "user", label: "User" },
      ],
      render: (roles: string[]) => (
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {roles.length > 0 ? (
            roles.map((role) => (
              <Badge key={role} variant={role === "admin" ? "primary" : "default"} size="sm">
                {role}
              </Badge>
            ))
          ) : (
            <Badge variant="default" size="sm">
              no role
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Created At",
      sortable: true,
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card variant="flat" padding="none">
        <CardHeader
          title="User Management"
          description="Manage users and their roles"
          action={
            <Button size="sm" variant="primary" onClick={() => router.push("/admin/users/create")}>
              + Add User
            </Button>
          }
        />
        <div style={{ padding: "16px" }}>
          <DataTable
            data={users}
            columns={columns}
            keyField="id"
            isLoading={loading}
            searchPlaceholder="Search users by name or email..."
            onRowClick={(user) => router.push(`/admin/users/${user.id}`)}
            selectable
            bulkActions={[
              {
                label: "Delete Selected",
                action: handleDeleteUsers,
                variant: "danger",
              },
            ]}
            emptyState={
              <div style={{ textAlign: "center", padding: "48px" }}>
                <p>No users found</p>
              </div>
            }
          />
        </div>
      </Card>
    </div>
  );
}
