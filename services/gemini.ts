import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY || ''; // In a real app, you might want to prompt for this or use a backend proxy
  if (!apiKey) {
    console.warn("Gemini API Key is missing.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeTicket = async (title: string, description: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return "AI Configuration Missing: Please set API_KEY.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert facility manager. Analyze this maintenance ticket.
      
      Ticket Title: ${title}
      Description: ${description}
      
      Please provide a brief, structured analysis including:
      1. Estimated Priority (Low/Medium/High/Emergency)
      2. Recommended Professional (e.g., Electrician, Plumber)
      3. A suggested polite response to the tenant.
      
      Keep the output concise (under 150 words).`,
    });
    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to analyze ticket. Please check your network or API key.";
  }
};

export const draftCommunication = async (topic: string, tone: 'formal' | 'friendly' | 'urgent'): Promise<{ title: string, content: string }> => {
  const ai = getClient();
  if (!ai) return { title: "Error", content: "AI Configuration Missing." };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a condominium announcement about: "${topic}".
      Tone: ${tone}.
      
      Return the result in JSON format with keys "title" and "content".
      The content should be clear, professional, and ready to send.`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return { title: "Drafting Failed", content: "Could not generate draft." };
  }
};
