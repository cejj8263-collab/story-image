
import React from 'https://esm.sh/react@19.0.0';
import { FileText, Search } from 'https://esm.sh/lucide-react@0.460.0';

interface ScriptInputProps {
  script: string;
  setScript: (s: string) => void;
  onAnalyze: () => void;
  isAnalyzed: boolean;
  resetAnalysis: () => void;
}

const ScriptInput: React.FC<ScriptInputProps> = ({ script, setScript, onAnalyze, isAnalyzed, resetAnalysis }) => {
  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-semibold text-white">대본 입력</h2>
        </div>
      </div>
      
      <p className="text-slate-400 text-sm mb-4">이야기 대본을 입력하세요. 문장 단위로 분석하여 이미지를 생성합니다.</p>

      <textarea
        value={script}
        onChange={(e) => setScript(e.target.value)}
        placeholder="대본을 입력하세요..."
        readOnly={isAnalyzed}
        className={`flex-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none min-h-[200px] leading-relaxed ${isAnalyzed ? 'opacity-75 cursor-not-allowed bg-slate-800' : ''}`}
      />

      {!isAnalyzed ? (
        <button
          onClick={onAnalyze}
          disabled={!script.trim()}
          className={`mt-4 flex items-center justify-center space-x-2 w-full py-4 rounded-lg font-bold text-lg transition-all ${!script.trim() ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'}`}
        >
          <Search className="w-5 h-5" />
          <span>대본 분석하기</span>
        </button>
      ) : (
        <div className="mt-4 flex items-center justify-between p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
            <span className="text-green-400 text-sm font-medium">✓ 대본 분석 완료</span>
            <button onClick={resetAnalysis} className="text-xs text-slate-400 hover:text-white underline px-2">대본 수정</button>
        </div>
      )}
    </div>
  );
};

export default ScriptInput;
