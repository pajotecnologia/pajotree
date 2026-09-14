import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { BlockType } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { pageId, type, title, contentJson } = body;

    // Verificar se a página pertence à organização do usuário
    const page = await db.page.findFirst({
      where: { id: pageId, organizationId: auth.organization.id },
    });

    if (!page) {
      return NextResponse.json({ error: "Página não encontrada" }, { status: 404 });
    }

    // Obter última posição
    const lastBlock = await db.pageBlock.findFirst({
      where: { pageId },
      orderBy: { position: "desc" },
    });

    const position = lastBlock ? lastBlock.position + 1 : 0;

    const block = await db.pageBlock.create({
      data: {
        pageId,
        type: type as BlockType,
        title: title || null,
        contentJson: typeof contentJson === "string" ? contentJson : JSON.stringify(contentJson || {}),
        position,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ success: true, block });
  } catch (error: any) {
    console.error("Erro ao criar bloco:", error);
    return NextResponse.json({ error: error.message || "Erro ao criar bloco" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const blockId = searchParams.get("id");

    if (!blockId) {
      return NextResponse.json({ error: "ID do bloco obrigatório" }, { status: 400 });
    }

    const block = await db.pageBlock.findUnique({
      where: { id: blockId },
      include: { page: true },
    });

    if (!block || block.page.organizationId !== auth.organization.id) {
      return NextResponse.json({ error: "Bloco não encontrado" }, { status: 404 });
    }

    await db.pageBlock.delete({ where: { id: blockId } });

    return NextResponse.json({ success: true, message: "Bloco removido com sucesso" });
  } catch (error: any) {
    console.error("Erro ao deletar bloco:", error);
    return NextResponse.json({ error: "Erro ao excluir bloco" }, { status: 500 });
  }
}
