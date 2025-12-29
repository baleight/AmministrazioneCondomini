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
  if (!ai) return "Configurazione IA mancante: Imposta API_KEY.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Sei un esperto gestore di condomini. Analizza questa segnalazione di manutenzione.
      
      Titolo Segnalazione: ${title}
      Descrizione: ${description}
      
      Fornisci una breve analisi strutturata in ITALIANO includendo:
      1. Priorità stimata (Bassa/Media/Alta/Emergenza)
      2. Professionista consigliato (es. Elettricista, Idraulico)
      3. Una risposta cortese suggerita da inviare all'inquilino.
      
      Mantieni l'output conciso (sotto le 150 parole).`,
    });
    return response.text || "Nessuna analisi disponibile.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Impossibile analizzare la segnalazione. Controlla la rete o la chiave API.";
  }
};

export const draftCommunication = async (topic: string, tone: 'formal' | 'friendly' | 'urgent'): Promise<{ title: string, content: string }> => {
  const ai = getClient();
  if (!ai) return { title: "Errore", content: "Configurazione IA mancante." };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Scrivi un avviso condominiale in ITALIANO riguardante: "${topic}".
      Tono: ${tone}.
      
      Restituisci il risultato in formato JSON con le chiavi "title" e "content".
      Il contenuto deve essere chiaro, professionale e pronto per essere inviato.`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return { title: "Creazione Fallita", content: "Impossibile generare la bozza." };
  }
};