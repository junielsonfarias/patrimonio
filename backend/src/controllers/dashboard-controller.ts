// Controller de dashboard
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { ApiResponse, DashboardStats } from '../types';

const prisma = new PrismaClient();

export class DashboardController {
  // Obter estatísticas do dashboard
  async obterEstatisticas(req: Request, res: Response): Promise<void> {
    try {
      // Buscar estatísticas básicas
      const [
        totalPatrimonios,
        totalValor,
        totalSecretarias,
        totalFuncionarios,
        transferenciasPendentes,
        manutencoesPendentes,
      ] = await Promise.all([
        prisma.patrimonio.count(),
        prisma.patrimonio.aggregate({
          _sum: { valor: true },
        }),
        prisma.secretaria.count(),
        prisma.funcionario.count(),
        prisma.transferencia.count({
          where: { status: 'PENDENTE' },
        }),
        prisma.manutencao.count({
          where: {
            data: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 dias
            },
          },
        }),
      ]);

      // Buscar patrimônios por categoria
      const patrimoniosPorCategoria = await prisma.patrimonio.groupBy({
        by: ['categoria'],
        _count: { categoria: true },
        _sum: { valor: true },
      });

      // Buscar patrimônios por secretaria
      const patrimoniosPorSecretaria = await prisma.patrimonio.groupBy({
        by: ['secretariaId'],
        _count: { secretariaId: true },
        _sum: { valor: true },
      });

      // Buscar secretarias para mapear nomes
      const secretarias = await prisma.secretaria.findMany({
        select: { id: true, nome: true },
      });

      const secretariasMap = new Map(secretarias.map(s => [s.id, s.nome]));

      const stats: DashboardStats = {
        totalPatrimonios,
        totalValor: Number(totalValor._sum.valor || 0),
        totalValorAtual: Number(totalValor._sum.valor || 0), // TODO: Calcular valor atual com depreciação
        patrimoniosPorCategoria: patrimoniosPorCategoria.map(item => ({
          categoria: item.categoria,
          quantidade: item._count.categoria,
          valor: Number(item._sum.valor || 0),
        })),
        patrimoniosPorSecretaria: patrimoniosPorSecretaria.map(item => ({
          secretaria: secretariasMap.get(item.secretariaId) || 'Desconhecida',
          quantidade: item._count.secretariaId,
          valor: Number(item._sum.valor || 0),
        })),
        transferenciasPendentes,
        manutencoesPendentes,
        patrimoniosVencendoGarantia: 0, // TODO: Implementar cálculo de garantias
      };

      const response: ApiResponse<DashboardStats> = {
        success: true,
        data: stats,
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao obter estatísticas do dashboard:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Obter dados para gráficos
  async obterDadosGraficos(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implementar dados para gráficos
      const response: ApiResponse = {
        success: false,
        error: 'Dados para gráficos não implementados ainda',
      };
      res.status(501).json(response);
    } catch (error) {
      logger.error('Erro ao obter dados para gráficos:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Obter alertas e notificações
  async obterAlertas(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implementar sistema de alertas
      const response: ApiResponse = {
        success: false,
        error: 'Sistema de alertas não implementado ainda',
      };
      res.status(501).json(response);
    } catch (error) {
      logger.error('Erro ao obter alertas:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }
}
