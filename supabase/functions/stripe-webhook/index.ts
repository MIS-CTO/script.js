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
      }

      // Handle consultation payment
      // Consultation payments use client_reference_id as appointment ID
      // and may have type: 'consultation' in metadata
      const paymentType = session.metadata?.type;
      const appointmentId = session.metadata?.appointment_id || session.client_reference_id;

      // If no request_id but has appointmentId, treat as consultation
      if (appointmentId && !requestId) {
        console.log('Processing consultation payment for appointment:', appointmentId);

        // Get appointment details for the email
        const { data: appointment, error: fetchError } = await supabase
          .from('appointments')
          .select(`
            *,
            customer:customers!appointments_customer_id_fkey(id, name, email),
            artist:artists!appointments_artist_id_fkey(id, name)
          `)
          .eq('id', appointmentId)
          .single();

        if (fetchError) {
          console.error('Error fetching appointment:', fetchError);
        } else if (appointment) {
          // Update appointment status
          const { error: updateError } = await supabase
            .from('appointments')
            .update({
              status: 'scheduled',
              payment_status: 'paid',
              stripe_payment_id: session.id || session.payment_intent,
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', appointmentId);

          if (updateError) {
            console.error('Error updating appointment:', updateError);
          } else {
            console.log('Consultation payment updated for:', appointmentId);

            // Send confirmation email
            if (appointment.customer?.email) {
              const appointmentDate = new Date(appointment.date);
              const formattedDate = appointmentDate.toLocaleDateString('de-DE', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              });

              try {
                const emailResponse = await fetch(
                  `${supabaseUrl}/functions/v1/send-consultation-confirmation`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${supabaseServiceKey}`
                    },
                    body: JSON.stringify({
                      customer_email: appointment.customer.email,
                      customer_name: appointment.customer.name,
                      artist_name: appointment.artist?.name || 'Artist',
                      appointment_date: formattedDate,
                      appointment_time: appointment.time || '11:00',
                      location_name: 'MOMMY I\'M SORRY',
                      location_address: session.metadata?.location_address || ''
                    })
                  }
                );

                if (emailResponse.ok) {
                  console.log('✅ Confirmation email sent for consultation:', appointmentId);
                } else {
                  const emailError = await emailResponse.text();
                  console.error('Email send failed:', emailError);
                }
              } catch (emailErr) {
                console.error('Error sending confirmation email:', emailErr);
              }
            }
          }
        }
      } else if (!requestId && !appointmentId) {
        console.log('No request_id or appointment_id in metadata, skipping DB update');
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
