import { GoogleGenAI, Type } from "@google/genai";
import { ZeppWidget, WidgetType } from "../types";

const SYSTEM_PROMPT = `
You are an expert Zepp OS (Amazfit) developer. 
The user will describe a watch face or app layout. 
The screen resolution is 480x480 pixels.
Center of screen is x:240, y:240.

Available Widget Types:
1. TEXT (props: text, color, text_size)
2. BUTTON (props: text, normal_color, press_color, radius)
3. CIRCLE (props: color)
4. RECT (props: color, radius)
5. TODO_LIST (A vertical list of tasks. props: api_endpoint)
6. VOICE_BUTTON (A circular microphone button. props: normal_color)

If the user asks for "Todoist" or "Task Manager", use a TODO_LIST widget.
If the user asks for "Voice", "AI", or "Microphone", use a VOICE_BUTTON widget.

Ensure elements are positioned logically within the 480x480 circle.
`;

export const generateLayoutFromPrompt = async (prompt: string): Promise<ZeppWidget[]> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key missing");

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ["TEXT", "BUTTON", "CIRCLE", "RECT", "TODO_LIST", "VOICE_BUTTON"] },
              name: { type: Type.STRING },
              props: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  w: { type: Type.NUMBER },
                  h: { type: Type.NUMBER },
                  text: { type: Type.STRING },
                  color: { type: Type.STRING },
                  normal_color: { type: Type.STRING },
                  press_color: { type: Type.STRING },
                  text_size: { type: Type.NUMBER },
                  radius: { type: Type.NUMBER },
                  api_endpoint: { type: Type.STRING }
                },
                required: ["x", "y", "w", "h"]
              }
            },
            required: ["type", "props", "name"]
          }
        }
      }
    });

    const rawJson = response.text;
    if (!rawJson) return [];
    
    const parsedData = JSON.parse(rawJson);
    
    // Map to internal structure and add IDs
    return parsedData.map((item: any, index: number) => ({
        id: `gen-${Date.now()}-${index}`,
        type: item.type as WidgetType,
        name: item.name || `Widget ${index}`,
        props: item.props
    }));

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};