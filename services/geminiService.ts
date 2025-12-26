
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message } from "../types";

export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private modelName = 'gemini-3-flash-preview';

  private getAI() {
    if (!this.ai) {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error("Clé API manquante. Veuillez configurer la variable d'environnement API_KEY sur Vercel.");
      }
      this.ai = new GoogleGenAI({ apiKey });
    }
    return this.ai;
  }

  async *streamChat(history: Message[], userInput: string) {
    try {
      const ai = this.getAI();
      const systemInstruction = "Tu es un assistant IA français intelligent, serviable et créatif. Réponds en Markdown de manière concise et élégante.";

      const responseStream = await ai.models.generateContentStream({
        model: this.modelName,
        contents: [
          { role: 'user', parts: [{ text: userInput }] }
        ],
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          yield text;
        }
      }
    } catch (error) {
      console.error("Gemini Service Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
