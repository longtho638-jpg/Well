import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, history, modelName = 'gemini-pro', temperature = 0.7 } = await req.json();

    // Get API key from Supabase secrets
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName }); // gemini-pro is text-only, gemini-pro-vision is multimodal

    const generationConfig = {
        temperature,
    };

    let text = '';

    if (history && Array.isArray(history) && history.length > 0) {
        // Chat mode
        const chat = model.startChat({
            history: history.map((msg: any) => ({
                role: msg.role === 'client' || msg.role === 'user' ? 'user' : 'model', // Gemini uses 'user' and 'model' roles
                parts: [{ text: msg.content || msg.parts?.[0]?.text || '' }],
            })),
            generationConfig,
        });

        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        text = response.text();

    } else {
        // Single prompt mode
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig,
        });
        const response = await result.response;
        text = response.text();
    }

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in gemini-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
