import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const generateAdDescription = async (title: string, category: string, features: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Escreve uma descrição apelativa para um anúncio de classificados.
      Título: ${title}
      Categoria: ${category}
      Características: ${features}
      
      A descrição deve ser profissional, honesta e destacar os pontos fortes. Usa parágrafos e emojis se apropriado.`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Error generating description:", error);
    return "";
  }
};

export const analyzeAdPerformance = async (ads: any[]) => {
  try {
    const adSummaries = ads.map(ad => `Título: ${ad.title}, Categoria: ${ad.category}, Visualizações: ${ad.views || 0}`).join('\n');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analisa o desempenho dos seguintes anúncios e sugere estratégias promocionais baseadas nas tendências de mercado atuais:
      ${adSummaries}
      
      Fornece uma análise breve e 3 sugestões concretas de otimização ou promoção.`,
    });
    return response.text || "Análise concluída com sucesso.";
  } catch (error) {
    console.error("Error analyzing ad performance:", error);
    return "Erro ao analisar o desempenho.";
  }
};
