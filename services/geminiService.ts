
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";
import { CharacterProfile, AspectRatio, Theme } from "../types";

const TEXT_MODEL_NAME = 'gemini-3-flash-preview';
const IMAGE_MODEL_NAME = 'gemini-2.5-flash-image';

const IMAGE_PROMPT_GUIDE = `
🚨 이미지 프롬프트 요구 사항:
- 첨부한 캐릭터 이미지를 반드시 활용
- 등장인물1(탐정 K)은 나레이터/주인공/관찰자로 등장 (모든 장면에 필수는 아님)
- 스타일: Flat 2D vector art, 금융 만화 스타일
- 배경: 대본 내용에 맞게, 하얀색 금지
- 테두리: 굵은 검은색
- 색상: 깔끔하고 평면적
- 표정: 대본 내용에 맞춰 다양하게
- 등장인물 이름이 나오면 첨부한 이미지 활용
- 텍스트 없음 (자연스러운 것은 가능)
- 썸네일 수준의 퀄리티
- 포즈, 표정, 소품 자세히 묘사
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
  
  const systemInstruction = `당신은 전문 스토리보드 아티스트입니다.

배경: ${background || '대본 내용에 맞게'}
등장인물:\n${characterList}

${IMAGE_PROMPT_GUIDE}

대본을 분석하여 다음 JSON을 생성하세요:
{
  "imagePrompt": "[Style Wrapper] Flat 2D vector art, minimal clean lines, bold black outlines, simple coloring. [Subject] ... [Visual Details] ... [Background] ...",
  "activeCharacterIndices": [등장할 캐릭터 인덱스 배열],
  "videoPrompt": "구체적인 영상 움직임 묘사 (6-8초 분량)"
}`;

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

  parts.push({ text: `16:9 cinematic full-bleed scene. ${imagePrompt}` });

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
