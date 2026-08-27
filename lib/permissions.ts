import type { SystemPermissionName } from "@prouni/shared";

export interface PermissionAwareUser {
  role: string;
  permissions?: readonly SystemPermissionName[];
}

export function hasSystemPermission(
  user: PermissionAwareUser | null | undefined,
  permission: SystemPermissionName,
): boolean {
  return Boolean(
    user &&
      (user.role === "ADMIN" || user.permissions?.includes(permission)),
  );
}

export function canManageSchedule(
  user: PermissionAwareUser | null | undefined,
): boolean {
  return Boolean(
    user && (user.role === "ADMIN" || user.role === "ANALYST"),
  );
}
