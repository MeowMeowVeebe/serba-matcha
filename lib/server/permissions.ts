// Central list of permissions used in the app.
// Keep these stable because they may be stored in DB.

export const PERMISSIONS = {
  ADMIN_USERS_READ: "admin.users.read",
  ADMIN_USERS_WRITE: "admin.users.write",
  ADMIN_AUDIT_READ: "admin.audit.read",
  ADMIN_ROLES_WRITE: "admin.roles.write",
} as const;

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
