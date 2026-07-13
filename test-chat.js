import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  const contents = [
    { role: 'user', parts: [{ text: "Hello" }] }
  ];
  const res = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents
  });
  console.log(res.text);
}
run();
