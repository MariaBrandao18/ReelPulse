import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// URL do webhook n8n configurada via variável de ambiente.
// Configure em: Supabase Dashboard > Edge Functions > Secrets > N8N_WEBHOOK_URL
// Use o endpoint de PRODUÇÃO (/webhook/), não o de teste (/webhook-test/).
const WEBHOOK_URL = Deno.env.get("N8N_WEBHOOK_URL") ?? "";

type N8nReelPayload = {
  instagram_external_id?: string;
  thumbnail_url?: string;
  posted_at?: string; // pode vir "24/12/2025" ou ISO
  views_count?: number;
  plays_count?: number;
  comments_count?: number;
  likes_count?: number;
  video_url?: string;
};

function parsePostedAt(input?: string | null): string | null {
  if (!input) return null;

  console.log("Parsing posted_at input:", input);

  // dd/mm/yyyy (Brazilian format)
  const brSlash = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const brSlashMatch = input.match(brSlash);
  if (brSlashMatch) {
    const [, dd, mm, yyyy] = brSlashMatch;
    // Use timezone offset -03:00 for Brazil to avoid UTC conversion issues
    const result = `${yyyy}-${mm}-${dd}T12:00:00-03:00`;
    console.log("Parsed BR slash format:", result);
    return result;
  }

  // dd-mm-yyyy (Brazilian format with dashes)
  const brDash = /^(\d{2})-(\d{2})-(\d{4})$/;
  const brDashMatch = input.match(brDash);
  if (brDashMatch) {
    const [, dd, mm, yyyy] = brDashMatch;
    const result = `${yyyy}-${mm}-${dd}T12:00:00-03:00`;
    console.log("Parsed BR dash format:", result);
    return result;
  }

  // yyyy-mm-dd (ISO date only)
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/;
  if (isoDate.test(input)) {
    const result = `${input}T12:00:00-03:00`;
    console.log("Parsed ISO date format:", result);
    return result;
  }

  // Try parsing as generic date string
  const date = new Date(input);
  console.log("Parsed as generic date:", date.toISOString());
  return isNaN(date.getTime()) ? null : date.toISOString();
}

