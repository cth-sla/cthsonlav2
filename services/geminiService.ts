import { GoogleGenAI } from "@google/genai";

/**
 * Phân tích hiệu quả cuộc họp bằng AI Gemini
 * Tuân thủ hướng dẫn SDK Google GenAI: sử dụng process.env.API_KEY trực tiếp.
 */
export const analyzeMeetingEfficiency = async (meetingData: any) => {
  try {
    // Fix: Khởi tạo instance GoogleGenAI trực tiếp bằng process.env.API_KEY theo đúng quy định
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [{
          text: `Phân tích hiệu quả và đề xuất cải thiện cho cuộc họp sau: ${JSON.stringify(meetingData)}. 
          Hãy trả về kết quả ngắn gọn bằng tiếng Việt gồm: Đánh giá quy mô, Đề xuất tối ưu điểm cầu, và Lưu ý cho cán bộ chủ trì.`
        }]
      }],
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