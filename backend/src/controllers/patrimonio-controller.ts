// Controller de patrimônio
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import QRCode from 'qrcode';
import { logger, auditLog } from '../utils/logger';
import { config } from '../config';
import { ApiResponse, PaginatedResponse, PatrimonioResponse, PatrimonioRequest } from '../types';
import { createNotFoundError, createValidationError, createConflictError } from '../middleware/error-handler';

const prisma = new PrismaClient();

export class PatrimonioController {
  // Listar patrimônios com filtros e paginação
  async listar(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        categoria,
        status,
        situacao,
        estadoConservacao,
        secretariaId,
        responsavelId,
        dataAquisicaoInicio,
        dataAquisicaoFim,
        valorMinimo,
        valorMaximo,
      } = req.query;

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
          { numeroSerie: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      // Filtros específicos
      if (categoria) where.categoria = categoria;
      if (status) where.status = status;
      if (situacao) where.situacao = situacao;
      if (estadoConservacao) where.estadoConservacao = estadoConservacao;
      if (secretariaId) where.secretariaId = secretariaId;
      if (responsavelId) where.responsavelId = responsavelId;

      // Filtros de data
      if (dataAquisicaoInicio || dataAquisicaoFim) {
        where.dataAquisicao = {};
        if (dataAquisicaoInicio) where.dataAquisicao.gte = new Date(dataAquisicaoInicio as string);
        if (dataAquisicaoFim) where.dataAquisicao.lte = new Date(dataAquisicaoFim as string);
      }

      // Filtros de valor
      if (valorMinimo || valorMaximo) {
        where.valor = {};
        if (valorMinimo) where.valor.gte = Number(valorMinimo);
        if (valorMaximo) where.valor.lte = Number(valorMaximo);
      }

      // Restrição por secretaria se não for supervisor
      if (req.usuario?.role !== 'SUPERVISOR' && req.usuario?.funcionarioId) {
        const funcionario = await prisma.funcionario.findUnique({
          where: { id: req.usuario.funcionarioId },
          select: { secretariaId: true },
        });

        if (funcionario) {
          where.secretariaId = funcionario.secretariaId;
        }
      }

      // Buscar patrimônios
      const [patrimonios, total] = await Promise.all([
        prisma.patrimonio.findMany({
          where,
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
            responsavel: {
              select: {
                id: true,
                nome: true,
                cargo: true,
              },
            },
            _count: {
              select: {
                documentos: true,
                manutencoes: true,
                transferencias: true,
              },
            },
          },
        }),
        prisma.patrimonio.count({ where }),
      ]);

      // Mapear resposta
      const patrimoniosResponse: PatrimonioResponse[] = patrimonios.map(patrimonio => ({
        id: patrimonio.id,
        numero: patrimonio.numero,
        codigoSecretaria: patrimonio.codigoSecretaria,
        descricao: patrimonio.descricao,
        categoria: patrimonio.categoria,
        subcategoria: patrimonio.subcategoria,
        marca: patrimonio.marca,
        modelo: patrimonio.modelo,
        numeroSerie: patrimonio.numeroSerie,
        valor: Number(patrimonio.valor),
        valorAtual: Number(patrimonio.valorAtual),
        dataAquisicao: patrimonio.dataAquisicao,
        vidaUtil: patrimonio.vidaUtil,
        secretariaId: patrimonio.secretariaId,
        localizacao: patrimonio.localizacao,
        responsavelId: patrimonio.responsavelId,
        status: patrimonio.status,
        situacao: patrimonio.situacao,
        estadoConservacao: patrimonio.estadoConservacao,
        observacoes: patrimonio.observacoes,
        fotos: patrimonio.fotos,
        qrCode: patrimonio.qrCode,
        createdAt: patrimonio.createdAt,
        updatedAt: patrimonio.updatedAt,
        secretaria: patrimonio.secretaria,
        responsavel: patrimonio.responsavel,
        _count: patrimonio._count,
      }));

