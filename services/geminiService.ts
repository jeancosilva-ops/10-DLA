import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIAnalysisResult, Category8M, Priority } from "../types";

// Helper to sanitize JSON string if the model returns markdown code blocks
const cleanJsonString = (text: string): string => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export interface AnalysisContext {
  startDate: string; // Used as the REFERENCE DATE for the lookahead
  workName: string;
  revision: string;
}

export const analyzeSchedule = async (fileContent: string, context?: AnalysisContext): Promise<AIAnalysisResult[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey });

  let contextPrompt = "";
  if (context) {
    const start = new Date(context.startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 9); // Lookahead of 10 days
    
    contextPrompt = `
    DADOS PARA ANÁLISE DE LOOKAHEAD (10 DIAS):
    - DATA DE REFERÊNCIA (HOJE/INÍCIO): ${start.toISOString().split('T')[0]}
    - DATA LIMITE (FIM DA JANELA): ${end.toISOString().split('T')[0]}
    - NOME DA OBRA/EQUIPAMENTO: ${context.workName}
    - REVISÃO: ${context.revision}

    ATENÇÃO: Você deve focar EXCLUSIVAMENTE nas atividades que ocorrem dentro deste intervalo de datas (LOOKAHEAD). Ignore o restante do cronograma.
    `;
  }

  const prompt = `
    Você é um especialista em Paradas de Manutenção (Shutdown Manager).
    Sua missão é realizar uma ANÁLISE DE RISCO PARA UM LOOKAHEAD DE 10 DIAS.
    
    ${contextPrompt}

    CONTEXTO CRÍTICO:
    Estamos gerando um plano operacional para os próximos 10 dias a partir da Data de Referência.
    Atividades fora dessa janela são irrelevantes agora.
    
    OBJETIVO:
    Analise o conteúdo do arquivo fornecido. Identifique APENAS restrições, riscos, interferências e necessidades de recursos para as atividades que caem dentro da janela de datas estipulada acima.

    REGRAS DE CLASSIFICAÇÃO (8M):
    1. Identifique o problema ou restrição potencial.
    2. Classifique em um dos 8Ms (Mão de Obra, Material, Método, Máquinas, Medição, Meio Ambiente, Gerenciamento, Money).
    3. Prioridade: 
       - ALTA: Bloqueia atividade crítica nestes 10 dias.
       - MÉDIA: Risco de atraso dentro da janela.
       - BAIXA: Atenção administrativa.
    4. Tente identificar a ÁREA (Unidade, Tag, Local) e a DISCIPLINA (Mecânica, Elétrica, Civil) baseada no texto.
    
    REGRAS ESTRITAS:
    - Description: Descrição técnica, direta e curta.
    - Impact: Explique em 1 frase o impacto na janela de 10 dias.
    - RESPONSÁVEL: NÃO INVENTE RESPONSÁVEIS. O campo de responsável deve ser nulo ou vazio no JSON.

    Conteúdo do Cronograma (Amostra):
    ${fileContent.substring(0, 50000)}
  `;

  // Define schema for structured JSON output
  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING },
        category: { 
          type: Type.STRING, 
          enum: Object.values(Category8M) 
        },
        priority: { 
          type: Type.STRING, 
          enum: Object.values(Priority) 
        },
        impact: { type: Type.STRING },
        area: { type: Type.STRING, description: "Area or Unit extracted from text" },
        discipline: { type: Type.STRING, description: "Discipline extracted from text (e.g., Mechanical)" }
      },
      required: ["description", "category", "priority", "impact"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No data returned from AI.");
    }

    const parsedData = JSON.parse(cleanJsonString(jsonText)) as AIAnalysisResult[];
    return parsedData;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw new Error("Falha ao analisar o cronograma com IA. Verifique o arquivo e tente novamente.");
  }
};