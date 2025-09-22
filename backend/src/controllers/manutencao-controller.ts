// Controller de manutenções
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger, auditLog } from '../utils/logger';
import { ApiResponse, ManutencaoResponse } from '../types';
import { createNotFoundError } from '../middleware/error-handler';

const prisma = new PrismaClient();

export class ManutencaoController {
  // Obter manutenção por ID
  async obterPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const manutencao = await prisma.manutencao.findUnique({
        where: { id },
        include: {
          patrimonio: {
            select: {
              id: true,
              numero: true,
              descricao: true,
            },
          },
        },
      });

      if (!manutencao) {
        const response: ApiResponse = {
          success: false,
          error: 'Manutenção não encontrada',
        };
        res.status(404).json(response);
        return;
      }

      const manutencaoResponse: ManutencaoResponse = {
        id: manutencao.id,
        patrimonioId: manutencao.patrimonioId,
        data: manutencao.data,
        tipo: manutencao.tipo,
        descricao: manutencao.descricao,
        valor: manutencao.valor ? Number(manutencao.valor) : undefined,
        responsavel: manutencao.responsavel,
        createdAt: manutencao.createdAt,
        patrimonio: manutencao.patrimonio,
      };

      const response: ApiResponse<ManutencaoResponse> = {
        success: true,
        data: manutencaoResponse,
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao obter manutenção:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Criar nova manutenção
  async criar(req: Request, res: Response): Promise<void> {
    try {
      const manutencaoData = req.body;
      const usuarioId = req.usuario!.id;

      // Verificar se patrimônio existe
      const patrimonio = await prisma.patrimonio.findUnique({
        where: { id: manutencaoData.patrimonioId },
      });

      if (!patrimonio) {
        const response: ApiResponse = {
          success: false,
          error: 'Patrimônio não encontrado',
        };
        res.status(404).json(response);
        return;
      }

      // Criar manutenção
      const manutencao = await prisma.manutencao.create({
        data: manutencaoData,
        include: {
          patrimonio: {
            select: {
              id: true,
              numero: true,
              descricao: true,
            },
          },
        },
      });

      // Log de auditoria
      auditLog({
        usuarioId,
        acao: 'CREATE',
        entidade: 'Manutencao',
        entidadeId: manutencao.id,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        detalhes: { 
          tipo: manutencao.tipo, 
          data: manutencao.data, 
          patrimonioId: manutencao.patrimonioId 
        },
      });

      const manutencaoResponse: ManutencaoResponse = {
        id: manutencao.id,
        patrimonioId: manutencao.patrimonioId,
        data: manutencao.data,
        tipo: manutencao.tipo,
        descricao: manutencao.descricao,
        valor: manutencao.valor ? Number(manutencao.valor) : undefined,
        responsavel: manutencao.responsavel,
        createdAt: manutencao.createdAt,
        patrimonio: manutencao.patrimonio,
      };

      const response: ApiResponse<ManutencaoResponse> = {
        success: true,
        data: manutencaoResponse,
        message: 'Manutenção criada com sucesso',
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Erro ao criar manutenção:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }
}
