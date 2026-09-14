import { getCurrentAuthContext } from "@/lib/auth";
import { apiError } from "@/lib/api-response";

export async function requireAuth() {
  const context = await getCurrentAuthContext();
  if (!context) {
    return { context: null, response: apiError("UNAUTHORIZED", "Não autenticado.", 401) } as const;
  }
  return { context, response: null } as const;
}

export async function requireOrganizationAccess(organizationId?: string) {
  const result = await requireAuth();
  if (!result.context) return result;

  const { context } = result;
  if (!organizationId || context.isSuperAdmin || context.organization?.id === organizationId) {
    return { context, response: null } as const;
  }

  return {
    context: null,
    response: apiError("FORBIDDEN", "Acesso negado à organização solicitada.", 403),
  } as const;
}

export async function requirePermission(permission: string) {
  const result = await requireAuth();
  if (!result.context) return result;

  if (result.context.isSuperAdmin || result.context.permissions.includes(permission)) {
    return result;
  }

  return {
    context: null,
    response: apiError("FORBIDDEN", "Você não possui permissão para executar esta ação.", 403),
  } as const;
}
