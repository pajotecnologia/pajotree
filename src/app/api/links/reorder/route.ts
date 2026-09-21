import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { AuditService } from "@/server/services/audit.service";
import { z } from "zod";

const reorderSchema = z.object({
  linkIds: z.array(z.string()).min(1, "Lista de IDs é obrigatória"),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orgId = auth.organization.id;
    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { linkIds } = parsed.data;

    // Atualiza a posição de cada link em lote dentro de uma transação
    await db.$transaction(
      linkIds.map((id, index) =>
        db.link.updateMany({
          where: {
            id,
            organizationId: orgId,
          },
          data: {
            position: index,
          },
        })
      )
    );

    await AuditService.log({
      organizationId: orgId,
      userId: auth.user.id,
      action: "REORDER_LINKS",
      entity: "Link",
      metadata: { totalLinks: linkIds.length, order: linkIds },
    });

    return NextResponse.json({ success: true, message: "Ordem atualizada com sucesso" });
  } catch (error: any) {
    console.error("Erro ao reordenar links:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno ao reordenar links" },
      { status: 500 }
    );
  }
}
