import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import {
  getGlobalInterConfig,
  getInterOAuthToken,
  registrarWebhookInter,
  clearInterTokenCache,
  BancoInterConfig,
} from "@/lib/banco-inter";

export async function GET() {
  const auth = await getCurrentAuthContext();
  if (!auth || !auth.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const config = await getGlobalInterConfig();
  const configured = Boolean(
    config.clientId && config.clientSecret && config.certCrt && config.certKey
  );

  return NextResponse.json({
    configured,
    ambiente: config.ambiente,
    clientIdMasked: config.clientId ? `${config.clientId.substring(0, 6)}...` : "",
    hasCertCrt: Boolean(config.certCrt),
    hasCertKey: Boolean(config.certKey),
  });
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentAuthContext();
  if (!auth || !auth.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, clientId, clientSecret, certCrt, certKey, ambiente, webhookUrl } = body;

    const testConfig: BancoInterConfig = {
      clientId: clientId || process.env.BANCO_INTER_CLIENT_ID || "",
      clientSecret: clientSecret || process.env.BANCO_INTER_CLIENT_SECRET || "",
      certCrt: certCrt || process.env.BANCO_INTER_CERT_CRT || "",
      certKey: certKey || process.env.BANCO_INTER_CERT_KEY || "",
      ambiente: (ambiente as "PRODUCAO" | "SANDBOX") || "PRODUCAO",
    };

    if (action === "test_connection") {
      clearInterTokenCache();
      const token = await getInterOAuthToken(testConfig, "test_admin");
      return NextResponse.json({
        success: true,
        message: "Conexão mTLS e autenticação OAuth 2.0 estabelecidas com sucesso no Banco Inter!",
        tokenMasked: `${token.substring(0, 8)}...`,
      });
    }

    if (action === "register_webhook") {
      if (!webhookUrl) {
        return NextResponse.json({ error: "URL do Webhook é obrigatória." }, { status: 400 });
      }
      clearInterTokenCache();
      const res = await registrarWebhookInter(webhookUrl, testConfig);
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Falha na comunicação com o Banco Inter." },
      { status: 400 }
    );
  }
}
