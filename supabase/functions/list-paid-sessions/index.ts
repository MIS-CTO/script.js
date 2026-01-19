import Stripe from 'https://esm.sh/stripe@14?target=denonext';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // List recent checkout sessions that are paid
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
    });

    const paidSessions = sessions.data
      .filter(s => s.payment_status === 'paid')
      .map(s => ({
        id: s.id,
        amount: s.amount_total ? s.amount_total / 100 : null,
        email: s.customer_email,
        request_id: s.metadata?.request_id || null,
        payment_link: s.payment_link,
        created: new Date(s.created * 1000).toISOString(),
      }));

    // Also list payment links
    const paymentLinks = await stripe.paymentLinks.list({
      limit: 50,
    });

    return new Response(JSON.stringify({
      paid_sessions: paidSessions,
      total_sessions: sessions.data.length,
      payment_links: paymentLinks.data.map(pl => ({
        id: pl.id,
        url: pl.url,
        active: pl.active,
        metadata: pl.metadata
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
