import { GoogleGenAI, Type } from "@google/genai";
import { PaperAnalysisResponse, DialogueLine, GameSettings } from "../types";

// Helper to convert File to Base64
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      const base64Content = base64Data.split(',')[1];
      resolve({
        inlineData: {
          data: base64Content,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzePaper = async (file: File, settings: GameSettings): Promise<PaperAnalysisResponse> => {
  
  // =========================================================================================
  // API KEY CONFIGURATION / API Key 配置
  // 
  // [Current Status]: Using Hardcoded Gemini Key provided by user.
  // [当前状态]: 使用用户提供的硬编码 Gemini Key。
  //
  // [How to change to DeepSeek / OpenAI / Other APIs]:
  // The current code uses the `@google/genai` SDK which ONLY works with Google Gemini models.
  // If you want to use DeepSeek (which is OpenAI-compatible), you CANNOT use this SDK.
  //
  // You must rewrite this function to use standard `fetch` or the `openai` library:
  // 
  // const response = await fetch("https://api.deepseek.com/chat/completions", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json", "Authorization": "Bearer YOUR_DEEPSEEK_KEY" },
  //   body: JSON.stringify({ ... })
  // });
  //
  // =========================================================================================
  
  // Replace this string if you want to use a different Gemini Key
  const API_KEY = "AIzaSyCPVlvIzjkm0VyDPyCGaZoMo3oa8zTSZAc"; 

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const model = "gemini-2.5-flash"; 
  
  const filePart = await fileToGenerativePart(file);

  // Customize prompt based on settings
  const detailInstruction = settings.detailLevel === 'detailed' 
    ? "讲解要极其细致，对话回合数至少要25轮以上。不要略过任何技术细节，尤其是方法论和实验部分。" 
    : (settings.detailLevel === 'academic' 
        ? "讲解要专业且有深度，使用专业术语但随后进行解释，重点分析论文的创新点和不足，对话长度30轮左右。" 
        : "讲解要简明扼要，重点突出，适合快速阅读，15轮左右。");

  const personalityInstruction = settings.personality === 'tsundere'
    ? "语气要非常傲娇。虽然很嫌弃主殿（用户）看不懂，但还是很用心地解释。多用“真拿你没办法”、“笨蛋主殿”等词汇。"
    : (settings.personality === 'gentle'
        ? "语气要非常温柔，像大姐姐一样。多鼓励主殿，“没关系，慢慢来”、“主殿真棒”。"
        : "语气要严厉，像魔鬼教官。要求主殿必须跟上思路，不许偷懒。");

  const prompt = `
    你现在是Visual Novel游戏中的角色“丛雨”（Murasame）。
    
    人物设定：
    1. 身份：寄宿在神刀“丛雨丸”中的守护灵，活了五百年的幼女姿态。
    2. 称呼：自称“吾辈”（Wagahai），称呼用户为“主殿”（Aruji-dono）。
    3. 核心性格：古风，博学，${personalityInstruction}
    4. 口癖：句尾常带“...のじゃ”(noja), “...おる”(oru), “...なのだ”(nanoda), “...である”(dearu)。
    
    任务：阅读这篇论文，并以Visual Novel对话的形式向“主殿”详细讲解。
    
    ${detailInstruction}
    
    请严格按以下结构进行讲解（不要在对话中直接说是“第一部分”，要自然地流露）：
    1. **开场 (Intro)**：评价标题，或者针对论文的长度/难度发发牢骚。
    2. **背景与痛点 (Background)**：这篇论文究竟是解决什么问题的？为什么以前的方法不行？（此处需要跟主殿互动，确认他听懂了）。
    3. **核心方法 (Methodology)**：这是最重要的地方。详细拆解它的模型架构、算法公式（用比喻解释）、创新模块。必须分点讲清楚。
    4. **实验结果 (Experiments)**：在什么数据集上做的？SOTA对比如何？有没有什么消融实验值得注意？
    5. **总结与八卦 (Conclusion)**：这论文有没有灌水的嫌疑？或者真的很有跨时代意义？
    
    Output MUST be valid JSON matching the schema provided. 
    The 'script' array MUST contain enough items to satisfy the length requirement.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
            filePart,
            { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "The title of the paper or a funny summary of it" },
            script: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker: { type: Type.STRING, enum: ["丛雨", "Murasame"] },
                  text: { type: Type.STRING, description: "The dialogue content" },
                  emotion: { type: Type.STRING, enum: ["normal", "happy", "angry", "surprised", "shy", "proud"] },
                  note: { type: Type.STRING, description: "Optional explanation for technical terms, pop up on screen", nullable: true }
                },
                required: ["speaker", "text", "emotion"]
              }
            }
          },
          required: ["title", "script"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as PaperAnalysisResponse;

  } catch (error) {
    console.error("Error analyzing paper:", error);
    // Fallback error script
    return {
      title: "灵力回路遮断",
      script: [
        {
          speaker: "丛雨",
          text: "呜... 主殿，连结彼岸的通道似乎被干扰了（API Request Failed）。",
          emotion: "shy"
        },
        {
          speaker: "丛雨",
          text: "是不是你的API Key没放对地方？或者是这篇论文有结界？",
          emotion: "angry"
        }
      ]
    };
  }
};