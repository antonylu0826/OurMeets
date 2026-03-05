import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.log("No GEMINI_API_KEY found in environment");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const models = await model.generateContent("hello");
        console.log("gemini-1.5-flash works:", models.response.text());
    } catch (e) {
        console.error("gemini-1.5-flash error:", e.message);
    }
}
listModels();
