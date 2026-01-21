
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API with named parameter and direct environment variable access as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeMeetingEfficiency = async (meetingData: any) => {
  try {
    // Calling generateContent with model name and prompt directly.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Phân tích hiệu quả và đề xuất cải thiện cho cuộc họp sau: ${JSON.stringify(meetingData)}. 
      Hãy trả về kết quả ngắn gọn gồm: Đánh giá quy mô, Đề xuất tối ưu điểm cầu, và Lưu ý cho cán bộ chủ trì.`,
      config: {
        temperature: 0.7,
      }
    });
    // Accessing .text property directly instead of calling it as a method.
    return response.text || "Không có kết quả phân tích.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Không thể phân tích dữ liệu vào lúc này.";
  }
};
