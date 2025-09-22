// Controller de funcionários
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger, auditLog } from '../utils/logger';
import { ApiResponse, PaginatedResponse, FuncionarioResponse } from '../types';
import { createNotFoundError, createConflictError } from '../middleware/error-handler';

const prisma = new PrismaClient();

export class FuncionarioController {
  // Listar funcionários com filtros e paginação
  async listar(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        secretariaId,
        cargo,
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      // Construir filtros
      const where: any = {};

      // Filtro de busca por texto
      if (search) {
        where.OR = [
          { nome: { contains: search as string, mode: 'insensitive' } },
          { cpf: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { cargo: { contains: search as string, mode: 'insensitive' } },
          { setor: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      // Filtros específicos
      if (status) where.status = status;
      if (secretariaId) where.secretariaId = secretariaId;
      if (cargo) where.cargo = { contains: cargo as string, mode: 'insensitive' };

      // Buscar funcionários
      const [funcionarios, total] = await Promise.all([
        prisma.funcionario.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { nome: 'asc' },
          include: {
            secretaria: {
              select: {
                id: true,
                nome: true,
                codigo: true,
              },
            },
            _count: {
              select: {
                patrimonios: true,
              },
            },
          },
        }),
        prisma.funcionario.count({ where }),
      ]);

      // Mapear resposta
      const funcionariosResponse: FuncionarioResponse[] = funcionarios.map(funcionario => ({
        id: funcionario.id,
        nome: funcionario.nome,
        cpf: funcionario.cpf,
        email: funcionario.email,
        telefone: funcionario.telefone,
        cargo: funcionario.cargo,
        setor: funcionario.setor,
        secretariaId: funcionario.secretariaId,
        matricula: funcionario.matricula,
        status: funcionario.status,
        dataAdmissao: funcionario.dataAdmissao,
        dataExoneracao: funcionario.dataExoneracao,
        observacoes: funcionario.observacoes,
        createdAt: funcionario.createdAt,
        updatedAt: funcionario.updatedAt,
        secretaria: funcionario.secretaria,
        _count: funcionario._count,
      }));

      const response: PaginatedResponse<FuncionarioResponse> = {
        success: true,
        data: funcionariosResponse,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao listar funcionários:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Obter funcionário por ID
  async obterPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const funcionario = await prisma.funcionario.findUnique({
        where: { id },
        include: {
          secretaria: true,
          _count: {
            select: {
              patrimonios: true,
            },
          },
        },
      });

      if (!funcionario) {
        const response: ApiResponse = {
          success: false,
          error: 'Funcionário não encontrado',
        };
        res.status(404).json(response);
        return;
      }

      const funcionarioResponse: FuncionarioResponse = {
        id: funcionario.id,
        nome: funcionario.nome,
        cpf: funcionario.cpf,
        email: funcionario.email,
        telefone: funcionario.telefone,
        cargo: funcionario.cargo,
        setor: funcionario.setor,
        secretariaId: funcionario.secretariaId,
        matricula: funcionario.matricula,
        status: funcionario.status,
        dataAdmissao: funcionario.dataAdmissao,
        dataExoneracao: funcionario.dataExoneracao,
        observacoes: funcionario.observacoes,
        createdAt: funcionario.createdAt,
        updatedAt: funcionario.updatedAt,
        secretaria: funcionario.secretaria,
        _count: funcionario._count,
      };

      const response: ApiResponse<FuncionarioResponse> = {
        success: true,
        data: funcionarioResponse,
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao obter funcionário:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Criar novo funcionário
  async criar(req: Request, res: Response): Promise<void> {
    try {
      const funcionarioData = req.body;
      const usuarioId = req.usuario!.id;

      // Verificar se CPF já existe
      const cpfExistente = await prisma.funcionario.findUnique({
        where: { cpf: funcionarioData.cpf },
      });

      if (cpfExistente) {
        const response: ApiResponse = {
          success: false,
          error: 'CPF já cadastrado',
        };
        res.status(409).json(response);
        return;
      }

      // Verificar se secretaria existe
      const secretaria = await prisma.secretaria.findUnique({
        where: { id: funcionarioData.secretariaId },
      });

      if (!secretaria) {
        const response: ApiResponse = {
          success: false,
          error: 'Secretaria não encontrada',
        };
        res.status(404).json(response);
        return;
      }

      // Criar funcionário
      const funcionario = await prisma.funcionario.create({
        data: funcionarioData,
        include: {
          secretaria: true,
        },
      });

      // Log de auditoria
      auditLog({
        usuarioId,
        acao: 'CREATE',
        entidade: 'Funcionario',
        entidadeId: funcionario.id,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        detalhes: { nome: funcionario.nome, cpf: funcionario.cpf },
      });

      const funcionarioResponse: FuncionarioResponse = {
        id: funcionario.id,
        nome: funcionario.nome,
        cpf: funcionario.cpf,
        email: funcionario.email,
        telefone: funcionario.telefone,
        cargo: funcionario.cargo,
        setor: funcionario.setor,
        secretariaId: funcionario.secretariaId,
        matricula: funcionario.matricula,
        status: funcionario.status,
        dataAdmissao: funcionario.dataAdmissao,
        dataExoneracao: funcionario.dataExoneracao,
        observacoes: funcionario.observacoes,
        createdAt: funcionario.createdAt,
        updatedAt: funcionario.updatedAt,
        secretaria: funcionario.secretaria,
      };

      const response: ApiResponse<FuncionarioResponse> = {
        success: true,
        data: funcionarioResponse,
        message: 'Funcionário criado com sucesso',
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Erro ao criar funcionário:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Atualizar funcionário
  async atualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const funcionarioData = req.body;
      const usuarioId = req.usuario!.id;

      // Verificar se funcionário existe
      const funcionarioExistente = await prisma.funcionario.findUnique({
        where: { id },
      });

      if (!funcionarioExistente) {
        const response: ApiResponse = {
          success: false,
          error: 'Funcionário não encontrado',
        };
        res.status(404).json(response);
        return;
      }

      // Atualizar funcionário
      const funcionario = await prisma.funcionario.update({
        where: { id },
        data: funcionarioData,
        include: {
          secretaria: true,
        },
      });

      // Log de auditoria
      auditLog({
        usuarioId,
        acao: 'UPDATE',
        entidade: 'Funcionario',
        entidadeId: funcionario.id,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        detalhes: { nome: funcionario.nome, cpf: funcionario.cpf, alteracoes: funcionarioData },
      });

      const funcionarioResponse: FuncionarioResponse = {
        id: funcionario.id,
        nome: funcionario.nome,
        cpf: funcionario.cpf,
        email: funcionario.email,
        telefone: funcionario.telefone,
        cargo: funcionario.cargo,
        setor: funcionario.setor,
        secretariaId: funcionario.secretariaId,
        matricula: funcionario.matricula,
        status: funcionario.status,
        dataAdmissao: funcionario.dataAdmissao,
        dataExoneracao: funcionario.dataExoneracao,
        observacoes: funcionario.observacoes,
        createdAt: funcionario.createdAt,
        updatedAt: funcionario.updatedAt,
        secretaria: funcionario.secretaria,
      };

      const response: ApiResponse<FuncionarioResponse> = {
        success: true,
        data: funcionarioResponse,
        message: 'Funcionário atualizado com sucesso',
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao atualizar funcionário:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Obter patrimônios do funcionário
  async obterPatrimonios(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      // Verificar se funcionário existe
      const funcionario = await prisma.funcionario.findUnique({
        where: { id },
      });

      if (!funcionario) {
        const response: ApiResponse = {
          success: false,
          error: 'Funcionário não encontrado',
        };
        res.status(404).json(response);
        return;
      }

      // Buscar patrimônios
      const [patrimonios, total] = await Promise.all([
        prisma.patrimonio.findMany({
          where: { responsavelId: id },
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            secretaria: {
              select: {
                id: true,
                nome: true,
                codigo: true,
              },
            },
          },
        }),
        prisma.patrimonio.count({ where: { responsavelId: id } }),
      ]);

      const response: PaginatedResponse<any> = {
        success: true,
        data: patrimonios,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao obter patrimônios do funcionário:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }
}
