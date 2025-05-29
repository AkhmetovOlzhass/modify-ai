import { extractRequestedCount } from '../utils/extract.js';



export async function generateSongsForMood(mood, apiKey) {
    const promptCount = `From the following text, extract how many songs the user wants. 
Return only a single number. If no number is mentioned, return 15. 
If the number is more than 100, return 100.
Text: "${mood}"`;

    const responseCount = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptCount }] }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: 'number'
                    }
                }
            })
        }
    );

    const dataCount = await responseCount.json();
    const raw = dataCount?.candidates?.[0]?.content?.parts?.[0]?.text;

    const number = parseInt(raw);
    let count;
    if (!number || isNaN(number)) {
        count = 15;
    }
    count =  Math.min(number, 100);


    const prompt = `Generate a playlist of exactly ${count} songs that match the mood: "${mood}". 
⚠️ Rules:
- You must return exactly ${count} songs.
- Never return more or fewer than ${count}. If it’s impossible, stop and say it's not possible.
- Each song must be a JSON object with a "title" and "artist".
- Return only a valid JSON array of objects. Do not include any explanations, headings, or notes.`;
    
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