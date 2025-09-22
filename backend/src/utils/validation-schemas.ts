// Schemas de validação com Zod
import { z } from 'zod';
import { 
  StatusSecretaria, 
  StatusFuncionario, 
  StatusPatrimonio, 
  SituacaoPatrimonio, 
  EstadoConservacao,
  TipoDocumento,
  TipoManutencao,
  StatusTransferencia,
  RoleUsuario 
} from '../types';

// Schemas para Secretaria
export const createSecretariaSchema = z.object({
  codigo: z.string()
    .min(2, 'Código deve ter 2 caracteres')
    .max(2, 'Código deve ter 2 caracteres')
    .regex(/^\d{2}$/, 'Código deve conter apenas números'),
  nome: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  descricao: z.string()
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
    .optional(),
  dataInicio: z.coerce.date('Data de início inválida'),
  responsavel: z.string()
    .min(3, 'Nome do responsável deve ter pelo menos 3 caracteres')
    .max(255, 'Nome do responsável deve ter no máximo 255 caracteres'),
});

export const updateSecretariaSchema = z.object({
  nome: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres')
    .optional(),
  descricao: z.string()
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
    .optional(),
  responsavel: z.string()
    .min(3, 'Nome do responsável deve ter pelo menos 3 caracteres')
    .max(255, 'Nome do responsável deve ter no máximo 255 caracteres')
    .optional(),
});

export const updateSecretariaStatusSchema = z.object({
  status: z.nativeEnum(StatusSecretaria),
  motivoInativacao: z.string()
    .max(1000, 'Motivo deve ter no máximo 1000 caracteres')
    .optional(),
  dataFim: z.coerce.date('Data de fim inválida').optional(),
  secretariaSuccessora: z.string()
    .max(255, 'Secretaria sucessora deve ter no máximo 255 caracteres')
    .optional(),
});

// Schemas para Funcionário
export const createFuncionarioSchema = z.object({
  nome: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  cpf: z.string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve estar no formato 000.000.000-00'),
  email: z.string()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres')
    .optional(),
  telefone: z.string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (00) 00000-0000')
    .optional(),
  cargo: z.string()
    .min(3, 'Cargo deve ter pelo menos 3 caracteres')
    .max(255, 'Cargo deve ter no máximo 255 caracteres'),
  setor: z.string()
    .min(3, 'Setor deve ter pelo menos 3 caracteres')
    .max(255, 'Setor deve ter no máximo 255 caracteres'),
  secretariaId: z.string().uuid('ID da secretaria inválido'),
  matricula: z.string()
    .max(50, 'Matrícula deve ter no máximo 50 caracteres')
    .optional(),
  dataAdmissao: z.coerce.date('Data de admissão inválida'),
  observacoes: z.string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional(),
});

export const updateFuncionarioSchema = z.object({
  nome: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres')
    .optional(),
  email: z.string()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres')
    .optional(),
  telefone: z.string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (00) 00000-0000')
    .optional(),
  cargo: z.string()
    .min(3, 'Cargo deve ter pelo menos 3 caracteres')
    .max(255, 'Cargo deve ter no máximo 255 caracteres')
    .optional(),
  setor: z.string()
    .min(3, 'Setor deve ter pelo menos 3 caracteres')
    .max(255, 'Setor deve ter no máximo 255 caracteres')
    .optional(),
  matricula: z.string()
    .max(50, 'Matrícula deve ter no máximo 50 caracteres')
    .optional(),
  status: z.nativeEnum(StatusFuncionario).optional(),
  dataExoneracao: z.coerce.date('Data de exoneração inválida').optional(),
  observacoes: z.string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional(),
});

