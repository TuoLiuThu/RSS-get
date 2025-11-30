import { GoogleGenAI, Type } from "@google/genai";
import { Episode, SummaryResult } from '../types';

// Use the API Key from environment variables as strictly instructed.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are an expert bilingual podcast summarizer and translator. 
Your goal is to extract the essence of a podcast episode for a Chinese-speaking audience who also reads English.
Provide a clear, engaging summary in both English and Chinese. 
Identify the top 3-5 key takeaways/insights in Chinese.
`;

export const generatePodcastSummary = async (episode: Episode): Promise<SummaryResult> => {
  // Check for fetch error early
  if (episode.status === 'error') {
    return {
        originalTitle: episode.title || 'Fetch Failed',
        translatedTitle: '获取失败 / Fetch Failed',
        originalLink: episode.link,
        summaryEnglish: `Could not retrieve content for ${episode.podcastName}.`,
        summaryChinese: `无法获取该播客的最新内容。原因: ${episode.content}`,
        keyPoints: ['Check RSS URL', 'Check Proxy Connection'],
        podcastName: episode.podcastName,
        status: 'error'
    };
  }

  try {
    const prompt = `
    Analyze the following podcast episode metadata and transcript/description.
    
    Podcast: ${episode.podcastName}
    Title: ${episode.title}
    
    Content Snippet:
    ${episode.content}
    
    Please provide:
    1. A translated Chinese title.
    2. A concise English summary (approx 100 words).
    3. A concise Chinese summary (approx 150 characters).
    4. 3 to 5 key bullet points in Chinese.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translatedTitle: { type: Type.STRING },
            summaryEnglish: { type: Type.STRING },
            summaryChinese: { type: Type.STRING },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["translatedTitle", "summaryEnglish", "summaryChinese", "keyPoints"]
        }
      }
    });

    let jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");

    // Sanitize
    jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();

    const data = JSON.parse(jsonText);

    return {
      originalTitle: episode.title,
      translatedTitle: data.translatedTitle,
      originalLink: episode.link,
      summaryEnglish: data.summaryEnglish,
      summaryChinese: data.summaryChinese,
      keyPoints: data.keyPoints,
      podcastName: episode.podcastName,
      status: 'success'
    };

  } catch (error) {
    console.error("Gemini summarization failed:", error);
    return {
      originalTitle: episode.title,
      translatedTitle: "Summary Generation Failed",
      originalLink: episode.link,
      summaryEnglish: "Could not generate summary.",
      summaryChinese: "无法生成摘要 (可能是内容过长或 API 问题)。",
      keyPoints: [],
      podcastName: episode.podcastName,
      status: 'error'
    };
  }
};