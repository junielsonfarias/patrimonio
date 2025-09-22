// Controller de documentos
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger, auditLog } from '../utils/logger';
import { ApiResponse, DocumentoResponse } from '../types';
import { createNotFoundError } from '../middleware/error-handler';

const prisma = new PrismaClient();

export class DocumentoController {
  // Obter documento por ID
  async obterPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const documento = await prisma.documento.findUnique({
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

      if (!documento) {
        const response: ApiResponse = {
          success: false,
          error: 'Documento não encontrado',
        };
        res.status(404).json(response);
        return;
      }

      const documentoResponse: DocumentoResponse = {
        id: documento.id,
        patrimonioId: documento.patrimonioId,
        nome: documento.nome,
        tipo: documento.tipo,
        url: documento.url,
        dataVencimento: documento.dataVencimento,
        createdAt: documento.createdAt,
      };

      const response: ApiResponse<DocumentoResponse> = {
        success: true,
        data: documentoResponse,
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao obter documento:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Criar novo documento
  async criar(req: Request, res: Response): Promise<void> {
    try {
      const documentoData = req.body;
      const usuarioId = req.usuario!.id;

      // Verificar se patrimônio existe
      const patrimonio = await prisma.patrimonio.findUnique({
        where: { id: documentoData.patrimonioId },
      });

      if (!patrimonio) {
        const response: ApiResponse = {
          success: false,
          error: 'Patrimônio não encontrado',
        };
        res.status(404).json(response);
        return;
      }

      // Criar documento
      const documento = await prisma.documento.create({
        data: documentoData,
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
        entidade: 'Documento',
        entidadeId: documento.id,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        detalhes: { nome: documento.nome, tipo: documento.tipo, patrimonioId: documento.patrimonioId },
      });

      const documentoResponse: DocumentoResponse = {
        id: documento.id,
        patrimonioId: documento.patrimonioId,
        nome: documento.nome,
        tipo: documento.tipo,
        url: documento.url,
        dataVencimento: documento.dataVencimento,
        createdAt: documento.createdAt,
      };

      const response: ApiResponse<DocumentoResponse> = {
        success: true,
        data: documentoResponse,
        message: 'Documento criado com sucesso',
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Erro ao criar documento:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Excluir documento
  async excluir(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = req.usuario!.id;

      // Verificar se documento existe
      const documento = await prisma.documento.findUnique({
        where: { id },
      });

      if (!documento) {
        const response: ApiResponse = {
          success: false,
          error: 'Documento não encontrado',
        };
        res.status(404).json(response);
        return;
      }

      // Excluir documento
      await prisma.documento.delete({
        where: { id },
      });

      // Log de auditoria
      auditLog({
        usuarioId,
        acao: 'DELETE',
        entidade: 'Documento',
        entidadeId: documento.id,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        detalhes: { nome: documento.nome, tipo: documento.tipo, patrimonioId: documento.patrimonioId },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Documento excluído com sucesso',
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao excluir documento:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }
}
