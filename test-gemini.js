const { GoogleGenerativeAI } = require("@google/generative-ai");
const apiKey = process.env.GEMINI_API_KEY || "AIzaSyDQUte262__tknmMS_SQRsq13JyO2URBWs";
const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const prompt = "Can you format [{title: 'Stay active', description:'You haven\\'t applied recently.'}]";
    console.log("Sending...");
    const res = await model.generateContent(prompt);
    console.log("Response:", res.response.text());
  } catch(e) {
    console.error("Error:", e);
  }
}
test();
