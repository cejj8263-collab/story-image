
import React, { useState, useCallback, useRef, useEffect } from 'https://esm.sh/react@19.0.0';
import CharacterSetup from './components/CharacterSetup';
import ScriptInput from './components/ScriptInput';
import SceneCard from './components/SceneCard';
import { CharacterProfile, Scene, GenerationStatus, AspectRatio, Theme } from './types';
import { generateSceneImage } from './services/geminiService';
import { Film, ArrowRight, Wand2, Package, ArrowLeft, Plus } from 'https://esm.sh/lucide-react@0.460.0';
import JSZip from 'https://esm.sh/jszip@3.10.1';

function App() {
  const [characters, setCharacters] = useState<CharacterProfile[]>(() => {
    try {
      const saved = localStorage.getItem('storyboard_ai_characters');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("캐릭터 데이터를 불러오는 중 오류 발생:", e);
    }
    return [{ id: '1', name: '탐정 K', description: '검은 코트와 페도라를 쓴 나레이터', imageBase64: null, mimeType: null }];
  });
  
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('storyboard_ai_api_key') || '';
    } catch (e) {
      return '';
    }
  });
  const [theme, setTheme] = useState<Theme>('economic');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [backgroundLocation, setBackgroundLocation] = useState('');
  const [script, setScript] = useState('');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [globalStatus, setGlobalStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const step2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('storyboard_ai_characters', JSON.stringify(characters));
    } catch (e) {
      console.warn("로컬 저장소 용량 초과: 이미지가 너무 큽니다. 브라우저 기록에 저장되지 않을 수 있습니다.", e);
    }
  }, [characters]);

  useEffect(() => {
    try {
      localStorage.setItem('storyboard_ai_api_key', apiKey);
    } catch (e) {
      console.warn("API 키 저장 실패", e);
    }
  }, [apiKey]);

  const splitScript = (text: string): string[] => {
    if (!text.trim()) return [];
    return text.split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 5);
  };

  const handleAnalyze = () => {
    const list = splitScript(script);
    if (list.length === 0) {
      alert("분석할 대본 내용이 충분하지 않습니다.");
      return;
    }
    const newScenes: Scene[] = list.map((text, idx) => ({
      id: `scene-${Date.now()}-${idx}`,
      originalText: text,
      status: 'pending'
    }));
    setScenes(newScenes);
    setIsAnalyzed(true);
    setTimeout(() => step2Ref.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleStartGeneration = async () => {
    setGlobalStatus(GenerationStatus.PROCESSING);
    const scenesToGenerate = [...scenes];
    
    for (let i = 0; i < scenesToGenerate.length; i++) {
      if (scenesToGenerate[i].status === 'completed' || !scenesToGenerate[i].originalText) continue;
      
      const id = scenesToGenerate[i].id;
      setScenes(prev => prev.map(s => s.id === id ? { ...s, status: 'generating' } : s));
      
      try {
        const result = await generateSceneImage(scenesToGenerate[i].originalText, characters, theme, aspectRatio, backgroundLocation, apiKey);
        setScenes(prev => prev.map(s => s.id === id ? { 
          ...s, 
          status: 'completed', 
          imageUrl: result.imageUrl,
          imagePrompt: result.imagePrompt,
          videoPrompt: result.videoPrompt
        } : s));
      } catch (err: any) {
        setScenes(prev => prev.map(s => s.id === id ? { ...s, status: 'error', errorMsg: err.message } : s));
      }
    }
    setGlobalStatus(GenerationStatus.COMPLETED);
  };

  const handleRegenerate = useCallback(async (id: string, updatedText?: string) => {
    setScenes(prev => prev.map(s => s.id === id ? { ...s, status: 'generating', errorMsg: undefined, originalText: updatedText || s.originalText } : s));
    const target = scenes.find(s => s.id === id);
    const text = updatedText || target?.originalText || '';
    try {
      const result = await generateSceneImage(text, characters, theme, aspectRatio, backgroundLocation, apiKey);
      setScenes(prev => prev.map(s => s.id === id ? { 
        ...s, 
        status: 'completed', 
        imageUrl: result.imageUrl,
        imagePrompt: result.imagePrompt,
        videoPrompt: result.videoPrompt
      } : s));
    } catch (err: any) {
      setScenes(prev => prev.map(s => s.id === id ? { ...s, status: 'error', errorMsg: err.message } : s));
    }
  }, [scenes, characters, theme, aspectRatio, backgroundLocation, apiKey]);

  const handleDownloadAll = async () => {
    const list = scenes.filter(s => s.status === 'completed' && s.imageUrl);
    if (list.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      for (const scene of list) {
        if (scene.imageUrl) {
          const base64 = scene.imageUrl.split(',')[1];
          const idx = scenes.findIndex(s => s.id === scene.id);
          zip.file(`scene_${idx + 1}.png`, base64, { base64: true });
        }
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `storyboard_${Date.now()}.zip`;
      link.click();
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-indigo-600">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">스토리보드 AI</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {/* API Key Input */}
        <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Google AI API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="API 키를 입력하세요 (aistudio.google.com에서 발급)"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {!apiKey && (
            <p className="mt-2 text-sm text-amber-400">
              ⚠️ API 키가 필요합니다. <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-300">여기</a>에서 발급받으세요.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <div className="lg:col-span-4">
            <CharacterSetup 
              characters={characters} setCharacters={setCharacters} 
              aspectRatio={aspectRatio} setAspectRatio={setAspectRatio}
              theme={theme} setTheme={setTheme}
              backgroundLocation={backgroundLocation} setBackgroundLocation={setBackgroundLocation}
            />
          </div>
          <div className="lg:col-span-8">
            <ScriptInput script={script} setScript={setScript} onAnalyze={handleAnalyze} isAnalyzed={isAnalyzed} resetAnalysis={() => setIsAnalyzed(false)} />
          </div>
        </div>

        {isAnalyzed && (
          <div ref={step2Ref} className="mb-12 animate-fade-in-up">
            <div className="bg-slate-800/50 border border-indigo-500/30 rounded-xl p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">이미지 생성 시작</h3>
              <div className="flex justify-center space-x-4">
                <button onClick={() => setIsAnalyzed(false)} className="px-6 py-3 border border-slate-600 rounded-full hover:bg-slate-700">
                  <ArrowLeft className="w-4 h-4 mr-2 inline" /> 대본 수정
                </button>
                <button 
                  onClick={handleStartGeneration} 
                  disabled={globalStatus === GenerationStatus.PROCESSING}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-full font-bold flex items-center"
                >
                  <Wand2 className="w-5 h-5 mr-2" />
                  {globalStatus === GenerationStatus.PROCESSING ? "생성 중..." : "전체 생성 시작"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        )}

        {scenes.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">장면 목록 ({scenes.length})</h2>
              {scenes.some(s => s.status === 'completed') && (
                <button onClick={handleDownloadAll} disabled={isZipping} className="flex items-center px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700">
                  <Package className="w-4 h-4 mr-2" /> {isZipping ? '압축 중...' : '전체 다운로드'}
                </button>
              )}
            </div>
            <div className="flex flex-col space-y-4">
              {scenes.map((scene, idx) => (
                <SceneCard 
                  key={scene.id} 
                  scene={scene} 
                  index={idx} 
                  onRegenerate={handleRegenerate} 
                  onUpdateText={(id, text) => setScenes(prev => prev.map(s => s.id === id ? { ...s, originalText: text } : s))}
                  onRemove={() => setScenes(prev => prev.filter(s => s.id !== scene.id))}
                />
              ))}
              <button 
                onClick={() => setScenes([...scenes, { id: `manual-${Date.now()}`, originalText: '', status: 'pending' }])}
                className="w-full py-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 hover:border-indigo-500 hover:text-indigo-400 transition-all flex items-center justify-center"
              >
                <Plus className="w-5 h-5 mr-2" /> 장면 직접 추가
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
