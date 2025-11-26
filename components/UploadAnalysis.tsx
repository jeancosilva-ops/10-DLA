import React, { useState, useRef } from 'react';
import { Upload, FileText, Check, AlertCircle, Loader2, HardHat, FileDigit, Calendar } from 'lucide-react';
import { analyzeSchedule } from '../services/geminiService';
import { Constraint, Category8M, Priority, Status } from '../types';

interface UploadAnalysisProps {
  startDate: string; // Original Project Start Date
  onAnalysisComplete: (constraints: Constraint[]) => void;
}

const UploadAnalysis: React.FC<UploadAnalysisProps> = ({ startDate, onAnalysisComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Context State
  const [workName, setWorkName] = useState('');
  const [revision, setRevision] = useState('');
  
  // New: Analysis Reference Date (Lookahead Start)
  // Default to Today if Today > Project Start, otherwise Project Start
  const todayStr = new Date().toISOString().split('T')[0];
  const [analysisRefDate, setAnalysisRefDate] = useState(todayStr);

  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!workName.trim() || !revision.trim()) {
      setError("Por favor, preencha o Nome da Obra e a Revisão antes de carregar o arquivo.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const text = await file.text();
      // Basic validation to ensure it's text
      if (!text || text.length < 10) {
        throw new Error("Arquivo vazio ou inválido.");
      }

      // Pass the Analysis Reference Date instead of the fixed Project Start Date
      // This enables the "Today + 10 days" lookahead logic
      const results = await analyzeSchedule(text, {
        startDate: analysisRefDate,
        workName,
        revision
      });
      
      const newConstraints: Constraint[] = results.map((r, index) => ({
        id: `ai-${Date.now()}-${index}`,
        description: r.description,
        category: r.category || Category8M.OTHER,
        priority: r.priority || Priority.MEDIUM,
        status: Status.OPEN,
        responsible: 'Não atribuído',
        deadline: new Date(Date.now() + 86400000 * 2).toISOString(), // Default 2 days
        aiSuggested: true,
        impact: r.impact,
        origin: 'ia',
        area: r.area || 'Geral',
        discipline: r.discipline || 'Geral'
      }));

      // Sort by Area > Discipline
      newConstraints.sort((a, b) => {
        if ((a.area || '') < (b.area || '')) return -1;
        if ((a.area || '') > (b.area || '')) return 1;
        if ((a.discipline || '') < (b.discipline || '')) return -1;
        if ((a.discipline || '') > (b.discipline || '')) return 1;
        return 0;
      });

      onAnalysisComplete(newConstraints);
    } catch (err: any) {
      setError(err.message || "Erro ao processar arquivo.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in zoom-in-95 duration-300">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Processamento do Cronograma (Lookahead)</h2>
        <p className="text-slate-500 mt-2">
          A IA analisará as atividades dentro da janela de 10 dias a partir da data de referência abaixo.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nome da Obra / Equipamento</label>
            <div className="relative">
                <input 
                type="text" 
                className="w-full pl-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: Permutador E-2101"
                value={workName}
                onChange={(e) => setWorkName(e.target.value)}
                />
                <HardHat className="absolute left-3 top-3.5 text-slate-400" size={18} />
            </div>
            </div>
            <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Revisão do Cronograma</label>
            <div className="relative">
                <input 
                type="text" 
                className="w-full pl-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: Rev. 02"
                value={revision}
                onChange={(e) => setRevision(e.target.value)}
                />
                <FileDigit className="absolute left-3 top-3.5 text-slate-400" size={18} />
            </div>
            </div>
        </div>

        <div>
            <label className="block text-sm font-bold text-blue-800 mb-1">Data de Referência (Início do Lookahead)</label>
            <div className="relative">
                <input 
                type="date" 
                className="w-full pl-10 p-3 border-2 border-blue-100 bg-blue-50 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-blue-900 font-medium"
                value={analysisRefDate}
                onChange={(e) => setAnalysisRefDate(e.target.value)}
                />
                <Calendar className="absolute left-3 top-3.5 text-blue-500" size={18} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
                A IA buscará interferências entre <b>{new Date(analysisRefDate).toLocaleDateString()}</b> e <b>{new Date(new Date(analysisRefDate).getTime() + 9 * 86400000).toLocaleDateString()}</b> (10 dias).
            </p>
        </div>
      </div>

      <div 
        className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all min-h-[250px] ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          ref={inputRef}
          type="file" 
          className="hidden" 
          accept=".xml,.csv,.txt,.json,.xer"
          onChange={handleChange} 
        />
        
        {loading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
            <p className="text-lg font-semibold text-slate-700">A IA está analisando seu cronograma...</p>
            <p className="text-sm text-slate-400 mt-2">Filtrando Lookahead 10 Dias ({new Date(analysisRefDate).toLocaleDateString()}+).</p>
          </div>
        ) : (
          <>
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <Upload className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              Arraste e solte o arquivo
            </h3>
            <p className="text-slate-400 mb-6 text-center max-w-sm">
              Certifique-se de definir a data de referência corretamente.
            </p>
            <button 
              onClick={() => {
                if (!workName || !revision) {
                  setError("Preencha Nome da Obra e Revisão.");
                  return;
                }
                inputRef.current?.click();
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-shadow shadow-md hover:shadow-lg ${
                 !workName || !revision 
                 ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                 : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Carregar e Processar
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3 animate-in shake">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default UploadAnalysis;