import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, format, saveToStorage = true } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Generating image for prompt: ${prompt}, format: ${format}`);

    const aspectRatioText = format === '1:1' 
      ? 'square 1:1 aspect ratio' 
      : format === '9:16' 
        ? 'vertical 9:16 mobile aspect ratio' 
        : 'horizontal 16:9 widescreen aspect ratio';

    const enhancedPrompt = `Professional marketing campaign image. ${prompt}. Clean, modern design with ${aspectRatioText}. High quality, suitable for social media advertising. No text overlays.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          { role: 'user', content: enhancedPrompt }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('Image generation response received');

    const base64ImageUrl = aiResponse.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!base64ImageUrl) {
      console.error('No image URL in response:', aiResponse);
      throw new Error('No image generated');
    }

    let finalImageUrl = base64ImageUrl;

    // If saveToStorage is true, upload the base64 image to Supabase Storage
    if (saveToStorage && base64ImageUrl.startsWith('data:image')) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Extract base64 data
        const base64Data = base64ImageUrl.split(',')[1];
        const mimeType = base64ImageUrl.match(/data:([^;]+);/)?.[1] || 'image/png';
        const extension = mimeType.split('/')[1] || 'png';
        
        // Decode base64 to bytes
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Generate unique filename
        const fileName = `cta-${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
        
        // Upload to campaign-images bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('campaign-images')
          .upload(fileName, bytes, {
            contentType: mimeType,
            cacheControl: '3600',
          });

        if (uploadError) {
          console.error('Error uploading to storage:', uploadError);
          // Return base64 as fallback
        } else {
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('campaign-images')
            .getPublicUrl(fileName);
          
          finalImageUrl = publicUrl;
          console.log('Image uploaded to storage:', finalImageUrl);
        }
      } catch (storageError) {
        console.error('Storage error:', storageError);
        // Return base64 as fallback
      }
    }

    return new Response(
      JSON.stringify({ imageUrl: finalImageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating image:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
