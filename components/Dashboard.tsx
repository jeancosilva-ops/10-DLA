import React from 'react';
import { Constraint, Status, Category8M, Priority } from '../types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { AlertTriangle, CheckCircle, Clock, Activity, Calendar } from 'lucide-react';

interface DashboardProps {
  constraints: Constraint[];
  totalDays: number;
  startDate: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57'];
const PRIORITY_COLORS = {
  [Priority.HIGH]: '#ef4444',
  [Priority.MEDIUM]: '#f59e0b',
  [Priority.LOW]: '#3b82f6'
};

const Dashboard: React.FC<DashboardProps> = ({ constraints, totalDays, startDate }) => {
  // Stats Calculation
  const total = constraints.length;
  const open = constraints.filter(c => c.status === Status.OPEN).length;
  const inProgress = constraints.filter(c => c.status === Status.IN_PROGRESS).length;
  const resolved = constraints.filter(c => c.status === Status.RESOLVED).length;
  const highPriority = constraints.filter(c => c.priority === Priority.HIGH && c.status !== Status.RESOLVED).length;

  // Data for Charts
  const categoryData = Object.values(Category8M).map(cat => ({
    name: cat,
    value: constraints.filter(c => c.category === cat).length
  })).filter(d => d.value > 0);

  const priorityData = Object.values(Priority).map(p => ({
    name: p,
    value: constraints.filter(c => c.priority === p).length
  }));

  // Calculate days remaining logic based on TOTAL duration
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // End date is Start + (totalDays - 1)
  const end = new Date(start);
  end.setDate(start.getDate() + (totalDays - 1)); 

  let statusText = "";
  let progressPercent = 0;
  let dayDisplay = "";
  let subText = "";

  if (now < start) {
    const daysToStart = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    statusText = `Pré-Parada`;
    subText = `Inicia em ${daysToStart} dia(s)`;
    progressPercent = 0;
    dayDisplay = `0 / ${totalDays}`;
  } else if (now > end) {
    statusText = "Parada Finalizada";
    subText = "Prazo esgotado";
    progressPercent = 100;
    dayDisplay = `${totalDays} / ${totalDays}`;
  } else {
    const daysElapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    dayDisplay = `${daysElapsed} / ${totalDays}`;
    statusText = "Em Execução";
    subText = `Dia ${daysElapsed} de ${totalDays}`;
    progressPercent = (daysElapsed / totalDays) * 100;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Info */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white p-3 rounded-lg shadow-sm border border-slate-200 w-fit">
            <Calendar size={16} className="text-blue-500"/>
            <span>Período Total: <b>{start.toLocaleDateString()}</b> até <b>{end.toLocaleDateString()}</b></span>
        </div>
        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg shadow-sm border border-blue-200 w-fit">
            <Clock size={16} />
            <span className="font-semibold">Foco: Janela Móvel (Lookahead 10 Dias)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric Cards */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between z-10 relative">
            <div>
              <p className="text-sm font-medium text-slate-500">Cronograma Geral</p>
              <h3 className="text-2xl font-bold text-slate-900">{dayDisplay} Dias</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full text-blue-600 group-hover:scale-110 transition-transform">
              <Clock size={24} />
            </div>
          </div>
          <div className="mt-4 w-full bg-slate-100 rounded-full h-2 z-10 relative">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-blue-600 font-bold uppercase tracking-wide">{statusText}</p>
            <p className="text-xs text-slate-400">{subText}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Riscos Críticos</p>
              <h3 className="text-2xl font-bold text-red-600">{highPriority}</h3>
            </div>
            <div className="p-3 bg-red-100 rounded-full text-red-600 group-hover:scale-110 transition-transform">
              <AlertTriangle size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">No Lookahead atual</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Restrições Mapeadas</p>
              <h3 className="text-2xl font-bold text-slate-900">{total}</h3>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full text-indigo-600 group-hover:scale-110 transition-transform">
              <Activity size={24} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-green-600 font-medium">{resolved} Resolvidos</span>
            <span className="text-slate-300">|</span>
            <span className="text-amber-600 font-medium">{open + inProgress} Pendentes</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Resolução de Restrições</p>
              <h3 className="text-2xl font-bold text-green-600">
                {total > 0 ? Math.round((resolved / total) * 100) : 0}%
              </h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full text-green-600 group-hover:scale-110 transition-transform">
              <CheckCircle size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Eficiência da equipe</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 8M Distribution Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[400px]">
          <h4 className="text-lg font-semibold text-slate-800 mb-4">Distribuição por 8M</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[400px]">
          <h4 className="text-lg font-semibold text-slate-800 mb-4">Restrições por Prioridade</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priorityData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name as Priority] || '#8884d8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;