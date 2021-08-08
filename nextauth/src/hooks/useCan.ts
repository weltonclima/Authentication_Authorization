import { useAuth } from "../Contexts/AuthContext"
import { validateUserPermissionParams } from "../utils/validateUserPermission";

type useCanProps = {
  permissions?: string[];
  roles?: string[];
}
export function useCan({ permissions = [], roles = [] }: useCanProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return false;
  }

  const userHasValidPermissions = validateUserPermissionParams({
    user, permissions, roles
  })

  return userHasValidPermissions;
}