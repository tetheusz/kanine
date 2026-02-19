const https = require('https');
require('dotenv').config();

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error('API Key not found');
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log(`Querying: ${url.replace(apiKey, 'HIDDEN_KEY')}`);

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        try {
            const json = JSON.parse(data);
            if (json.models) {
                console.log('Available Models:');
                json.models.forEach(m => console.log(`- ${m.name}`));
            } else {
                console.error('Error Response:', JSON.stringify(json, null, 2));
            }
        } catch (e) {
            console.error('Raw Response:', data);
        }
    });
}).on('error', (err) => {
    console.error('Request Error:', err.message);
});
