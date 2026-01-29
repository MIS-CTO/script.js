import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const {
      customer_email,
      customer_name,
      artist_name,
      wannado_name,
      appointment_date,
      appointment_time,
      duration_hours,
      location_name,
      location_address
    } = await req.json();

    if (!customer_email) {
      return new Response(JSON.stringify({ error: 'customer_email required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background:#f7f6f5; font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6f5; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:0;">

          <!-- Header -->
          <tr>
            <td style="padding:48px 48px 32px; text-align:center; border-bottom:1px solid #e5e5e5;">
              <h1 style="margin:0; font-size:28px; font-weight:normal; color:#1d1d1f; letter-spacing:1px;">
                MOMMY I'M SORRY
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:48px;">
              <h2 style="margin:0 0 24px; font-size:22px; font-weight:normal; color:#1d1d1f;">
                Dein Wannado-Termin ist bestätigt
              </h2>

              <p style="margin:0 0 32px; font-size:16px; line-height:1.6; color:#515154;">
                Hallo ${customer_name || 'there'},<br><br>
                vielen Dank für deine Zahlung! Dein Wannado-Motiv ist jetzt für dich reserviert.
              </p>

              <!-- Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6f5; border-radius:8px; margin-bottom:32px;">
                <tr>
                  <td style="padding:24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0; border-bottom:1px solid #e5e5e5;">
                          <span style="color:#86868b; font-size:13px;">MOTIV</span><br>
                          <span style="color:#1d1d1f; font-size:16px; font-weight:500;">${wannado_name || '-'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0; border-bottom:1px solid #e5e5e5;">
                          <span style="color:#86868b; font-size:13px;">ARTIST</span><br>
                          <span style="color:#1d1d1f; font-size:16px; font-weight:500;">${artist_name || '-'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0; border-bottom:1px solid #e5e5e5;">
                          <span style="color:#86868b; font-size:13px;">DATUM</span><br>
                          <span style="color:#1d1d1f; font-size:16px; font-weight:500;">${appointment_date || '-'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0; border-bottom:1px solid #e5e5e5;">
                          <span style="color:#86868b; font-size:13px;">UHRZEIT</span><br>
                          <span style="color:#1d1d1f; font-size:16px; font-weight:500;">${appointment_time || '-'} Uhr</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0; border-bottom:1px solid #e5e5e5;">
                          <span style="color:#86868b; font-size:13px;">DAUER</span><br>
                          <span style="color:#1d1d1f; font-size:16px; font-weight:500;">ca. ${duration_hours || '3'} Stunden</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="color:#86868b; font-size:13px;">LOCATION</span><br>
                          <span style="color:#1d1d1f; font-size:16px; font-weight:500;">${location_name || "MOMMY I'M SORRY"}</span><br>
                          ${location_address ? `<span style="color:#515154; font-size:14px;">${location_address}</span>` : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px; font-size:14px; line-height:1.6; color:#86868b;">
                <strong>Wichtig:</strong> Bitte sei pünktlich (max. 30 Min. Verspätung). Dein Wannado-Motiv ist jetzt exklusiv für dich reserviert.
              </p>

              <p style="margin:0; font-size:14px; line-height:1.6; color:#86868b;">
                Bei Fragen erreichst du uns unter:<br>
                <a href="mailto:info@mommyimsorry.com" style="color:#1d1d1f;">info@mommyimsorry.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 48px; background:#1d1d1f; text-align:center;">
              <p style="margin:0; font-size:12px; color:#86868b;">
                &copy; 2026 Mommy I'm Sorry &middot; Culture Over Money
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Mommy I\'m Sorry <info@mommyimsorry.com>',
        to: customer_email,
        subject: `Wannado-Termin bestätigt – ${wannado_name} bei ${artist_name}`,
        html: emailHtml
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', result);
      return new Response(JSON.stringify({ error: 'Failed to send email', details: result }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Wannado confirmation email sent to:', customer_email);

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
