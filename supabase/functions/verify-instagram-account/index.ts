import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Autenticação via JWT Bearer token
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  if (!supabaseUrl || !anonKey) {
    return new Response(JSON.stringify({ error: "Backend não configurado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await authClient.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const username = (body.username ?? "").trim().replace(/^@/, "");

    if (!username) {
      return new Response(JSON.stringify({ error: "Username é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Valida formato básico do username do Instagram:
    // 1-30 caracteres, apenas letras, números, pontos e underscores.
    const validUsername = /^[a-zA-Z0-9._]{1,30}$/.test(username);
    if (!validUsername) {
      return new Response(
        JSON.stringify({ exists: false, error: "Username inválido. Use apenas letras, números, pontos e underscores (máximo 30 caracteres)." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verifica existência do perfil acessando a página pública do Instagram.
    // Nota: Instagram pode alterar esse comportamento. Se necessário, migre para
    // a Instagram Graph API oficial (requer Meta Developer App).
    const profileUrl = `https://www.instagram.com/${username}/`;
    let exists = false;
    let verificationNote = "";

    try {
      const response = await fetch(profileUrl, {
        method: "HEAD",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
          Accept: "text/html",
        },
        redirect: "follow",
      });

      if (response.status === 200) {
        exists = true;
      } else if (response.status === 404) {
        exists = false;
      } else {
        // Status inesperado (429 rate-limit, 500 Instagram offline, etc.)
        // Nesse caso, permitimos o cadastro com aviso ao usuário.
        console.warn(`Instagram verification returned unexpected status ${response.status} for @${username}`);
        exists = true;
        verificationNote = "Verificação automática indisponível no momento. A conta foi adicionada, mas confirme se o @ está correto.";
      }
    } catch (fetchError) {
      // Falha de rede ao acessar o Instagram. Permitimos o cadastro com aviso.
      console.warn("Failed to reach Instagram for verification:", fetchError);
      exists = true;
      verificationNote = "Verificação automática indisponível no momento. A conta foi adicionada, mas confirme se o @ está correto.";
    }

    return new Response(
      JSON.stringify({ exists, username, note: verificationNote || undefined }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Erro interno", details: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
