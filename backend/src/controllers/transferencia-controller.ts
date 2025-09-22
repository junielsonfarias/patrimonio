// Controller de transferências
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger, auditLog } from '../utils/logger';
import { ApiResponse, TransferenciaResponse } from '../types';
import { createNotFoundError } from '../middleware/error-handler';

const prisma = new PrismaClient();

export class TransferenciaController {
  // Obter transferência por ID
  async obterPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const transferencia = await prisma.transferencia.findUnique({
        where: { id },
        include: {
          patrimonio: {
            select: {
              id: true,
              numero: true,
              descricao: true,
            },
          },
          secretariaOrigem: true,
          secretariaDestino: true,
          responsavelTransferencia: true,
        },
      });

      if (!transferencia) {
        const response: ApiResponse = {
          success: false,
          error: 'Transferência não encontrada',
        };
        res.status(404).json(response);
        return;
      }

      const transferenciaResponse: TransferenciaResponse = {
        id: transferencia.id,
        patrimonioId: transferencia.patrimonioId,
        secretariaOrigemId: transferencia.secretariaOrigemId,
        secretariaDestinoId: transferencia.secretariaDestinoId,
        responsavelTransferenciaId: transferencia.responsavelTransferenciaId,
        supervisorAprovacaoId: transferencia.supervisorAprovacaoId,
        motivoTransferencia: transferencia.motivoTransferencia,
        justificativaSecretariaInativa: transferencia.justificativaSecretariaInativa,
        dataTransferencia: transferencia.dataTransferencia,
        status: transferencia.status,
        createdAt: transferencia.createdAt,
        patrimonio: transferencia.patrimonio,
        secretariaOrigem: transferencia.secretariaOrigem,
        secretariaDestino: transferencia.secretariaDestino,
        responsavelTransferencia: transferencia.responsavelTransferencia,
      };

      const response: ApiResponse<TransferenciaResponse> = {
        success: true,
        data: transferenciaResponse,
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao obter transferência:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Criar nova transferência
  async criar(req: Request, res: Response): Promise<void> {
    try {
      const transferenciaData = req.body;
      const usuarioId = req.usuario!.id;

      // Verificar se patrimônio existe
      const patrimonio = await prisma.patrimonio.findUnique({
        where: { id: transferenciaData.patrimonioId },
        include: { secretaria: true },
      });

      if (!patrimonio) {
        const response: ApiResponse = {
          success: false,
          error: 'Patrimônio não encontrado',
        };
        res.status(404).json(response);
        return;
      }

      // Verificar se secretaria de destino existe
      const secretariaDestino = await prisma.secretaria.findUnique({
        where: { id: transferenciaData.secretariaDestinoId },
      });

      if (!secretariaDestino) {
        const response: ApiResponse = {
          success: false,
          error: 'Secretaria de destino não encontrada',
        };
        res.status(404).json(response);
        return;
      }

      // Criar transferência
      const transferencia = await prisma.transferencia.create({
        data: {
          ...transferenciaData,
          secretariaOrigemId: patrimonio.secretariaId,
          responsavelTransferenciaId: usuarioId,
        },
        include: {
          patrimonio: {
            select: {
              id: true,
              numero: true,
              descricao: true,
            },
          },
          secretariaOrigem: true,
          secretariaDestino: true,
          responsavelTransferencia: true,
        },
      });

      // Log de auditoria
      auditLog({
        usuarioId,
        acao: 'CREATE',
        entidade: 'Transferencia',
        entidadeId: transferencia.id,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        detalhes: { 
          patrimonioId: transferencia.patrimonioId,
          secretariaOrigem: transferencia.secretariaOrigemId,
          secretariaDestino: transferencia.secretariaDestinoId,
        },
      });

      const transferenciaResponse: TransferenciaResponse = {
        id: transferencia.id,
        patrimonioId: transferencia.patrimonioId,
        secretariaOrigemId: transferencia.secretariaOrigemId,
        secretariaDestinoId: transferencia.secretariaDestinoId,
        responsavelTransferenciaId: transferencia.responsavelTransferenciaId,
        supervisorAprovacaoId: transferencia.supervisorAprovacaoId,
        motivoTransferencia: transferencia.motivoTransferencia,
        justificativaSecretariaInativa: transferencia.justificativaSecretariaInativa,
        dataTransferencia: transferencia.dataTransferencia,
        status: transferencia.status,
        createdAt: transferencia.createdAt,
        patrimonio: transferencia.patrimonio,
        secretariaOrigem: transferencia.secretariaOrigem,
        secretariaDestino: transferencia.secretariaDestino,
        responsavelTransferencia: transferencia.responsavelTransferencia,
      };

      const response: ApiResponse<TransferenciaResponse> = {
        success: true,
        data: transferenciaResponse,
        message: 'Transferência criada com sucesso',
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Erro ao criar transferência:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Atualizar status da transferência
  async atualizarStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, dataTransferencia } = req.body;
      const usuarioId = req.usuario!.id;

      // Verificar se transferência existe
      const transferenciaExistente = await prisma.transferencia.findUnique({
        where: { id },
      });

      if (!transferenciaExistente) {
        const response: ApiResponse = {
          success: false,
          error: 'Transferência não encontrada',
        };
        res.status(404).json(response);
        return;
      }

      // Preparar dados de atualização
      const updateData: any = { 
        status,
        supervisorAprovacaoId: usuarioId,
      };

      if (status === 'APROVADA') {
        updateData.dataTransferencia = dataTransferencia || new Date();
      }

      // Atualizar transferência
      const transferencia = await prisma.transferencia.update({
        where: { id },
        data: updateData,
        include: {
          patrimonio: {
            select: {
              id: true,
              numero: true,
              descricao: true,
            },
          },
          secretariaOrigem: true,
          secretariaDestino: true,
          responsavelTransferencia: true,
        },
      });

      // Se aprovada, atualizar patrimônio
      if (status === 'APROVADA') {
        await prisma.patrimonio.update({
          where: { id: transferencia.patrimonioId },
          data: {
            secretariaId: transferencia.secretariaDestinoId,
            codigoSecretaria: transferencia.secretariaDestino.codigo,
          },
        });
      }

      // Log de auditoria
      auditLog({
        usuarioId,
        acao: 'UPDATE_STATUS',
        entidade: 'Transferencia',
        entidadeId: transferencia.id,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        detalhes: { 
          statusAnterior: transferenciaExistente.status,
          statusNovo: status,
          patrimonioId: transferencia.patrimonioId,
        },
      });

      const transferenciaResponse: TransferenciaResponse = {
        id: transferencia.id,
        patrimonioId: transferencia.patrimonioId,
        secretariaOrigemId: transferencia.secretariaOrigemId,
        secretariaDestinoId: transferencia.secretariaDestinoId,
        responsavelTransferenciaId: transferencia.responsavelTransferenciaId,
        supervisorAprovacaoId: transferencia.supervisorAprovacaoId,
        motivoTransferencia: transferencia.motivoTransferencia,
        justificativaSecretariaInativa: transferencia.justificativaSecretariaInativa,
        dataTransferencia: transferencia.dataTransferencia,
        status: transferencia.status,
        createdAt: transferencia.createdAt,
        patrimonio: transferencia.patrimonio,
        secretariaOrigem: transferencia.secretariaOrigem,
        secretariaDestino: transferencia.secretariaDestino,
        responsavelTransferencia: transferencia.responsavelTransferencia,
      };

      const response: ApiResponse<TransferenciaResponse> = {
        success: true,
        data: transferenciaResponse,
        message: 'Status da transferência atualizado com sucesso',
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao atualizar status da transferência:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }
}
