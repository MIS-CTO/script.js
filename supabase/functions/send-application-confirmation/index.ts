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
    const { applicant_email, applicant_name, job_title } = await req.json();

    if (!applicant_email) {
      return new Response(JSON.stringify({ error: 'applicant_email required' }), {
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
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;">

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
                Vielen Dank für deine Bewerbung
              </h2>

              <p style="margin:0 0 32px; font-size:16px; line-height:1.6; color:#515154;">
                Hallo ${applicant_name || 'there'},<br><br>
                wir haben deine Bewerbung${job_title ? ` für die Stelle <strong>${job_title}</strong>` : ''} erhalten und freuen uns über dein Interesse an unserem Team.
              </p>

              <p style="margin:0 0 32px; font-size:16px; line-height:1.6; color:#515154;">
                Wir werden deine Unterlagen sorgfältig prüfen und uns zeitnah bei dir melden.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6f5; margin-bottom:32px;">
                <tr>
                  <td style="padding:24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0; border-bottom:1px solid #e5e5e5;">
                          <span style="color:#86868b; font-size:13px;">POSITION</span><br>
                          <span style="color:#1d1d1f; font-size:16px; font-weight:500;">${job_title || '-'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="color:#86868b; font-size:13px;">STATUS</span><br>
                          <span style="color:#1d1d1f; font-size:16px; font-weight:500;">Bewerbung eingegangen</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

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
        to: applicant_email,
        subject: `Bewerbung eingegangen – ${job_title || 'Mommy I\'m Sorry'}`,
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

    console.log('✅ Application confirmation email sent to:', applicant_email);

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
