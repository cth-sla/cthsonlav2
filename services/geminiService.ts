
import { GoogleGenAI } from "@google/genai";

// Hàm khởi tạo AI instance an toàn
const getAI = () => {
  const apiKey = (window as any).process?.env?.API_KEY || process.env.API_KEY || "";
  return new GoogleGenAI({ apiKey });
};

export const analyzeMeetingEfficiency = async (meetingData: any) => {
  try {
    const ai = getAI();
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
