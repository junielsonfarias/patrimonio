// Tipos TypeScript para o frontend do Sistema de Gestão Patrimonial

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Tipos de Autenticação
export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  usuario: UsuarioResponse;
}

export interface UsuarioResponse {
  id: string;
  nome: string;
  email: string;
  role: RoleUsuario;
  funcionario?: FuncionarioResponse;
  isActive: boolean;
  lastLogin?: Date;
}

// Tipos de Secretaria
export interface SecretariaResponse {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  status: StatusSecretaria;
  dataInicio: Date;
  dataFim?: Date;
  motivoInativacao?: string;
  secretariaSuccessora?: string;
  responsavel: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    funcionarios: number;
    patrimonios: number;
  };
}

// Tipos de Funcionário
export interface FuncionarioResponse {
  id: string;
  nome: string;
  cpf: string;
  email?: string;
  telefone?: string;
  cargo: string;
  setor: string;
  secretariaId: string;
  matricula?: string;
  status: StatusFuncionario;
  dataAdmissao: Date;
  dataExoneracao?: Date;
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
  secretaria?: SecretariaResponse;
  _count?: {
    patrimonios: number;
  };
}

// Tipos de Patrimônio
export interface PatrimonioResponse {
  id: string;
  numero: string;
  codigoSecretaria: string;
  descricao: string;
  categoria: string;
  subcategoria?: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  valor: number;
  valorAtual: number;
  dataAquisicao: Date;
  vidaUtil: number;
  secretariaId: string;
  localizacao: string;
  responsavelId: string;
  status: StatusPatrimonio;
  situacao: SituacaoPatrimonio;
  estadoConservacao: EstadoConservacao;
  observacoes?: string;
  fotos: string[];
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
  secretaria?: SecretariaResponse;
  responsavel?: FuncionarioResponse;
  _count?: {
    documentos: number;
    manutencoes: number;
    transferencias: number;
  };
}

// Tipos de Documento
export interface DocumentoResponse {
  id: string;
  patrimonioId: string;
  nome: string;
  tipo: TipoDocumento;
  url: string;
  dataVencimento?: Date;
  createdAt: Date;
}

// Tipos de Manutenção
export interface ManutencaoResponse {
  id: string;
  patrimonioId: string;
  data: Date;
  tipo: TipoManutencao;
  descricao: string;
  valor?: number;
  responsavel: string;
  createdAt: Date;
  patrimonio?: PatrimonioResponse;
}

// Tipos de Transferência
export interface TransferenciaResponse {
  id: string;
  patrimonioId: string;
  secretariaOrigemId: string;
  secretariaDestinoId: string;
  responsavelTransferenciaId: string;
  supervisorAprovacaoId?: string;
  motivoTransferencia: string;
  justificativaSecretariaInativa?: string;
  dataTransferencia?: Date;
  status: StatusTransferencia;
  createdAt: Date;
  patrimonio?: PatrimonioResponse;
  secretariaOrigem?: SecretariaResponse;
  secretariaDestino?: SecretariaResponse;
  responsavelTransferencia?: FuncionarioResponse;
}

// Enums
export enum StatusSecretaria {
  ATIVA = 'ATIVA',
  INATIVA = 'INATIVA',
  EXTINTA = 'EXTINTA'
}

export enum StatusFuncionario {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  AFASTADO = 'AFASTADO',
  EXONERADO = 'EXONERADO'
}

export enum StatusPatrimonio {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  BAIXADO = 'BAIXADO'
}

export enum SituacaoPatrimonio {
  NOVO = 'NOVO',
  RECONDICIONADO = 'RECONDICIONADO',
  USADO = 'USADO',
  TRANSFERIDO = 'TRANSFERIDO',
  DOADO = 'DOADO',
  EXTRAVIADO = 'EXTRAVIADO'
}

export enum EstadoConservacao {
  EXCELENTE = 'EXCELENTE',
  BOM = 'BOM',
  REGULAR = 'REGULAR',
  RUIM = 'RUIM'
}

export enum TipoDocumento {
  NOTA_FISCAL = 'NOTA_FISCAL',
  GARANTIA = 'GARANTIA',
  MANUAL = 'MANUAL',
  OUTRO = 'OUTRO'
}

export enum TipoManutencao {
  PREVENTIVA = 'PREVENTIVA',
  CORRETIVA = 'CORRETIVA'
}

export enum StatusTransferencia {
  PENDENTE = 'PENDENTE',
  APROVADA = 'APROVADA',
  REJEITADA = 'REJEITADA'
}

export enum RoleUsuario {
  SUPERVISOR = 'SUPERVISOR',
  ADMINISTRADOR = 'ADMINISTRADOR',
  OPERADOR = 'OPERADOR',
  CONSULTOR = 'CONSULTOR'
}

// Tipos de Filtros e Busca
export interface PatrimonioFilters {
  search?: string;
  categoria?: string;
  status?: StatusPatrimonio;
  situacao?: SituacaoPatrimonio;
  estadoConservacao?: EstadoConservacao;
  secretariaId?: string;
  responsavelId?: string;
  dataAquisicaoInicio?: Date;
  dataAquisicaoFim?: Date;
  valorMinimo?: number;
  valorMaximo?: number;
  page?: number;
  limit?: number;
}

export interface FuncionarioFilters {
  search?: string;
  status?: StatusFuncionario;
  secretariaId?: string;
  cargo?: string;
  page?: number;
  limit?: number;
}

export interface SecretariaFilters {
  search?: string;
  status?: StatusSecretaria;
  page?: number;
  limit?: number;
}

// Tipos de Dashboard
export interface DashboardStats {
  totalPatrimonios: number;
  totalValor: number;
  totalValorAtual: number;
  patrimoniosPorCategoria: Array<{
    categoria: string;
    quantidade: number;
    valor: number;
  }>;
  patrimoniosPorSecretaria: Array<{
    secretaria: string;
    quantidade: number;
    valor: number;
  }>;
  transferenciasPendentes: number;
  manutencoesPendentes: number;
  patrimoniosVencendoGarantia: number;
}

// Tipos de Formulários
export interface PatrimonioFormData {
  descricao: string;
  categoria: string;
  subcategoria?: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  valor: number;
  dataAquisicao: Date;
  vidaUtil?: number;
  secretariaId: string;
  localizacao: string;
  responsavelId: string;
  situacao?: SituacaoPatrimonio;
  estadoConservacao?: EstadoConservacao;
  observacoes?: string;
}

export interface SecretariaFormData {
  codigo: string;
  nome: string;
  descricao?: string;
  dataInicio: Date;
  responsavel: string;
}

export interface FuncionarioFormData {
  nome: string;
  cpf: string;
  email?: string;
  telefone?: string;
  cargo: string;
  setor: string;
  secretariaId: string;
  matricula?: string;
  dataAdmissao: Date;
  observacoes?: string;
}

// Tipos de Navegação
export interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  roles?: RoleUsuario[];
  children?: MenuItem[];
}

// Tipos de Notificações
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

// Tipos de Configuração
export interface AppConfig {
  apiUrl: string;
  appName: string;
  version: string;
  environment: 'development' | 'production' | 'test';
}

// Tipos de Estado Global
export interface AuthState {
  user: UsuarioResponse | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AppState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: Notification[];
}

// Tipos de Componentes
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  onRowClick?: (item: T) => void;
}

// Tipos de Hooks
export interface UseApiOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  retry?: number;
  staleTime?: number;
}

export interface UseApiResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}
