import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.EMAIL_FROM || "TRAMA <noreply@trama.app.br>";
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

type SendResult = { success: boolean; error?: string };

export async function sendInviteEmail(params: {
  to: string;
  token: string;
  inviterName: string;
  plan: string;
  message?: string | null;
}): Promise<SendResult> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY não configurada. Email não enviado para:", params.to);
    return { success: false, error: "Serviço de email não configurado" };
  }

  const inviteUrl = `${APP_URL}/convite/${params.token}`;
  const planLabels: Record<string, string> = {
    FREE: "Free",
    PRO: "Pro",
    TEAM: "Team",
  };
  const planLabel = planLabels[params.plan] || params.plan;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `${params.inviterName} te convidou para o TRAMA`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e7e5e4;overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background:#6366f1;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:900;letter-spacing:-0.5px;">trama</h1>
              <p style="margin:8px 0 0;color:#c7d2fe;font-size:13px;">Pesquisa qualitativa que se compõe</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <h2 style="margin:0 0 8px;color:#1c1917;font-size:18px;font-weight:600;">Você foi convidado!</h2>
              <p style="margin:0 0 24px;color:#78716c;font-size:14px;line-height:1.6;">
                <strong style="color:#44403c;">${params.inviterName}</strong> te convidou para usar o TRAMA, 
                uma plataforma de análise qualitativa de dados.
              </p>
              
              ${params.message ? `
              <div style="background:#fafaf9;border-left:3px solid #c97b5d;padding:12px 16px;margin:0 0 24px;border-radius:0 8px 8px 0;">
                <p style="margin:0;color:#57534e;font-size:13px;font-style:italic;line-height:1.5;">"${params.message}"</p>
              </div>
              ` : ""}
              
              <!-- Plan badge -->
              <div style="background:#eef2ff;border-radius:8px;padding:12px 16px;margin:0 0 24px;text-align:center;">
                <p style="margin:0 0 4px;color:#78716c;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Plano atribuído</p>
                <p style="margin:0;color:#6366f1;font-size:18px;font-weight:600;">${planLabel}</p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align:center;margin:0 0 24px;">
                <a href="${inviteUrl}" style="display:inline-block;background:#6366f1;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
                  Aceitar convite e criar conta
                </a>
              </div>
              
              <p style="margin:0 0 8px;color:#a8a29e;font-size:12px;text-align:center;">
                Este convite expira em 7 dias.
              </p>
              <p style="margin:0;color:#d6d3d1;font-size:11px;text-align:center;word-break:break-all;">
                Se o botão não funcionar, copie e cole este link no navegador:<br/>
                <a href="${inviteUrl}" style="color:#6366f1;">${inviteUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background:#fafaf9;padding:20px 40px;border-top:1px solid #e7e5e4;text-align:center;">
              <p style="margin:0;color:#a8a29e;font-size:11px;">
                trama.app.br — Pesquisa qualitativa que se compõe
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
    });

    if (error) {
      console.error("[email] Erro ao enviar convite para", params.to, error);
      return { success: false, error: error.message };
    }

    console.log("[email] Convite enviado para", params.to);
    return { success: true };
  } catch (err: any) {
    console.error("[email] Exceção ao enviar email:", err);
    return { success: false, error: err.message || "Erro desconhecido" };
  }
}
