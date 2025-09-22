// Controller de secretarias
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger, auditLog } from '../utils/logger';
import { ApiResponse, PaginatedResponse, SecretariaResponse } from '../types';
import { createNotFoundError, createConflictError } from '../middleware/error-handler';

const prisma = new PrismaClient();

export class SecretariaController {
  // Listar secretarias com filtros e paginação
  async listar(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      // Construir filtros
      const where: any = {};

      // Filtro de busca por texto
      if (search) {
        where.OR = [
          { nome: { contains: search as string, mode: 'insensitive' } },
          { codigo: { contains: search as string, mode: 'insensitive' } },
          { descricao: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      // Filtro de status
      if (status) {
        where.status = status;
      }

      // Buscar secretarias
      const [secretarias, total] = await Promise.all([
        prisma.secretaria.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { nome: 'asc' },
          include: {
            _count: {
              select: {
                funcionarios: true,
                patrimonios: true,
              },
            },
          },
        }),
        prisma.secretaria.count({ where }),
      ]);

      // Mapear resposta
      const secretariasResponse: SecretariaResponse[] = secretarias.map(secretaria => ({
        id: secretaria.id,
        codigo: secretaria.codigo,
        nome: secretaria.nome,
        descricao: secretaria.descricao,
        status: secretaria.status,
        dataInicio: secretaria.dataInicio,
        dataFim: secretaria.dataFim,
        motivoInativacao: secretaria.motivoInativacao,
        secretariaSuccessora: secretaria.secretariaSuccessora,
        responsavel: secretaria.responsavel,
        createdAt: secretaria.createdAt,
        updatedAt: secretaria.updatedAt,
        _count: secretaria._count,
      }));

      const response: PaginatedResponse<SecretariaResponse> = {
        success: true,
        data: secretariasResponse,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao listar secretarias:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Obter secretaria por ID
  async obterPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const secretaria = await prisma.secretaria.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              funcionarios: true,
              patrimonios: true,
            },
          },
        },
      });

      if (!secretaria) {
        const response: ApiResponse = {
          success: false,
          error: 'Secretaria não encontrada',
        };
        res.status(404).json(response);
        return;
      }

      const secretariaResponse: SecretariaResponse = {
        id: secretaria.id,
        codigo: secretaria.codigo,
        nome: secretaria.nome,
        descricao: secretaria.descricao,
        status: secretaria.status,
        dataInicio: secretaria.dataInicio,
        dataFim: secretaria.dataFim,
        motivoInativacao: secretaria.motivoInativacao,
        secretariaSuccessora: secretaria.secretariaSuccessora,
        responsavel: secretaria.responsavel,
        createdAt: secretaria.createdAt,
        updatedAt: secretaria.updatedAt,
        _count: secretaria._count,
      };

      const response: ApiResponse<SecretariaResponse> = {
        success: true,
        data: secretariaResponse,
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao obter secretaria:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Criar nova secretaria
  async criar(req: Request, res: Response): Promise<void> {
    try {
      const secretariaData = req.body;
      const usuarioId = req.usuario!.id;

      // Verificar se código já existe
      const codigoExistente = await prisma.secretaria.findUnique({
        where: { codigo: secretariaData.codigo },
      });

      if (codigoExistente) {
        const response: ApiResponse = {
          success: false,
          error: 'Código da secretaria já existe',
        };
        res.status(409).json(response);
        return;
      }

      // Criar secretaria
      const secretaria = await prisma.secretaria.create({
        data: secretariaData,
      });

      // Log de auditoria
      auditLog({
        usuarioId,
        acao: 'CREATE',
        entidade: 'Secretaria',
        entidadeId: secretaria.id,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        detalhes: { codigo: secretaria.codigo, nome: secretaria.nome },
      });

      const secretariaResponse: SecretariaResponse = {
        id: secretaria.id,
        codigo: secretaria.codigo,
        nome: secretaria.nome,
        descricao: secretaria.descricao,
        status: secretaria.status,
        dataInicio: secretaria.dataInicio,
        dataFim: secretaria.dataFim,
        motivoInativacao: secretaria.motivoInativacao,
        secretariaSuccessora: secretaria.secretariaSuccessora,
        responsavel: secretaria.responsavel,
        createdAt: secretaria.createdAt,
        updatedAt: secretaria.updatedAt,
      };

      const response: ApiResponse<SecretariaResponse> = {
        success: true,
        data: secretariaResponse,
        message: 'Secretaria criada com sucesso',
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Erro ao criar secretaria:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Atualizar secretaria
  async atualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const secretariaData = req.body;
      const usuarioId = req.usuario!.id;

      // Verificar se secretaria existe
      const secretariaExistente = await prisma.secretaria.findUnique({
        where: { id },
      });

      if (!secretariaExistente) {
        const response: ApiResponse = {
          success: false,
          error: 'Secretaria não encontrada',
        };
        res.status(404).json(response);
        return;
      }

      // Atualizar secretaria
      const secretaria = await prisma.secretaria.update({
        where: { id },
        data: secretariaData,
      });

      // Log de auditoria
      auditLog({
        usuarioId,
        acao: 'UPDATE',
        entidade: 'Secretaria',
        entidadeId: secretaria.id,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        detalhes: { codigo: secretaria.codigo, nome: secretaria.nome, alteracoes: secretariaData },
      });

      const secretariaResponse: SecretariaResponse = {
        id: secretaria.id,
        codigo: secretaria.codigo,
        nome: secretaria.nome,
        descricao: secretaria.descricao,
        status: secretaria.status,
        dataInicio: secretaria.dataInicio,
        dataFim: secretaria.dataFim,
        motivoInativacao: secretaria.motivoInativacao,
        secretariaSuccessora: secretaria.secretariaSuccessora,
        responsavel: secretaria.responsavel,
        createdAt: secretaria.createdAt,
        updatedAt: secretaria.updatedAt,
      };

      const response: ApiResponse<SecretariaResponse> = {
        success: true,
        data: secretariaResponse,
        message: 'Secretaria atualizada com sucesso',
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao atualizar secretaria:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Atualizar status da secretaria
  async atualizarStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, motivoInativacao, dataFim, secretariaSuccessora } = req.body;
      const usuarioId = req.usuario!.id;

      // Verificar se secretaria existe
      const secretariaExistente = await prisma.secretaria.findUnique({
        where: { id },
      });

      if (!secretariaExistente) {
        const response: ApiResponse = {
          success: false,
          error: 'Secretaria não encontrada',
        };
        res.status(404).json(response);
        return;
      }

      // Preparar dados de atualização
      const updateData: any = { status };

      if (status === 'INATIVA' || status === 'EXTINTA') {
        updateData.dataFim = dataFim || new Date();
        updateData.motivoInativacao = motivoInativacao;
        updateData.secretariaSuccessora = secretariaSuccessora;
      } else if (status === 'ATIVA') {
        updateData.dataFim = null;
        updateData.motivoInativacao = null;
        updateData.secretariaSuccessora = null;
      }

      // Atualizar secretaria
      const secretaria = await prisma.secretaria.update({
        where: { id },
        data: updateData,
      });

      // Log de auditoria
      auditLog({
        usuarioId,
        acao: 'UPDATE_STATUS',
        entidade: 'Secretaria',
        entidadeId: secretaria.id,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        detalhes: { 
          codigo: secretaria.codigo, 
          nome: secretaria.nome, 
          statusAnterior: secretariaExistente.status,
          statusNovo: status,
          motivoInativacao,
        },
      });

      const secretariaResponse: SecretariaResponse = {
        id: secretaria.id,
        codigo: secretaria.codigo,
        nome: secretaria.nome,
        descricao: secretaria.descricao,
        status: secretaria.status,
        dataInicio: secretaria.dataInicio,
        dataFim: secretaria.dataFim,
        motivoInativacao: secretaria.motivoInativacao,
        secretariaSuccessora: secretaria.secretariaSuccessora,
        responsavel: secretaria.responsavel,
        createdAt: secretaria.createdAt,
        updatedAt: secretaria.updatedAt,
      };

      const response: ApiResponse<SecretariaResponse> = {
        success: true,
        data: secretariaResponse,
        message: 'Status da secretaria atualizado com sucesso',
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao atualizar status da secretaria:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Obter patrimônios da secretaria
  async obterPatrimonios(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      // Verificar se secretaria existe
      const secretaria = await prisma.secretaria.findUnique({
        where: { id },
      });

      if (!secretaria) {
        const response: ApiResponse = {
          success: false,
          error: 'Secretaria não encontrada',
        };
        res.status(404).json(response);
        return;
      }

      // Buscar patrimônios
      const [patrimonios, total] = await Promise.all([
        prisma.patrimonio.findMany({
          where: { secretariaId: id },
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            responsavel: {
              select: {
                id: true,
                nome: true,
                cargo: true,
              },
            },
          },
        }),
        prisma.patrimonio.count({ where: { secretariaId: id } }),
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
      logger.error('Erro ao obter patrimônios da secretaria:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Obter funcionários da secretaria
  async obterFuncionarios(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      // Verificar se secretaria existe
      const secretaria = await prisma.secretaria.findUnique({
        where: { id },
      });

      if (!secretaria) {
        const response: ApiResponse = {
          success: false,
          error: 'Secretaria não encontrada',
        };
        res.status(404).json(response);
        return;
      }

      // Buscar funcionários
      const [funcionarios, total] = await Promise.all([
        prisma.funcionario.findMany({
          where: { secretariaId: id },
          skip,
          take: Number(limit),
          orderBy: { nome: 'asc' },
        }),
        prisma.funcionario.count({ where: { secretariaId: id } }),
      ]);

      const response: PaginatedResponse<any> = {
        success: true,
        data: funcionarios,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao obter funcionários da secretaria:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }
}
