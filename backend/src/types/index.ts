// Tipos TypeScript para o Sistema de Gestão Patrimonial

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
export interface SecretariaRequest {
  codigo: string;
  nome: string;
  descricao?: string;
  dataInicio: Date;
  responsavel: string;
}

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
export interface FuncionarioRequest {
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
export interface PatrimonioRequest {
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
export interface DocumentoRequest {
  patrimonioId: string;
  nome: string;
  tipo: TipoDocumento;
  url: string;
  dataVencimento?: Date;
}

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
export interface ManutencaoRequest {
  patrimonioId: string;
  data: Date;
  tipo: TipoManutencao;
  descricao: string;
  valor?: number;
  responsavel: string;
}

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
export interface TransferenciaRequest {
  patrimonioId: string;
  secretariaDestinoId: string;
  motivoTransferencia: string;
  justificativaSecretariaInativa?: string;
}

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

// Tipos de Log de Atividade
export interface LogAtividadeResponse {
  id: string;
  usuarioId: string;
  acao: string;
  entidade: string;
  entidadeId: string;
  campo: string;
  valorAnterior?: any;
  valorNovo?: any;
  ip: string;
  userAgent: string;
  timestamp: Date;
  sessaoId: string;
  funcionario?: FuncionarioResponse;
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
}

export interface FuncionarioFilters {
  search?: string;
  status?: StatusFuncionario;
  secretariaId?: string;
  cargo?: string;
}

export interface SecretariaFilters {
  search?: string;
  status?: StatusSecretaria;
}

// Tipos de Relatórios
export interface RelatorioPatrimonioRequest {
  tipo: 'por_secretaria' | 'por_categoria' | 'por_responsavel' | 'depreciacao' | 'inventario';
  filtros?: PatrimonioFilters;
  formato: 'pdf' | 'excel' | 'csv';
  dataInicio?: Date;
  dataFim?: Date;
}

export interface RelatorioTransferenciaRequest {
  filtros?: {
    status?: StatusTransferencia;
    secretariaOrigemId?: string;
    secretariaDestinoId?: string;
    dataInicio?: Date;
    dataFim?: Date;
  };
  formato: 'pdf' | 'excel' | 'csv';
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

// Tipos de Upload
export interface UploadResponse {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
}

// Tipos de Configuração
export interface SystemConfig {
  numeracaoPatrimonio: {
    formato: string;
    resetAnual: boolean;
  };
  depreciacao: {
    metodo: string;
    tabelas: Record<string, {
      vidaUtil: number;
      taxaAnual: number;
    }>;
  };
  backup: {
    incremental: string;
    completo: string;
    retencao: number;
  };
  seguranca: {
    politicaSenha: string;
    timeoutSessao: number;
    tentativasLogin: number;
  };
}

// Tipos de Auditoria
export interface AuditLog {
  id: string;
  usuario: string;
  acao: string;
  entidade: string;
  entidadeId: string;
  timestamp: Date;
  ip: string;
  userAgent: string;
  detalhes?: any;
}

// Tipos de Notificação
export interface NotificationRequest {
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
  destinatarios: string[];
  dataEnvio?: Date;
}

export interface NotificationResponse {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  dataEnvio: Date;
  dataLeitura?: Date;
}
