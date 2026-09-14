import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const eventos = Array.isArray(payload) ? payload : [payload];

    for (const evento of eventos) {
      const codigoSolicitacao = evento.codigoSolicitacao;
      const situacao = evento.situacao; // "RECEBIDO" ou "PAGO"

      if (codigoSolicitacao && (situacao === "RECEBIDO" || situacao === "PAGO")) {
        const payment = await db.payment.findFirst({
          where: { externalId: codigoSolicitacao },
          include: {
            organization: true,
            subscription: { include: { plan: true } },
          },
        });

        if (payment && payment.status !== "PAID") {
          const now = new Date();
          const paidAmount = evento.valorTotalRecebido ? Number(evento.valorTotalRecebido) : Number(payment.amount);

          // 1. Atualiza o status do pagamento
          await db.payment.update({
            where: { id: payment.id },
            data: {
              status: "PAID",
              paymentMethod: evento.origemRecebimento === "PIX" ? "pix" : "boleto",
            },
          });

          // 2. Se for vinculado a uma assinatura/organização, ativa e estende período
          if (payment.organizationId) {
            const org = payment.organization;
            let planId = org.planId;

            if (payment.subscription) {
              planId = payment.subscription.planId;
              const isYearly = payment.subscription.billingCycle === "yearly";
              const nextPeriodEnd = new Date(now);
              if (isYearly) {
                nextPeriodEnd.setFullYear(nextPeriodEnd.getFullYear() + 1);
              } else {
                nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
              }

              await db.subscription.update({
                where: { id: payment.subscription.id },
                data: {
                  status: "ACTIVE",
                  currentPeriodStart: now,
                  currentPeriodEnd: nextPeriodEnd,
                },
              });
            }

            // Ativa a organização
            await db.organization.update({
              where: { id: org.id },
              data: {
                status: "ACTIVE",
                ...(planId ? { planId } : {}),
              },
            });

            // Cria notificação de confirmação
            await db.notification.create({
              data: {
                organizationId: org.id,
                type: "billing_success",
                title: "Pagamento Confirmado via Banco Inter",
                message: `Seu pagamento no valor de R$ ${paidAmount.toFixed(2).replace(".", ",")} foi compensado e seu plano está 100% ativo!`,
                link: "/app/billing",
              },
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: "Webhook processado com sucesso" });
  } catch (error: any) {
    console.error("Erro no processamento do webhook Banco Inter:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
