
import React, { useState, useEffect } from 'https://esm.sh/react@19.0.0';
import { Scene } from '../types';
import { RefreshCw, AlertCircle, Image as ImageIcon, Clock, Download, Pencil, Trash2 } from 'https://esm.sh/lucide-react@0.460.0';

interface SceneCardProps {
  scene: Scene;
  onRegenerate: (id: string, newText?: string) => void;
  onUpdateText: (id: string, newText: string) => void;
  onRemove: () => void;
  index: number;
}

const SceneCard: React.FC<SceneCardProps> = ({ scene, onRegenerate, onUpdateText, onRemove, index }) => {
  const [isEditing, setIsEditing] = useState(scene.originalText === '');
  const [editText, setEditText] = useState(scene.originalText);

  useEffect(() => {
    setEditText(scene.originalText);
    if (scene.originalText === '') setIsEditing(true);
  }, [scene.originalText]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!scene.imageUrl) return;
    const link = document.createElement('a');
    link.href = scene.imageUrl;
    link.download = `scene_${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg hover:border-slate-600 transition-all flex flex-col md:flex-row my-2">
      <div className="w-full md:w-1/2 aspect-video bg-slate-900 relative flex items-center justify-center group overflow-hidden border-b md:border-b-0 md:border-r border-slate-700">
        {scene.status === 'completed' && scene.imageUrl ? (
          <>
            <img src={scene.imageUrl} className="w-full h-full object-cover block scale-105" style={{ objectFit: 'cover', objectPosition: 'center' }} />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
              <button onClick={() => window.open(scene.imageUrl, '_blank')} className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white"><ImageIcon className="w-5 h-5" /></button>
              <button onClick={handleDownload} className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white"><Download className="w-5 h-5" /></button>
              <button onClick={() => onRegenerate(scene.id)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white"><RefreshCw className="w-5 h-5" /></button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center h-full w-full">
            {scene.status === 'pending' && <Clock className="w-8 h-8 text-slate-500 mb-2" />}
            {scene.status === 'generating' && <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-2" />}
            {scene.status === 'error' && (
              <>
                <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
                <button 
                  onClick={() => onRegenerate(scene.id)} 
                  className="mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>다시 시도</span>
                </button>
              </>
            )}
            <span className="text-xs text-slate-400 mt-2">{scene.status === 'generating' ? '생성 중...' : scene.status === 'error' ? scene.errorMsg || '실패' : '대기 중'}</span>
          </div>
        )}
      </div>

      <div className="w-full md:w-1/2 p-6 flex flex-col justify-between bg-slate-800">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
             <h3 className="text-slate-200 font-semibold text-sm">장면 {index + 1}</h3>
             <div className="flex space-x-2">
                {!isEditing && <button onClick={() => setIsEditing(true)} className="text-xs text-slate-400 hover:text-indigo-400"><Pencil className="w-3 h-3 inline mr-1" />수정</button>}
                <button onClick={onRemove} className="text-xs text-slate-500 hover:text-red-400"><Trash2 className="w-3 h-3 inline mr-1" />삭제</button>
             </div>
          </div>
          {isEditing ? (
            <div className="flex-1 flex flex-col">
               <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full h-full min-h-[100px] bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none mb-2" />
               <div className="flex items-center justify-end space-x-2">
                 <button onClick={() => setIsEditing(false)} className="px-2 py-1 text-xs text-slate-400">취소</button>
                 <button onClick={() => { onUpdateText(scene.id, editText); setIsEditing(false); }} className="px-3 py-1 text-xs bg-slate-700 text-white rounded">저장</button>
               </div>
            </div>
          ) : (
            <>
              <p className="text-slate-300 text-sm italic flex-1 mb-3">{scene.originalText}</p>
              {scene.videoPrompt && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <h4 className="text-xs font-semibold text-indigo-400 mb-2">🎬 영상 프롬프트</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">{scene.videoPrompt}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SceneCard;
