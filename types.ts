export enum Category8M {
  MANPOWER = 'Mão de Obra',
  MACHINERY = 'Máquinas',
  MATERIAL = 'Material',
  METHOD = 'Método',
  MEASUREMENT = 'Medição',
  MOTHER_NATURE = 'Meio Ambiente',
  MANAGEMENT = 'Gerenciamento',
  MONEY = 'Orçamento',
  OTHER = 'Outros'
}

export enum Status {
  OPEN = 'Aberto',
  IN_PROGRESS = 'Em Andamento',
  RESOLVED = 'Resolvido',
  BLOCKED = 'Bloqueado'
}

export enum Priority {
  HIGH = 'Alta',
  MEDIUM = 'Média',
  LOW = 'Baixa'
}

export interface Constraint {
  id: string;
  description: string;
  category: Category8M;
  status: Status;
  priority: Priority;
  responsible: string; // Manually assigned
  deadline: string; // ISO Date
  aiSuggested: boolean;
  impact: string; // A short description of impact on the 10-day plan
  origin: 'ia' | 'manual';
  area?: string;
  discipline?: string;
}

export interface ShutdownState {
  projectName: string;
  startDate: string; // ISO Date
  totalDays: number; // Default 10
  constraints: Constraint[];
  participants: string[]; // List of teams/people available for responsibility
  lastUpdated: string;
}

export type ViewMode = 'dashboard' | 'upload' | 'kanban' | 'meeting' | 'report' | 'settings';

export interface AIAnalysisResult {
  description: string;
  category: Category8M;
  priority: Priority;
  impact: string;
  area?: string;
  discipline?: string;
}