const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error('API Key not found in .env');
    process.exit(1);
}

async function listModels() {
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log(`Checking models with key: ${apiKey.substring(0, 10)}...`);

    // List of models to try (exhaustive list)
    const models = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash-001',
        'gemini-1.5-flash-002',
        'gemini-1.5-pro',
        'gemini-1.5-pro-latest',
        'gemini-1.0-pro',
        'gemini-pro',
        'gemini-2.0-flash-exp', // Try legacy exp if available
    ];

    console.log('Testing execution permissions for models...');

    for (const modelName of models) {
        process.stdout.write(`Testing ${modelName.padEnd(25)}: `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Say OK');
            const response = await result.response;
            console.log(`✅ SUCCESS! Response: ${response.text().trim()}`);
            console.log(`\n🎉 FOUND WORKING MODEL: ${modelName}\n`);
            return; // Stop at first working model
        } catch (error) {
            if (error.message.includes('404')) console.log('❌ 404 (Not Found)');
            else if (error.message.includes('429')) console.log('❌ 429 (Quota/Limit Exceeded)');
            else console.log(`❌ Error: ${error.message.split('\n')[0]}`);
        }
    }
    console.log('\n❌ No working models found with current API Key.');
}

listModels();
