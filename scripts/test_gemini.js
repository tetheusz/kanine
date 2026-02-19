const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env' });

async function main() {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) {
        console.error("No GOOGLE_API_KEY found in .env");
        return;
    }

    console.log("Using key:", key.substring(0, 10) + "...");

    const genAI = new GoogleGenerativeAI(key);

    // Method 2: Raw HTTP List Models
    try {
        console.log("Fetching visible models via API...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);

        if (!response.ok) {
            console.error(`HTTP Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error("Response:", text);
        } else {
            const data = await response.json();
            console.log("Available Models:");
            if (data.models) {
                data.models.forEach(m => {
                    if (m.name.includes("gemini")) {
                        console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`);
                    }
                });
            } else {
                console.log("No models field in response:", data);
            }
        }
    } catch (e) {
        console.error("Fetch failed:", e.message);
    }

    // There isn't a direct listModels on the client instance in some versions, 
    // but let's try a standard generation with a known safe model 'gemini-pro' to see if it works
    // or use the model listing if exposed.
    // Actually, for Node SDK, typical usage is just getting the model.
    // But to debug the 404, let's try to hit the list endpoint via fetch if SDK doesn't support it easily 
    // independent of the model instance.

    // Let's try 'gemini-1.5-flash' again purely.
    try {
        console.log("Testing gemini-1.5-flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-1.5-flash!", result.response.text());
    } catch (e) {
        console.error("Failed gemini-1.5-flash:", e.message);
    }

    try {
        console.log("Testing gemini-1.5-flash-001...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-1.5-flash-001!", result.response.text());
    } catch (e) {
        console.error("Failed gemini-1.5-flash-001:", e.message);
    }

    try {
        console.log("Testing gemini-pro...");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-pro!", result.response.text());
    } catch (e) {
        console.error("Failed gemini-pro:", e.message);
    }
}

main();
