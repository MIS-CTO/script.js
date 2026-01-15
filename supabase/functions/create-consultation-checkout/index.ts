import Stripe from 'https://esm.sh/stripe@14?target=denonext';

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
      // Customer data
      customer_email,
      customer_first_name,
      customer_last_name,
      customer_phone,
      customer_instagram,
      // Appointment data
      artist_id,
      artist_name,
      location_id,
      date, // ISO date string: '2025-01-15'
      // URLs
      success_url,
      cancel_url
    } = await req.json();

    // Validate required fields
    if (!customer_email || !artist_id || !date) {
      throw new Error('Missing required fields: customer_email, artist_id, date');
    }

    // Format date for display
    const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    // Create Checkout Session with ALL data in metadata
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: customer_email,
      client_reference_id: `consultation_${Date.now()}`, // Unique reference
      metadata: {
        type: 'consultation',
        // Customer
        customer_email,
        customer_first_name: customer_first_name || '',
        customer_last_name: customer_last_name || '',
        customer_phone: customer_phone || '',
        customer_instagram: customer_instagram || '',
        // Appointment
        artist_id,
        artist_name: artist_name || '',
        location_id: location_id || '',
        date, // '2025-01-15'
        time: '11:00'
      },
      line_items: [{
        price_data: {
          currency: 'eur',
          unit_amount: 10000, // 100€
          product_data: {
            name: 'Beratungstermin',
            description: `Beratung bei ${artist_name} am ${displayDate}`
          }
        },
        quantity: 1
      }],
      success_url: success_url || 'https://mommyimsorry.com/consultation-booking.html?success=true',
      cancel_url: cancel_url || 'https://mommyimsorry.com/consultation-booking.html?canceled=true'
    });

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
