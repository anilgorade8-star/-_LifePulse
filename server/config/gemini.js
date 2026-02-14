const { GoogleGenerativeAI } = require('@google/generative-ai');

// Validate API key on startup
if (!process.env.GEMINI_API_KEY) {
    console.error('❌ ERROR: GEMINI_API_KEY is not set in .env file');
    console.error('Please create a .env file and add your Gemini API key');
    console.error('Get your key from: https://makersuite.google.com/app/apikey');
    process.exit(1);
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configure the model
const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024,
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

// Healthcare-specific system prompt
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

module.exports = {
    model,
    SYSTEM_PROMPT,
};
