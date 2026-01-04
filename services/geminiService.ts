import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ImageSize, HistoryItem } from "../types";

// Helper to ensure we have a client with the latest key
const getAiClient = async (): Promise<GoogleGenAI> => {
  // We prioritize the window.aistudio key if available (checked via implicit env injection usually, 
  // but for the Pro Image model user selection is mandatory).
  // The instructions say "Create a new GoogleGenAI instance right before making an API call"
  // and "The selected API key is available via process.env.API_KEY". 
  // However, for the Image model specifically, we need to ensure the user has gone through the selection flow.
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const STORY_MODEL = "gemini-flash-lite-latest"; // gemini-2.5-flash-lite
const IMAGE_MODEL = "gemini-3-pro-image-preview";
const CHAT_MODEL = "gemini-3-pro-preview";

const storySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    sceneTitle: { type: Type.STRING, description: "A short, evocative title for the current scene." },
    storyText: { type: Type.STRING, description: "The narrative content of the current scene, approx 100-200 words." },
    choices: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          text: { type: Type.STRING, description: "The text description of the choice." },
        },
        required: ["id", "text"]
      }
    },
    inventoryUpdates: {
      type: Type.OBJECT,
      properties: {
        add: { type: Type.ARRAY, items: { type: Type.STRING } },
        remove: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    newQuest: { type: Type.STRING, description: "Update the current quest if changed, otherwise null or empty string." },
    imagePrompt: { type: Type.STRING, description: "A detailed visual description of the scene for an image generator. Include art style: 'Digital fantasy art, detailed, dramatic lighting'." },
    characterVisualUpdate: { type: Type.STRING, description: "If the character's appearance changes (e.g., got new armor), describe the new look briefly." }
  },
  required: ["sceneTitle", "storyText", "choices", "imagePrompt"]
};

export const generateStorySegment = async (
  previousHistory: HistoryItem[],
  userChoice: string,
  currentInventory: string[],
  currentQuest: string,
  characterDescription: string
) => {
  const ai = await getAiClient();
  
  const systemPrompt = `
    You are an advanced Dungeon Master AI for an infinite text adventure game.
    
    Current State:
    - Inventory: ${JSON.stringify(currentInventory)}
    - Active Quest: ${currentQuest}
    - Character Appearance: ${characterDescription}
    
    Your goal:
    1. Generate the next segment of the story based on the user's choice and previous history.
    2. Be creative, unpredictable, and reacting genuinely to choices.
    3. Maintain a consistent fantasy tone (or whatever genre has been established).
    4. Provide 2-4 distinct choices for the player.
    5. Update inventory and quest status logically.
    6. Create a vivid image prompt for the scene, ensuring the character description is integrated if they are in the scene.
    
    Response MUST be JSON matching the defined schema.
  `;

  // Filter history to keep context manageable but sufficient
  // For Lite model, we send a reasonable amount of context.
  const contents = [
    { role: 'user', parts: [{ text: userChoice ? `I choose: ${userChoice}` : "Start a new adventure. Establish a setting and a character." }] }
  ];

  try {
    const response = await ai.models.generateContent({
      model: STORY_MODEL,
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: storySchema,
        temperature: 0.7,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Story generation error:", error);
    throw error;
  }
};

export const generateSceneImage = async (prompt: string, size: ImageSize) => {
  // Requirement: Check for API Key selection for this specific model
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
        throw new Error("API_KEY_MISSING");
    }
  }

  const ai = await getAiClient();
  
  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
            imageSize: size,
            aspectRatio: "16:9" // Cinematic for the main view
        }
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) {
         throw new Error("API_KEY_INVALID");
    }
    console.error("Image generation error:", error);
    throw error;
  }
};

export const chatWithAI = async (history: HistoryItem[], userMessage: string, contextSummary: string) => {
  const ai = await getAiClient();
  
  const systemInstruction = `
    You are a helpful assistant companion to the player of this text adventure game.
    You know the current state of the world: ${contextSummary}.
    Answer questions about the lore, mechanics, or offer subtle hints without spoiling the fun.
    Keep answers concise (under 3 sentences usually).
  `;

  const chat = ai.chats.create({
    model: CHAT_MODEL,
    config: {
      systemInstruction
    }
  });

  // Reconstruct simplified history for the chat session if needed, 
  // but for a simple Q&A bot, we often just need the immediate context.
  // We'll just send the user message to a fresh chat instance initialized with system instructions about the current game state 
  // to avoid token bloat from the entire game history in the chat window.
  
  const response = await chat.sendMessage({ message: userMessage });
  return response.text;
};

export const openKeySelection = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
        await window.aistudio.openSelectKey();
    }
};

export const checkHasKey = async () => {
     if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        return await window.aistudio.hasSelectedApiKey();
    }
    return true; // Fallback for dev environments if not running in specific shell
}
