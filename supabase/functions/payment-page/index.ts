import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const requestId = url.searchParams.get('id');

  if (!requestId) {
    return new Response(renderErrorPage('Request ID fehlt'), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  try {
    // Load request from database
    const { data: request, error } = await supabase
      .from('requests')
      .select('*, customer:customers(*), location:locations(*)')
      .eq('id', requestId)
      .single();

    if (error || !request) {
      console.error('Request not found:', error);
      return new Response(renderErrorPage('Request nicht gefunden'), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Check if already paid
    const paidStatuses = ['paid', 'deposit_paid', 'fully_paid'];
    if (paidStatuses.includes(request.payment_status)) {
      console.log('Request already paid:', requestId);
      return new Response(renderAlreadyPaidPage(request), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Check if canceled
    if (request.status === 'canceled') {
      return new Response(renderCanceledPage(request), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Redirect to Stripe payment link if exists
    if (request.stripe_payment_link) {
      return Response.redirect(request.stripe_payment_link, 302);
    }

    // No payment link available
    return new Response(renderErrorPage('Kein Zahlungslink verfuegbar'), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }
    });

  } catch (err) {
    console.error('Error processing payment page:', err);
    return new Response(renderErrorPage('Ein Fehler ist aufgetreten'), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
});

function renderAlreadyPaidPage(request: any): string {
  const requestNumber = request.request_number || request.id.slice(0, 8).toUpperCase();
  const customerName = `${request.first_name || ''} ${request.last_name || ''}`.trim() || 'Kunde';
  const paidAt = request.paid_at ? new Date(request.paid_at).toLocaleDateString('de-DE') : '';

  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Zahlung erhalten - Mommy I'm Sorry</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #f7f6f5 0%, #ebe9e6 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: #fff;
      border-radius: 16px;
      padding: 48px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .checkmark {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #34c759 0%, #30b350 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      box-shadow: 0 4px 16px rgba(52, 199, 89, 0.3);
    }
    .checkmark svg {
      width: 40px;
      height: 40px;
      color: white;
    }
    h1 {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 28px;
      color: #1a1a1a;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .subtitle {
      color: #666;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    .details {
      background: #f7f6f5;
      border-radius: 12px;
      padding: 24px;
      text-align: left;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid rgba(0,0,0,0.06);
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      color: #86868b;
      font-size: 14px;
    }
    .detail-value {
      color: #1a1a1a;
      font-weight: 500;
      font-size: 14px;
    }
    .status-paid {
      color: #34c759;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid rgba(0,0,0,0.06);
    }
    .logo {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 18px;
      color: #1a1a1a;
      font-weight: 600;
    }
    .contact {
      margin-top: 12px;
      font-size: 13px;
      color: #86868b;
    }
    .contact a {
      color: #007aff;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="checkmark">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>

    <h1>Zahlung erhalten</h1>
    <p class="subtitle">
      Vielen Dank, ${customerName}! Deine Anzahlung wurde erfolgreich verarbeitet.
      Wir freuen uns auf deinen Termin.
    </p>

    <div class="details">
      <div class="detail-row">
        <span class="detail-label">Referenz</span>
        <span class="detail-value">#${requestNumber}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status</span>
        <span class="detail-value status-paid">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <path d="m9 11 3 3L22 4"/>
          </svg>
          Bezahlt
        </span>
      </div>
      ${paidAt ? `
      <div class="detail-row">
        <span class="detail-label">Bezahlt am</span>
        <span class="detail-value">${paidAt}</span>
      </div>
      ` : ''}
    </div>

    <div class="footer">
      <div class="logo">Mommy I'm Sorry</div>
      <div class="contact">
        Fragen? <a href="mailto:info@mommyimsorry.com">info@mommyimsorry.com</a>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

function renderCanceledPage(request: any): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Termin storniert - Mommy I'm Sorry</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f7f6f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: #fff;
      border-radius: 16px;
      padding: 48px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .icon {
      width: 80px;
      height: 80px;
      background: #ff9500;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    .icon svg {
      width: 40px;
      height: 40px;
      color: white;
    }
    h1 {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 28px;
      color: #1a1a1a;
      margin-bottom: 12px;
    }
    p {
      color: #666;
      font-size: 16px;
      line-height: 1.6;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e5e5;
    }
    .logo {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 18px;
      color: #1a1a1a;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    </div>
    <h1>Termin storniert</h1>
    <p>Dieser Termin wurde storniert. Eine Zahlung ist nicht mehr moeglich.</p>
    <div class="footer">
      <div class="logo">Mommy I'm Sorry</div>
    </div>
  </div>
</body>
</html>
`;
}

function renderErrorPage(message: string): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Fehler - Mommy I'm Sorry</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f7f6f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: #fff;
      border-radius: 16px;
      padding: 48px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .icon {
      width: 80px;
      height: 80px;
      background: #ff3b30;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    .icon svg {
      width: 40px;
      height: 40px;
      color: white;
    }
    h1 {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 28px;
      color: #1a1a1a;
      margin-bottom: 12px;
    }
    p {
      color: #666;
      font-size: 16px;
      line-height: 1.6;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e5e5;
    }
    .logo {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 18px;
      color: #1a1a1a;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    </div>
    <h1>Fehler</h1>
    <p>${message}</p>
    <div class="footer">
      <div class="logo">Mommy I'm Sorry</div>
    </div>
  </div>
</body>
</html>
`;
}
