import { NextResponse } from "next/server";
import { ensureDatabaseSchema } from "@/lib/db-migrate";

export async function GET() {
  try {
    await ensureDatabaseSchema();
    return NextResponse.json({
      success: true,
      message: "Todas as colunas e tabelas do banco de dados foram sincronizadas com sucesso!",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || "Erro desconhecido ao sincronizar banco",
    }, { status: 500 });
  }
}
