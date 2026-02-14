const { model, SYSTEM_PROMPT } = require('../config/gemini');

/**
 * Handle chat requests from the frontend
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function handleChat(req, res) {
    try {
        const { message, language = 'en' } = req.body;

        // Validate input
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({
                error: 'Message is required and must be a non-empty string',
            });
        }

        // Limit message length to prevent abuse
        if (message.length > 1000) {
            return res.status(400).json({
                error: 'Message is too long. Please limit to 1000 characters.',
            });
        }

        console.log(`📩 Received message: "${message.substring(0, 50)}..." (Language: ${language})`);
        
        // Language name mapping
        const languageNames = {
            'en': 'English',
            'hi': 'Hindi (हिंदी)',
            'ta': 'Tamil (தமிழ்)',
            'te': 'Telugu (తెలుగు)',
            'bn': 'Bengali (বাংলা)',
            'mr': 'Marathi (मराठी)'
        };
        
        const langInstruction = language !== 'en' 
            ? `IMPORTANT: Respond in ${languageNames[language] || language}. Use the native script and maintain the same bullet-point format.\n\n`
            : '';

        // Create chat session with system prompt
        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: langInstruction + SYSTEM_PROMPT }],
                },
                {
                    role: 'model',
                    parts: [{ text: 'Namaste! I understand my role as a healthcare assistant for LifePulse. I will provide compassionate, practical healthcare guidance for rural India, always prioritizing safety and encouraging professional medical consultation when needed. How can I help you today?' }],
                },
            ],
        });

        // Send the user's message and get response
        const result = await chat.sendMessage(message);
        const response = await result.response;
        const reply = response.text();

        console.log(`✅ Generated response (${reply.length} chars)`);

        // Return the AI response
        res.json({
            reply: reply,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('❌ Error in chat controller:', JSON.stringify(error, null, 2));

        if (error.message && error.message.includes('404') && error.message.includes('not found')) {
            console.error('❌ CRITICAL: Model not found. This usually means the "Generative Language API" is not enabled in your Google Cloud Project, or your API key is invalid/restricted.');
            return res.status(500).json({
                error: 'AI Model not found. Please ensure the Generative Language API is enabled for your API key.',
                fallback: true,
            });
        }

        if (error.message && error.message.includes('API key')) {
            return res.status(500).json({
                error: 'API configuration error. Please contact support.',
                fallback: true,
            });
        }

        if (error.message.includes('quota') || error.message.includes('rate limit')) {
            return res.status(429).json({
                error: 'Service is busy. Please try again in a moment.',
                fallback: true,
            });
        }

        // Generic error response
        res.status(500).json({
            error: 'Failed to generate response. Please try again.',
            fallback: true,
        });
    }
}

module.exports = {
    handleChat,
};
