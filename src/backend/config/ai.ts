import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let cachedAi: GoogleGenAI | null = null;
let cachedApiKey: string | undefined = undefined;

export function getAi(): GoogleGenAI {
  const currentKey = process.env.GEMINI_API_KEY;
  if (!cachedAi || cachedApiKey !== currentKey) {
    cachedAi = new GoogleGenAI({
      apiKey: currentKey || "",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    cachedApiKey = currentKey;
  }
  return cachedAi;
}
