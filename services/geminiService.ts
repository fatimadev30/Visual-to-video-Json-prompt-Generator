import { GoogleGenAI, Type } from "@google/genai";
import { VideoPrompt } from '../types';

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType
    },
  };
};

const systemInstruction = `You are a visual-to-video prompt generator AI. Your task is to analyze a user-provided set of images and create a single, coherent JSON object describing how to turn them into a short, realistic video scene. The generated scene should logically combine elements and subjects from all the images provided into one cohesive narrative or setting.

Your JSON output must strictly follow this structure:
- "scene_description": Describe what is visible in the combined scene.
- "camera_movement": Explain how the camera should move (e.g., zoom in, pan left, rotate, drone shot).
- "camera_angle": Describe the perspective (e.g., eye level, top view, low angle).
- "lighting": Describe the lighting setup (e.g., natural daylight, cinematic, neon glow).
- "environment": Describe the synthesized surroundings or background.
- "subject_action": Suggest what movement or action could happen, potentially involving subjects from different images interacting.
- "mood_tone": Describe the emotional tone or atmosphere.
- "video_style": Describe the style (e.g., cinematic, documentary, anime, futuristic).
- "duration": Suggest an ideal video length in seconds.
- "recommended_prompt": Combine all the above into one natural-language prompt usable in a video generation model.

Rules:
- Synthesize a single, coherent scene from ALL provided images.
- Always generate JSON only.
- The output should help create a short, camera-realistic video.
- Be detailed, creative, and cinematic.`;

export const generateVideoPrompt = async (images: { base64: string, mimeType: string }[]): Promise<VideoPrompt> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imageParts = images.map(image => fileToGenerativePart(image.base64, image.mimeType));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [...imageParts, {text: "Generate a single, coherent video prompt that incorporates elements from all of these images."}] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scene_description: { type: Type.STRING, description: "Description of the image scene." },
            camera_movement: { type: Type.STRING, description: "Suggested camera movement." },
            camera_angle: { type: Type.STRING, description: "Suggested camera angle." },
            lighting: { type: Type.STRING, description: "Description of the lighting." },
            environment: { type: Type.STRING, description: "Description of the environment." },
            subject_action: { type: Type.STRING, description: "Action the subject could perform." },
            mood_tone: { type: Type.STRING, description: "The mood and tone of the video." },
            video_style: { type: Type.STRING, description: "The visual style of the video." },
            duration: { type: Type.STRING, description: "Suggested duration in seconds." },
            recommended_prompt: { type: Type.STRING, description: "A consolidated prompt for a video model." },
          },
          required: [
            "scene_description", "camera_movement", "camera_angle", "lighting", 
            "environment", "subject_action", "mood_tone", "video_style", 
            "duration", "recommended_prompt"
          ],
        },
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as VideoPrompt;
  } catch (error) {
    console.error("Error generating video prompt:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate video prompt from Gemini API: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API.");
  }
};
