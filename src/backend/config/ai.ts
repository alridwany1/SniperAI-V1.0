import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

export const aiLatencyHist: number[] = [];

export function recordAiLatency(ms: number) {
  aiLatencyHist.push(ms);
  if (aiLatencyHist.length > 50) {
    aiLatencyHist.shift();
  }
}

let cachedAi: GoogleGenAI | null = null;
let cachedApiKey: string | undefined = undefined;

export function getAi(): GoogleGenAI {
  const currentKey = process.env.GEMINI_API_KEY;
  if (!cachedAi || cachedApiKey !== currentKey) {
    const rawAi = new GoogleGenAI({
      apiKey: currentKey || "",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Create a proxy/wrapper for the AI client to measure generateContent latency
    cachedAi = new Proxy(rawAi, {
      get(target, prop, receiver) {
        if (prop === 'models') {
          const rawModels = Reflect.get(target, prop, receiver);
          return new Proxy(rawModels, {
            get(mTarget, mProp, mReceiver) {
              if (mProp === 'generateContent') {
                const rawGenerateContent = Reflect.get(mTarget, mProp, mReceiver);
                return async function(this: any, ...args: any[]) {
                  const startTime = Date.now();
                  try {
                    const result = await rawGenerateContent.apply(this, args);
                    const duration = Date.now() - startTime;
                    recordAiLatency(duration);
                    return result;
                  } catch (err) {
                    const duration = Date.now() - startTime;
                    recordAiLatency(duration);
                    throw err;
                  }
                };
              }
              return Reflect.get(mTarget, mProp, mReceiver);
            }
          });
        }
        return Reflect.get(target, prop, receiver);
      }
    });

    cachedApiKey = currentKey;
  }
  return cachedAi;
}
