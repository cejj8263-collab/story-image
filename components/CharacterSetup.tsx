
import React, { useRef, useState } from 'https://esm.sh/react@19.0.0';
import { Upload, X, User, Monitor, Smartphone, Plus, Trash2, Globe, Briefcase, ScrollText } from 'https://esm.sh/lucide-react@0.460.0';
import { CharacterProfile, AspectRatio, Theme } from '../types';

interface CharacterSetupProps {
  characters: CharacterProfile[];
  setCharacters: React.Dispatch<React.SetStateAction<CharacterProfile[]>>;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  backgroundLocation: string;
  setBackgroundLocation: (loc: string) => void;
}

const CharacterSetup: React.FC<CharacterSetupProps> = ({ 
  characters, 
  setCharacters, 
  aspectRatio, 
  setAspectRatio,
  theme,
  setTheme,
  backgroundLocation,
  setBackgroundLocation
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeCharIndex, setActiveCharIndex] = useState(0);

  const currentCharacter = characters[activeCharIndex] || characters[0];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 용량 체크 (2MB 초과 시 차단)
      if (file.size > 2 * 1024 * 1024) {
        alert("이미지 용량이 너무 큽니다 (2MB 이하만 가능). 브라우저 안정성을 위해 작은 이미지를 사용해 주세요.");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => {
        alert("파일을 읽는 중 오류가 발생했습니다.");
      };
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        const mimeType = file.type;

        updateCharacter(activeCharIndex, {
          imageBase64: base64Data,
          mimeType: mimeType
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const updateCharacter = (index: number, updates: Partial<CharacterProfile>) => {
    setCharacters(prev => prev.map((char, i) => i === index ? { ...char, ...updates } : char));
  };

  const handleRemoveImage = () => {
    updateCharacter(activeCharIndex, { imageBase64: null, mimeType: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addNewCharacter = () => {
    if (characters.length >= 10) return;
    const newChar: CharacterProfile = {
      id: Date.now().toString(),
      name: '',
      description: '',
      imageBase64: null,
      mimeType: null
    };
    setCharacters(prev => [...prev, newChar]);
    setActiveCharIndex(characters.length);
  };

  const removeCharacter = (index: number) => {
    if (characters.length <= 1) return;
    const newChars = characters.filter((_, i) => i !== index);
    setCharacters(newChars);
    if (activeCharIndex >= index && activeCharIndex > 0) {
        setActiveCharIndex(activeCharIndex - 1);
    } else if (activeCharIndex >= newChars.length) {
        setActiveCharIndex(newChars.length - 1);
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
      setTheme(newTheme);
      if (newTheme === 'economic' && characters.length === 0) {
          setCharacters([{ id: '1', name: '', description: '', imageBase64: null, mimeType: null }]);
          setActiveCharIndex(0);
      }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex flex-col h-full overflow-y-auto">
      <div className="flex items-center space-x-3 mb-4">
        <User className="w-6 h-6 text-indigo-400" />
        <h2 className="text-xl font-semibold text-white">설정</h2>
      </div>

      <div className="mb-6 p-1 bg-slate-900 rounded-lg grid grid-cols-2 gap-1">
        <button
            onClick={() => handleThemeChange('economic')}
            className={`flex items-center justify-center space-x-2 py-2 rounded-md text-sm font-medium transition-all ${
                theme === 'economic' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
        >
            <Briefcase className="w-4 h-4" />
            <span>경제 애니메이션</span>
        </button>
        <button
            onClick={() => handleThemeChange('joseon')}
            className={`flex items-center justify-center space-x-2 py-2 rounded-md text-sm font-medium transition-all ${
                theme === 'joseon' 
                ? 'bg-amber-700 text-white shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
        >
            <ScrollText className="w-4 h-4" />
            <span>조선 역사</span>
        </button>
      </div>
      
      <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
              <Globe className="w-4 h-4 mr-2 text-indigo-400" />
              배경 국가/장소
          </label>
          <input
            type="text"
            value={backgroundLocation}
            onChange={(e) => setBackgroundLocation(e.target.value)}
            placeholder="예: 한국, 일본, 활기찬 뉴욕 거리..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
      </div>

      <div className="mb-6">
           <label className="block text-sm font-medium text-slate-300 mb-2">이미지 비율</label>
           <div className="grid grid-cols-2 gap-3">
             <button
               onClick={() => setAspectRatio('16:9')}
               className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                 aspectRatio === '16:9' 
                   ? 'border-indigo-500 bg-indigo-500/20 text-white' 
                   : 'border-slate-700 bg-slate-700/50 text-slate-400 hover:bg-slate-700'
               }`}
             >
                <Monitor className="w-6 h-6 mb-2" />
                <span className="text-sm font-bold">16:9</span>
             </button>
             
             <button
               onClick={() => setAspectRatio('9:16')}
               className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                 aspectRatio === '9:16' 
                   ? 'border-indigo-500 bg-indigo-500/20 text-white' 
                   : 'border-slate-700 bg-slate-700/50 text-slate-400 hover:bg-slate-700'
               }`}
             >
                <Smartphone className="w-6 h-6 mb-2" />
                <span className="text-sm font-bold">9:16</span>
             </button>
           </div>
      </div>

      <div className="h-px bg-slate-700 mb-6" />

      <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-300">등장인물 ({characters.length}/10)</span>
          {characters.length < 10 && (
              <button 
                  onClick={addNewCharacter}
                  className="flex items-center space-x-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded transition-colors"
              >
                  <Plus className="w-3 h-3" />
                  <span>추가</span>
              </button>
          )}
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-2 mb-4">
          {characters.map((char, idx) => (
              <button
                  key={char.id}
                  onClick={() => setActiveCharIndex(idx)}
                  className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center relative transition-all ${idx === activeCharIndex ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-slate-600'}`}
              >
                  {char.imageBase64 ? (
                      <img src={`data:${char.mimeType};base64,${char.imageBase64}`} className="w-full h-full rounded-full object-cover" />
                  ) : (
                      <span className="text-xs text-slate-400 font-bold">{idx + 1}</span>
                  )}
              </button>
          ))}
      </div>

      <div className="space-y-4 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
        <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Character #{activeCharIndex + 1}</span>
            {characters.length > 1 && <button onClick={() => removeCharacter(activeCharIndex)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-4 h-4" /></button>}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">이미지 업로드 (Max 2MB)</label>
          {!currentCharacter.imageBase64 ? (
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-600 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors">
              <Upload className="w-6 h-6 text-indigo-400 mb-2" />
              <p className="text-slate-300 font-medium text-sm">업로드</p>
            </div>
          ) : (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-600">
              <img src={`data:${currentCharacter.mimeType};base64,${currentCharacter.imageBase64}`} className="w-full h-full object-cover" />
              <button onClick={handleRemoveImage} className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white"><X className="w-4 h-4" /></button>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">이름/역할</label>
          <input type="text" value={currentCharacter.name} onChange={(e) => updateCharacter(activeCharIndex, { name: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">외형 묘사</label>
          <textarea value={currentCharacter.description} onChange={(e) => updateCharacter(activeCharIndex, { description: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px] resize-none" />
        </div>
      </div>
    </div>
  );
};

export default CharacterSetup;
