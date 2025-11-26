import React, { useState } from 'react';
import { Constraint, Status, Priority, Category8M, ShutdownState } from '../types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts';
import { FileSpreadsheet, FileCode, CheckSquare, AlertTriangle, ArrowLeft, LogOut } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ReportViewProps {
  data: ShutdownState;
  participants: string[];
  onFinalize: () => void;
  onBack: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57'];

const ReportView: React.FC<ReportViewProps> = ({ data, participants, onFinalize, onBack }) => {
  const { constraints, projectName, startDate } = data;
  const [isFinishing, setIsFinishing] = useState(false);

  // 1. Data Processing for Charts
  const categoryData = Object.values(Category8M).map(cat => ({
    name: cat,
    value: constraints.filter(c => c.category === cat).length
  })).filter(d => d.value > 0);

  const responsibleData = participants.map(p => ({
    name: p,
    total: constraints.filter(c => c.responsible === p).length,
    resolved: constraints.filter(c => c.responsible === p && c.status === Status.RESOLVED).length
  })).filter(d => d.total > 0);

  // Simulate Line Chart (Evolution over 10 days based on deadlines)
  const chartDays = Array.from({length: 10}, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD logic approximation
    return {
      day: `Dia ${i+1}`,
      due: constraints.filter(c => c.deadline.startsWith(dateStr)).length,
      accumulated: 0 // Would need history for real evolution
    };
  });

  // 2. Export Functions
  const exportToXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(constraints.map(c => ({
      ID: c.id,
      Descrição: c.description,
      Área: c.area || 'Geral',
      Categoria: c.category,
      Prioridade: c.priority,
      Status: c.status,
      Responsável: c.responsible,
      Origem: c.origin,
      Impacto: c.impact
    })));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ata Final Parada");
    XLSX.writeFile(wb, `Ata_Parada_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportToHTML = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ata da Parada - ${projectName}</title>
        <meta charset="UTF-8">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>@page { margin: 20px; } body { -webkit-print-color-adjust: exact; }</style>
      </head>
      <body class="bg-white p-8 font-sans text-slate-900">
        <div class="border-b-2 border-blue-900 pb-4 mb-6 flex justify-between items-end">
          <div>
            <h1 class="text-3xl font-bold text-blue-900">Ata de Encerramento da Parada</h1>
            <p class="text-lg font-medium text-slate-600 mt-1">${projectName}</p>
          </div>
          <div class="text-right">
             <p class="text-sm font-bold text-slate-700">Data de Emissão</p>
             <p class="text-slate-500">${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-6 mb-8">
           <div class="p-4 bg-slate-50 rounded border">
              <h3 className="font-bold text-sm text-slate-500 uppercase">Período (10 Dias)</h3>
              <p class="text-xl font-bold">${new Date(startDate).toLocaleDateString()} - ${new Date(new Date(startDate).getTime() + 9*86400000).toLocaleDateString()}</p>
           </div>
           <div class="p-4 bg-slate-50 rounded border">
              <h3 className="font-bold text-sm text-slate-500 uppercase">Total de Restrições</h3>
              <p class="text-xl font-bold">${constraints.length}</p>
           </div>
           <div class="p-4 bg-slate-50 rounded border">
              <h3 className="font-bold text-sm text-slate-500 uppercase">Taxa de Resolução</h3>
              <p class="text-xl font-bold text-green-600">
                ${Math.round((constraints.filter(c => c.status === Status.RESOLVED).length / constraints.length) * 100) || 0}%
              </p>
           </div>
        </div>

        <h2 class="text-xl font-bold text-slate-800 mb-4 border-l-4 border-blue-600 pl-3">Participantes</h2>
        <div class="flex flex-wrap gap-2 mb-8">
          ${participants.map(p => `<span class="px-3 py-1 bg-slate-100 rounded-full text-sm border">${p}</span>`).join('')}
        </div>

        <h2 class="text-xl font-bold text-slate-800 mb-4 border-l-4 border-blue-600 pl-3">Detalhamento das Restrições</h2>
        <table class="w-full text-sm text-left border-collapse mb-8">
          <thead class="bg-slate-100 uppercase text-xs font-bold text-slate-600">
            <tr>
              <th class="p-3 border-b">Prioridade</th>
              <th class="p-3 border-b">Descrição</th>
              <th class="p-3 border-b">Área</th>
              <th class="p-3 border-b">Resp.</th>
              <th class="p-3 border-b">Status</th>
            </tr>
          </thead>
          <tbody>
            ${constraints.map((c, i) => `
              <tr class="border-b ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}">
                <td class="p-3 font-bold ${c.priority === Priority.HIGH ? 'text-red-600' : 'text-slate-600'}">${c.priority}</td>
                <td class="p-3">${c.description}</td>
                <td class="p-3 text-slate-500">${c.area || '-'}</td>
                <td class="p-3 font-medium">${c.responsible}</td>
                <td class="p-3">
                  <span class="px-2 py-1 rounded text-xs font-bold ${c.status === Status.RESOLVED ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
                    ${c.status}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="text-center text-xs text-slate-400 mt-10 border-t pt-4">
          Gerado via Parada 10DLA - SaaS de Gestão de Paradas
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ata_Parada_${projectName.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Validation Logic
  const handleTryFinalize = () => {
    const pending = constraints.filter(c => !c.responsible || c.responsible === 'Não atribuído');
    
    if (pending.length > 0) {
      alert(`Bloqueio: Existem ${pending.length} restrições sem responsável definido. Todas as restrições devem ter um responsável para finalizar a Parada.`);
      return;
    }

    setIsFinishing(true);
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
           <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-2 transition-colors">
              <ArrowLeft size={16} /> Voltar e Editar
           </button>
           <h1 className="text-3xl font-bold text-slate-900">Ata da Parada</h1>
           <p className="text-slate-500">Visualização Final e Encerramento do Ciclo</p>
        </div>
        <div className="flex gap-2">
           <button onClick={exportToHTML} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium text-slate-700">
              <FileCode size={18} className="text-orange-500" /> Exportar HTML
           </button>
           <button onClick={exportToXLSX} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium text-slate-700">
              <FileSpreadsheet size={18} className="text-green-600" /> Exportar XLSX
           </button>
           <button 
             onClick={handleTryFinalize}
             className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-md transition-all hover:scale-105"
           >
              <LogOut size={18} /> Finalizar Parada
           </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isFinishing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border-t-8 border-red-600">
             <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
             </div>
             <h3 className="text-2xl font-bold text-center text-slate-900 mb-2">Finalizar Parada?</h3>
             <p className="text-center text-slate-500 mb-6">
               Esta ação irá <b>arquivar este relatório</b> e <b>apagar todos os dados</b> atuais para iniciar um novo ciclo de 10 dias.
               <br/><br/>
               Tem certeza que deseja continuar?
             </p>
             <div className="flex gap-3">
               <button onClick={() => setIsFinishing(false)} className="flex-1 py-3 bg-slate-100 font-bold text-slate-700 rounded-lg hover:bg-slate-200">
                 Cancelar
               </button>
               <button onClick={onFinalize} className="flex-1 py-3 bg-red-600 font-bold text-white rounded-lg hover:bg-red-700">
                 Sim, Finalizar
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Report Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* 8M Chart */}
            <div>
               <h4 className="font-bold text-slate-700 mb-4 border-l-4 border-blue-500 pl-3">Distribuição 8M</h4>
               <div className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                        {categoryData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <ReTooltip />
                      <Legend />
                    </PieChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* Responsible Chart */}
            <div>
               <h4 className="font-bold text-slate-700 mb-4 border-l-4 border-green-500 pl-3">Status por Responsável</h4>
               <div className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={responsibleData} layout="vertical" margin={{left: 20}}>
                       <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                       <XAxis type="number" />
                       <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 11}} />
                       <ReTooltip />
                       <Legend />
                       <Bar dataKey="total" name="Total" fill="#8884d8" radius={[0,4,4,0]} />
                       <Bar dataKey="resolved" name="Resolvidos" fill="#82ca9d" radius={[0,4,4,0]} />
                    </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>
         </div>

         {/* Full List */}
         <h4 className="font-bold text-slate-700 mb-4 border-l-4 border-indigo-500 pl-3">Lista Geral de Restrições</h4>
         <div className="overflow-x-auto rounded-lg border border-slate-200">
           <table className="w-full text-sm text-left">
             <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs">
               <tr>
                 <th className="p-4">Prioridade</th>
                 <th className="p-4">Descrição</th>
                 <th className="p-4">Área / Disc.</th>
                 <th className="p-4">Categ. (8M)</th>
                 <th className="p-4">Responsável</th>
                 <th className="p-4">Status</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {constraints.map((c) => (
                 <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                   <td className="p-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded border ${
                        c.priority === Priority.HIGH ? 'bg-red-50 text-red-600 border-red-200' :
                        c.priority === Priority.MEDIUM ? 'bg-amber-50 text-amber-600 border-amber-200' :
                        'bg-blue-50 text-blue-600 border-blue-200'
                      }`}>
                        {c.priority}
                      </span>
                   </td>
                   <td className="p-4 font-medium text-slate-800">
                     {c.description}
                     <div className="text-xs text-slate-400 font-normal mt-1">{c.origin === 'ia' ? '✨ Sugestão IA' : '📝 Manual'}</div>
                   </td>
                   <td className="p-4 text-slate-600">
                     <div className="font-semibold">{c.area || '-'}</div>
                     <div className="text-xs">{c.discipline}</div>
                   </td>
                   <td className="p-4 text-slate-600">{c.category}</td>
                   <td className="p-4 font-semibold text-slate-700">{c.responsible}</td>
                   <td className="p-4">
                      {c.status === Status.RESOLVED ? (
                        <span className="flex items-center gap-1 text-green-600 font-bold text-xs"><CheckSquare size={14}/> Resolvido</span>
                      ) : (
                        <span className="text-slate-500 text-xs uppercase">{c.status}</span>
                      )}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
};

export default ReportView;