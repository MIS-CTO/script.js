// NOTE: This function should be deployed with --no-verify-jwt to allow cron job invocation
// Deploy command: supabase functions deploy payment-reminders --no-verify-jwt

import { createClient } from "npm:@supabase/supabase-js@2.46.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function sanitizeKey(key) {
  if (!key) return "";
  return key.replace(/[^\x20-\x7E]/g, "").trim();
}

async function sendEmail(apiKey, to, subject, html) {
  if (!apiKey) return { success: false, error: "No API key" };
  
  try {
    var response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Mommy I'm Sorry <info@mommyimsorry.com>",
        to: to,
        reply_to: "info@mommyimsorry.com",
        subject: subject,
        html: html,
      }),
    });
    return { success: response.ok, error: response.ok ? null : await response.text() };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown" };
  }
}

async function deactivatePaymentLink(stripeKey, paymentLinkUrl) {
  if (!stripeKey || !paymentLinkUrl) return { success: false };
  
  try {
    var urlParts = paymentLinkUrl.split("/");
    var paymentLinkId = urlParts[urlParts.length - 1];
    
    if (paymentLinkId.includes("?")) {
      paymentLinkId = paymentLinkId.split("?")[0];
    }
    
    console.log("Deactivating payment link:", paymentLinkId);
    
    var response = await fetch("https://api.stripe.com/v1/payment_links/" + paymentLinkId, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + stripeKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "active=false"
    });
    
    var result = await response.json();
    console.log("Deactivate result:", response.ok ? "Success" : result.error);
    
    return { success: response.ok };
  } catch (err) {
    console.error("Error deactivating payment link:", err);
    return { success: false };
  }
}

