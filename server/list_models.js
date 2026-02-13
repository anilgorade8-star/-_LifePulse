require('dotenv').config({ path: __dirname + '/../.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

const logFile = __dirname + '/../model_check.log';
fs.writeFileSync(logFile, 'Starting model check...\n');

function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

async function checkModels() {
    try {
        if (!process.env.GEMINI_API_KEY) {
            log('❌ API Key not found in .env');
            return;
        }
        log(`API Key found: ${process.env.GEMINI_API_KEY.substring(0, 5)}...`);
        
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        const modelsToTry = [
            'gemini-1.5-flash',
            'gemini-1.5-flash-latest',
            'gemini-1.5-flash-001',
            'gemini-1.5-pro',
            'gemini-pro', 
            'gemini-1.0-pro'
        ];
        
        for (const modelName of modelsToTry) {
            try {
                log(`Trying ${modelName} (v1beta)...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                await model.generateContent('Hello');
                log(`✅ AVAILABLE (v1beta): ${modelName}`);
            } catch (e) {
                log(`❌ FAILED (v1beta): ${modelName} - ${e.message.split('\n')[0]}`);
            }

            try {
                log(`Trying ${modelName} (v1)...`);
                const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1' });
                await model.generateContent('Hello');
                log(`✅ AVAILABLE (v1): ${modelName}`);
            } catch (e) {
                log(`❌ FAILED (v1): ${modelName} - ${e.message.split('\n')[0]}`);
            }
        }
        
    } catch (error) {
        log(`Fatal error: ${error.message}`);
    }
}

checkModels();
