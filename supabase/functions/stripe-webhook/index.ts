import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const resendApiKey = Deno.env.get('RESEND_API_KEY') || '';

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
        // Update payment status - FIX: Use correct column name 'payment_received_at' instead of 'paid_at'
        const { error: updateError } = await supabase
          .from('requests')
          .update({
            payment_status: 'deposit_paid',
            payment_received_at: new Date().toISOString(),
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

        // Also update the linked appointment if exists
        const { data: requestData } = await supabase
          .from('requests')
          .select('appointment_id')
          .eq('id', requestId)
          .single();

        if (requestData?.appointment_id) {
          await supabase
            .from('appointments')
            .update({
              payment_status: 'deposit_paid',
              payment_received_at: new Date().toISOString(),
              stripe_payment_id: session.id || session.payment_intent,
              updated_at: new Date().toISOString()
            })
            .eq('id', requestData.appointment_id);
          console.log('Appointment payment status updated:', requestData.appointment_id);
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

      // Handle consultation checkout (NEW FLOW: creates appointment after payment)
      if (session.metadata?.type === 'consultation') {
        console.log('📅 Processing consultation checkout from metadata');

        const m = session.metadata; // shorthand

        // 1. Create or get customer
        let customerId = null;
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('email', m.customer_email)
          .single();

        if (existingCustomer) {
          customerId = existingCustomer.id;
          console.log('Found existing customer:', customerId);
        } else {
          const { data: newCustomer, error: custError } = await supabase
            .from('customers')
            .insert({
              first_name: m.customer_first_name,
              last_name: m.customer_last_name,
              email: m.customer_email,
              phone: m.customer_phone,
              instagram: m.customer_instagram || null,
              rank: 'Neukunde'
            })
            .select()
            .single();

          if (custError) {
            console.error('❌ Customer creation failed:', custError);
          } else {
            customerId = newCustomer.id;
            console.log('Created new customer:', customerId);
          }
        }

        // 2. Create appointment with correct schema columns (start/end timestamps)
        const startDateTime = new Date(m.date + 'T11:00:00').toISOString();
        const endDateTime = new Date(m.date + 'T12:00:00').toISOString();

        const { data: appointment, error: aptError } = await supabase
          .from('appointments')
          .insert({
            customer_id: customerId,
            artist_id: m.artist_id,
            location_id: m.location_id || null,
            customer_email: m.customer_email,
            customer_phone: m.customer_phone,
            first_name: m.customer_first_name,
            last_name: m.customer_last_name,
            instagram: m.customer_instagram || null,
            start: startDateTime,
            end: endDateTime,
            booking_type: 'consultation',
            status: 'scheduled',
            state: 'Zugesagt',
            payment_status: 'paid',
            payment_amount: 10000, // 100€
            work_process: 'Consultation',
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent,
            payment_received_at: new Date().toISOString()
          })
          .select()
          .single();

        if (aptError) {
          console.error('❌ Appointment creation failed:', aptError);
        } else {
          console.log('✅ Appointment created:', appointment.id);

          // 3. Send confirmation email
          const formattedDate = new Date(m.date + 'T12:00:00').toLocaleDateString('de-DE', {
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
                  customer_email: m.customer_email,
                  customer_name: `${m.customer_first_name} ${m.customer_last_name}`.trim(),
                  artist_name: m.artist_name,
                  appointment_date: formattedDate,
                  appointment_time: '11:00',
                  location_name: "MOMMY I'M SORRY",
                  location_address: ''
                })
              }
            );

            if (emailResponse.ok) {
              console.log('✅ Confirmation email sent');
            } else {
              console.error('❌ Email failed:', await emailResponse.text());
            }
          } catch (emailErr) {
            console.error('❌ Email error:', emailErr);
          }
        }
      }
      // Handle wannado checkout (creates appointment ONLY after payment)
      if (session.metadata?.type === 'wannado') {
        console.log('🎯 Processing wannado checkout from metadata');

        const m = session.metadata;

        // 1. Create or get customer
        let customerId = null;
        const { data: existingWannadoCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('email', m.customer_email)
          .single();

        if (existingWannadoCustomer) {
          customerId = existingWannadoCustomer.id;
          console.log('Found existing customer:', customerId);
        } else {
          const { data: newCustomer, error: custError } = await supabase
            .from('customers')
            .insert({
              first_name: m.customer_first_name,
              last_name: m.customer_last_name,
              email: m.customer_email,
              phone: m.customer_phone,
              instagram: m.customer_instagram || null,
              rank: 'Neukunde'
            })
            .select()
            .single();

          if (custError) {
            console.error('❌ Customer creation failed:', custError);
          } else {
            customerId = newCustomer.id;
            console.log('Created new customer:', customerId);
          }
        }

        // 2. Create appointment
        // Look up artist's location
        const { data: artistData } = await supabase
          .from('artists')
          .select('location_id')
          .eq('id', m.artist_id)
          .single();
        const artistLocationId = artistData?.location_id || null;

        const startDateTime = new Date(`${m.selected_date}T${m.selected_start_time}:00`).toISOString();
        const endDateTime = new Date(`${m.selected_date}T${m.selected_end_time}:00`).toISOString();

        const { data: wannadoAppointment, error: wannadoAptError } = await supabase
          .from('appointments')
          .insert({
            customer_id: customerId,
            artist_id: m.artist_id,
            location_id: artistLocationId,
            customer_email: m.customer_email,
            customer_phone: m.customer_phone,
            first_name: m.customer_first_name,
            last_name: m.customer_last_name,
            instagram: m.customer_instagram || null,
            start: startDateTime,
            end: endDateTime,
            booking_type: 'wannado',
            status: 'scheduled',
            state: 'Zugesagt',
            payment_status: 'paid',
            price: parseFloat(m.wannado_price),
            payment_amount: Math.round(parseFloat(m.wannado_price) * 100),
            total_amount: parseFloat(m.wannado_price),
            work_process: 'Wannado',
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent,
            payment_received_at: new Date().toISOString(),
            description: `Wannado: ${m.wannado_name}`,
            placement: m.wannado_name
          })
          .select()
          .single();

        if (wannadoAptError) {
          console.error('❌ Wannado appointment creation failed:', wannadoAptError);
        } else {
          console.log('✅ Wannado appointment created:', wannadoAppointment.id);

          // 3. Mark wannado as sold
          const { error: wannadoUpdateError } = await supabase
            .from('wannados')
            .update({ status: 'sold' })
            .eq('id', m.wannado_id);

          if (wannadoUpdateError) {
            console.error('❌ Failed to mark wannado as sold:', wannadoUpdateError);
          } else {
            console.log('✅ Wannado marked as sold:', m.wannado_id);
          }

          // 4. Log to payment_logs
          await supabase
            .from('payment_logs')
            .insert({
              appointment_id: wannadoAppointment.id,
              action: 'payment_received',
              amount: parseFloat(m.wannado_price),
              email_sent_to: m.customer_email,
              status: 'completed'
            })
            .catch(err => console.error('Payment log error:', err));

          // 5. Send confirmation email directly via Resend API
          const customerName = `${m.customer_first_name} ${m.customer_last_name}`.trim();
          // Format date manually to avoid locale issues in Deno
          const [dy, dm, dd] = m.selected_date.split('-');
          const monthNames = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
          const dayNames = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
          const dateObj = new Date(Number(dy), Number(dm)-1, Number(dd));
          const formattedDate = `${dayNames[dateObj.getDay()]}, ${dd}. ${monthNames[Number(dm)-1]} ${dy}`;

          try {
            const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f7f6f5;font-family:Georgia,'Times New Roman',serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6f5;padding:40px 20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;"><tr><td style="padding:48px 48px 32px;text-align:center;border-bottom:1px solid #e5e5e5;"><h1 style="margin:0;font-size:28px;font-weight:normal;color:#1d1d1f;letter-spacing:1px;">MOMMY I'M SORRY</h1></td></tr><tr><td style="padding:48px;"><h2 style="margin:0 0 24px;font-size:22px;font-weight:normal;color:#1d1d1f;">Dein Wannado-Termin ist bestätigt</h2><p style="margin:0 0 32px;font-size:16px;line-height:1.6;color:#515154;">Hallo ${customerName || 'there'},<br><br>vielen Dank für deine Zahlung! Dein Wannado-Motiv ist jetzt für dich reserviert.</p><table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6f5;border-radius:8px;margin-bottom:32px;"><tr><td style="padding:24px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:8px 0;border-bottom:1px solid #e5e5e5;"><span style="color:#86868b;font-size:13px;">MOTIV</span><br><span style="color:#1d1d1f;font-size:16px;font-weight:500;">${m.wannado_name || '-'}</span></td></tr><tr><td style="padding:8px 0;border-bottom:1px solid #e5e5e5;"><span style="color:#86868b;font-size:13px;">ARTIST</span><br><span style="color:#1d1d1f;font-size:16px;font-weight:500;">${m.artist_name || '-'}</span></td></tr><tr><td style="padding:8px 0;border-bottom:1px solid #e5e5e5;"><span style="color:#86868b;font-size:13px;">DATUM</span><br><span style="color:#1d1d1f;font-size:16px;font-weight:500;">${formattedDate}</span></td></tr><tr><td style="padding:8px 0;border-bottom:1px solid #e5e5e5;"><span style="color:#86868b;font-size:13px;">UHRZEIT</span><br><span style="color:#1d1d1f;font-size:16px;font-weight:500;">${m.selected_start_time || '-'} Uhr</span></td></tr><tr><td style="padding:8px 0;border-bottom:1px solid #e5e5e5;"><span style="color:#86868b;font-size:13px;">DAUER</span><br><span style="color:#1d1d1f;font-size:16px;font-weight:500;">ca. ${m.wannado_duration_hours || '3'} Stunden</span></td></tr><tr><td style="padding:8px 0;"><span style="color:#86868b;font-size:13px;">LOCATION</span><br><span style="color:#1d1d1f;font-size:16px;font-weight:500;">MOMMY I'M SORRY</span><br><span style="color:#515154;font-size:14px;">Tübinger Str. 73, 70178 Stuttgart</span></td></tr></table></td></tr></table><p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#86868b;"><strong>Wichtig:</strong> Bitte sei pünktlich (max. 30 Min. Verspätung). Dein Wannado-Motiv ist jetzt exklusiv für dich reserviert.</p><p style="margin:0;font-size:14px;line-height:1.6;color:#86868b;">Bei Fragen erreichst du uns unter:<br><a href="mailto:info@mommyimsorry.com" style="color:#1d1d1f;">info@mommyimsorry.com</a></p></td></tr><tr><td style="padding:32px 48px;background:#1d1d1f;text-align:center;"><p style="margin:0;font-size:12px;color:#86868b;">&copy; 2026 Mommy I'm Sorry &middot; Culture Over Money</p></td></tr></table></td></tr></table></body></html>`;

            console.log('📧 Sending wannado email to:', m.customer_email, 'via Resend API, key present:', !!resendApiKey, 'key length:', resendApiKey.length);
            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: "Mommy I'm Sorry <info@mommyimsorry.com>",
                to: m.customer_email,
                subject: `Wannado-Termin bestätigt – ${m.wannado_name} bei ${m.artist_name}`,
                html: emailHtml
              })
            });

            const emailResult = await emailResponse.json();
            if (emailResponse.ok) {
              console.log('✅ Wannado confirmation email sent:', emailResult);
            } else {
              console.error('❌ Resend API error:', emailResult);
            }
          } catch (emailErr) {
            console.error('❌ Email error:', emailErr);
          }
        }
      }

      // LEGACY: Handle old-style consultation payment (appointment already exists)
      // Keep for backwards compatibility with any pending bookings
      else {
        const appointmentId = session.metadata?.appointment_id || session.client_reference_id;

        if (appointmentId && !requestId && !appointmentId.startsWith('consultation_')) {
          console.log('Processing legacy consultation payment for appointment:', appointmentId);

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
            // Update appointment status - FIX: Use correct column name
            const { error: updateError } = await supabase
              .from('appointments')
              .update({
                status: 'scheduled',
                payment_status: 'paid',
                stripe_payment_id: session.id || session.payment_intent,
                payment_received_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', appointmentId);

            if (updateError) {
              console.error('Error updating appointment:', updateError);
            } else {
              console.log('Consultation payment updated for:', appointmentId);

              // Send confirmation email
              if (appointment.customer?.email) {
                const appointmentDate = new Date(appointment.start || appointment.date);
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
