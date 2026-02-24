import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateWelcomeEmail } from "./templates/welcome-email-template.ts";
import { generateOrderConfirmationEmail } from "./templates/order-confirmation-email-template.ts";
import { generateCommissionEarnedEmail } from "./templates/commission-earned-email-template.ts";
import { generateRankUpgradeEmail } from "./templates/rank-upgrade-celebration-email-template.ts";
import { generateWithdrawalApprovedEmail } from "./templates/withdrawal-approved-email-template.ts";
import { generateWithdrawalRejectedEmail } from "./templates/withdrawal-rejected-email-template.ts";
import { generateWithdrawalPendingEmail } from "./templates/withdrawal-pending-email-template.ts";

// Resend API endpoint
const RESEND_API_ENDPOINT = "https://api.resend.com/emails";

const ALLOWED_ORIGINS = [
  'https://wellnexus.vn',
  'https://www.wellnexus.vn',
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };
}

interface EmailRequest {
  to: string | string[];
  subject: string;
  html?: string; // Optional if using template
  templateType?: 'welcome' | 'order-confirmation' | 'commission-earned' | 'rank-upgrade' | 'withdrawal-approved' | 'withdrawal-rejected' | 'withdrawal-pending';
  data?: Record<string, unknown>;
  from?: string;
  replyTo?: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Require service role key OR authenticated user (internal calls only)
  const authHeader = req.headers.get('Authorization');
  const serviceKey = req.headers.get('x-service-key');
  const expectedServiceKey = Deno.env.get('INTERNAL_SERVICE_KEY');

  // Allow if valid service key (internal server-to-server call)
  const hasValidServiceKey = expectedServiceKey && serviceKey === expectedServiceKey;

  // Allow if authenticated Supabase user (logged-in user triggering email)
  let isAuthenticatedUser = false;
  if (!hasValidServiceKey && authHeader) {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    isAuthenticatedUser = !!user;
  }

  if (!hasValidServiceKey && !isAuthenticatedUser) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { to, subject, html, templateType, data, from, replyTo }: EmailRequest = await req.json();

    // Validate required fields
    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate HTML from template if templateType is provided
    let emailHtml = html;
    if (!emailHtml && templateType && data) {
      switch (templateType) {
        case 'welcome':
          emailHtml = generateWelcomeEmail(data);
          break;
        case 'order-confirmation':
          emailHtml = generateOrderConfirmationEmail(data);
          break;
        case 'commission-earned':
          emailHtml = generateCommissionEarnedEmail(data);
          break;
        case 'rank-upgrade':
          emailHtml = generateRankUpgradeEmail(data);
          break;
        case 'withdrawal-approved':
          emailHtml = generateWithdrawalApprovedEmail(data);
          break;
        case 'withdrawal-rejected':
          emailHtml = generateWithdrawalRejectedEmail(data);
          break;
        case 'withdrawal-pending':
          emailHtml = generateWithdrawalPendingEmail(data);
          break;
        default:
          return new Response(
            JSON.stringify({ error: `Unknown template type: ${templateType}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }
    }

    // Validate we have HTML content
    if (!emailHtml) {
      return new Response(
        JSON.stringify({ error: 'Missing email content: provide either html or templateType with data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('[SendEmail] RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email via Resend API
    const emailPayload = {
      from: from || 'WellNexus <noreply@wellnexus.vn>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html: emailHtml,
      ...(replyTo && { reply_to: replyTo }),
    };

    console.log('[SendEmail] Sending email to:', to, 'Template:', templateType || 'custom');

    const response = await fetch(RESEND_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('[SendEmail] Resend API error:', responseData);
      return new Response(
        JSON.stringify({
          error: 'Failed to send email',
          details: responseData
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[SendEmail] Email sent successfully:', responseData.id);

    return new Response(
      JSON.stringify({
        success: true,
        id: responseData.id,
        message: 'Email sent successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[SendEmail] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
