import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ListTodo, 
  UploadCloud, 
  Users, 
  LogOut, 
  Menu,
  CheckSquare,
  HardHat,
  ArrowRight,
  Settings,
  Calendar,
  Factory,
  FileText
} from 'lucide-react';
import { ShutdownState, Constraint, ViewMode, Status } from './types';
import Dashboard from './components/Dashboard';
import ConstraintBoard from './components/ConstraintBoard';
import UploadAnalysis from './components/UploadAnalysis';
import ReportView from './components/ReportView';

// Generated Professional Sigma SVG Logo (Blue/Orange Industrial Theme)
const SIGMA_LOGO = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMjAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMzIwIDEwMCI+CiAgPCEtLSBJY29uIC0tPgogIDxwYXRoIGQ9Ik0xNSAxMCBDIDUgMTAgNSA5MCAxNSA5MCBMIDcwIDkwIEwgMTAwIDUwIEwgNzAgMTAgTCAxNSAxMCIgZmlsbD0iIzMxMjU1OSIvPgogIDxwYXRoIGQ9Ik0xNSAxMCBMIDQ1IDUwIEwgMTUgOTAiIGZpbGw9IiNmOTczMTYiLz4KICA8cGF0aCBkPSJNMzAgMTAgTCA2MCA1MCBMIDMwIDkwIiBmaWxsPSIjMzEyNTU5Ii8+CiAgCiAgPCEtLSBUZXh0IC0tPgogIDx0ZXh0IHg9IjExMCIgeT0iNjUiIGZvbnQtZmFtaWx5PSJTYW5zLVNlcmlmLCBBcmlhbCIgZm9udC13ZWlnaHQ9IjkwMCIgZm9udC1zaXplPSI1MiIgZmlsbD0iIzMxMjU1OSIgbGV0dGVyLXNwYWNpbmc9Ii0yIiBmb250LXN0eWxlPSJpdGFsaWMiPlNJR01BPC90ZXh0PgogIDx0ZXh0IHg9IjExMiIgeT0iODgiIGZvbnQtZmFtaWx5PSJTYW5zLVNlcmlmLCBBcmlhbCIgZm9udC13ZWlnaHQ9IjQwMCIgZm9udC1zaXplPSIxNiIgZmlsbD0iI2Y5NzMxNiIgZm9udC1zdHlsZT0iaXRhbGljIj5HZXJlbmNpYW1lbnRvIGRlIFByb2pldG9zPC90ZXh0Pgo8L3N2Zz4=";

