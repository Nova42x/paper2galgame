import { PaperAnalysisResponse, DialogueLine, GameSettings } from "../types";

// =========================================================================================
// Doubao API Configuration / 豆包 API 配置
// 
// This service uses the Volcengine ARK (Doubao) API to analyze papers
// API Documentation: https://www.volcengine.com/docs/82379/1302007
// =========================================================================================

const API_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";
const MODEL_ID = "doubao-seed-1-6-251015";

// Replace this with your actual Doubao API Key (ARK_API_KEY)
// In production, use environment variables or backend proxy
const API_KEY = process.env.ARK_API_KEY || "YOUR_ARK_API_KEY_HERE";

interface DoubaoFileUploadResponse {
  id: string;
  object: string;
  bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
  status?: string;
}

interface DoubaoResponseContent {
  type: string;
  text?: string;
}

interface DoubaoResponse {
  id: string;
  object: string;
  created_at: number;
  status: string;
  output?: {
    type: string;
    content?: DoubaoResponseContent[];
  }[];
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}

/**
 * Upload PDF file to Doubao Files API
 * Returns file_id for use in Responses API
 */
const uploadPDFFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('purpose', 'user_data');
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/files`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload file: ${response.status} ${errorText}`);
  }

  const data: DoubaoFileUploadResponse = await response.json();
  
  // Wait for file processing to complete
  await waitForFileProcessing(data.id);
  
  return data.id;
};

/**
 * Wait for file to be processed by the API
 * Polls the file status until it's ready
 */
const waitForFileProcessing = async (fileId: string, maxAttempts = 30): Promise<void> => {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to check file status: ${response.status}`);
    }

    const data: DoubaoFileUploadResponse = await response.json();
    
    if (data.status === 'processed' || !data.status) {
      // File is ready or status field doesn't exist (assume ready)
      return;
    }
    
    if (data.status === 'failed') {
      throw new Error('File processing failed');
    }

    // Wait 2 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('File processing timeout');
};

/**
 * Convert File to Base64 data URL
 * Alternative method for smaller files (<50MB)
 */
const fileToBase64DataUrl = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Main function to analyze paper using Doubao API
 * Uses Files API for PDF upload (recommended method)
 */
export const analyzePaper = async (file: File, settings: GameSettings): Promise<PaperAnalysisResponse> => {
  
  try {
    // Upload file using Files API (supports files up to 512MB)
    if (file.size > 512 * 1024 * 1024) {
      throw new Error('File size exceeds 512MB limit');
    }
    
    const fileId = await uploadPDFFile(file);

    // Customize prompt based on settings
    const detailInstruction = settings.detailLevel === 'detailed' 
      ? "讲解要极其细致，对话回合数至少要25轮以上。不要略过任何技术细节，尤其是方法论和实验部分。" 
      : (settings.detailLevel === 'academic' 
          ? "讲解要专业且有深度，使用专业术语但随后进行解释，重点分析论文的创新点和不足，对话长度30轮左右。" 
          : "讲解要简明扼要，重点突出，适合快速阅读，15轮左右。");

    const personalityInstruction = settings.personality === 'tsundere'
      ? '语气要非常傲娇。虽然很嫌弃主殿（用户）看不懂，但还是很用心地解释。多用"真拿你没办法"、"笨蛋主殿"等词汇。'
      : (settings.personality === 'gentle'
          ? '语气要非常温柔，像大姐姐一样。多鼓励主殿，"没关系，慢慢来"、"主殿真棒"。'
          : '语气要严厉，像魔鬼教官。要求主殿必须跟上思路，不许偷懒。');

    const prompt = `
你现在是Visual Novel游戏中的角色"丛雨"（Murasame）。

人物设定：
1. 身份：寄宿在神刀"丛雨丸"中的守护灵，活了五百年的幼女姿态。
2. 称呼：自称"吾辈"（Wagahai），称呼用户为"主殿"（Aruji-dono）。
3. 核心性格：古风，博学，${personalityInstruction}
4. 口癖：句尾常带"...のじゃ"(noja), "...おる"(oru), "...なのだ"(nanoda), "...である"(dearu)。

任务：阅读这篇论文，并以Visual Novel对话的形式向"主殿"详细讲解。

${detailInstruction}

请严格按以下结构进行讲解（不要在对话中直接说是"第一部分"，要自然地流露）：
1. **开场 (Intro)**：评价标题，或者针对论文的长度/难度发发牢骚。
2. **背景与痛点 (Background)**：这篇论文究竟是解决什么问题的？为什么以前的方法不行？（此处需要跟主殿互动，确认他听懂了）。
3. **核心方法 (Methodology)**：这是最重要的地方。详细拆解它的模型架构、算法公式（用比喻解释）、创新模块。必须分点讲清楚。
4. **实验结果 (Experiments)**：在什么数据集上做的？SOTA对比如何？有没有什么消融实验值得注意？
5. **总结与八卦 (Conclusion)**：这论文有没有灌水的嫌疑？或者真的很有跨时代意义？

请以JSON格式输出，结构如下：
{
  "title": "论文标题或有趣的总结",
  "script": [
    {
      "speaker": "丛雨",
      "text": "对话内容",
      "emotion": "normal/happy/angry/surprised/shy/proud",
      "note": "可选的技术术语解释"
    }
  ]
}

必须确保script数组包含足够的条目以满足长度要求。每个对话都必须有speaker、text和emotion字段。
    `.trim();

    // Call Doubao Responses API
    const response = await fetch(`${API_BASE_URL}/responses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_ID,
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_file',
                file_id: fileId,
              },
              {
                type: 'input_text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Doubao API request failed: ${response.status} ${errorText}`);
    }

    const data: DoubaoResponse = await response.json();
    
    // Extract text from response
    let responseText = '';
    if (data.output && data.output.length > 0) {
      for (const output of data.output) {
        if (output.content && output.content.length > 0) {
          for (const content of output.content) {
            if (content.type === 'text' && content.text) {
              responseText += content.text;
            }
          }
        }
      }
    }

    if (!responseText) {
      throw new Error('No response text from Doubao API');
    }

    // Try to parse JSON from response
    // The response might contain markdown code blocks, so we need to extract JSON
    let jsonText = responseText.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const result = JSON.parse(jsonText) as PaperAnalysisResponse;
    
    // Validate the response structure
    if (!result.title || !Array.isArray(result.script)) {
      throw new Error('Invalid response structure from Doubao API');
    }

    return result;

  } catch (error) {
    console.error("Error analyzing paper with Doubao:", error);
    
    // Fallback error script
    return {
      title: "灵力回路遮断",
      script: [
        {
          speaker: "丛雨",
          text: "呜... 主殿，连结彼岸的通道似乎被干扰了（Doubao API Request Failed）。",
          emotion: "shy"
        },
        {
          speaker: "丛雨",
          text: error instanceof Error ? `错误信息：${error.message}` : "发生了未知错误。",
          emotion: "angry"
        },
        {
          speaker: "丛雨",
          text: "是不是你的ARK_API_KEY没放对地方？或者是这篇论文有结界？",
          emotion: "angry"
        }
      ]
    };
  }
};
