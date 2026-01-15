import { PERMISSIONS } from "./permissions";
import { grantPermissionToRole } from "./rbac";

// Safe to call multiple times; operations are idempotent.
export async function ensureDefaultAdminPermissions() {
  await grantPermissionToRole({ roleName: "admin", permissionName: PERMISSIONS.ADMIN_USERS_READ });
  await grantPermissionToRole({ roleName: "admin", permissionName: PERMISSIONS.ADMIN_USERS_WRITE });
  await grantPermissionToRole({ roleName: "admin", permissionName: PERMISSIONS.ADMIN_AUDIT_READ });
  await grantPermissionToRole({ roleName: "admin", permissionName: PERMISSIONS.ADMIN_ROLES_WRITE });
}