// The flow is: AUTH -> CONFIG -> APP
type AppStep = 'AUTH' | 'CONFIG' | 'APP';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('AUTH');
  const [data, setData] = useState<ShutdownState | null>(null);
  const [view, setView] = useState<ViewMode>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Auth State
  const [facilitator, setFacilitator] = useState<string>('');
  const [showRestartToast, setShowRestartToast] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    // 1. Check for restart flag first
    if (localStorage.getItem('session_restart')) {
      setShowRestartToast(true);
      localStorage.removeItem('session_restart');
      setTimeout(() => setShowRestartToast(false), 4000);
    }

    // 2. Check Auth
    const savedFacilitator = localStorage.getItem('parada_facilitator');
    
    // 3. Check Data
    const savedData = localStorage.getItem('parada_mvp_data');

    if (savedFacilitator) {
      setFacilitator(savedFacilitator);
      if (savedData) {
        try {
          setData(JSON.parse(savedData));
          setStep('APP');
        } catch (e) {
          console.error("Failed to load data", e);
          setStep('CONFIG');
        }
      } else {
        setStep('CONFIG');
      }
    } else {
      setStep('AUTH');
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (data) {
      localStorage.setItem('parada_mvp_data', JSON.stringify(data));
    }
  }, [data]);

  const handleLogin = (name: string) => {
    if (!name.trim()) return;
    localStorage.setItem('parada_facilitator', name);
    setFacilitator(name);
    // After login, check if we have data to skip to APP
    const savedData = localStorage.getItem('parada_mvp_data');
    if (savedData) {
      setData(JSON.parse(savedData));
      setStep('APP');
    } else {
      setStep('CONFIG');
    }
  };

  const handleConfiguration = (projectName: string, unit: string, startDate: string, duration: number) => {
    const newState: ShutdownState = {
      projectName: `${projectName} - ${unit}`,
      startDate: startDate,
      totalDays: duration, // Variable duration
      constraints: [],
      participants: ['Engenharia', 'SSMA', 'Planejamento', 'PCM', 'Operação'], // Default participants
      lastUpdated: new Date().toISOString()
    };
    setData(newState);
    setStep('APP');
  };

  const addConstraints = (newConstraints: Constraint[]) => {
    if (!data) return;
    setData(prev => prev ? ({
      ...prev,
      constraints: [...prev.constraints, ...newConstraints],
      lastUpdated: new Date().toISOString()
    }) : null);
    setView('kanban'); 
  };

  const updateConstraint = (updated: Constraint) => {
    if (!data) return;
    setData(prev => prev ? ({
      ...prev,
      constraints: prev.constraints.map(c => c.id === updated.id ? updated : c),
      lastUpdated: new Date().toISOString()
    }) : null);
  };

  const deleteConstraint = (id: string) => {
    if (!data) return;
    setData(prev => prev ? ({
      ...prev,
      constraints: prev.constraints.filter(c => c.id !== id),
      lastUpdated: new Date().toISOString()
    }) : null);
  };

  const addSingleConstraint = (c: Omit<Constraint, 'id'>) => {
    if (!data) return;
    const newId = `manual-${Date.now()}`;
    setData(prev => prev ? ({
      ...prev,
      constraints: [...prev.constraints, { ...c, id: newId }],
      lastUpdated: new Date().toISOString()
    }) : null);
  };

  const updateParticipants = (newParticipants: string[]) => {
    if (!data) return;
    setData(prev => prev ? ({
      ...prev,
      participants: newParticipants
    }) : null);
  };

  const finalizeShutdown = () => {
    // Clear data and restart
    setData(null);
    localStorage.removeItem('parada_mvp_data');
    localStorage.setItem('session_restart', 'true');
    window.location.reload();
  };

  // --- Sub-Components ---

  const LoginScreen = () => {
    const [name, setName] = useState('');
    return (
      <div className="min-h-screen bg-industrial-900 flex items-center justify-center p-4">
        {showRestartToast && (
            <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-10 fade-in duration-500">
            <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
                <div className="bg-white/20 p-1 rounded-full"><CheckSquare size={16} /></div>
                <div>
                <h4 className="font-bold">Nova Sessão Iniciada</h4>
                <p className="text-xs opacity-90">Ciclo de Parada reiniciado com sucesso.</p>
                </div>
            </div>
            </div>
        )}
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-in zoom-in-95 duration-500">
          <div className="text-center mb-8">
            <img 
              src={SIGMA_LOGO} 
              alt="Sigma" 
              className="h-20 mx-auto mb-6 object-contain"
            />
            <h1 className="text-2xl font-bold text-slate-900">Parada 10DLA</h1>
            <p className="text-slate-500 mt-2">Autenticação do Facilitador</p>
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(name); }}>
            <label className="block text-sm font-medium text-slate-700 mb-2">Seu Nome</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Ex: João Silva"
              autoFocus
            />
            <button 
              type="submit"
              disabled={!name.trim()}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Entrar <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    );
  };

  const ConfigurationScreen = () => {
    const [pName, setPName] = useState('');
    const [pUnit, setPUnit] = useState('');
    const [pDate, setPDate] = useState(new Date().toISOString().split('T')[0]);
    const [pDuration, setPDuration] = useState(30);

    // Calculate end date based on duration
    const startDateObj = new Date(pDate);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + (pDuration - 1));
    const endDateStr = endDateObj.toLocaleDateString();

    const isValid = pName.trim().length > 0 && pUnit.trim().length > 0 && pDate.length > 0 && pDuration > 0;

    return (
        <div className="min-h-screen bg-industrial-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg animate-in zoom-in-95 duration-500">
            <div className="mb-6 pb-6 border-b border-slate-100">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Settings className="text-blue-600" /> Configuração da Parada
                </h2>
                <p className="text-slate-500 mt-1">Defina os parâmetros gerais da Parada.</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); if(isValid) handleConfiguration(pName, pUnit, pDate, Number(pDuration)); }}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Parada</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={pName}
                                onChange={e => setPName(e.target.value)}
                                className="w-full pl-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ex: Parada Geral 2024"
                            />
                            <HardHat className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Unidade / Planta</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={pUnit}
                                onChange={e => setPUnit(e.target.value)}
                                className="w-full pl-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ex: U-2300"
                            />
                            <Factory className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Data de Início</label>
                          <div className="relative">
                              <input 
                                  type="date" 
                                  value={pDate}
                                  onChange={e => setPDate(e.target.value)}
                                  className="w-full pl-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                              <Calendar className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Duração (Dias)</label>
                          <div className="relative">
                              <input 
                                  type="number" 
                                  min="1"
                                  value={pDuration}
                                  onChange={e => setPDuration(Number(e.target.value))}
                                  className="w-full pl-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                              <Calendar className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                          </div>
                      </div>
                    </div>

                    {/* Timeline Visualization */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                        <div className="flex justify-between items-center text-sm mb-2">
                            <span className="font-semibold text-blue-800">Período Total da Parada</span>
                            <span className="text-blue-600 font-bold">{pDuration} dias</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 text-sm">
                            <div className="bg-white px-3 py-1 rounded border border-blue-200">
                                {new Date(pDate).toLocaleDateString()}
                            </div>
                            <ArrowRight size={16} className="text-blue-400"/>
                            <div className="bg-white px-3 py-1 rounded border border-blue-200">
                                {endDateStr}
                            </div>
                        </div>
                        <p className="text-xs text-blue-500 mt-2 italic">
                           *A análise de IA será feita em janelas móveis de 10 dias (Lookahead) a partir da data que você escolher no upload.
                        </p>
                    </div>
                </div>

                <button 
                  type="submit"
                  disabled={!isValid}
                  className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Iniciar Parada <ArrowRight size={18} />
                </button>
            </form>
          </div>
        </div>
    );
  };

  const MeetingView = () => {
    if (!data) return null;
    const openConstraints = data.constraints.filter(c => c.status !== Status.RESOLVED);
    
    return (
      <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
        <div className="bg-indigo-600 text-white p-6 rounded-t-xl shadow-lg">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users /> Reunião Operacional Diária
          </h2>
          <p className="opacity-80 mt-1">Facilitador: <b>{facilitator}</b></p>
        </div>
        <div className="bg-white border-x border-b border-slate-200 rounded-b-xl p-6 shadow-sm min-h-[60vh]">
          {openConstraints.length === 0 ? (
            <div className="text-center py-20">
              <CheckSquare className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800">Tudo Limpo!</h3>
              <p className="text-slate-500">Não há restrições pendentes para discutir.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {openConstraints.map((c, idx) => (
                <div key={c.id} className="border border-slate-200 rounded-lg p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                  <div className="bg-slate-100 text-slate-500 font-bold w-8 h-8 flex items-center justify-center rounded-full shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-slate-800">{c.description}</h4>
                    <div className="flex gap-3 text-sm mt-1">
                      <span className="text-slate-500">Resp: <b>{c.responsible}</b></span>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-500">Categ: {c.category}</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-500">Área: {c.area || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => updateConstraint({...c, status: Status.RESOLVED})}
                      className="text-xs bg-green-100 text-green-700 px-3 py-2 rounded-md font-medium hover:bg-green-200"
                    >
                      Resolver
                    </button>
                    <button 
                       onClick={() => updateConstraint({...c, status: Status.IN_PROGRESS})}
                       className="text-xs bg-blue-100 text-blue-700 px-3 py-2 rounded-md font-medium hover:bg-blue-200"
                    >
                      Em Andamento
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Main Render ---

  if (step === 'AUTH') {
    return <LoginScreen />;
  }

  if (step === 'CONFIG') {
    return <ConfigurationScreen />;
  }

  if (!data) return null; // Should not happen if step is APP

  return (
    <div className="flex h-screen bg-industrial-50 overflow-hidden relative">
      {/* Toast Notification for Restart */}
      {showRestartToast && (
        <div className="absolute top-4 right-4 z-50 animate-in slide-in-from-right-10 fade-in duration-500">
          <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
            <div className="bg-white/20 p-1 rounded-full"><CheckSquare size={16} /></div>
            <div>
              <h4 className="font-bold">Nova Sessão Iniciada</h4>
              <p className="text-xs opacity-90">Ciclo de Parada reiniciado com sucesso.</p>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside 
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-industrial-900 text-white transition-all duration-300 flex flex-col shadow-xl z-20`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-industrial-800 bg-white/5">
          {sidebarOpen && (
            <div className="bg-white/90 py-1 px-3 rounded-md flex items-center justify-center">
              <img src={SIGMA_LOGO} alt="Sigma" className="h-8 object-contain" />
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-industrial-800 rounded text-slate-300">
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 py-6 space-y-1">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={view === 'dashboard'} 
            expanded={sidebarOpen}
            onClick={() => setView('dashboard')} 
          />
          <SidebarItem 
            icon={<ListTodo size={20} />} 
            label="Restrições" 
            active={view === 'kanban'} 
            expanded={sidebarOpen}
            onClick={() => setView('kanban')} 
          />
          <SidebarItem 
            icon={<UploadCloud size={20} />} 
            label="Importar / IA" 
            active={view === 'upload'} 
            expanded={sidebarOpen}
            onClick={() => setView('upload')} 
          />
          <SidebarItem 
            icon={<Users size={20} />} 
            label="Reunião Diária" 
            active={view === 'meeting'} 
            expanded={sidebarOpen}
            onClick={() => setView('meeting')} 
          />
          <div className="pt-4 mt-4 border-t border-industrial-800"></div>
          <SidebarItem 
            icon={<FileText size={20} />} 
            label="Ata / Relatório" 
            active={view === 'report'} 
            expanded={sidebarOpen}
            onClick={() => setView('report')} 
          />
        </nav>

        <div className="p-4 border-t border-industrial-800">
           {sidebarOpen && <div className="mb-4 px-2 text-xs text-slate-400">Facilitador: {facilitator}</div>}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <h1 className="text-xl font-semibold text-slate-800">
            {view === 'dashboard' && 'Visão Geral da Parada'}
            {view === 'kanban' && 'Gestão de Restrições (8M)'}
            {view === 'upload' && 'Análise de Cronograma'}
            {view === 'meeting' && 'Modo Reunião'}
            {view === 'report' && 'Ata e Finalização'}
          </h1>
          <div className="text-sm text-slate-500">
            Projeto: <span className="font-medium text-slate-900">{data.projectName}</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-industrial-50">
          {view === 'dashboard' && (
            <Dashboard 
              constraints={data.constraints} 
              totalDays={data.totalDays} 
              startDate={data.startDate} 
            />
          )}
          
          {view === 'kanban' && (
            <ConstraintBoard 
              constraints={data.constraints}
              participants={data.participants || []}
              onUpdateConstraint={updateConstraint}
              onDeleteConstraint={deleteConstraint}
              onAddConstraint={addSingleConstraint}
              onUpdateParticipants={updateParticipants}
              onNavigateToReport={() => setView('report')}
            />
          )}

          {view === 'upload' && (
            <UploadAnalysis 
               startDate={data.startDate}
               onAnalysisComplete={addConstraints} 
            />
          )}

          {view === 'meeting' && <MeetingView />}

          {view === 'report' && (
             <ReportView 
               data={data}
               participants={data.participants || []}
               onFinalize={finalizeShutdown}
               onBack={() => setView('kanban')}
             />
          )}
        </div>
      </main>
    </div>
  );
};

// Subcomponent for Sidebar Items
interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  expanded: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, expanded, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center px-4 py-3 transition-colors duration-200
      ${active ? 'bg-industrial-800 border-r-4 border-blue-500' : 'hover:bg-industrial-800 border-r-4 border-transparent'}
    `}
  >
    <div className={`${active ? 'text-blue-400' : 'text-slate-400'}`}>
      {icon}
    </div>
    {expanded && (
      <span className={`ml-4 font-medium ${active ? 'text-white' : 'text-slate-300'}`}>
        {label}
      </span>
    )}
  </button>
);

export default App;