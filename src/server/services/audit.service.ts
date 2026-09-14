import { db } from "@/lib/db";

export class AuditService {
  static async log(params: {
    organizationId?: string | null;
    userId?: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    metadata?: Record<string, any> | null;
  }) {
    try {
      await db.auditLog.create({
        data: {
          organizationId: params.organizationId || null,
          userId: params.userId || null,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId || null,
          metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        },
      });
    } catch (err) {
      console.error("Erro ao registrar log de auditoria:", err);
    }
  }
}
