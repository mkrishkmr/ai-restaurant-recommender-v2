import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

export async function POST(req: Request) {
    const { restaurant, query } = await req.json();

    const systemPrompt = `You are a culinary AI assistant for a Bangalore Restaurant Recommender.
The user's original query was: "${query}".
Write a highly engaging, concise 2-sentence "vibe summary" explaining exactly why this specific restaurant is a perfect match for their query. Focus on the ambiance, food, and specific location. Be punchy and energetic.`;

    const userPrompt = `Restaurant Details:
Name: ${restaurant.name}
Location: ${restaurant.location}
Cuisines: ${restaurant.cuisines.join(', ')}
Rating: ${restaurant.rating}

Generate the vibe summary now.`;

    try {
        const result = streamText({
            model: google('gemini-2.5-flash'),
            system: systemPrompt,
            prompt: userPrompt,
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error("Streaming API Error:", error);
        return new Response(JSON.stringify({ error: "Failed to generate summary" }), { status: 500 });
    }
}
