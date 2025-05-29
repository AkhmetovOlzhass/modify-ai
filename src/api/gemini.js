export async function generateSongsForMood(mood, apiKey) {
    const prompt = `Составь список из 15 песен, подходящих под настроение: "${mood}". Для каждой песни укажи название и исполнителя.`;
    
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                artist: { type: 'string' }
                            },
                            required: ['title', 'artist']
                        }
                    }
                }
            })
        }
    );

    const data = await response.json();
    const geminiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!geminiReply) {
        throw new Error('No response from Gemini API');
    }
    
    return JSON.parse(geminiReply);
}