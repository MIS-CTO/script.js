import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return new Response('Missing signature', {
        status: 400,
        headers: corsHeaders
      });
    }

    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET');
      return new Response('Webhook secret not configured', {
        status: 500,
        headers: corsHeaders
      });
    }

    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(`Webhook Error: ${err.message}`, {
        status: 400,
        headers: corsHeaders
      });
    }

    console.log('Received Stripe event:', event.type);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle successful payment events
    if (event.type === 'checkout.session.completed' ||
        event.type === 'payment_intent.succeeded' ||
        event.type === 'charge.succeeded') {

      const session = event.data.object as any;
      const requestId = session.metadata?.request_id;

      console.log('Processing payment for request:', requestId);

      if (requestId) {
        // Update payment status
        const { error: updateError } = await supabase
          .from('requests')
          .update({
            payment_status: 'deposit_paid',
            paid_at: new Date().toISOString(),
            stripe_payment_id: session.id || session.payment_intent,
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId);

        if (updateError) {
          console.error('Error updating request:', updateError);
          // Still return 200 to Stripe so it doesn't retry
        } else {
          console.log('Payment status updated successfully for:', requestId);
        }

        // Log activity
        await supabase
          .from('request_activity_log')
          .insert({
            request_id: requestId,
            action: 'payment_received',
            action_at: new Date().toISOString(),
            action_by: 'Stripe Webhook',
            is_system_action: true,
            details: {
              event_type: event.type,
              amount: session.amount_total || session.amount,
              stripe_id: session.id
            }
          })
          .catch(err => console.error('Activity log error:', err));
      } else {
        console.log('No request_id in metadata, skipping DB update');
      }
    }

    // Handle failed payment
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const requestId = paymentIntent.metadata?.request_id;

      if (requestId) {
        console.log('Payment failed for request:', requestId);

        await supabase
          .from('requests')
          .update({
            payment_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId);

        // Log activity
        await supabase
          .from('request_activity_log')
          .insert({
            request_id: requestId,
            action: 'payment_failed',
            action_at: new Date().toISOString(),
            action_by: 'Stripe Webhook',
            is_system_action: true,
            details: {
              payment_id: paymentIntent.id,
              error: paymentIntent.last_payment_error?.message || 'Unknown error'
            }
          })
          .catch(err => console.error('Activity log error:', err));
      }
    }

    // Always return 200 to prevent Stripe retries
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook handler error:', error);
    // Still return 200 to avoid retry loop
    return new Response(JSON.stringify({ error: 'Internal error', received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
