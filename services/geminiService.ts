import { GoogleGenAI } from "@google/genai";

/**
 * Phân tích hiệu quả cuộc họp bằng AI Gemini
 */
export const analyzeMeetingEfficiency = async (meetingData: any) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Phân tích hiệu quả và đề xuất cải thiện cho cuộc họp sau: ${JSON.stringify(meetingData)}. 
          Hãy trả về kết quả ngắn gọn bằng tiếng Việt gồm: Đánh giá quy mô, Đề xuất tối ưu điểm cầu, và Lưu ý cho cán bộ chủ trì.`,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "Không có kết quả phân tích.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Hệ thống AI đang bận hoặc chưa được cấu hình API Key. Vui lòng kiểm tra lại.";
  }
};