// Schemas para Patrimônio
export const createPatrimonioSchema = z.object({
  descricao: z.string()
    .min(3, 'Descrição deve ter pelo menos 3 caracteres')
    .max(500, 'Descrição deve ter no máximo 500 caracteres'),
  categoria: z.string()
    .min(3, 'Categoria deve ter pelo menos 3 caracteres')
    .max(100, 'Categoria deve ter no máximo 100 caracteres'),
  subcategoria: z.string()
    .max(100, 'Subcategoria deve ter no máximo 100 caracteres')
    .optional(),
  marca: z.string()
    .max(100, 'Marca deve ter no máximo 100 caracteres')
    .optional(),
  modelo: z.string()
    .max(100, 'Modelo deve ter no máximo 100 caracteres')
    .optional(),
  numeroSerie: z.string()
    .max(100, 'Número de série deve ter no máximo 100 caracteres')
    .optional(),
  valor: z.number()
    .positive('Valor deve ser positivo')
    .max(999999999.99, 'Valor muito alto'),
  dataAquisicao: z.coerce.date('Data de aquisição inválida'),
  vidaUtil: z.number()
    .int('Vida útil deve ser um número inteiro')
    .min(1, 'Vida útil deve ser pelo menos 1 ano')
    .max(50, 'Vida útil deve ser no máximo 50 anos')
    .optional(),
  secretariaId: z.string().uuid('ID da secretaria inválido'),
  localizacao: z.string()
    .min(3, 'Localização deve ter pelo menos 3 caracteres')
    .max(255, 'Localização deve ter no máximo 255 caracteres'),
  responsavelId: z.string().uuid('ID do responsável inválido'),
  situacao: z.nativeEnum(SituacaoPatrimonio).optional(),
  estadoConservacao: z.nativeEnum(EstadoConservacao).optional(),
  observacoes: z.string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional(),
});

export const updatePatrimonioSchema = z.object({
  descricao: z.string()
    .min(3, 'Descrição deve ter pelo menos 3 caracteres')
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
  categoria: z.string()
    .min(3, 'Categoria deve ter pelo menos 3 caracteres')
    .max(100, 'Categoria deve ter no máximo 100 caracteres')
    .optional(),
  subcategoria: z.string()
    .max(100, 'Subcategoria deve ter no máximo 100 caracteres')
    .optional(),
  marca: z.string()
    .max(100, 'Marca deve ter no máximo 100 caracteres')
    .optional(),
  modelo: z.string()
    .max(100, 'Modelo deve ter no máximo 100 caracteres')
    .optional(),
  numeroSerie: z.string()
    .max(100, 'Número de série deve ter no máximo 100 caracteres')
    .optional(),
  valor: z.number()
    .positive('Valor deve ser positivo')
    .max(999999999.99, 'Valor muito alto')
    .optional(),
  dataAquisicao: z.coerce.date('Data de aquisição inválida').optional(),
  vidaUtil: z.number()
    .int('Vida útil deve ser um número inteiro')
    .min(1, 'Vida útil deve ser pelo menos 1 ano')
    .max(50, 'Vida útil deve ser no máximo 50 anos')
    .optional(),
  localizacao: z.string()
    .min(3, 'Localização deve ter pelo menos 3 caracteres')
    .max(255, 'Localização deve ter no máximo 255 caracteres')
    .optional(),
  responsavelId: z.string().uuid('ID do responsável inválido').optional(),
  status: z.nativeEnum(StatusPatrimonio).optional(),
  situacao: z.nativeEnum(SituacaoPatrimonio).optional(),
  estadoConservacao: z.nativeEnum(EstadoConservacao).optional(),
  observacoes: z.string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional(),
});

// Schemas para Documento
export const createDocumentoSchema = z.object({
  patrimonioId: z.string().uuid('ID do patrimônio inválido'),
  nome: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  tipo: z.nativeEnum(TipoDocumento),
  url: z.string()
    .url('URL inválida')
    .max(500, 'URL deve ter no máximo 500 caracteres'),
  dataVencimento: z.coerce.date('Data de vencimento inválida').optional(),
});

// Schemas para Manutenção
export const createManutencaoSchema = z.object({
  patrimonioId: z.string().uuid('ID do patrimônio inválido'),
  data: z.coerce.date('Data inválida'),
  tipo: z.nativeEnum(TipoManutencao),
  descricao: z.string()
    .min(10, 'Descrição deve ter pelo menos 10 caracteres')
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres'),
  valor: z.number()
    .positive('Valor deve ser positivo')
    .max(999999999.99, 'Valor muito alto')
    .optional(),
  responsavel: z.string()
    .min(3, 'Nome do responsável deve ter pelo menos 3 caracteres')
    .max(255, 'Nome do responsável deve ter no máximo 255 caracteres'),
});

