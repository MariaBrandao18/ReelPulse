import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verificação de segurança via X-CRON-SECRET
  const cronSecret = Deno.env.get('CRON_SECRET');
  const requestSecret = req.headers.get('x-cron-secret');

  if (!cronSecret || requestSecret !== cronSecret) {
    console.error('Unauthorized: Invalid or missing X-CRON-SECRET header');
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Invalid or missing X-CRON-SECRET header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Criar cliente Supabase com service_role para bypass de RLS
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // GET: Retorna todos os video_reels ativos para monitoramento
    if (req.method === 'GET') {
      console.log('GET request: Fetching all video_reels for monitoring');

      const { data, error } = await supabase
        .from('video_reel')
        .select('id, video_url')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching video_reels:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch video_reels', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Found ${data?.length || 0} video_reels`);
      return new Response(
        JSON.stringify({ success: true, count: data?.length || 0, reels: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST: Recebe métricas do n8n e insere em reels_daily_stats
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('POST request: Received metrics from n8n', JSON.stringify(body));

      // Suporta tanto um único objeto quanto um array de objetos
      const metricsArray = Array.isArray(body) ? body : [body];

      const insertResults = [];
      const errors = [];

      for (const metrics of metricsArray) {
        const { video_reel_id, views, likes, comments, plays } = metrics;

        if (!video_reel_id) {
          errors.push({ error: 'Missing video_reel_id', received: metrics });
          continue;
        }

        const insertData = {
          reel_id: video_reel_id,
          views_count: views ?? 0,
          likes_count: likes ?? 0,
          comments_count: comments ?? 0,
          plays_count: plays ?? 0,
          // captured_at usa o default CURRENT_DATE
        };

        console.log('Inserting stats:', JSON.stringify(insertData));

        const { data, error } = await supabase
          .from('reels_daily_stats')
          .insert(insertData)
          .select();

        if (error) {
          console.error('Error inserting stats:', error);
          errors.push({ video_reel_id, error: error.message });
        } else {
          insertResults.push(data[0]);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: errors.length === 0, 
          inserted: insertResults.length,
          failed: errors.length,
          results: insertResults,
          errors: errors.length > 0 ? errors : undefined
        }),
        { 
          status: errors.length === metricsArray.length ? 400 : 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
