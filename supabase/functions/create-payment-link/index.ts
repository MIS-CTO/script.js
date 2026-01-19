import { createClient } from "npm:@supabase/supabase-js@2.46.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function sanitizeKey(key) {
  if (!key) return "";
  return key.replace(/[^\x20-\x7E]/g, "").trim();
}

async function stripeRequest(endpoint, apiKey, body) {
  try {
    const formBody = new URLSearchParams(body).toString();
    const response = await fetch("https://api.stripe.com/v1/" + endpoint, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody,
    });
    const data = await response.json();
    if (!response.ok) {
      return { ok: false, error: data.error?.message || JSON.stringify(data) };
    }
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

async function sendEmail(apiKey, to, subject, html) {
  if (!apiKey) {
    console.log("No RESEND_API_KEY");
    return { success: false, error: "No API key" };
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Mommy I'm Sorry <booking@mommyimsorry.com>",
        to: to,
        reply_to: "info@mommyimsorry.com",
        subject: subject,
        html: html,
      }),
    });
    const responseText = await response.text();
    console.log("Resend Status:", response.status);
    return { success: response.ok, error: response.ok ? null : responseText };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown" };
  }
}

function generateBankQRCode(iban, recipient, amount, reference) {
  const epcData = [
    "BCD", "002", "1", "SCT", "",
    recipient,
    iban.replace(/\s/g, ""),
    "EUR" + amount.toFixed(2),
    "", reference, ""
  ].join("\n");
  return "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(epcData);
}

