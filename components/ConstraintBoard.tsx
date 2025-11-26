import React, { useState } from 'react';
import { Constraint, Status, Priority, Category8M } from '../types';
import { Edit2, Trash2, UserPlus, Filter, Plus, Users, Tag, AlertTriangle, ChevronDown, ChevronRight, FileText } from 'lucide-react';

interface ConstraintBoardProps {
  constraints: Constraint[];
  participants: string[];
  onUpdateConstraint: (c: Constraint) => void;
  onDeleteConstraint: (id: string) => void;
  onAddConstraint: (c: Omit<Constraint, 'id'>) => void;
  onUpdateParticipants: (newParticipants: string[]) => void;
  onNavigateToReport: () => void;
}

const ConstraintBoard: React.FC<ConstraintBoardProps> = ({ 
  constraints, participants, onUpdateConstraint, onDeleteConstraint, onAddConstraint, onUpdateParticipants, onNavigateToReport
}) => {
  const [filter, setFilter] = useState<Status | 'ALL' | 'PENDING'>('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Participant State
  const [showParticipants, setShowParticipants] = useState(false);
  const [newParticipant, setNewParticipant] = useState('');

  // New Constraint State
  const [isAdding, setIsAdding] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState<Category8M>(Category8M.OTHER);
  const [newPriority, setNewPriority] = useState<Priority>(Priority.MEDIUM);
  const [newArea, setNewArea] = useState('');

  // Grouping State
  const [groupByArea, setGroupByArea] = useState(true);

  const filteredConstraints = constraints.filter(c => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return c.responsible === 'Não atribuído' || !c.responsible;
    return c.status === filter;
  });

  const pendingCount = constraints.filter(c => c.responsible === 'Não atribuído' || !c.responsible).length;

  // Group constraints
  const groupedConstraints: { [area: string]: Constraint[] } = {};
  if (groupByArea) {
    filteredConstraints.forEach(c => {
      const area = c.area || 'Geral / Sem Área';
      if (!groupedConstraints[area]) groupedConstraints[area] = [];
      groupedConstraints[area].push(c);
    });
  }

  const handleStatusChange = (c: Constraint, newStatus: Status) => {
    onUpdateConstraint({ ...c, status: newStatus });
  };

  const handleAssignResponsible = (c: Constraint, responsible: string) => {
    onUpdateConstraint({ ...c, responsible: responsible });
    setEditingId(null);
  };

  const handleAddNew = () => {
    if(!newDesc) return;
    onAddConstraint({
      description: newDesc,
      category: newCat,
      priority: newPriority,
      status: Status.OPEN,
      responsible: 'Não atribuído',
      deadline: new Date().toISOString(),
      aiSuggested: false,
      impact: 'Inserido manualmente',
      origin: 'manual',
      area: newArea || 'Geral',
      discipline: 'Geral'
    });
    setIsAdding(false);
    setNewDesc('');
    setNewArea('');
  };

  const handleAddParticipant = () => {
    if (newParticipant && !participants.includes(newParticipant)) {
      onUpdateParticipants([...participants, newParticipant]);
      setNewParticipant('');
    }
  };

  const handleRemoveParticipant = (p: string) => {
    onUpdateParticipants(participants.filter(item => item !== p));
  };

  const ConstraintCard: React.FC<{ c: Constraint }> = ({ c }) => (
    <div className={`bg-white p-5 rounded-lg shadow-sm border-l-4 transition-all hover:shadow-md mb-3 ${
      c.priority === Priority.HIGH ? 'border-l-red-500' : 
      c.priority === Priority.MEDIUM ? 'border-l-amber-500' : 'border-l-blue-500'
    }`}>
      <div className="flex flex-col lg:flex-row justify-between gap-6">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              c.category === Category8M.MANPOWER ? 'bg-purple-100 text-purple-700' :
              c.category === Category8M.MATERIAL ? 'bg-orange-100 text-orange-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {c.category}
            </span>
            {c.origin === 'ia' && (
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1 font-medium">
                ✨ Sugestão IA
              </span>
            )}
            {c.area && (
              <span className="text-xs bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                <Tag size={10} /> {c.area}
              </span>
            )}
            {(c.responsible === 'Não atribuído' || !c.responsible) && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                 <AlertTriangle size={10} /> Resp. Pendente
              </span>
            )}
          </div>
          <h3 className="font-semibold text-slate-800 text-lg leading-snug">{c.description}</h3>
          <p className="text-sm text-slate-500 mt-2 italic border-l-2 border-slate-200 pl-3">Impacto: {c.impact}</p>
        </div>
        
        <div className="flex flex-col lg:items-end gap-3 min-w-[220px]">
          {/* Status Selector */}
          <div className="w-full lg:w-auto">
             <select 
                value={c.status}
                onChange={(e) => handleStatusChange(c, e.target.value as Status)}
                className={`w-full lg:w-auto text-xs font-bold uppercase rounded px-3 py-1.5 border-none focus:ring-2 focus:ring-offset-1 cursor-pointer transition-colors ${
                  c.status === Status.RESOLVED ? 'bg-green-100 text-green-700 focus:ring-green-500' :
                  c.status === Status.IN_PROGRESS ? 'bg-blue-100 text-blue-700 focus:ring-blue-500' :
                  'bg-slate-100 text-slate-700 focus:ring-slate-400'
                }`}
             >
               {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
             </select>
          </div>

          {/* Responsible Assignment */}
          <div className="w-full lg:w-auto">
            {editingId === c.id ? (
              <div className="flex flex-col gap-2 animate-in fade-in bg-slate-50 p-2 rounded border border-slate-200">
                <p className="text-xs font-bold text-slate-500">Atribuir a:</p>
                <div className="flex flex-wrap gap-1">
                   {participants.map(p => (
                      <button 
                        key={p} 
                        onClick={() => handleAssignResponsible(c, p)}
                        className="text-xs bg-white border hover:bg-blue-50 hover:border-blue-300 px-2 py-1 rounded"
                      >
                        {p}
                      </button>
                   ))}
                   <button onClick={() => setEditingId(null)} className="text-xs text-red-500 px-2 py-1">Cancelar</button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setEditingId(c.id)}
                className={`w-full lg:w-auto flex items-center justify-between lg:justify-end gap-2 px-3 py-1.5 rounded border transition-all ${
                  c.responsible === 'Não atribuído' 
                  ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-sm font-medium">
                  {c.responsible === 'Não atribuído' ? 'Definir Responsável' : c.responsible}
                </span>
                <Edit2 size={12} className="opacity-50" />
              </button>
            )}
          </div>
        </div>
      </div>
       
      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{c.priority} Prioridade</span>
          <button 
            onClick={() => onDeleteConstraint(c.id)}
            className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors"
          >
            <Trash2 size={14} /> Excluir
          </button>
       </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="text-slate-400" size={20} />
            <select 
              className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
            >
              <option value="ALL">Todas as Restrições</option>
              <option value="PENDING">Pendentes de Responsável</option>
              {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          
          <button 
             onClick={() => setShowParticipants(!showParticipants)}
             className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${showParticipants ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
          >
             <Users size={16} /> Equipes / Participantes
          </button>
          
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer ml-2 select-none">
            <input 
              type="checkbox" 
              checked={groupByArea} 
              onChange={() => setGroupByArea(!groupByArea)}
              className="rounded text-blue-600 focus:ring-blue-500" 
            />
            Agrupar por Área
          </label>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm ml-2"
          >
            <Plus size={16} /> Nova Restrição
          </button>
          <button
             onClick={onNavigateToReport}
             disabled={pendingCount > 0}
             className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all shadow-sm ${
               pendingCount > 0 
               ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
               : 'bg-green-600 text-white hover:bg-green-700 hover:scale-105'
             }`}
             title={pendingCount > 0 ? "Defina todos os responsáveis antes de gerar a ata." : "Pronto para gerar ata"}
          >
            <FileText size={16} /> 
            {pendingCount > 0 ? `Pendências (${pendingCount})` : 'Gerar Ata'}
          </button>
        </div>
      </div>

      {/* Participants Manager */}
      {showParticipants && (
         <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 animate-in slide-in-from-top-2">
            <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Gerenciar Participantes</h4>
            <div className="flex flex-wrap gap-2 mb-3">
               {participants.map(p => (
                 <span key={p} className="bg-white px-3 py-1 rounded-full text-sm border border-slate-200 text-slate-700 flex items-center gap-2 shadow-sm">
                    {p}
                    <button onClick={() => handleRemoveParticipant(p)} className="text-slate-400 hover:text-red-500 font-bold">×</button>
                 </span>
               ))}
            </div>
            <div className="flex gap-2 max-w-md">
               <input 
                 type="text" 
                 placeholder="Novo participante (Ex: Elétrica)"
                 className="flex-1 p-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                 value={newParticipant}
                 onChange={e => setNewParticipant(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && handleAddParticipant()}
               />
               <button onClick={handleAddParticipant} className="px-4 py-2 bg-slate-800 text-white text-sm rounded hover:bg-slate-900">Adicionar</button>
            </div>
         </div>
      )}

      {/* Add New Form */}
      {isAdding && (
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 animate-in slide-in-from-top-2 shadow-lg mb-6">
          <h4 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
            <Plus size={18} /> Adicionar Nova Restrição
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-blue-700 mb-1">Descrição</label>
              <input 
                type="text" 
                placeholder="Descrição do problema..." 
                className="w-full p-2 border border-blue-200 rounded focus:border-blue-500 outline-none"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-blue-700 mb-1">Área / Local</label>
              <input 
                type="text" 
                placeholder="Ex: Unidade 200" 
                className="w-full p-2 border border-blue-200 rounded focus:border-blue-500 outline-none"
                value={newArea}
                onChange={e => setNewArea(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-blue-700 mb-1">Categoria (8M)</label>
              <select 
                className="w-full p-2 border border-blue-200 rounded focus:border-blue-500 outline-none bg-white"
                value={newCat}
                onChange={e => setNewCat(e.target.value as Category8M)}
              >
                {Object.values(Category8M).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-white rounded transition-colors">Cancelar</button>
            <button onClick={handleAddNew} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 shadow-sm">Salvar Restrição</button>
          </div>
        </div>
      )}

      {/* List Area */}
      <div className="space-y-4">
        {filteredConstraints.length === 0 ? (
           <div className="text-center py-16 bg-white rounded-lg border border-dashed border-slate-300">
             <Filter className="w-12 h-12 text-slate-300 mx-auto mb-3" />
             <p className="text-slate-500 font-medium">Nenhuma restrição encontrada com este filtro.</p>
           </div>
        ) : groupByArea ? (
           // Accordion View
           Object.keys(groupedConstraints).sort().map(area => (
             <details key={area} open className="group bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <summary className="flex items-center justify-between p-4 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors list-none select-none">
                   <div className="flex items-center gap-3">
                      <ChevronRight className="w-5 h-5 text-slate-400 group-open:rotate-90 transition-transform" />
                      <h3 className="font-bold text-slate-700 text-lg">{area}</h3>
                      <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                        {groupedConstraints[area].length}
                      </span>
                   </div>
                </summary>
                <div className="p-4 bg-slate-50/50 space-y-3 border-t border-slate-100">
                  {groupedConstraints[area].map(c => <ConstraintCard key={c.id} c={c} />)}
                </div>
             </details>
           ))
        ) : (
          // Flat View
          filteredConstraints.map(c => <ConstraintCard key={c.id} c={c} />)
        )}
      </div>
    </div>
  );
};

export default ConstraintBoard;