import Stripe from 'https://esm.sh/stripe@14?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16'
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      wannado_id,
      customer_email,
      customer_first_name,
      customer_last_name,
      customer_phone,
      customer_instagram,
      selected_date,
      selected_start_time,
      selected_end_time,
      success_url,
      cancel_url
    } = await req.json();

    // Validate required fields
    if (!wannado_id || !customer_email || !selected_date || !selected_start_time || !selected_end_time) {
      throw new Error('Missing required fields: wannado_id, customer_email, selected_date, selected_start_time, selected_end_time');
    }

    // Fetch wannado details from Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: wannado, error: wannadoError } = await supabase
      .from('wannados')
      .select('*, artist:artists(id, name), collection:wannado_collections(id, name)')
      .eq('id', wannado_id)
      .single();

    if (wannadoError || !wannado) {
      throw new Error('Wannado not found');
    }

    // Security check: Ensure wannado is still available
    if (wannado.status !== 'available') {
      throw new Error('Dieses Motiv ist leider nicht mehr verfügbar.');
    }

    // Format date for display
    const displayDate = new Date(selected_date + 'T12:00:00').toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const priceInCents = Math.round(Number(wannado.price) * 100);

    // Session expires in 30 minutes (Stripe minimum)
    const expiresAt = Math.floor(Date.now() / 1000) + (30 * 60);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'klarna'],
      customer_email: customer_email,
      client_reference_id: `wannado_${wannado_id}_${Date.now()}`,
      expires_at: expiresAt,
      metadata: {
        type: 'wannado',
        wannado_id: wannado.id,
        wannado_name: wannado.name,
        wannado_price: String(wannado.price),
        wannado_duration_hours: String(wannado.duration_hours),
        collection_id: wannado.collection_id || '',
        customer_email,
        customer_first_name: customer_first_name || '',
        customer_last_name: customer_last_name || '',
        customer_phone: customer_phone || '',
        customer_instagram: customer_instagram || '',
        artist_id: wannado.artist_id,
        artist_name: wannado.artist?.name || '',
        selected_date,
        selected_start_time,
        selected_end_time,
      },
      line_items: [{
        price_data: {
          currency: 'eur',
          unit_amount: priceInCents,
          product_data: {
            name: `Wannado: ${wannado.name}`,
            description: `${wannado.collection?.name || 'Collection'} · ${wannado.artist?.name} · ${displayDate} ${selected_start_time}-${selected_end_time}`,
            images: wannado.image_url ? [wannado.image_url] : []
          }
        },
        quantity: 1
      }],
      success_url: success_url || 'https://www.mommyimsorry.com/shop/wannado',
      cancel_url: cancel_url || 'https://www.mommyimsorry.com/shop/wannado'
    });

    console.log('✅ Wannado checkout session created:', session.id, '| Expires:', new Date(expiresAt * 1000).toISOString());

    return new Response(
      JSON.stringify({ checkout_url: session.url, session_id: session.id, expires_at: expiresAt }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating wannado checkout:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