// Schemas para Transferência
export const createTransferenciaSchema = z.object({
  patrimonioId: z.string().uuid('ID do patrimônio inválido'),
  secretariaDestinoId: z.string().uuid('ID da secretaria de destino inválido'),
  motivoTransferencia: z.string()
    .min(10, 'Motivo deve ter pelo menos 10 caracteres')
    .max(1000, 'Motivo deve ter no máximo 1000 caracteres'),
  justificativaSecretariaInativa: z.string()
    .max(1000, 'Justificativa deve ter no máximo 1000 caracteres')
    .optional(),
});

export const updateTransferenciaStatusSchema = z.object({
  status: z.nativeEnum(StatusTransferencia),
  dataTransferencia: z.coerce.date('Data de transferência inválida').optional(),
});

// Schemas para Autenticação
export const loginSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres'),
  senha: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(255, 'Senha deve ter no máximo 255 caracteres'),
});

export const createUsuarioSchema = z.object({
  nome: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  email: z.string()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres'),
  senha: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(255, 'Senha deve ter no máximo 255 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'),
  role: z.nativeEnum(RoleUsuario),
  funcionarioId: z.string().uuid('ID do funcionário inválido').optional(),
});

// Schemas para Parâmetros
export const uuidParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const patrimonioIdParamSchema = z.object({
  id: z.string().uuid('ID do patrimônio inválido'),
});

export const secretariaIdParamSchema = z.object({
  id: z.string().uuid('ID da secretaria inválido'),
});

export const funcionarioIdParamSchema = z.object({
  id: z.string().uuid('ID do funcionário inválido'),
});

// Schemas para Query Parameters
export const paginationQuerySchema = z.object({
  page: z.coerce.number()
    .int('Página deve ser um número inteiro')
    .min(1, 'Página deve ser pelo menos 1')
    .default(1),
  limit: z.coerce.number()
    .int('Limite deve ser um número inteiro')
    .min(1, 'Limite deve ser pelo menos 1')
    .max(100, 'Limite deve ser no máximo 100')
    .default(10),
});

export const searchQuerySchema = z.object({
  search: z.string()
    .max(255, 'Termo de busca deve ter no máximo 255 caracteres')
    .optional(),
});

export const patrimonioFiltersQuerySchema = paginationQuerySchema.extend({
  search: z.string().max(255).optional(),
  categoria: z.string().max(100).optional(),
  status: z.nativeEnum(StatusPatrimonio).optional(),
  situacao: z.nativeEnum(SituacaoPatrimonio).optional(),
  estadoConservacao: z.nativeEnum(EstadoConservacao).optional(),
  secretariaId: z.string().uuid().optional(),
  responsavelId: z.string().uuid().optional(),
  dataAquisicaoInicio: z.coerce.date().optional(),
  dataAquisicaoFim: z.coerce.date().optional(),
  valorMinimo: z.coerce.number().positive().optional(),
  valorMaximo: z.coerce.number().positive().optional(),
});

export const funcionarioFiltersQuerySchema = paginationQuerySchema.extend({
  search: z.string().max(255).optional(),
  status: z.nativeEnum(StatusFuncionario).optional(),
  secretariaId: z.string().uuid().optional(),
  cargo: z.string().max(255).optional(),
});

export const secretariaFiltersQuerySchema = paginationQuerySchema.extend({
  search: z.string().max(255).optional(),
  status: z.nativeEnum(StatusSecretaria).optional(),
});

// Schema para upload de arquivos
export const uploadFileSchema = z.object({
  patrimonioId: z.string().uuid('ID do patrimônio inválido'),
  tipo: z.enum(['foto', 'documento']),
  descricao: z.string()
    .max(255, 'Descrição deve ter no máximo 255 caracteres')
    .optional(),
});