function pickFirstItem(payload: unknown): N8nReelPayload | null {
  if (!payload) return null;
  if (Array.isArray(payload)) return (payload[0] ?? null) as N8nReelPayload | null;
  if (typeof payload === "object") return payload as N8nReelPayload;
  return null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1) Autenticação: pegamos o usuário do JWT (não confiamos no userId do body)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !anonKey || !serviceKey) {
      console.error("Missing backend env vars");
      return new Response(JSON.stringify({ error: "Backend não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!WEBHOOK_URL) {
      console.error("Missing N8N_WEBHOOK_URL env var");
      return new Response(JSON.stringify({ error: "Webhook n8n não configurado. Defina N8N_WEBHOOK_URL nas secrets da Edge Function." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      console.error("Unauthorized:", userError);
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Body
    const rawBody = await req.text();
    if (!rawBody?.trim()) {
      return new Response(
        JSON.stringify({
          error: "Body vazio. Envie JSON no formato { url, instagramAccountId }.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let body: { url?: string; instagramAccountId?: string };
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      console.error("Invalid JSON body:", rawBody);
      return new Response(JSON.stringify({ error: "JSON inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = body.url?.trim();
    const instagramAccountId = body.instagramAccountId;

    console.log("Received request to add reel:", {
      url,
      userId: user.id,
      instagramAccountId,
    });

    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!instagramAccountId) {
      return new Response(JSON.stringify({ error: "instagramAccountId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service client para escrever no banco
    const serviceClient = createClient(supabaseUrl, serviceKey);

    // 3) Verifica se a conta do Instagram pertence ao usuário
    const { data: igAccount, error: igError } = await serviceClient
      .from("instagram_accounts")
      .select("id, user_id")
      .eq("id", instagramAccountId)
      .maybeSingle();

    if (igError) {
      console.error("Error checking instagram account:", igError);
      return new Response(JSON.stringify({ error: "Erro ao validar conta Instagram" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!igAccount || igAccount.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Conta Instagram inválida" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4) Chama n8n
    console.log("Calling n8n webhook:", WEBHOOK_URL);
    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        userId: user.id,
        instagramAccountId,
        timestamp: new Date().toISOString(),
      }),
    });

    const webhookText = await webhookResponse.text();
    console.log("Webhook response status:", webhookResponse.status);
    console.log("Webhook raw body length:", webhookText?.length ?? 0);

    if (!webhookResponse.ok) {
      console.error("Webhook error:", webhookText);
      return new Response(
        JSON.stringify({
          error: "Falha ao processar no webhook",
          details: webhookText,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!webhookText?.trim()) {
      // Este é o caso mais comum quando o webhook está em modo teste e não retorna JSON.
      return new Response(
        JSON.stringify({
          error:
            "O webhook respondeu 200, mas sem JSON no body. Verifique se o n8n está ativo (modo produção) e retornando JSON.",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let webhookJson: unknown;
    try {
      webhookJson = JSON.parse(webhookText);
    } catch (e) {
      console.error("Webhook returned non-JSON:", webhookText);
      return new Response(
        JSON.stringify({
          error: "Webhook não retornou JSON válido",
          details: webhookText.slice(0, 500),
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const parsed = pickFirstItem(webhookJson);
    if (!parsed) {
      return new Response(
        JSON.stringify({
          error: "JSON do webhook veio vazio/inesperado",
          details: webhookJson,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 5) Escreve no banco (somente depois de ter dados válidos)
    // Use upsert para lidar com reels duplicados
    console.log("Upserting video_reel...");
    const { data: reelRow, error: reelError } = await serviceClient
      .from("video_reel")
      .upsert(
        {
          user_id: user.id,
          instagram_account_id: instagramAccountId,
          video_url: parsed.video_url ?? url,
          instagram_external_id: parsed.instagram_external_id ?? null,
          thumbnail_url: parsed.thumbnail_url ?? null,
          posted_at: parsePostedAt(parsed.posted_at),
        },
        {
          onConflict: "instagram_external_id",
          ignoreDuplicates: false,
        },
      )
      .select("id")
      .single();

    if (reelError) {
      console.error("Error upserting video_reel:", reelError);
      return new Response(JSON.stringify({ error: "Erro ao salvar reel", details: reelError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6) Insert/Update daily stats
    console.log("Upserting reels_daily_stats...");
    const today = new Date().toISOString().slice(0, 10);
    const { error: statsError } = await serviceClient.from("reels_daily_stats").upsert(
      {
        reel_id: reelRow.id,
        captured_at: today,
        views_count: parsed.views_count ?? 0,
        likes_count: parsed.likes_count ?? 0,
        comments_count: parsed.comments_count ?? 0,
        plays_count: parsed.plays_count ?? 0,
      },
      {
        onConflict: "reel_id,captured_at",
      },
    );

    if (statsError) {
      console.error("Error inserting reels_daily_stats:", statsError);
      return new Response(JSON.stringify({ error: "Erro ao salvar estatísticas" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 7) Cache thumbnail to storage com retry (até 3 tentativas com backoff exponencial)
    let thumbnailCachedUrl: string | null = null;
    const thumbnailUrl = parsed.thumbnail_url;
    const externalId = parsed.instagram_external_id;

    if (thumbnailUrl && externalId) {
      console.log("Caching thumbnail to storage...");

      const MAX_RETRIES = 3;
      const storagePath = `reels/${externalId}.jpg`;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          if (attempt > 1) {
            const backoffMs = Math.pow(2, attempt - 1) * 500; // 500ms, 1s, 2s
            console.log(`Thumbnail retry ${attempt}/${MAX_RETRIES}, waiting ${backoffMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
          }

          const imageResponse = await fetch(thumbnailUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.9",
              Referer: "https://www.instagram.com/",
            },
          });

          if (!imageResponse.ok) {
            console.warn(`Thumbnail fetch attempt ${attempt} failed: HTTP ${imageResponse.status}`);
            continue;
          }

          const imageBytes = await imageResponse.arrayBuffer();
          const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

          console.log(`Uploading thumbnail (attempt ${attempt}): ${storagePath} (${imageBytes.byteLength} bytes)`);

          const { error: uploadError } = await serviceClient.storage
            .from("dowload-image")
            .upload(storagePath, imageBytes, {
              contentType: contentType,
              cacheControl: "3600",
              upsert: true,
            });

          if (uploadError) {
            console.warn(`Thumbnail upload attempt ${attempt} failed:`, uploadError.message);
            continue;
          }

          const { data: publicUrlData } = serviceClient.storage.from("dowload-image").getPublicUrl(storagePath);
          thumbnailCachedUrl = publicUrlData?.publicUrl ?? null;
          console.log("Thumbnail cached successfully:", thumbnailCachedUrl);

          if (thumbnailCachedUrl) {
            const { error: updateError } = await serviceClient
              .from("video_reel")
              .update({ thumbnail_cached_url: thumbnailCachedUrl })
              .eq("id", reelRow.id);

            if (updateError) {
              console.error("Error updating thumbnail_cached_url:", updateError);
            }
          }

          break; // Sucesso — sai do loop de retry
        } catch (cacheError) {
          console.warn(`Thumbnail caching attempt ${attempt} threw an error:`, cacheError);
          if (attempt === MAX_RETRIES) {
            console.error("All thumbnail caching attempts failed. Reel saved without cached thumbnail.");
          }
        }
      }
    }

    console.log("Reel and stats saved successfully");

    return new Response(
      JSON.stringify({
        success: true,
        reelId: reelRow.id,
        thumbnailCachedUrl,
        message: "Reel processado e salvo",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error processing request:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