      const response: PaginatedResponse<PatrimonioResponse> = {
        success: true,
        data: patrimoniosResponse,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao listar patrimônios:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Obter patrimônio por ID
  async obterPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const patrimonio = await prisma.patrimonio.findUnique({
        where: { id },
        include: {
          secretaria: true,
          responsavel: {
            include: {
              secretaria: true,
            },
          },
          documentos: true,
          manutencoes: {
            orderBy: { data: 'desc' },
            take: 10,
          },
          transferencias: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              secretariaOrigem: true,
              secretariaDestino: true,
              responsavelTransferencia: true,
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

      const patrimonioResponse: PatrimonioResponse = {
        id: patrimonio.id,
        numero: patrimonio.numero,
        codigoSecretaria: patrimonio.codigoSecretaria,
        descricao: patrimonio.descricao,
        categoria: patrimonio.categoria,
        subcategoria: patrimonio.subcategoria,
        marca: patrimonio.marca,
        modelo: patrimonio.modelo,
        numeroSerie: patrimonio.numeroSerie,
        valor: Number(patrimonio.valor),
        valorAtual: Number(patrimonio.valorAtual),
        dataAquisicao: patrimonio.dataAquisicao,
        vidaUtil: patrimonio.vidaUtil,
        secretariaId: patrimonio.secretariaId,
        localizacao: patrimonio.localizacao,
        responsavelId: patrimonio.responsavelId,
        status: patrimonio.status,
        situacao: patrimonio.situacao,
        estadoConservacao: patrimonio.estadoConservacao,
        observacoes: patrimonio.observacoes,
        fotos: patrimonio.fotos,
        qrCode: patrimonio.qrCode,
        createdAt: patrimonio.createdAt,
        updatedAt: patrimonio.updatedAt,
        secretaria: patrimonio.secretaria,
        responsavel: patrimonio.responsavel,
        _count: {
          documentos: patrimonio.documentos.length,
          manutencoes: patrimonio.manutencoes.length,
          transferencias: patrimonio.transferencias.length,
        },
      };

      const response: ApiResponse<PatrimonioResponse> = {
        success: true,
        data: patrimonioResponse,
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao obter patrimônio:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Criar novo patrimônio
  async criar(req: Request, res: Response): Promise<void> {
    try {
      const patrimonioData: PatrimonioRequest = req.body;
      const usuarioId = req.usuario!.id;

      // Verificar se secretaria existe
      const secretaria = await prisma.secretaria.findUnique({
        where: { id: patrimonioData.secretariaId },
      });

      if (!secretaria) {
        const response: ApiResponse = {
          success: false,
          error: 'Secretaria não encontrada',
        };
        res.status(404).json(response);
        return;
      }

      // Verificar se responsável existe
      const responsavel = await prisma.funcionario.findUnique({
        where: { id: patrimonioData.responsavelId },
      });

      if (!responsavel) {
        const response: ApiResponse = {
          success: false,
          error: 'Responsável não encontrado',
        };
        res.status(404).json(response);
        return;
      }

      // Gerar número do patrimônio
      const numero = await this.gerarNumeroPatrimonio(patrimonioData.dataAquisicao, secretaria.codigo);

      // Calcular valor atual (inicialmente igual ao valor de aquisição)
      const valorAtual = patrimonioData.valor;

      // Criar patrimônio
      const patrimonio = await prisma.patrimonio.create({
        data: {
          ...patrimonioData,
          numero,
          codigoSecretaria: secretaria.codigo,
          valor: patrimonioData.valor,
          valorAtual,
          vidaUtil: patrimonioData.vidaUtil || this.obterVidaUtilPorCategoria(patrimonioData.categoria),
          fotos: [],
        },
        include: {
          secretaria: true,
          responsavel: true,
        },
      });

      // Gerar QR Code
      const qrCode = await this.gerarQRCode(patrimonio.id, patrimonio.numero);
      
      // Atualizar patrimônio com QR Code
      await prisma.patrimonio.update({
        where: { id: patrimonio.id },
        data: { qrCode },
      });

      // Log de auditoria
      auditLog({
        usuarioId,
        acao: 'CREATE',
        entidade: 'Patrimonio',
        entidadeId: patrimonio.id,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        detalhes: { numero: patrimonio.numero, descricao: patrimonio.descricao },
      });

      const patrimonioResponse: PatrimonioResponse = {
        id: patrimonio.id,
        numero: patrimonio.numero,
        codigoSecretaria: patrimonio.codigoSecretaria,
        descricao: patrimonio.descricao,
        categoria: patrimonio.categoria,
        subcategoria: patrimonio.subcategoria,
        marca: patrimonio.marca,
        modelo: patrimonio.modelo,
        numeroSerie: patrimonio.numeroSerie,
        valor: Number(patrimonio.valor),
        valorAtual: Number(patrimonio.valorAtual),
        dataAquisicao: patrimonio.dataAquisicao,
        vidaUtil: patrimonio.vidaUtil,
        secretariaId: patrimonio.secretariaId,
        localizacao: patrimonio.localizacao,
        responsavelId: patrimonio.responsavelId,
        status: patrimonio.status,
        situacao: patrimonio.situacao,
        estadoConservacao: patrimonio.estadoConservacao,
        observacoes: patrimonio.observacoes,
        fotos: patrimonio.fotos,
        qrCode,
        createdAt: patrimonio.createdAt,
        updatedAt: patrimonio.updatedAt,
        secretaria: patrimonio.secretaria,
        responsavel: patrimonio.responsavel,
      };

      const response: ApiResponse<PatrimonioResponse> = {
        success: true,
        data: patrimonioResponse,
        message: 'Patrimônio criado com sucesso',
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Erro ao criar patrimônio:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Atualizar patrimônio
  async atualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const patrimonioData = req.body;
      const usuarioId = req.usuario!.id;

      // Verificar se patrimônio existe
      const patrimonioExistente = await prisma.patrimonio.findUnique({
        where: { id },
      });

      if (!patrimonioExistente) {
        const response: ApiResponse = {
          success: false,
          error: 'Patrimônio não encontrado',
        };
        res.status(404).json(response);
        return;
      }

      // Verificar se responsável existe (se fornecido)
      if (patrimonioData.responsavelId) {
        const responsavel = await prisma.funcionario.findUnique({
          where: { id: patrimonioData.responsavelId },
        });

        if (!responsavel) {
          const response: ApiResponse = {
            success: false,
            error: 'Responsável não encontrado',
          };
          res.status(404).json(response);
          return;
        }
      }

      // Atualizar patrimônio
      const patrimonio = await prisma.patrimonio.update({
        where: { id },
        data: patrimonioData,
        include: {
          secretaria: true,
          responsavel: true,
        },
      });

      // Log de auditoria
      auditLog({
        usuarioId,
        acao: 'UPDATE',
        entidade: 'Patrimonio',
        entidadeId: patrimonio.id,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        detalhes: { numero: patrimonio.numero, alteracoes: patrimonioData },
      });

      const patrimonioResponse: PatrimonioResponse = {
        id: patrimonio.id,
        numero: patrimonio.numero,
        codigoSecretaria: patrimonio.codigoSecretaria,
        descricao: patrimonio.descricao,
        categoria: patrimonio.categoria,
        subcategoria: patrimonio.subcategoria,
        marca: patrimonio.marca,
        modelo: patrimonio.modelo,
        numeroSerie: patrimonio.numeroSerie,
        valor: Number(patrimonio.valor),
        valorAtual: Number(patrimonio.valorAtual),
        dataAquisicao: patrimonio.dataAquisicao,
        vidaUtil: patrimonio.vidaUtil,
        secretariaId: patrimonio.secretariaId,
        localizacao: patrimonio.localizacao,
        responsavelId: patrimonio.responsavelId,
        status: patrimonio.status,
        situacao: patrimonio.situacao,
        estadoConservacao: patrimonio.estadoConservacao,
        observacoes: patrimonio.observacoes,
        fotos: patrimonio.fotos,
        qrCode: patrimonio.qrCode,
        createdAt: patrimonio.createdAt,
        updatedAt: patrimonio.updatedAt,
        secretaria: patrimonio.secretaria,
        responsavel: patrimonio.responsavel,
      };

      const response: ApiResponse<PatrimonioResponse> = {
        success: true,
        data: patrimonioResponse,
        message: 'Patrimônio atualizado com sucesso',
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao atualizar patrimônio:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Excluir patrimônio
  async excluir(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = req.usuario!.id;

      // Verificar se patrimônio existe
      const patrimonio = await prisma.patrimonio.findUnique({
        where: { id },
      });

      if (!patrimonio) {
        const response: ApiResponse = {
          success: false,
          error: 'Patrimônio não encontrado',
        };
        res.status(404).json(response);
        return;
      }

      // Excluir patrimônio
      await prisma.patrimonio.delete({
        where: { id },
      });

      // Log de auditoria
      auditLog({
        usuarioId,
        acao: 'DELETE',
        entidade: 'Patrimonio',
        entidadeId: patrimonio.id,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        detalhes: { numero: patrimonio.numero, descricao: patrimonio.descricao },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Patrimônio excluído com sucesso',
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao excluir patrimônio:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Upload de arquivo
  async uploadArquivo(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implementar upload de arquivos
      const response: ApiResponse = {
        success: false,
        error: 'Upload de arquivos não implementado ainda',
      };
      res.status(501).json(response);
    } catch (error) {
      logger.error('Erro no upload de arquivo:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Gerar QR Code
  async gerarQRCode(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const patrimonio = await prisma.patrimonio.findUnique({
        where: { id },
        select: { id: true, numero: true, qrCode: true },
      });

      if (!patrimonio) {
        const response: ApiResponse = {
          success: false,
          error: 'Patrimônio não encontrado',
        };
        res.status(404).json(response);
        return;
      }

      let qrCode = patrimonio.qrCode;

      if (!qrCode) {
        qrCode = await this.gerarQRCode(patrimonio.id, patrimonio.numero);
        
        await prisma.patrimonio.update({
          where: { id },
          data: { qrCode },
        });
      }

      const response: ApiResponse<{ qrCode: string }> = {
        success: true,
        data: { qrCode },
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao gerar QR Code:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Transferir patrimônio
  async transferir(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implementar transferência de patrimônio
      const response: ApiResponse = {
        success: false,
        error: 'Transferência de patrimônio não implementada ainda',
      };
      res.status(501).json(response);
    } catch (error) {
      logger.error('Erro na transferência de patrimônio:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Dar baixa no patrimônio
  async darBaixa(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implementar baixa de patrimônio
      const response: ApiResponse = {
        success: false,
        error: 'Baixa de patrimônio não implementada ainda',
      };
      res.status(501).json(response);
    } catch (error) {
      logger.error('Erro na baixa de patrimônio:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Obter histórico do patrimônio
  async obterHistorico(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implementar histórico do patrimônio
      const response: ApiResponse = {
        success: false,
        error: 'Histórico de patrimônio não implementado ainda',
      };
      res.status(501).json(response);
    } catch (error) {
      logger.error('Erro ao obter histórico do patrimônio:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Calcular depreciação
  async calcularDepreciacao(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const patrimonio = await prisma.patrimonio.findUnique({
        where: { id },
        select: {
          valor: true,
          dataAquisicao: true,
          vidaUtil: true,
          categoria: true,
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

      const depreciacao = this.calcularDepreciacaoLinear(
        Number(patrimonio.valor),
        patrimonio.dataAquisicao,
        patrimonio.vidaUtil
      );

      const response: ApiResponse = {
        success: true,
        data: depreciacao,
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao calcular depreciação:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Métodos auxiliares privados

  private async gerarNumeroPatrimonio(dataAquisicao: Date, codigoSecretaria: string): Promise<string> {
    const ano = dataAquisicao.getFullYear();
    
    // Buscar último número do ano
    const ultimoPatrimonio = await prisma.patrimonio.findFirst({
      where: {
        numero: {
          startsWith: ano.toString(),
        },
      },
      orderBy: { numero: 'desc' },
    });

    let sequencia = 1;
    if (ultimoPatrimonio) {
      const ultimaSequencia = parseInt(ultimoPatrimonio.numero.substring(4));
      sequencia = ultimaSequencia + 1;
    }

    return `${ano}${sequencia.toString().padStart(6, '0')}`;
  }

  private obterVidaUtilPorCategoria(categoria: string): number {
    const categoriaUpper = categoria.toUpperCase();
    const configDepreciacao = config.system.depreciacao.tabelas;
    
    if (configDepreciacao[categoriaUpper as keyof typeof configDepreciacao]) {
      return configDepreciacao[categoriaUpper as keyof typeof configDepreciacao].vidaUtil;
    }
    
    return 10; // Valor padrão
  }

  private async gerarQRCode(patrimonioId: string, numero: string): Promise<string> {
    const qrData = {
      id: patrimonioId,
      numero,
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/patrimonio/${numero}`,
      timestamp: new Date().toISOString(),
    };

    return await QRCode.toDataURL(JSON.stringify(qrData), {
      width: config.system.qrCode.size,
      margin: config.system.qrCode.margin,
      color: config.system.qrCode.color,
    });
  }

  private calcularDepreciacaoLinear(valor: number, dataAquisicao: Date, vidaUtil: number) {
    const hoje = new Date();
    const anosDecorridos = (hoje.getTime() - dataAquisicao.getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    const taxaAnual = 1 / vidaUtil;
    const depreciacaoAcumulada = Math.min(anosDecorridos * taxaAnual, 1);
    const valorDepreciado = valor * depreciacaoAcumulada;
    const valorAtual = valor - valorDepreciado;

    return {
      valorOriginal: valor,
      valorAtual: Math.max(valorAtual, 0),
      depreciacaoAcumulada: valorDepreciado,
      percentualDepreciacao: (depreciacaoAcumulada * 100).toFixed(2),
      anosDecorridos: anosDecorridos.toFixed(2),
      vidaUtilRestante: Math.max(vidaUtil - anosDecorridos, 0).toFixed(2),
    };
  }
}
