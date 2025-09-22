// Controller público
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

const prisma = new PrismaClient();

export class PublicController {
  // Buscar patrimônio público por número
  async buscarPatrimonio(req: Request, res: Response): Promise<void> {
    try {
      const { numero } = req.params;

      const patrimonio = await prisma.patrimonio.findUnique({
        where: { numero },
        include: {
          secretaria: {
            select: {
              id: true,
              nome: true,
              codigo: true,
            },
          },
          responsavel: {
            select: {
              id: true,
              nome: true,
              cargo: true,
            },
          },
        },
      });

      if (!patrimonio) {
        const response: ApiResponse = {
          success: false,
          error: 'Patrimônio não encontrado',
        };
        res.status(404).json(response);
        return;
      }

      // Retornar apenas informações públicas
      const patrimonioPublico = {
        numero: patrimonio.numero,
        descricao: patrimonio.descricao,
        categoria: patrimonio.categoria,
        marca: patrimonio.marca,
        modelo: patrimonio.modelo,
        dataAquisicao: patrimonio.dataAquisicao,
        secretaria: patrimonio.secretaria,
        responsavel: patrimonio.responsavel,
        qrCode: patrimonio.qrCode,
      };

      const response: ApiResponse = {
        success: true,
        data: patrimonioPublico,
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao buscar patrimônio público:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Busca pública de patrimônios
  async buscarPatrimonios(req: Request, res: Response): Promise<void> {
    try {
      const { search, categoria, secretaria } = req.query;
      const { page = 1, limit = 10 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      // Construir filtros
      const where: any = {};

      // Filtro de busca por texto
      if (search) {
        where.OR = [
          { descricao: { contains: search as string, mode: 'insensitive' } },
          { numero: { contains: search as string, mode: 'insensitive' } },
          { marca: { contains: search as string, mode: 'insensitive' } },
          { modelo: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      // Filtros específicos
      if (categoria) where.categoria = categoria;
      if (secretaria) {
        where.secretaria = {
          nome: { contains: secretaria as string, mode: 'insensitive' },
        };
      }

      // Buscar patrimônios
      const [patrimonios, total] = await Promise.all([
        prisma.patrimonio.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          select: {
            numero: true,
            descricao: true,
            categoria: true,
            marca: true,
            modelo: true,
            dataAquisicao: true,
            secretaria: {
              select: {
                nome: true,
                codigo: true,
              },
            },
            responsavel: {
              select: {
                nome: true,
                cargo: true,
              },
            },
          },
        }),
        prisma.patrimonio.count({ where }),
      ]);

      const response: ApiResponse = {
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
      logger.error('Erro na busca pública de patrimônios:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Obter estatísticas públicas
  async obterEstatisticas(req: Request, res: Response): Promise<void> {
    try {
      // Buscar estatísticas públicas
      const [
        totalPatrimonios,
        totalSecretarias,
        patrimoniosPorCategoria,
      ] = await Promise.all([
        prisma.patrimonio.count(),
        prisma.secretaria.count({
          where: { status: 'ATIVA' },
        }),
        prisma.patrimonio.groupBy({
          by: ['categoria'],
          _count: { categoria: true },
        }),
      ]);

      const estatisticas = {
        totalPatrimonios,
        totalSecretarias,
        patrimoniosPorCategoria: patrimoniosPorCategoria.map(item => ({
          categoria: item.categoria,
          quantidade: item._count.categoria,
        })),
        ultimaAtualizacao: new Date().toISOString(),
      };

      const response: ApiResponse = {
        success: true,
        data: estatisticas,
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao obter estatísticas públicas:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }
}
