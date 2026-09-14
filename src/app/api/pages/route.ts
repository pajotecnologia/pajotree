import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { AuditService } from "@/server/services/audit.service";

export async function GET() {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orgId = auth.organization.id;

    let page = await db.page.findFirst({
      where: { organizationId: orgId },
      include: {
        settings: true,
        links: {
          orderBy: { position: "asc" },
          include: { shortLinks: true },
        },
        blocks: {
          orderBy: { position: "asc" },
        },
      },
    });

    if (!page) {
      // Criar página inicial caso ainda não exista
      const slug = `empresa-${Date.now().toString(36)}`;
      page = await db.page.create({
        data: {
          organizationId: orgId,
          name: auth.organization.name,
          slug,
          title: `${auth.organization.name} | Link Oficial`,
          description: "Acesse nossos canais e links oficiais.",
          status: "PUBLISHED",
          settings: {
            create: {
              backgroundType: "gradient",
              backgroundValue: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
              primaryColor: "#6366f1",
              secondaryColor: "#ec4899",
              textColor: "#ffffff",
              buttonStyle: "rounded-xl",
              fontFamily: "Inter",
              layout: "classic",
            },
          },
        },
        include: {
          settings: true,
          links: { include: { shortLinks: true } },
          blocks: true,
        },
      });
    }

    const themes = await db.theme.findMany({
      where: { isGlobal: true },
    });

    return NextResponse.json({ page, themes });
  } catch (error: any) {
    console.error("Erro ao carregar página do editor:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, slug, title, description, settings } = body;

    const existingPage = await db.page.findFirst({
      where: { id, organizationId: auth.organization.id },
    });

    if (!existingPage) {
      return NextResponse.json({ error: "Página não encontrada" }, { status: 404 });
    }

    // Se o slug mudou, validar unicidade
    if (slug && slug !== existingPage.slug) {
      const slugExists = await db.page.findFirst({
        where: { slug, NOT: { id } },
      });
      if (slugExists) {
        return NextResponse.json(
          { error: "Este endereço (slug) já está sendo utilizado por outra página." },
          { status: 400 }
        );
      }
    }

    const updatedPage = await db.page.update({
      where: { id },
      data: {
        name: name || existingPage.name,
        slug: slug || existingPage.slug,
        title: title !== undefined ? title : existingPage.title,
        description: description !== undefined ? description : existingPage.description,
        settings: settings
          ? {
              upsert: {
                create: {
                  themeId: settings.themeId,
                  backgroundType: settings.backgroundType || "gradient",
                  backgroundValue: settings.backgroundValue || "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
                  primaryColor: settings.primaryColor || "#6366f1",
                  secondaryColor: settings.secondaryColor || "#ec4899",
                  textColor: settings.textColor || "#ffffff",
                  buttonStyle: settings.buttonStyle || "rounded-xl",
                  fontFamily: settings.fontFamily || "Inter",
                  layout: settings.layout || "classic",
                },
                update: {
                  themeId: settings.themeId,
                  backgroundType: settings.backgroundType,
                  backgroundValue: settings.backgroundValue,
                  primaryColor: settings.primaryColor,
                  secondaryColor: settings.secondaryColor,
                  textColor: settings.textColor,
                  buttonStyle: settings.buttonStyle,
                  fontFamily: settings.fontFamily,
                  layout: settings.layout,
                },
              },
            }
          : undefined,
      },
      include: {
        settings: true,
        links: { include: { shortLinks: true } },
        blocks: true,
      },
    });

    await AuditService.log({
      organizationId: auth.organization.id,
      userId: auth.user.id,
      action: "UPDATE_PAGE",
      entity: "Page",
      entityId: id,
    });

    return NextResponse.json({ success: true, page: updatedPage });
  } catch (error: any) {
    console.error("Erro ao atualizar página:", error);
    return NextResponse.json({ error: error.message || "Erro ao salvar página" }, { status: 500 });
  }
}
