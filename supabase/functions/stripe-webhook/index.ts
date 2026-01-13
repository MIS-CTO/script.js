import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    console.error('Missing signature or webhook secret');
    return new Response(JSON.stringify({ error: 'Missing signature' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log('Stripe webhook event received:', event.type);

    // Handle successful payment
    if (event.type === 'checkout.session.completed' ||
        event.type === 'payment_intent.succeeded') {

      const session = event.data.object as Stripe.Checkout.Session | Stripe.PaymentIntent;

      // Get request_id from metadata
      const requestId = session.metadata?.request_id;

      if (requestId) {
        console.log('Updating payment status for request:', requestId);

        // Update payment status in requests table
        const { error: updateError } = await supabase
          .from('requests')
          .update({
            payment_status: 'deposit_paid',
            paid_at: new Date().toISOString(),
            stripe_payment_id: session.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId);

        if (updateError) {
          console.error('Error updating request:', updateError);
          throw updateError;
        }

        // Log activity
        await supabase.from('request_activity_log').insert({
          request_id: requestId,
          action: 'payment_received',
          action_at: new Date().toISOString(),
          action_by: 'Stripe Webhook',
          is_system_action: true,
          details: {
            payment_id: session.id,
            amount: (session as any).amount_total || (session as any).amount,
            event_type: event.type
          }
        });

        console.log('Payment status updated successfully for request:', requestId);
      } else {
        console.warn('No request_id in payment metadata');
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
        await supabase.from('request_activity_log').insert({
          request_id: requestId,
          action: 'payment_failed',
          action_at: new Date().toISOString(),
          action_by: 'Stripe Webhook',
          is_system_action: true,
          details: {
            payment_id: paymentIntent.id,
            error: paymentIntent.last_payment_error?.message || 'Unknown error'
          }
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
