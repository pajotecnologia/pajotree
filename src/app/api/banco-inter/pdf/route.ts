import { NextRequest, NextResponse } from "next/server";
import { baixarPdfBoletoInter } from "@/lib/banco-inter";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get("paymentId");
  const codigoSolicitacao = searchParams.get("codigoSolicitacao");

  let codSol = codigoSolicitacao || "";

  if (paymentId) {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
    });
    if (payment && payment.externalId) {
      codSol = payment.externalId;
    }
  }

  if (!codSol) {
    return NextResponse.json({ error: "Código de solicitação ou pagamento não informado." }, { status: 400 });
  }

  try {
    const pdfBase64 = await baixarPdfBoletoInter(codSol);
    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="boleto_${codSol}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Erro ao baixar PDF Banco Inter:", error);
    return NextResponse.json(
      { error: error.message || "Não foi possível gerar o PDF do boleto." },
      { status: 500 }
    );
  }
}
