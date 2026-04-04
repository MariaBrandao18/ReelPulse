import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
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
    // 1) Parse and validate input
    const body = await req.json();
    const { imageUrl, fileKey } = body;

    if (!imageUrl || typeof imageUrl !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'imageUrl' field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!fileKey || typeof fileKey !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'fileKey' field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching image from: ${imageUrl}`);
    console.log(`File key: ${fileKey}`);

    // 2) Fetch the image from the URL (server-side)
    const imageResponse = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.instagram.com/",
      },
    });

    if (!imageResponse.ok) {
      console.error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch image from URL", 
          status: imageResponse.status,
          statusText: imageResponse.statusText 
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3) Read the image bytes and content-type
    const imageBytes = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    
    console.log(`Image fetched successfully. Size: ${imageBytes.byteLength} bytes, Content-Type: ${contentType}`);

    // 4) Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 5) Upload to Storage bucket "download-image"
    const storagePath = `reels/${fileKey}.jpg`;
    
    console.log(`Uploading to storage: ${storagePath}`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("dowload-image")
      .upload(storagePath, imageBytes, {
        contentType: contentType,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload image to storage", details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Upload successful:", uploadData);

    // 6) Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from("dowload-image")
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData?.publicUrl;

    // 7) If bucket is not public, also generate a signed URL (24h expiry)
    let signedUrl: string | null = null;
    
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("dowload-image")
      .createSignedUrl(storagePath, 60 * 60 * 24); // 24 hours

    if (!signedUrlError && signedUrlData) {
      signedUrl = signedUrlData.signedUrl;
    }

    console.log("Cache complete. Public URL:", publicUrl);

    // 8) Return success response
    return new Response(
      JSON.stringify({
        ok: true,
        bucket: "dowload-image",
        path: storagePath,
        publicUrl: publicUrl,
        signedUrl: signedUrl,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Unexpected error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