// AESOP-STYLE REMINDER 1 EMAIL (Day 2-3: Friendly reminder)
function generateReminder1Email(customerName, dateStr, artistName, totalAmount, paymentLinkUrl, refCode) {
  var halfAmount = (totalAmount / 2).toFixed(2);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Erinnerung: Anzahlung</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f6f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;line-height:1.6;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f6f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">

        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:48px 48px 32px 48px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:12px;color:#666666;text-transform:uppercase;letter-spacing:1px;">Freundliche Erinnerung</p>
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1a1a1a;">Anzahlung ausstehend</h1>
            </td>
          </tr>

          <tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid #e5e5e5;margin:0;"></td></tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 48px;">
              <p style="margin:0 0 16px 0;font-size:16px;color:#1a1a1a;">Hallo ${customerName},</p>
              <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.7;">wir möchten dich freundlich an die ausstehende Anzahlung für deinen Tattoo-Termin erinnern.</p>
            </td>
          </tr>

          <!-- Info Box -->
          <tr>
            <td style="padding:0 48px 24px 48px;">
              <div style="background-color:#fef9e7;padding:20px 24px;border-radius:2px;border-left:3px solid #d4a012;">
                <p style="margin:0;font-size:13px;color:#856404;line-height:1.6;"><strong>Bitte begleiche die Anzahlung in den nächsten Tagen</strong>, damit wir deinen Termin verbindlich reservieren können.</p>
              </div>
            </td>
          </tr>

          <!-- Appointment Details Box -->
          <tr>
            <td style="padding:0 48px 32px 48px;">
              <div style="background-color:#f7f6f5;padding:24px;border-radius:2px;">
                <p style="margin:0 0 16px 0;font-size:11px;color:#666666;text-transform:uppercase;letter-spacing:1px;">Dein Termin</p>
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
                      <p style="margin:0;font-size:11px;color:#666666;text-transform:uppercase;letter-spacing:0.5px;">Ausstehend</p>
                      <p style="margin:4px 0 0 0;font-size:14px;color:#1a1a1a;">${totalAmount.toFixed(2)} EUR (online) oder ${halfAmount} EUR (Überweisung)</p>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:0 48px 24px 48px;text-align:center;">
              <a href="${paymentLinkUrl}" style="display:inline-block;padding:16px 48px;background-color:#1a1a1a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;letter-spacing:0.5px;border-radius:2px;">Jetzt bezahlen</a>
            </td>
          </tr>

          <!-- Bank Info -->
          <tr>
            <td style="padding:0 48px 32px 48px;">
              <p style="margin:0;font-size:12px;color:#666666;line-height:1.7;text-align:center;">Oder per Überweisung: IBAN LT69 3250 0708 9191 0477 | BIC: REVOLT21<br>Betrag: ${halfAmount} EUR | Verwendungszweck: ${refCode}</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 48px;background-color:#1a1a1a;text-align:center;">
              <p style="margin:0 0 8px 0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#ffffff;">Mommy I'm Sorry</p>
              <p style="margin:0;font-size:12px;color:#999999;">Tübinger Str. 73, 70178 Stuttgart</p>
              <p style="margin:12px 0 0 0;font-size:11px;color:#666666;">info@mommyimsorry.com</p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

// AESOP-STYLE REMINDER 2 EMAIL (Day 4-5: Urgent warning)
function generateReminder2Email(customerName, dateStr, artistName, totalAmount, paymentLinkUrl, refCode) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dringende Erinnerung</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f6f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;line-height:1.6;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f6f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">

        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;max-width:600px;width:100%;">

          <!-- Header with Warning Badge -->
          <tr>
            <td style="padding:48px 48px 32px 48px;text-align:center;">
              <span style="display:inline-block;padding:6px 16px;background-color:#fef3c7;color:#92400e;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;border-radius:2px;margin-bottom:16px;">Erinnerung</span>
              <h1 style="margin:16px 0 0 0;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1a1a1a;">Anzahlung ausstehend</h1>
            </td>
          </tr>

          <tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid #e5e5e5;margin:0;"></td></tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 48px;">
              <p style="margin:0 0 16px 0;font-size:16px;color:#1a1a1a;">Hallo ${customerName},</p>
              <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.7;">leider haben wir noch keine Anzahlung für deinen Tattoo-Termin erhalten.</p>
            </td>
          </tr>

          <!-- Urgent Warning Box -->
          <tr>
            <td style="padding:0 48px 24px 48px;">
              <div style="background-color:#fef2f2;padding:20px 24px;border-radius:2px;border-left:3px solid #dc2626;">
                <p style="margin:0;font-size:13px;color:#991b1b;line-height:1.6;"><strong>Wichtig:</strong> Ohne Zahlungseingang in den nächsten 2 Tagen müssen wir deinen Termin leider stornieren.</p>
              </div>
            </td>
          </tr>

          <!-- Appointment Details Box -->
          <tr>
            <td style="padding:0 48px 32px 48px;">
              <div style="background-color:#f7f6f5;padding:24px;border-radius:2px;">
                <p style="margin:0 0 16px 0;font-size:11px;color:#666666;text-transform:uppercase;letter-spacing:1px;">Dein Termin</p>
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
                </table>
              </div>
            </td>
          </tr>

          <!-- Payment Amount -->
          <tr>
            <td style="padding:0 48px 32px 48px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:11px;color:#666666;text-transform:uppercase;letter-spacing:1px;">Offener Betrag</p>
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:36px;font-weight:400;color:#1a1a1a;">${totalAmount.toFixed(2)} €</p>
            </td>
          </tr>

          <tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid #e5e5e5;margin:0;"></td></tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:32px 48px;text-align:center;">
              <a href="${paymentLinkUrl}" style="display:inline-block;padding:16px 48px;background-color:#1a1a1a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;letter-spacing:0.5px;border-radius:2px;">Jetzt bezahlen – Termin sichern</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 48px;background-color:#1a1a1a;text-align:center;">
              <p style="margin:0 0 8px 0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#ffffff;">Mommy I'm Sorry</p>
              <p style="margin:0;font-size:12px;color:#999999;">Tübinger Str. 73, 70178 Stuttgart</p>
              <p style="margin:12px 0 0 0;font-size:11px;color:#666666;">info@mommyimsorry.com</p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

// AESOP-STYLE CANCELLATION EMAIL (Day 6+)
function generateCancellationEmail(customerName, dateStr, artistName) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Termin storniert</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f6f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;line-height:1.6;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f6f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">

        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:48px 48px 32px 48px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:12px;color:#666666;text-transform:uppercase;letter-spacing:1px;">Mitteilung</p>
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1a1a1a;">Termin storniert</h1>
            </td>
          </tr>

          <tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid #e5e5e5;margin:0;"></td></tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 48px;">
              <p style="margin:0 0 16px 0;font-size:16px;color:#1a1a1a;">Hallo ${customerName},</p>
              <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.7;">leider mussten wir deinen Tattoo-Termin stornieren, da wir keine Anzahlung erhalten haben.</p>
            </td>
          </tr>

          <!-- Cancelled Appointment Box -->
          <tr>
            <td style="padding:0 48px 32px 48px;">
              <div style="background-color:#f7f6f5;padding:24px;border-radius:2px;">
                <p style="margin:0 0 16px 0;font-size:11px;color:#666666;text-transform:uppercase;letter-spacing:1px;">Stornierter Termin</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="50%" style="padding:8px 0;vertical-align:top;">
                      <p style="margin:0;font-size:11px;color:#666666;text-transform:uppercase;letter-spacing:0.5px;">Datum</p>
                      <p style="margin:4px 0 0 0;font-size:14px;color:#1a1a1a;">${dateStr}</p>
                    </td>
                    <td width="50%" style="padding:8px 0;vertical-align:top;">
                      <p style="margin:0;font-size:11px;color:#666666;text-transform:uppercase;letter-spacing:0.5px;">Artist</p>
                      <p style="margin:4px 0 0 0;font-size:14px;color:#1a1a1a;">${artistName}</p>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- New Booking CTA -->
          <tr>
            <td style="padding:0 48px 32px 48px;">
              <p style="margin:0 0 20px 0;font-size:14px;color:#666666;text-align:center;">Du kannst jederzeit eine neue Anfrage stellen:</p>
              <div style="text-align:center;">
                <a href="https://www.mommyimsorry.com/booking" style="display:inline-block;padding:16px 48px;background-color:#1a1a1a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;letter-spacing:0.5px;border-radius:2px;">Neue Anfrage stellen</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 48px;background-color:#1a1a1a;text-align:center;">
              <p style="margin:0 0 8px 0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#ffffff;">Mommy I'm Sorry</p>
              <p style="margin:0;font-size:12px;color:#999999;">Tübinger Str. 73, 70178 Stuttgart</p>
              <p style="margin:12px 0 0 0;font-size:11px;color:#666666;">info@mommyimsorry.com</p>
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

  console.log("=== PAYMENT-REMINDERS STARTED ===");

  var results = {
    reminder1_sent: 0,
    reminder2_sent: 0,
    auto_canceled: 0,
    payment_links_deactivated: 0,
    errors: []
  };

  try {
    var RESEND_KEY = sanitizeKey(Deno.env.get("RESEND_API_KEY"));
    var STRIPE_KEY = sanitizeKey(Deno.env.get("STRIPE_SECRET_KEY"));
    var supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    var supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!RESEND_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    var supabase = createClient(supabaseUrl, supabaseServiceKey);
    var now = new Date();

    var fetchResult = await supabase
      .from("requests")
      .select("*, customer:customers(*), artist:artists(*), appointment:appointments!requests_appointment_id_fkey(id, send_payment_reminders)")
      .eq("payment_status", "pending")
      .not("stripe_payment_link", "is", null)
      .is("payment_auto_canceled_at", null);

    if (fetchResult.error) {
      throw new Error("Fetch error: " + fetchResult.error.message);
    }

    var pendingRequests = fetchResult.data || [];
    console.log("Found pending requests:", pendingRequests.length);

    for (var i = 0; i < pendingRequests.length; i++) {
      var request = pendingRequests[i];
      
      try {
        var paymentLinkSentAt = new Date(request.payment_link_sent_at);
        var daysSinceSent = Math.floor((now.getTime() - paymentLinkSentAt.getTime()) / (1000 * 60 * 60 * 24));
        
        var customerEmail = request.email || (request.customer ? request.customer.email : null);
        var firstName = request.first_name || (request.customer ? request.customer.first_name : "") || "";
        var lastName = request.last_name || (request.customer ? request.customer.last_name : "") || "";
        var customerName = (firstName + " " + lastName).trim() || "Kunde";
        var artistName = (request.artist ? request.artist.name : null) || "Artist";
        var totalAmount = Number(request.total_amount) || 0;
        var refCode = "P" + request.id.substring(0, 8).toUpperCase();
        
        var scheduledDate = new Date(request.scheduled_date);
        var dateStr = scheduledDate.toLocaleDateString("de-DE", {
          weekday: "long", year: "numeric", month: "long", day: "numeric"
        });

        if (!customerEmail) {
          console.log("Skipping (no email):", request.id);
          continue;
        }

        // Check if payment reminders are disabled for this appointment
        if (request.appointment && request.appointment.send_payment_reminders === false) {
          console.log("Skipping (reminders disabled):", request.id);
          continue;
        }

        console.log("Processing:", request.id, "Days:", daysSinceSent);

        // TAG 6+: AUTO-STORNIERUNG
        if (daysSinceSent >= 6) {
          console.log("Auto-canceling:", request.id);
          
          // Payment Link deaktivieren
          if (STRIPE_KEY && request.stripe_payment_link) {
            var deactivateResult = await deactivatePaymentLink(STRIPE_KEY, request.stripe_payment_link);
            if (deactivateResult.success) results.payment_links_deactivated++;
          }
          
          var cancelEmailHtml = generateCancellationEmail(customerName, dateStr, artistName);
          await sendEmail(RESEND_KEY, customerEmail, "Termin storniert - Mommy I'm Sorry", cancelEmailHtml);
          
          await supabase.from("requests").update({
            status: "canceled",
            payment_status: "failed",
            payment_auto_canceled_at: now.toISOString(),
            last_action: "auto_storniert",
            last_action_at: now.toISOString()
          }).eq("id", request.id);
          
          if (request.appointment_id) {
            await supabase.from("appointments").update({
              status: "canceled",
              payment_status: "failed",
              canceled_at: now.toISOString(),
              cancel_reason: "auto_canceled_no_payment"
            }).eq("id", request.appointment_id);
          }
          
          await supabase.from("request_activity_log").insert({
            request_id: request.id,
            appointment_id: request.appointment_id,
            action: "auto_storniert",
            action_by: "System",
            is_system_action: true,
            details: { days_since_sent: daysSinceSent, payment_link_deactivated: true }
          });
          
          results.auto_canceled++;
        }
        // TAG 4-5: 2ND REMINDER
        else if (daysSinceSent >= 4 && !request.payment_reminder_2_sent_at) {
          var reminder2Html = generateReminder2Email(customerName, dateStr, artistName, totalAmount, request.stripe_payment_link, refCode);
          await sendEmail(RESEND_KEY, customerEmail, "Dringende Erinnerung - Anzahlung ausstehend", reminder2Html);
          
          await supabase.from("requests").update({
            payment_reminder_2_sent_at: now.toISOString(),
            last_action: "auto_reminder_2",
            last_action_at: now.toISOString()
          }).eq("id", request.id);
          
          await supabase.from("request_activity_log").insert({
            request_id: request.id,
            action: "auto_reminder_2",
            action_by: "System",
            is_system_action: true
          });
          
          results.reminder2_sent++;
        }
        // TAG 2-3: 1ST REMINDER
        else if (daysSinceSent >= 2 && !request.payment_reminder_1_sent_at) {
          var reminder1Html = generateReminder1Email(customerName, dateStr, artistName, totalAmount, request.stripe_payment_link, refCode);
          await sendEmail(RESEND_KEY, customerEmail, "Erinnerung: Anzahlung für deinen Tattoo-Termin", reminder1Html);
          
          await supabase.from("requests").update({
            payment_reminder_1_sent_at: now.toISOString(),
            last_action: "auto_reminder_1",
            last_action_at: now.toISOString()
          }).eq("id", request.id);
          
          await supabase.from("request_activity_log").insert({
            request_id: request.id,
            action: "auto_reminder_1",
            action_by: "System",
            is_system_action: true
          });
          
          results.reminder1_sent++;
        }
        
      } catch (reqError) {
        results.errors.push(request.id + ": " + reqError.message);
      }
    }

    console.log("=== COMPLETED ===", JSON.stringify(results));

    return new Response(JSON.stringify({ success: true, results: results }), {
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("=== ERROR ===", err.message);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" }
    });
  }
});