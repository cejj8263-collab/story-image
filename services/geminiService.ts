
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";
import { CharacterProfile, AspectRatio, Theme } from "../types";

const ai = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY || "");

const TEXT_MODEL_NAME = 'gemini-3-flash-preview';
const IMAGE_MODEL_NAME = 'gemini-2.5-flash-image';

const ECONOMIC_STYLE_GUIDE = `ART STYLE: FLAT 2D VECTOR ART - 16:9 Full Bleed, No borders. Detective K (black trench coat/fedora) acts as narrator in scene. No text labels.`;
const JOSEON_STYLE_GUIDE = `ART STYLE: TRADITIONAL JOSEON HISTORY MANHWA - 16:9 Full Bleed. Accurate Hanbok. No text labels.`;

async function createOptimizedPrompt(sceneText: string, characters: CharacterProfile[], theme: Theme, background: string) {
  const isJoseon = theme === 'joseon';
  const systemInstruction = `Professional Storyboard Artist. Theme: ${theme}. Location: ${background}. Style: ${isJoseon ? JOSEON_STYLE_GUIDE : ECONOMIC_STYLE_GUIDE}. Ensure Detective K is the storyteller. Output JSON: { "imagePrompt": "...", "activeCharacterIndices": [] }`;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL_NAME,
      config: { temperature: 0.7, systemInstruction, responseMimeType: 'application/json' },
      contents: [{ role: 'user', parts: [{ text: sceneText }] }]
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return { imagePrompt: sceneText, activeCharacterIndices: theme === 'economic' ? [0] : [] };
  }
}

export const generateSceneImage = async (sceneText: string, characters: CharacterProfile[], theme: Theme, aspectRatio: AspectRatio = '16:9', background: string = '') => {
  const { imagePrompt, activeCharacterIndices } = await createOptimizedPrompt(sceneText, characters, theme, background);
  const parts: any[] = [];
  const validIndices = Array.from(new Set(activeCharacterIndices as number[]));
  
  for (const index of validIndices) {
      const char = characters[index];
      if (char && char.imageBase64) parts.push({ inlineData: { data: char.imageBase64, mimeType: char.mimeType || 'image/png' } });
  }

  parts.push({ text: `16:9 cinematic full-bleed scene. ${imagePrompt}` });

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME,
      contents: { parts },
      config: { imageConfig: { aspectRatio } }
    });

    const parts_out = response.candidates?.[0]?.content?.parts;
    if (parts_out) {
        for (const p of parts_out) {
            if (p.inlineData) return `data:${p.inlineData.mimeType || 'image/png'};base64,${p.inlineData.data}`;
        }
    }
    throw new Error("이미지 없음");
  } catch (error) {
    throw new Error("이미지 생성 오류");
  }
};
