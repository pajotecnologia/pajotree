import https from "https";
import querystring from "querystring";
import { db } from "@/lib/db";

export interface BancoInterConfig {
  clientId: string;
  clientSecret: string;
  certCrt: string;
  certKey: string;
  ambiente: "PRODUCAO" | "SANDBOX";
  contaCorrente?: string;
  ativo?: boolean;
}

export interface BolepixResponse {
  codigoSolicitacao: string;
  nossoNumero?: string;
  codigoBarras?: string;
  linhaDigitavel?: string;
  pixCopiaECola?: string;
  situacao?: string;
  dataVencimento?: string;
  valorNominal?: number;
}

const INTER_URLS = {
  PRODUCAO: "https://cdpj.partners.bancointer.com.br",
  SANDBOX: "https://cdpj-sandbox.partners.uatinter.co",
};

// Cache de Token OAuth em memória
const tokenCache = new Map<string, { accessToken: string; expiresAt: number }>();

export function clearInterTokenCache(key: string = "global") {
  tokenCache.delete(key);
}

/**
 * Normaliza os arquivos PEM (.crt e .key), corrigindo quebras de linha e inversões acidentais
 */
export function normalizarCertificados(crt: string, key: string): { cert: string; key: string } {
  let certClean = crt.trim().replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  let keyClean = key.trim().replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  if (certClean.includes("PRIVATE KEY") && keyClean.includes("CERTIFICATE")) {
    const temp = certClean;
    certClean = keyClean;
    keyClean = temp;
  }

  return { cert: certClean, key: keyClean };
}

/**
 * Cria o agente HTTPS com suporte mTLS e cifras compatíveis com o Banco Inter
 */
export function createInterHttpsAgent(certCrt: string, certKey: string): https.Agent {
  const { cert, key } = normalizarCertificados(certCrt, certKey);

  return new https.Agent({
    cert,
    key,
    minVersion: "TLSv1.2",
    maxVersion: "TLSv1.3",
    ciphers: "DEFAULT:@SECLEVEL=1",
    rejectUnauthorized: true,
    keepAlive: true,
  });
}

/**
 * Executa requisição HTTP nativa com mTLS
 */
export async function makeInterRequest<T = any>({
  url,
  method,
  headers = {},
  body,
  agent,
  isBinary = false,
}: {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
  agent: https.Agent;
  isBinary?: boolean;
}): Promise<{ status: number; data: T }> {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(url);
      let payloadData: string | undefined = undefined;
      const requestHeaders: Record<string, string> = { ...headers };

      if (body) {
        if (typeof body === "string") {
          payloadData = body;
        } else if (headers["Content-Type"] === "application/x-www-form-urlencoded") {
          payloadData = querystring.stringify(body);
        } else {
          payloadData = JSON.stringify(body);
          if (!requestHeaders["Content-Type"]) requestHeaders["Content-Type"] = "application/json";
        }
        requestHeaders["Content-Length"] = Buffer.byteLength(payloadData).toString();
      }

      const req = https.request(
        {
          hostname: parsedUrl.hostname,
          port: 443,
          path: `${parsedUrl.pathname}${parsedUrl.search}`,
          method,
          headers: requestHeaders,
          agent,
          timeout: 30000,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
          res.on("end", () => {
            const bufferResult = Buffer.concat(chunks);
            const status = res.statusCode || 500;

            if (isBinary) {
              return resolve({ status, data: bufferResult as unknown as T });
            }

            const responseText = bufferResult.toString("utf-8");
            try {
              const json = responseText ? JSON.parse(responseText) : {};
              resolve({ status, data: json });
            } catch {
              resolve({ status, data: responseText as unknown as T });
            }
          });
        }
      );

      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Tempo limite de conexão esgotado com o Banco Inter (30s)."));
      });

      req.on("error", (err) => reject(new Error(`Falha na conexão mTLS: ${err.message}`)));

      if (payloadData) req.write(payloadData);
      req.end();
    } catch (err: any) {
      reject(err);
    }
  });
}

/**
 * Obtém a configuração global do Banco Inter (das variáveis de ambiente ou persistência)
 */
export async function getGlobalInterConfig(): Promise<BancoInterConfig> {
  const envClientId = process.env.BANCO_INTER_CLIENT_ID || "";
  const envClientSecret = process.env.BANCO_INTER_CLIENT_SECRET || "";
  const envCertCrt = process.env.BANCO_INTER_CERT_CRT || "";
  const envCertKey = process.env.BANCO_INTER_CERT_KEY || "";
  const envAmbiente = (process.env.BANCO_INTER_AMBIENTE as "PRODUCAO" | "SANDBOX") || "PRODUCAO";

  return {
    clientId: envClientId,
    clientSecret: envClientSecret,
    certCrt: envCertCrt,
    certKey: envCertKey,
    ambiente: envAmbiente,
    ativo: Boolean(envClientId && envClientSecret && envCertCrt && envCertKey),
  };
}

