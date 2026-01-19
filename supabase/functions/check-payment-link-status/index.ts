import Stripe from 'https://esm.sh/stripe@14?target=denonext';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { payment_link_url } = await req.json();

    if (!payment_link_url) {
      return new Response(JSON.stringify({ paid: false, error: 'No payment_link_url provided' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Checking payment link:', payment_link_url);

    // Extract payment link ID from URL
    // Format: https://buy.stripe.com/test_XXXXX or https://buy.stripe.com/XXXXX
    const urlParts = payment_link_url.split('/');
    const paymentLinkId = urlParts[urlParts.length - 1];

    if (!paymentLinkId) {
      return new Response(JSON.stringify({ paid: false, error: 'Invalid payment link URL' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Payment link ID:', paymentLinkId);

    // Get the payment link to verify it exists
    let paymentLink;
    try {
      paymentLink = await stripe.paymentLinks.retrieve(paymentLinkId);
      console.log('Payment link found:', paymentLink.id, 'active:', paymentLink.active);
    } catch (e) {
      console.log('Payment link not found, trying as session ID');
      // Maybe it's already a session ID
      try {
        const session = await stripe.checkout.sessions.retrieve(paymentLinkId);
        return new Response(JSON.stringify({
          paid: session.payment_status === 'paid',
          amount: session.amount_total ? session.amount_total / 100 : null,
          customer_email: session.customer_email,
          payment_intent: session.payment_intent,
          session_id: session.id
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e2) {
        return new Response(JSON.stringify({ paid: false, error: 'Payment link or session not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // List all checkout sessions for this payment link
    const sessions = await stripe.checkout.sessions.list({
      payment_link: paymentLinkId,
      limit: 10
    });

    console.log('Found', sessions.data.length, 'sessions for payment link');

    // Check if any session is paid
    const paidSession = sessions.data.find(s => s.payment_status === 'paid');

    if (paidSession) {
      console.log('Paid session found:', paidSession.id);
      return new Response(JSON.stringify({
        paid: true,
        amount: paidSession.amount_total ? paidSession.amount_total / 100 : null,
        customer_email: paidSession.customer_email,
        payment_intent: paidSession.payment_intent,
        session_id: paidSession.id,
        paid_at: paidSession.created ? new Date(paidSession.created * 1000).toISOString() : null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // No paid session found
    return new Response(JSON.stringify({
      paid: false,
      payment_link_active: paymentLink.active,
      sessions_count: sessions.data.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ paid: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
