import { GoogleGenAI, Type } from "@google/genai";
import { GameMode, GameState, ResultData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateOptionsAI = async (topic: string, language: 'en' | 'zh') => {
  const model = "gemini-3-flash-preview";
  const prompt = `Generate 4-6 diverse voting options for the topic: "${topic}". 
  Each option should have a short name and a brief description.
  Respond in ${language === 'zh' ? 'Traditional Chinese' : 'English'}.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["name", "description"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};

export const refineDescriptionsAI = async (options: { name: string, description: string }[], language: 'en' | 'zh') => {
  const model = "gemini-3-flash-preview";
  const prompt = `Refine and professionalize the following voting options. Keep the names similar but improve the descriptions to be more clear and persuasive.
  Options: ${JSON.stringify(options)}
  Respond in ${language === 'zh' ? 'Traditional Chinese' : 'English'}.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["name", "description"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};

export const generateSummaryReportAI = async (state: GameState, results: ResultData[], language: 'en' | 'zh') => {
  const model = "gemini-3-flash-preview";
  
  const dataSummary = {
    mode: state.mode,
    participantsCount: state.participants.length,
    options: results.map(r => ({
      name: r.name,
      totalScore: r.total,
      average: r.mean,
      median: r.median,
      votesCount: r.count
    }))
  };

  const prompt = `You are an expert analyst. Generate a comprehensive summary report for a Fibonacci Voting session.
  Voting Data: ${JSON.stringify(dataSummary)}
  
  The report should include:
  1. Executive Summary
  2. Detailed Analysis of the Winner
  3. Comparison of all options
  4. Strategic Recommendations based on the voting patterns.
  
  Respond in ${language === 'zh' ? 'Traditional Chinese' : 'English'}. Use Markdown formatting.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt
  });

  return response.text || "";
};