/**
 * Obtém o Bearer Token OAuth 2.0 (com renovação automática e cache em memória)
 */
export async function getInterOAuthToken(config: BancoInterConfig, cacheKey: string = "global"): Promise<string> {
  const cached = tokenCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now() + 60000) {
    return cached.accessToken;
  }

  if (!config.clientId || !config.clientSecret || !config.certCrt || !config.certKey) {
    throw new Error("Credenciais do Banco Inter incompletas (Client ID, Secret e Certificados necessários).");
  }

  const agent = createInterHttpsAgent(config.certCrt, config.certKey);
  const baseUrl = config.ambiente === "SANDBOX" ? INTER_URLS.SANDBOX : INTER_URLS.PRODUCAO;

  const bodyData = {
    client_id: config.clientId.trim(),
    client_secret: config.clientSecret.trim(),
    grant_type: "client_credentials",
    scope: "boleto-cobranca.read boleto-cobranca.write",
  };

  const res = await makeInterRequest<{ access_token?: string; expires_in?: number; error_description?: string }>({
    url: `${baseUrl}/oauth/v2/token`,
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: bodyData,
    agent,
  });

  if (res.status === 200 && res.data?.access_token) {
    const expiresIn = Number(res.data.expires_in || 3600);
    tokenCache.set(cacheKey, {
      accessToken: res.data.access_token,
      expiresAt: Date.now() + expiresIn * 1000,
    });
    return res.data.access_token;
  }

  throw new Error(`Falha OAuth 2.0 Banco Inter (${res.status}): ${res.data?.error_description || JSON.stringify(res.data)}`);
}

/**
 * 1. Emite a Cobrança no Banco Inter (Bolepix / Boleto Híbrido com Pix)
 */
export async function emitirBolepixInter({
  identifier,
  valor,
  dataVencimento,
  pagador,
  mensagem1,
  mensagem2,
  config,
}: {
  identifier: string;
  valor: number;
  dataVencimento: string; // YYYY-MM-DD
  pagador: {
    nome: string;
    cpfCnpj: string;
    email?: string;
    telefone?: string;
    endereco?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  };
  mensagem1?: string;
  mensagem2?: string;
  config?: BancoInterConfig;
}): Promise<BolepixResponse> {
  const activeConfig = config || (await getGlobalInterConfig());

  const valorNominal = Number(valor.toFixed(2));
  if (valorNominal < 2.50) {
    throw new Error("O valor mínimo para emissão de boleto bancário no Banco Inter é de R$ 2,50.");
  }

  const cpfCnpjLimpo = (pagador.cpfCnpj || "").replace(/\D/g, "");
  const tipoPessoa = cpfCnpjLimpo.length === 14 ? "JURIDICA" : "FISICA";

  const hojeStr = new Date().toISOString().split("T")[0];
  let vencimentoIso = dataVencimento;
  if (!vencimentoIso || vencimentoIso < hojeStr) vencimentoIso = hojeStr;

  // Formatação de DDD e Telefone
  const telNumeros = pagador.telefone ? pagador.telefone.replace(/\D/g, "") : "";
  let ddd = undefined;
  let telefone = undefined;
  if (telNumeros.length >= 10) {
    ddd = telNumeros.substring(0, 2);
    telefone = telNumeros.substring(2, 11);
  } else if (telNumeros.length > 0) {
    telefone = telNumeros.substring(0, 9);
  }

  const token = await getInterOAuthToken(activeConfig);
  const agent = createInterHttpsAgent(activeConfig.certCrt, activeConfig.certKey);
  const baseUrl = activeConfig.ambiente === "SANDBOX" ? INTER_URLS.SANDBOX : INTER_URLS.PRODUCAO;

  const seuNumero = identifier.replace(/[^a-zA-Z0-9]/g, "").substring(0, 15);

  const payloadInter = {
    seuNumero,
    valorNominal,
    dataVencimento: vencimentoIso,
    numDiasAgendaRecebimento: 60,
    pagador: {
      cpfCnpj: cpfCnpjLimpo || "00000000000",
      tipoPessoa,
      nome: pagador.nome.substring(0, 100),
      endereco: (pagador.endereco || "Endereco Principal").substring(0, 100),
      bairro: (pagador.bairro || "Centro").substring(0, 60),
      cidade: (pagador.cidade || "Sao Paulo").substring(0, 60),
      uf: (pagador.uf || "SP").substring(0, 2),
      cep: (pagador.cep || "01001000").replace(/\D/g, "").substring(0, 8),
      email: pagador.email || undefined,
      ddd,
      telefone,
    },
    mensagem: {
      linha1: mensagem1 || "Assinatura Pajotree SaaS",
      linha2: mensagem2 || "Pagamento via Bolepix / Pix",
    },
  };

  const res = await makeInterRequest<{ codigoSolicitacao?: string; violacoes?: Array<{ razao: string }> }>({
    url: `${baseUrl}/cobranca/v3/cobrancas`,
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: payloadInter,
    agent,
  });

  if (res.status !== 200 && res.status !== 201) {
    const errMsg = res.data?.violacoes?.map((v) => v.razao).join("; ") || JSON.stringify(res.data);
    throw new Error(`Erro Banco Inter (${res.status}): ${errMsg}`);
  }

  const codigoSolicitacao = res.data.codigoSolicitacao!;

  // 2. Consulta imediatamente os dados completos (Linha digitável e Pix)
  const detalhes = await consultarBolepixInter(codigoSolicitacao, activeConfig);

  return {
    codigoSolicitacao,
    nossoNumero: detalhes.nossoNumero,
    codigoBarras: detalhes.codigoBarras,
    linhaDigitavel: detalhes.linhaDigitavel,
    pixCopiaECola: detalhes.pixCopiaECola,
    situacao: detalhes.situacao,
    dataVencimento: detalhes.dataVencimento,
    valorNominal: detalhes.valorNominal,
  };
}

