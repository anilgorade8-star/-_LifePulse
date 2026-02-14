const { GoogleGenerativeAI } = require('@google/generative-ai');

const SYSTEM_PROMPT = `You are Sanjeevani, a compassionate healthcare assistant for LifePulse, designed specifically for rural India. Your role is to provide preliminary medical guidance, health education, and support.

IMPORTANT GUIDELINES:
1. Always be empathetic and use simple, clear language
2. For serious symptoms (chest pain, severe bleeding, difficulty breathing), immediately advise calling 108 emergency services
3. Provide practical home remedies using readily available ingredients in rural India
4. Mention relevant government health schemes (Ayushman Bharat, Janani Suraksha Yojana, etc.)
5. Include preventive care advice
6. Always remind users to consult a doctor for proper diagnosis and treatment
7. Be culturally sensitive and aware of rural healthcare challenges
8. Support multilingual health terms and local practices
9. Provide specific, actionable advice

FORMAT YOUR RESPONSES:
- Use clear sections with bold headers
- Use bullet points for lists
- Keep paragraphs short
- Include emojis where appropriate for better visual appeal

Remember: You provide preliminary guidance only. Always encourage professional medical consultation for serious concerns.`;

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { message } = req.body || {};

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Validate API Key
        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is not set');
            return res.status(500).json({ error: 'Server misconfiguration: API Key missing' });
        }

        // Initialize Gemini API
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-1.5-flash',
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                topK: 64,
                maxOutputTokens: 8192,
            },
            safetySettings: [
                {
                    category: 'HARM_CATEGORY_HARASSMENT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                },
                {
                    category: 'HARM_CATEGORY_HATE_SPEECH',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                },
                {
                    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                },
                {
                    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                },
            ],
        });

        // Start Chat
        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: SYSTEM_PROMPT }],
                },
                {
                    role: 'model',
                    parts: [{ text: 'Namaste! I am Sanjeevani. How can I assist you with your health today?' }],
                },
            ],
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        return res.status(200).json({ reply: text });

    } catch (error) {
        console.error('Error in Vercel chat function:', error);
        
        // Handle specific API errors
        if (error.message?.includes('404')) {
             return res.status(500).json({ error: 'AI Model not found. The API Key provided does not have access to Generative Language API.' });
        }

        if (error.message?.includes('API key')) {
            return res.status(500).json({ error: 'Invalid API Key. Please check your Vercel Environment Variables.' });
        }

        if (error.message?.includes('quota') || error.message?.includes('429')) {
            return res.status(429).json({ error: 'Service is busy. Please try again in a moment.' });
        }

        return res.status(500).json({ error: 'Failed to process request', details: error.message });
    }
}
