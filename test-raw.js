const https = require('https');
require('dotenv').config();

const apiKey = process.env.GOOGLE_API_KEY;
const models = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-001',
    'gemini-1.5-flash-002',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro',
    'gemini-1.5-pro-latest',
    'gemini-1.5-pro-001',
    'gemini-1.5-pro-002',
    'gemini-1.0-pro',
    'gemini-pro',
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash',
    'learnlm-1.5-pro-experimental'
];

const data = JSON.stringify({
    contents: [{
        parts: [{ text: "Say Hello" }]
    }]
});

async function testModel(modelName) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        console.log(`Testing RAW HTTP to: ${modelName}`);

        const req = https.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => responseBody += chunk);
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                if (res.statusCode === 200) {
                    console.log(`✅ SUCCESS! ${modelName} works!`);
                    resolve(true); // Stop if found
                } else {
                    console.log('Response:', responseBody.substring(0, 100) + '...');
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.error('Error:', error);
            resolve(false);
        });

        req.write(data);
        req.end();
    });
}

async function runTests() {
    for (const m of models) {
        const success = await testModel(m);
        if (success) process.exit(0);
    }
}

runTests();
