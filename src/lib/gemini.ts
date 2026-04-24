import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function analyzeEmergency(input: string) {
  if (!process.env.GEMINI_API_KEY) {
    // Fallback if key is missing (for demo purposes)
    return {
      language: "Detected",
      emergency_type: "Medical",
      symptoms: ["Chest Pain", "Breathing difficulty"],
      urgency_score: 0.9,
      confidence: 0.85,
      analysis: "High priority cardiac emergency suspected."
    };
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this emergency request (could be in Hindi, Kannada, Tamil, or Hinglish): "${input}"`,
    config: {
      systemInstruction: `You are the AI Triage Engine for ANEIS (India's Emergency System). 
      Extract the emergency details into JSON. 
      Fields: 
      - language: identified language
      - emergency_type: Medical, Fire, Accident, Disaster
      - symptoms: list of key issues
      - urgency_score: 0 to 1 (1 is critical)
      - confidence: AI confidence 0 to 1
      - analysis: brief description of the situation in English`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          language: { type: Type.STRING },
          emergency_type: { type: Type.STRING },
          symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
          urgency_score: { type: Type.NUMBER },
          confidence: { type: Type.NUMBER },
          analysis: { type: Type.STRING }
        },
        required: ["language", "emergency_type", "urgency_score", "analysis"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
}