/**
 * 2. Consulta Detalhes de uma Cobrança
 */
export async function consultarBolepixInter(codigoSolicitacao: string, config?: BancoInterConfig) {
  const activeConfig = config || (await getGlobalInterConfig());
  const token = await getInterOAuthToken(activeConfig);
  const agent = createInterHttpsAgent(activeConfig.certCrt, activeConfig.certKey);
  const baseUrl = activeConfig.ambiente === "SANDBOX" ? INTER_URLS.SANDBOX : INTER_URLS.PRODUCAO;

  const res = await makeInterRequest({
    url: `${baseUrl}/cobranca/v3/cobrancas/${codigoSolicitacao}`,
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    agent,
  });

  if (res.status !== 200) throw new Error(`Falha ao consultar cobrança (${res.status})`);

  return {
    codigoSolicitacao,
    situacao: res.data.cobranca?.situacao || res.data.situacao,
    dataVencimento: res.data.cobranca?.dataVencimento,
    valorNominal: res.data.cobranca?.valorNominal,
    valorTotalRecebido: res.data.cobranca?.valorTotalRecebido || res.data.cobranca?.valorRecebido,
    dataPagamento: res.data.cobranca?.dataHoraSituacao || res.data.cobranca?.dataPagamento,
    linhaDigitavel: res.data.boleto?.linhaDigitavel || res.data.linhaDigitavel,
    codigoBarras: res.data.boleto?.codigoBarras || res.data.codigoBarras,
    nossoNumero: res.data.boleto?.nossoNumero || res.data.nossoNumero,
    pixCopiaECola: res.data.pix?.pixCopiaECola || res.data.pixCopiaECola,
  };
}

/**
 * 3. Download do PDF Oficial (Sem x-conta-corrente)
 */
export async function baixarPdfBoletoInter(codigoSolicitacao: string, config?: BancoInterConfig): Promise<string> {
  const activeConfig = config || (await getGlobalInterConfig());
  const token = await getInterOAuthToken(activeConfig);
  const agent = createInterHttpsAgent(activeConfig.certCrt, activeConfig.certKey);
  const baseUrl = activeConfig.ambiente === "SANDBOX" ? INTER_URLS.SANDBOX : INTER_URLS.PRODUCAO;

  const res = await makeInterRequest({
    url: `${baseUrl}/cobranca/v3/cobrancas/${codigoSolicitacao}/pdf`,
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    agent,
    isBinary: true,
  });

  if (res.status !== 200) throw new Error(`Erro ao baixar PDF (${res.status})`);

  const buffer = res.data as unknown as Buffer;
  if (buffer.toString("utf-8").startsWith("{")) {
    const json = JSON.parse(buffer.toString("utf-8"));
    if (json.pdf) return json.pdf;
  }

  return buffer.toString("base64");
}

/**
 * 4. Registro de Webhook no Banco Inter (Retorna HTTP 204)
 */
export async function registrarWebhookInter(webhookUrl: string, config?: BancoInterConfig) {
  const activeConfig = config || (await getGlobalInterConfig());
  const token = await getInterOAuthToken(activeConfig);
  const agent = createInterHttpsAgent(activeConfig.certCrt, activeConfig.certKey);
  const baseUrl = activeConfig.ambiente === "SANDBOX" ? INTER_URLS.SANDBOX : INTER_URLS.PRODUCAO;

  const res = await makeInterRequest({
    url: `${baseUrl}/cobranca/v3/cobrancas/webhook`,
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: { webhookUrl },
    agent,
  });

  if (res.status !== 200 && res.status !== 204) {
    throw new Error(`Erro ao registrar Webhook (${res.status}): ${JSON.stringify(res.data)}`);
  }

  return { success: true, message: "Webhook registrado com sucesso no Banco Inter!" };
}