// AESOP-STYLE PAYMENT LINK EMAIL
function generatePaymentLinkEmail(customerName, dateStr, artistName, totalAmount, paymentLinkUrl, halfAmount, refCode, qrCodeUrl) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dein Tattoo-Termin</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f6f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;line-height:1.6;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f6f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">

        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:48px 48px 32px 48px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:12px;color:#666666;text-transform:uppercase;letter-spacing:1px;">Dein Termin steht bevor</p>
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:400;color:#1a1a1a;">Tattoo-Termin</h1>
            </td>
          </tr>

          <tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid #e5e5e5;margin:0;"></td></tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 48px;">
              <p style="margin:0 0 16px 0;font-size:16px;color:#1a1a1a;">Hallo ${customerName},</p>
              <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.7;">perfekt! Wir freuen uns auf dein Projekt.</p>
            </td>
          </tr>

          <!-- Appointment Details Box -->
          <tr>
            <td style="padding:0 48px 32px 48px;">
              <div style="background-color:#f7f6f5;padding:24px;border-radius:2px;">
                <p style="margin:0 0 16px 0;font-size:11px;color:#666666;text-transform:uppercase;letter-spacing:1px;">Termindetails</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="50%" style="padding:8px 0;vertical-align:top;">
                      <p style="margin:0;font-size:11px;color:#666666;text-transform:uppercase;letter-spacing:0.5px;">Datum</p>
                      <p style="margin:4px 0 0 0;font-size:14px;color:#1a1a1a;font-weight:500;">${dateStr}</p>
                    </td>
                    <td width="50%" style="padding:8px 0;vertical-align:top;">
                      <p style="margin:0;font-size:11px;color:#666666;text-transform:uppercase;letter-spacing:0.5px;">Artist</p>
                      <p style="margin:4px 0 0 0;font-size:14px;color:#1a1a1a;">${artistName}</p>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding:8px 0;vertical-align:top;">
                      <p style="margin:0;font-size:11px;color:#666666;text-transform:uppercase;letter-spacing:0.5px;">Gesamtpreis</p>
                      <p style="margin:4px 0 0 0;font-size:14px;color:#1a1a1a;font-weight:500;">${totalAmount.toFixed(2)} EUR</p>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid #e5e5e5;margin:0;"></td></tr>

          <!-- Payment Options Header -->
          <tr>
            <td style="padding:32px 48px 24px 48px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#666666;text-transform:uppercase;letter-spacing:1px;">Zahlungsoptionen</p>
            </td>
          </tr>

          <!-- Option 1: Bank Transfer -->
          <tr>
            <td style="padding:0 48px 24px 48px;">
              <div style="border:1px solid #e5e5e5;padding:24px;border-radius:2px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:top;">
                      <p style="margin:0 0 12px 0;font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#1a1a1a;">Option 1: Überweisung</p>
                      <p style="margin:0 0 16px 0;font-size:13px;color:#666666;line-height:1.6;">50% (${halfAmount} EUR) vorab überweisen, 50% am Termin bar</p>
                      <p style="margin:0 0 4px 0;font-size:13px;color:#1a1a1a;"><strong>Empfänger:</strong> Mommy I'm Sorry Verwaltung GmbH</p>
                      <p style="margin:0 0 4px 0;font-size:13px;color:#1a1a1a;"><strong>IBAN:</strong> LT69 3250 0708 9191 0477</p>
                      <p style="margin:0 0 4px 0;font-size:13px;color:#1a1a1a;"><strong>BIC:</strong> REVOLT21</p>
                      <p style="margin:0 0 4px 0;font-size:13px;color:#1a1a1a;"><strong>Betrag:</strong> ${halfAmount} EUR</p>
                      <p style="margin:0;font-size:13px;color:#1a1a1a;"><strong>Verwendungszweck:</strong> ${refCode}</p>
                    </td>
                    <td style="width:140px;text-align:center;vertical-align:top;padding-left:16px;">
                      <img src="${qrCodeUrl}" alt="QR Code" style="width:120px;height:120px;border-radius:2px;border:1px solid #e5e5e5;">
                      <p style="margin:8px 0 0 0;font-size:10px;color:#999999;">Banking-App scannen</p>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Option 2: Online Payment -->
          <tr>
            <td style="padding:0 48px 32px 48px;">
              <div style="border:2px solid #1a1a1a;padding:24px;border-radius:2px;background-color:#fafafa;">
                <p style="margin:0 0 8px 0;font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#1a1a1a;">Option 2: Online bezahlen</p>
                <p style="margin:0 0 20px 0;font-size:13px;color:#666666;">Gesamtsumme (${totalAmount.toFixed(2)} EUR) online bezahlen</p>
                <a href="${paymentLinkUrl}" style="display:inline-block;padding:16px 48px;background-color:#1a1a1a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;letter-spacing:0.5px;border-radius:2px;">Jetzt bezahlen</a>
                <p style="margin:16px 0 0 0;font-size:12px;color:#999999;">Klarna, Kreditkarte, Apple Pay verfügbar</p>
              </div>
            </td>
          </tr>

          <tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid #e5e5e5;margin:0;"></td></tr>

          <!-- Terms -->
          <tr>
            <td style="padding:32px 48px;">
              <p style="margin:0 0 16px 0;font-size:11px;color:#666666;text-transform:uppercase;letter-spacing:1px;">Wichtige Hinweise</p>
              <p style="margin:0 0 8px 0;font-size:12px;color:#666666;line-height:1.7;">• Die Anzahlung wird mit dem Gesamtpreis verrechnet.</p>
              <p style="margin:0 0 8px 0;font-size:12px;color:#666666;line-height:1.7;">• Terminkaution wird nicht rückerstattet.</p>
              <p style="margin:0 0 8px 0;font-size:12px;color:#666666;line-height:1.7;">• Absage mindestens 3 Werktage vorher, sonst verfällt die Kaution.</p>
              <p style="margin:0;font-size:12px;color:#666666;line-height:1.7;">• Bitte pünktlich erscheinen (max. 30 min Verspätung).</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 48px;background-color:#1a1a1a;text-align:center;">
              <p style="margin:0 0 8px 0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#ffffff;">Mommy I'm Sorry</p>
              <p style="margin:0;font-size:12px;color:#999999;">Tübinger Str. 73, 70178 Stuttgart</p>
              <p style="margin:12px 0 0 0;font-size:11px;color:#666666;">0711 51875672 · info@mommyimsorry.com</p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("=== CREATE-PAYMENT-LINK STARTED ===");

  try {
    const STRIPE_KEY = sanitizeKey(Deno.env.get("STRIPE_SECRET_KEY"));
    const RESEND_KEY = sanitizeKey(Deno.env.get("RESEND_API_KEY"));
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!STRIPE_KEY || (!STRIPE_KEY.startsWith("sk_live_") && !STRIPE_KEY.startsWith("sk_test_"))) {
      throw new Error("Invalid STRIPE_SECRET_KEY");
    }

    const bodyText = await req.text();
    console.log("Raw body:", bodyText);
    const requestBody = JSON.parse(bodyText);
    const request_id = requestBody.request_id;
    if (!request_id) throw new Error("request_id is required");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: requestData, error: fetchError } = await supabase
      .from("requests")
      .select("*, customer:customers(*), artist:artists(*), location:locations(*)")
      .eq("id", request_id)
      .single();

    if (fetchError || !requestData) throw new Error("Request not found");

    const customerEmail = requestData.email || requestData.customer?.email || "";
    const customerName = ((requestData.first_name || requestData.customer?.first_name || "") + " " + (requestData.last_name || requestData.customer?.last_name || "")).trim() || "Kunde";
    const artistName = requestData.artist?.name || "Artist";
    const placement = requestData.placement || "Tattoo";
    const totalAmount = Number(requestData.total_amount) || 0;

    if (!requestData.artist_id) throw new Error("Artist fehlt");
    if (!requestData.scheduled_date) throw new Error("Datum fehlt");
    if (totalAmount <= 0) throw new Error("Preis fehlt");
    if (!customerEmail) throw new Error("Email fehlt");

    const productResult = await stripeRequest("products", STRIPE_KEY, {
      name: "Tattoo Anzahlung - " + placement,
      description: "Artist: " + artistName,
    });
    if (!productResult.ok) throw new Error("Stripe Product Error: " + productResult.error);

    const priceResult = await stripeRequest("prices", STRIPE_KEY, {
      product: productResult.data.id,
      unit_amount: String(Math.round(totalAmount * 100)),
      currency: "eur",
    });
    if (!priceResult.ok) throw new Error("Stripe Price Error: " + priceResult.error);

    // Pass metadata to payment_intent_data so it flows through to webhook events
    const linkResult = await stripeRequest("payment_links", STRIPE_KEY, {
      "line_items[0][price]": priceResult.data.id,
      "line_items[0][quantity]": "1",
      "metadata[request_id]": requestData.id,
      "metadata[customer_email]": customerEmail,
      "payment_intent_data[metadata][request_id]": requestData.id,
      "payment_intent_data[metadata][customer_email]": customerEmail,
      "payment_intent_data[metadata][request_number]": requestData.request_number || "",
      "after_completion[type]": "redirect",
      "after_completion[redirect][url]": "https://www.mommyimsorry.com/payment-success",
    });
    if (!linkResult.ok) throw new Error("Stripe Link Error: " + linkResult.error);
    const paymentLinkUrl = linkResult.data.url;

    console.log("Payment Link created with metadata:", { request_id: requestData.id, request_number: requestData.request_number });

    const scheduledDate = new Date(requestData.scheduled_date);
    const startTime = requestData.start_time || "10:00";
    const endTime = requestData.end_time || "12:00";
    const startDT = new Date(scheduledDate);
    startDT.setHours(parseInt(startTime.split(":")[0]), parseInt(startTime.split(":")[1]), 0, 0);
    const endDT = new Date(scheduledDate);
    endDT.setHours(parseInt(endTime.split(":")[0]), parseInt(endTime.split(":")[1]), 0, 0);

    const { data: appointment, error: aptError } = await supabase
      .from("appointments")
      .insert({
        request_id: requestData.id,
        customer_id: requestData.customer_id,
        artist_id: requestData.artist_id,
        location_id: requestData.location_id,
        customer_email: customerEmail,
        start: startDT.toISOString(),
        end: endDT.toISOString(),
        placement: requestData.placement,
        size: requestData.size,
        style: requestData.style,
        colorway: requestData.colorway,
        description: requestData.description,
        status: "scheduled",
        state: "Zugesagt",
        payment_status: "pending",
        payment_amount: totalAmount,
        stripe_payment_link: paymentLinkUrl,
        payment_link_sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (aptError) throw new Error("Appointment Error: " + aptError.message);

    await supabase.from("requests").update({
      status: "scheduled",
      payment_status: "pending",
      appointment_id: appointment.id,
      stripe_payment_link: paymentLinkUrl,
      payment_link_sent_at: new Date().toISOString(),
    }).eq("id", request_id);

    let emailSent = false;
    if (RESEND_KEY) {
      const dateStr = scheduledDate.toLocaleDateString("de-DE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      const halfAmount = (totalAmount / 2).toFixed(2);
      const refCode = "P" + requestData.id.substring(0, 8).toUpperCase();
      const qrCodeUrl = generateBankQRCode("LT693250070891910477", "Mommy Im Sorry Verwaltung GmbH", totalAmount / 2, refCode);

      // AESOP-STYLE EMAIL
      const emailHtml = generatePaymentLinkEmail(customerName, dateStr, artistName, totalAmount, paymentLinkUrl, halfAmount, refCode, qrCodeUrl);

      const emailResult = await sendEmail(RESEND_KEY, customerEmail, "Dein Tattoo-Termin am " + dateStr, emailHtml);
      emailSent = emailResult.success;
      console.log("Email:", emailSent ? "Sent" : "Failed");
    }

    await supabase.from("payment_logs").insert({
      request_id: request_id,
      appointment_id: appointment.id,
      action: "payment_link_sent",
      amount: totalAmount,
      stripe_payment_link: paymentLinkUrl,
      email_sent_to: customerEmail,
      status: emailSent ? "sent" : "created",
    });

    console.log("=== SUCCESS ===");
    return new Response(JSON.stringify({ success: true, payment_link: paymentLinkUrl, appointment_id: appointment.id, email_sent_to: emailSent ? customerEmail : null }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("=== ERROR ===", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});