import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  action: "send_signature_link" | "notify_signature" | "notify_fully_signed";
  contractId: string;
  recipientEmail?: string;
  recipientName?: string;
  signatureLink?: string;
}

// Koraflow brand colors
const COLORS = {
  primary: "#667eea",
  secondary: "#764ba2",
  success: "#10b981",
  text: "#374151",
  textLight: "#6b7280",
  background: "#f9fafb",
  white: "#ffffff",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // JWT auth — validate caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAnon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: NotificationRequest = await req.json();
    const { action, contractId, recipientEmail, recipientName, signatureLink } = body;

    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select(`
        id,
        title,
        value,
        end_date,
        signature_link_token,
        signature_link_expires_at,
        koraflow_signed_at,
        koraflow_signer_name,
        client_id,
        clients(company, name, email)
      `)
      .eq("id", contractId)
      .single();

    if (contractError || !contract) {
      throw new Error("Contrato não encontrado");
    }

    const baseUrl = Deno.env.get("APP_URL") || "https://koraflow.com.br";
    const fromEmail = Deno.env.get("FROM_EMAIL") || "noreply@koraflow.com.br";
    const fromName = "Koraflow";

    const link = signatureLink || `${baseUrl}/sign/${contract.signature_link_token}`;

    let emailSubject = "";
    let emailBody = "";

    switch (action) {
      case "send_signature_link":
        emailSubject = `📝 Assinatura de Contrato - ${contract.title}`;
        emailBody = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Assinatura de Contrato</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: ${COLORS.background};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%); padding: 40px 30px; text-align: center;">
        <h1 style="color: ${COLORS.white}; margin: 0; font-size: 28px; font-weight: 700;">Koraflow</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Assinatura Digital de Contrato</p>
      </td>
    </tr>

    <!-- Content -->
    <tr>
      <td style="background-color: ${COLORS.white}; padding: 40px 30px;">
        <p style="color: ${COLORS.text}; font-size: 16px; margin: 0 0 20px 0;">
          Olá, <strong>${recipientName || "Cliente"}!</strong>
        </p>

        <p style="color: ${COLORS.text}; font-size: 16px; margin: 0 0 30px 0;">
          Você recebeu uma solicitação de assinatura para o contrato <strong>${contract.title}</strong> da agência <strong>Koraflow</strong>.
        </p>

        <!-- Contract Details Card -->
        <table role="presentation" width="100%" style="background-color: ${COLORS.background}; border-radius: 12px; margin-bottom: 30px;">
          <tr>
            <td style="padding: 25px;">
              <p style="color: ${COLORS.textLight}; font-size: 14px; margin: 0 0 5px 0;">Valor do Contrato</p>
              <p style="color: ${COLORS.text}; font-size: 28px; font-weight: 700; margin: 0 0 15px 0;">${contract.value}</p>

              <p style="color: ${COLORS.textLight}; font-size: 14px; margin: 0 0 5px 0;">Cliente</p>
              <p style="color: ${COLORS.text}; font-size: 16px; font-weight: 500; margin: 0 0 15px 0;">${contract.clients?.company || "N/A"}</p>

              <p style="color: ${COLORS.textLight}; font-size: 14px; margin: 0 0 5px 0;">Válido até</p>
              <p style="color: ${COLORS.text}; font-size: 16px; font-weight: 500; margin: 0;">${new Date(contract.end_date).toLocaleDateString("pt-BR")}</p>
            </td>
          </tr>
        </table>

        <!-- Steps -->
        <p style="color: ${COLORS.text}; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">Como assinar:</p>
        <ol style="color: ${COLORS.text}; font-size: 15px; margin: 0 0 30px 0; padding-left: 20px; line-height: 1.8;">
          <li>Clique no botão "Assinar Contrato" abaixo</li>
          <li>Revise os detalhes do contrato</li>
          <li>Preencha seus dados (nome, e-mail e CPF)</li>
          <li>Desenhe sua assinatura digital</li>
          <li>Confirme a assinatura</li>
        </ol>

        <!-- CTA Button -->
        <table role="presentation" width="100%" style="margin-bottom: 30px;">
          <tr>
            <td style="text-align: center;">
              <a href="${link}" style="display: inline-block; background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%); color: ${COLORS.white}; padding: 18px 50px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px;">
                Assinar Contrato
              </a>
            </td>
          </tr>
        </table>

        <!-- Expiration Notice -->
        <table role="presentation" width="100%" style="background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <tr>
            <td style="padding: 15px 20px;">
              <p style="color: #92400e; font-size: 14px; margin: 0;">
                ⏰ <strong>Atenção:</strong> Este link expira em <strong>7 dias</strong>. Após essa data, será necessário solicitar um novo link.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: ${COLORS.background}; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="color: ${COLORS.textLight}; font-size: 13px; margin: 0 0 10px 0;">
          Este e-mail foi enviado por <strong>Koraflow</strong>
        </p>
        <p style="color: ${COLORS.textLight}; font-size: 12px; margin: 0;">
          Se você não solicitou esta assinatura, por favor ignore este e-mail.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
        `;
        break;

      case "notify_signature":
        emailSubject = `✅ Assinatura Confirmada - ${contract.title}`;
        emailBody = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Assinatura Confirmada</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: ${COLORS.background};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td style="background-color: ${COLORS.success}; padding: 40px 30px; text-align: center;">
        <h1 style="color: ${COLORS.white}; margin: 0; font-size: 28px; font-weight: 700;">✓ Assinatura Confirmada</h1>
      </td>
    </tr>
    <tr>
      <td style="background-color: ${COLORS.white}; padding: 40px 30px;">
        <p style="color: ${COLORS.text}; font-size: 16px; margin: 0 0 20px 0;">
          O cliente assinou o contrato <strong>${contract.title}</strong>.
        </p>
        <table role="presentation" width="100%" style="background-color: ${COLORS.background}; border-radius: 12px; margin-bottom: 30px;">
          <tr>
            <td style="padding: 25px;">
              <p style="color: ${COLORS.success}; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">Assinatura registrada com sucesso!</p>
              <p style="color: ${COLORS.textLight}; font-size: 14px; margin: 0;">
                Data: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}
              </p>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%">
          <tr>
            <td style="text-align: center;">
              <a href="${baseUrl}/contratos" style="display: inline-block; background-color: ${COLORS.success}; color: ${COLORS.white}; padding: 15px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px;">
                Ver Contrato
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;
        break;

      case "notify_fully_signed":
        emailSubject = `🎉 Contrato Totalmente Assinado - ${contract.title}`;
        emailBody = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contrato Totalmente Assinado</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: ${COLORS.background};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td style="background: linear-gradient(135deg, ${COLORS.success} 0%, #059669 100%); padding: 40px 30px; text-align: center;">
        <h1 style="color: ${COLORS.white}; margin: 0; font-size: 28px; font-weight: 700;">🎉 Contrato Totalmente Assinado!</h1>
      </td>
    </tr>
    <tr>
      <td style="background-color: ${COLORS.white}; padding: 40px 30px;">
        <p style="color: ${COLORS.text}; font-size: 16px; margin: 0 0 20px 0;">
          Parabéns! O contrato <strong>${contract.title}</strong> foi assinado por todas as partes e está completo.
        </p>
        <table role="presentation" width="100%" style="background-color: ${COLORS.background}; border-radius: 12px; margin-bottom: 30px;">
          <tr>
            <td style="padding: 25px;">
              <p style="color: ${COLORS.success}; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">Status: Completo</p>
              <p style="color: ${COLORS.textLight}; font-size: 14px; margin: 0;">
                Finalizado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}
              </p>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%">
          <tr>
            <td style="text-align: center;">
              <a href="${baseUrl}/contratos" style="display: inline-block; background-color: ${COLORS.success}; color: ${COLORS.white}; padding: 15px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px;">
                Baixar Contrato Assinado
              </a>
            </td>
          </tr>
        </table>
        <p style="color: ${COLORS.textLight}; font-size: 14px; margin: 20px 0 0 0; text-align: center;">
          O documento assinado está disponível para download no sistema.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
        `;
        break;

      default:
        throw new Error("Invalid action");
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY não configurada nas variáveis da Edge Function.");
    }

    if (!recipientEmail || typeof recipientEmail !== "string" || !recipientEmail.includes("@")) {
      throw new Error(`Email do destinatário inválido`);
    }

    const emailPayload = {
      from: `${fromName} <${fromEmail}>`,
      to: recipientEmail,
      subject: emailSubject,
      html: emailBody,
    };

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const responseText = await emailResponse.text();

    if (!emailResponse.ok) {
      let errorMessage = `Resend API error (${emailResponse.status})`;
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message) errorMessage = errorData.message;
      } catch {}
      throw new Error(`Falha ao enviar e-mail: ${errorMessage}`);
    }

    // Log the notification (non-fatal)
    try {
      await supabase.from("signature_audit_log").insert({
        contract_id: contractId,
        event_type: "email_sent",
        event_data: { recipient_email: recipientEmail, recipient_name: recipientName, subject: emailSubject, action },
      });
    } catch (_) { /* non-fatal */ }

    try {
      await supabase.from("signature_email_logs").insert({
        contract_id: contractId,
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        email_type: action === "send_signature_link" ? "signature_request" : "signature_confirmation",
        status: "sent",
      });
    } catch (_) { /* non-fatal */ }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notification sent successfully",
        email: { to: recipientEmail, subject: emailSubject },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("signature-notifications error:", error instanceof Error ? error.message : "unknown");
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
