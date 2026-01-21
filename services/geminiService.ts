
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";
import { CharacterProfile, AspectRatio, Theme } from "../types";

const TEXT_MODEL_NAME = 'gemini-3-flash-preview';
const IMAGE_MODEL_NAME = 'gemini-2.5-flash-image';

const IMAGE_PROMPT_GUIDE = `
🚨 CRITICAL STYLE REQUIREMENTS (MUST FOLLOW):
- Style: FLAT 2D VECTOR ART, simple cartoon style for financial/economic content
- NO 3D rendering, NO realistic style, NO fantasy art, NO photorealistic
- Simple geometric shapes with BOLD BLACK OUTLINES
- Flat colors, NO gradients, NO shading, NO complex lighting
- Minimalist clean design like webtoon thumbnails
- Think: simple infographic illustration style

CHARACTER & COMPOSITION:
- Use attached character images
- Character 1 (Detective K) as narrator/observer (not required in every scene)
- Characters should be simple, cartoon-like
- Facial expressions should match the script mood
- NO text in image (except natural elements like receipts)

BACKGROUND:
- Match script content
- NO white backgrounds
- Simple, flat colored backgrounds
- Minimal details
`;

const VIDEO_PROMPT_GUIDE = `
🎬 영상 프롬프트 규칙:
- 이미지의 캐릭터를 자연스럽게 움직이게
- 미세한 움직임: 눈 깜빡임, 숨쉬기, 고개 까닥, 손/팔 움직임
- 소품 움직임: 돈 떠다니기, 달력 넘기기, 시계 바늘
- 효과: 천천히 줌인, 부드러운 패럴랙스
- 화면 흔들림/빠른 편집 금지
- 캐릭터 디자인/옷/비율 유지
- 6-8초 길이
- 차분하고 깔끔한 금융/경제 설명 느낌
`;

async function createOptimizedPrompt(sceneText: string, characters: CharacterProfile[], theme: Theme, background: string, apiKey: string) {
  const ai = new GoogleGenerativeAI(apiKey);
  
  const characterList = characters.map((c, idx) => `${idx}: ${c.name} - ${c.description}`).join('\n');
  
  const systemInstruction = `You are a professional storyboard artist for financial/economic educational content.

Setting: ${background || 'Based on script content'}
Characters:\n${characterList}

${IMAGE_PROMPT_GUIDE}

Analyze the script and generate JSON:
{
  "imagePrompt": "FLAT 2D VECTOR ART style, simple cartoon for financial content. Bold black outlines. Simple flat colors. [Character descriptions with poses and expressions]. [Background description]. NO 3D, NO realistic style, NO fantasy art.",
  "activeCharacterIndices": [array of character indices to use],
  "videoPrompt": "Detailed animation description in Korean (6-8 seconds)"
}

REMEMBER: Every imagePrompt MUST start with "FLAT 2D VECTOR ART" and emphasize simple cartoon style.`;

  try {
    const model = ai.getGenerativeModel({ 
      model: TEXT_MODEL_NAME,
      systemInstruction: systemInstruction
    });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `대본: ${sceneText}` }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json'
      }
    });
    const response = await result.response;
    return JSON.parse(response.text() || "{}");
  } catch (error) {
    console.error('프롬프트 생성 오류:', error);
    return { 
      imagePrompt: sceneText, 
      activeCharacterIndices: [0],
      videoPrompt: '캐릭터가 자연스럽게 숨을 쉬고 눈을 깜빡입니다. 배경이 미세하게 움직입니다.'
    };
  }
}

export const generateSceneImage = async (sceneText: string, characters: CharacterProfile[], theme: Theme, aspectRatio: AspectRatio = '16:9', background: string = '', apiKey: string = '') => {
  if (!apiKey) throw new Error('API 키가 필요합니다');
  const ai = new GoogleGenerativeAI(apiKey);
  const { imagePrompt, activeCharacterIndices, videoPrompt } = await createOptimizedPrompt(sceneText, characters, theme, background, apiKey);
  const parts: any[] = [];
  const validIndices = Array.from(new Set(activeCharacterIndices as number[]));
  
  for (const index of validIndices) {
      const char = characters[index];
      if (char && char.imageBase64) parts.push({ inlineData: { data: char.imageBase64, mimeType: char.mimeType || 'image/png' } });
  }
  
  const styleEnforcement = `MANDATORY STYLE: FLAT 2D VECTOR ART. Simple cartoon illustration for financial education content. Bold black outlines. Flat colors. NO 3D rendering. NO realistic style. NO fantasy art. NO photorealism. Think: simple webtoon thumbnail style. 16:9 full-bleed composition.

Scene description: ${imagePrompt}`;

  parts.push({ text: styleEnforcement });

  try {
    const model = ai.getGenerativeModel({ model: IMAGE_MODEL_NAME });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts }]
    });
    const response = await result.response;

    const candidates = response.candidates;
    if (candidates && candidates[0]?.content?.parts) {
        for (const p of candidates[0].content.parts) {
            if (p.inlineData) {
              return {
                imageUrl: `data:${p.inlineData.mimeType || 'image/png'};base64,${p.inlineData.data}`,
                imagePrompt: imagePrompt || '',
                videoPrompt: videoPrompt || ''
              };
            }
        }
    }
    throw new Error("이미지 없음");
  } catch (error) {
    console.error('이미지 생성 오류:', error);
    throw new Error("이미지 생성 오류: " + (error as Error).message);
  }
};
