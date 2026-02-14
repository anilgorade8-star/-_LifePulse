require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const fs = require('fs');
const logFile = 'test_results.txt';
fs.writeFileSync(logFile, 'STARTING TESTS\n');

async function testModel(genAI, modelName) {
    fs.appendFileSync(logFile, `Testing ${modelName}...\n`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        await model.generateContent('Hi');
        fs.appendFileSync(logFile, `SUCCESS: ${modelName}\n`);
    } catch (e) {
        fs.appendFileSync(logFile, `FAIL: ${modelName} - ${e.message}\n`);
    }
}

async function listModels() {
    if (!process.env.GEMINI_API_KEY) {
        fs.appendFileSync(logFile, '❌ GEMINI_API_KEY not found\n');
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        await testModel(genAI, 'gemini-1.5-flash');
        await testModel(genAI, 'gemini-2.5-flash');
        await testModel(genAI, 'gemini-2.0-flash-exp');
        await testModel(genAI, 'gemini-pro');
        await testModel(genAI, 'gemini-1.5-pro');

    } catch (error) {
        fs.appendFileSync(logFile, `CRITICAL ERROR: ${error.message}\n`);
    }
}

listModels();
