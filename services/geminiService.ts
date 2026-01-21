
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";
import { CharacterProfile, AspectRatio, Theme } from "../types";

const TEXT_MODEL_NAME = 'gemini-3-flash-preview';
const IMAGE_MODEL_NAME = 'gemini-2.5-flash-image';

const ART_STYLE_DEFINITION = {
  "art_style": "플랫 2D 벡터 아트 (Flat 2D Vector Art), 깔끔하고 미니멀한 한국형 웹툰/일러스트레이션 스타일",
  "linework": {
    "outline": "균일하고 뚜렷한 검은색 외곽선 (Uniform black outlines), 디지털 펜으로 그린 듯한 매끄럽고 정교한 마감",
    "variation": "선의 굵기 변화가 적고 일정한 두께를 유지하며, 거친 질감 없이 깔끔하게 떨어지는 라인"
  },
  "shapes": "사실적인 신체 비율을 기반으로 하되 단순화된 형태, 과장이나 왜곡을 자제하고 안정감 있는 비율 유지",
  "color_palette": "그라데이션이나 텍스처가 배제된 완전한 단색 채우기 (Solid flat fills), 명도와 채도가 명확하여 가독성이 높은 디지털 색상, 상황에 따라 파스텔톤과 비비드한 원색을 적절히 혼용",
  "shading": "명암 표현을 극도로 절제함, 턱 밑이나 옷 주름 등 필수적인 부분에만 최소한의 1단계 셀 셰이딩(Cel shading) 적용, 하이라이트 거의 없음",
  "character_design": "대중적인 웹툰 스타일의 이목구비, 깔끔하게 정리된 헤어스타일, 감정 전달이 명확한 표정 묘사, 남성 캐릭터는 보통 체격, 여성 캐릭터는 부드러운 인상",
  "mood_and_tone": "정보 전달에 최적화된 명료하고 차분한 분위기, 금융/경제/일상 정보를 설명하기 위한 교육적이면서도 풍자적인 톤",
  "background": "인물을 부각하기 위해 디테일을 단순화한 배경, 투시도법은 지키되 복잡한 패턴은 생략하고 플랫하게 처리",
  "technical": "노이즈나 텍스처가 전혀 없는 매끄러운 디지털 벡터 느낌, 텍스트나 인포그래픽 요소(그래프, 간판 등)가 자연스럽게 어우러지는 구성"
};

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
  "imagePrompt": "Simple 2D flat cartoon style like Kurzgesagt or educational YouTube thumbnails. Bold black outlines. Flat colors. [Describe characters with simple shapes and expressions]. [Describe flat colored background]. Remember: FLAT 2D CARTOON ONLY, no 3D, no realism, no fantasy landscapes.",
  "activeCharacterIndices": [array of character indices to use],
  "videoPrompt": "Detailed animation description in Korean (6-8 seconds)"
}

CRITICAL: The imagePrompt MUST emphasize "flat 2D cartoon" style and explicitly reject 3D/realistic/fantasy styles.`;

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
  
  // Create ultra-clear aspect ratio prompt
  const ratioPrompt = aspectRatio === '16:9' 
    ? 'Create a WIDE HORIZONTAL image. The image must be in 16:9 landscape format (1920x1080). Width is almost DOUBLE the height. NOT square, NOT vertical. HORIZONTAL ONLY.'
    : 'Create a TALL VERTICAL image. The image must be in 9:16 portrait format (1080x1920). Height is almost DOUBLE the width. NOT square, NOT horizontal. VERTICAL ONLY.';
  
  parts.push({ text: ratioPrompt });
  
const styleEnforcement = `${imagePrompt}

MANDATORY IMAGE FORMAT:
${aspectRatio === '16:9' ? 
  `- 16:9 aspect ratio (landscape, horizontal)
  - Image dimensions: 1920 pixels WIDE × 1080 pixels TALL
  - HORIZONTAL orientation for desktop/YouTube` :
  `- 9:16 aspect ratio (portrait, vertical)  
  - Image dimensions: 1080 pixels WIDE × 1920 pixels TALL
  - VERTICAL orientation for mobile/stories`}

${JSON.stringify(ART_STYLE_DEFINITION, null, 2)}

COMPOSITION RULES (CRITICAL):
- FULL-BLEED composition (화면을 완전히 채움)
- NO white margins, NO borders, NO padding on any side
- NO letterboxing, NO pillarboxing, NO square format
- 상하좌우 여백 없이 ${aspectRatio} 비율로 화면 끝까지 채워진 구도
- Characters must be FULLY VISIBLE including head, hat, and entire body
- 탐정의 모자와 얼굴 전체가 프레임 안에 완전히 보여야 함
- 캐릭터가 잘리지 않도록 적절한 거리 유지
- ALL visual elements (symbols, icons, props) must be FULLY VISIBLE, NOT CROPPED
- 물음표(?), 느낌표(!), 그래프, 아이콘 등 모든 요소가 잘리지 않아야 함
- Background fills entire ${aspectRatio} frame edge-to-edge
- Compose the scene so that all important elements fit within the safe area

STYLE RULES:
- 플랫 2D 벡터 아트 (Flat 2D Vector Art), 한국형 웹툰/일러스트레이션 스타일
- 균일한 검은색 외곽선, 디지털 펜으로 그린 듯한 매끄러운 마감
- 그라데이션 없는 완전한 단색 채우기 (Solid flat fills)
- 셀 셰이딩(Cel shading)만 최소한으로 사용
- 사실적 비율 기반, 과장 자제
- 깔끔하게 정리된 웹툰 스타일 캐릭터
- 플랫하고 단순화된 배경
- 노이즈/텍스처 없는 매끄러운 벡터 느낌

❌ FORBIDDEN:
- NO white margins or borders
- NO cropped characters (especially Detective's hat/face)
- NO 3D rendering
- NO realistic photography
- NO fantasy landscape art
- NO gradients or complex shading
- NO atmospheric effects

Scene: ${imagePrompt}

REMEMBER: 16:9 full-bleed, no margins, character fully visible with hat and face intact!`;

  parts.push({ text: styleEnforcement });

  try {
    const model = ai.getGenerativeModel({ model: IMAGE_MODEL_NAME });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: "image/png",
        aspectRatio: aspectRatio === '16:9' ? '16:9' : '9:16'
      }
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
