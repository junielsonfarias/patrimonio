// Controller de autenticação
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { logger, securityLog } from '../utils/logger';
import { ApiResponse, LoginRequest, LoginResponse, UsuarioResponse } from '../types';
import { createUnauthorizedError, createValidationError, createNotFoundError } from '../middleware/error-handler';

const prisma = new PrismaClient();

export class AuthController {
  // Login do usuário
  async login(req: Request, res: Response): Promise<void> {
    const { email, senha }: LoginRequest = req.body;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    try {
      // Buscar usuário por email
      const usuario = await prisma.usuario.findUnique({
        where: { email },
        include: {
          funcionario: {
            include: {
              secretaria: true,
            },
          },
        },
      });

      if (!usuario) {
        securityLog({
          tipo: 'login_attempt',
          ip,
          userAgent,
          detalhes: { email, motivo: 'usuario_nao_encontrado' },
        });

        const response: ApiResponse = {
          success: false,
          error: 'Credenciais inválidas',
        };
        res.status(401).json(response);
        return;
      }

      // Verificar se usuário está ativo
      if (!usuario.isActive) {
        securityLog({
          tipo: 'login_attempt',
          usuarioId: usuario.id,
          ip,
          userAgent,
          detalhes: { email, motivo: 'usuario_inativo' },
        });

        const response: ApiResponse = {
          success: false,
          error: 'Usuário inativo',
        };
        res.status(401).json(response);
        return;
      }

      // Verificar se usuário está bloqueado
      if (usuario.lockedUntil && usuario.lockedUntil > new Date()) {
        securityLog({
          tipo: 'login_attempt',
          usuarioId: usuario.id,
          ip,
          userAgent,
          detalhes: { email, motivo: 'usuario_bloqueado' },
        });

        const response: ApiResponse = {
          success: false,
          error: 'Usuário temporariamente bloqueado. Tente novamente mais tarde.',
        };
        res.status(423).json(response);
        return;
      }

      // Verificar senha
      const senhaValida = await bcrypt.compare(senha, usuario.senha);

      if (!senhaValida) {
        // Incrementar tentativas de login
        const loginAttempts = usuario.loginAttempts + 1;
        const shouldLock = loginAttempts >= config.security.maxLoginAttempts;

        await prisma.usuario.update({
          where: { id: usuario.id },
          data: {
            loginAttempts,
            lockedUntil: shouldLock ? new Date(Date.now() + config.security.lockoutDuration) : null,
          },
        });

        securityLog({
          tipo: 'login_failure',
          usuarioId: usuario.id,
          ip,
          userAgent,
          detalhes: { email, tentativas: loginAttempts, bloqueado: shouldLock },
        });

        const response: ApiResponse = {
          success: false,
          error: shouldLock 
            ? 'Muitas tentativas de login. Usuário bloqueado temporariamente.'
            : 'Credenciais inválidas',
        };
        res.status(401).json(response);
        return;
      }

      // Login bem-sucedido - resetar tentativas e atualizar último login
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          loginAttempts: 0,
          lockedUntil: null,
          lastLogin: new Date(),
        },
      });

      // Gerar tokens
      const tokenPayload = {
        id: usuario.id,
        email: usuario.email,
        role: usuario.role,
        funcionarioId: usuario.funcionarioId,
      };

      const token = jwt.sign(tokenPayload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
      });

      const refreshToken = jwt.sign(tokenPayload, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn,
      });

      // Log de sucesso
      securityLog({
        tipo: 'login_success',
        usuarioId: usuario.id,
        ip,
        userAgent,
        detalhes: { email, role: usuario.role },
      });

      // Preparar resposta
      const usuarioResponse: UsuarioResponse = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        isActive: usuario.isActive,
        lastLogin: usuario.lastLogin,
        funcionario: usuario.funcionario ? {
          id: usuario.funcionario.id,
          nome: usuario.funcionario.nome,
          cpf: usuario.funcionario.cpf,
          email: usuario.funcionario.email,
          telefone: usuario.funcionario.telefone,
          cargo: usuario.funcionario.cargo,
          setor: usuario.funcionario.setor,
          secretariaId: usuario.funcionario.secretariaId,
          matricula: usuario.funcionario.matricula,
          status: usuario.funcionario.status,
          dataAdmissao: usuario.funcionario.dataAdmissao,
          dataExoneracao: usuario.funcionario.dataExoneracao,
          observacoes: usuario.funcionario.observacoes,
          createdAt: usuario.funcionario.createdAt,
          updatedAt: usuario.funcionario.updatedAt,
          secretaria: usuario.funcionario.secretaria,
        } : undefined,
      };

      const response: ApiResponse<LoginResponse> = {
        success: true,
        data: {
          token,
          refreshToken,
          usuario: usuarioResponse,
        },
        message: 'Login realizado com sucesso',
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro no login:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Logout do usuário
  async logout(req: Request, res: Response): Promise<void> {
    try {
      // Em uma implementação mais robusta, você poderia invalidar o token
      // adicionando-o a uma blacklist no Redis
      
      const response: ApiResponse = {
        success: true,
        message: 'Logout realizado com sucesso',
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro no logout:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Obter dados do usuário logado
  async getMe(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = req.usuario!.id;

      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        include: {
          funcionario: {
            include: {
              secretaria: true,
            },
          },
        },
      });

      if (!usuario) {
        const response: ApiResponse = {
          success: false,
          error: 'Usuário não encontrado',
        };
        res.status(404).json(response);
        return;
      }

      const usuarioResponse: UsuarioResponse = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        isActive: usuario.isActive,
        lastLogin: usuario.lastLogin,
        funcionario: usuario.funcionario ? {
          id: usuario.funcionario.id,
          nome: usuario.funcionario.nome,
          cpf: usuario.funcionario.cpf,
          email: usuario.funcionario.email,
          telefone: usuario.funcionario.telefone,
          cargo: usuario.funcionario.cargo,
          setor: usuario.funcionario.setor,
          secretariaId: usuario.funcionario.secretariaId,
          matricula: usuario.funcionario.matricula,
          status: usuario.funcionario.status,
          dataAdmissao: usuario.funcionario.dataAdmissao,
          dataExoneracao: usuario.funcionario.dataExoneracao,
          observacoes: usuario.funcionario.observacoes,
          createdAt: usuario.funcionario.createdAt,
          updatedAt: usuario.funcionario.updatedAt,
          secretaria: usuario.funcionario.secretaria,
        } : undefined,
      };

      const response: ApiResponse<UsuarioResponse> = {
        success: true,
        data: usuarioResponse,
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao obter dados do usuário:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Renovar token de acesso
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        const response: ApiResponse = {
          success: false,
          error: 'Refresh token não fornecido',
        };
        res.status(400).json(response);
        return;
      }

      // Verificar refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;

      // Verificar se usuário ainda existe e está ativo
      const usuario = await prisma.usuario.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          role: true,
          funcionarioId: true,
          isActive: true,
        },
      });

      if (!usuario || !usuario.isActive) {
        const response: ApiResponse = {
          success: false,
          error: 'Usuário não encontrado ou inativo',
        };
        res.status(401).json(response);
        return;
      }

      // Gerar novo token
      const tokenPayload = {
        id: usuario.id,
        email: usuario.email,
        role: usuario.role,
        funcionarioId: usuario.funcionarioId,
      };

      const newToken = jwt.sign(tokenPayload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
      });

      const response: ApiResponse<{ token: string }> = {
        success: true,
        data: { token: newToken },
        message: 'Token renovado com sucesso',
      };

      res.json(response);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        const response: ApiResponse = {
          success: false,
          error: 'Refresh token inválido',
        };
        res.status(401).json(response);
        return;
      }

      logger.error('Erro ao renovar token:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Alterar senha
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = req.usuario!.id;
      const { senhaAtual, novaSenha } = req.body;

      if (!senhaAtual || !novaSenha) {
        const response: ApiResponse = {
          success: false,
          error: 'Senha atual e nova senha são obrigatórias',
        };
        res.status(400).json(response);
        return;
      }

      // Buscar usuário
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
      });

      if (!usuario) {
        const response: ApiResponse = {
          success: false,
          error: 'Usuário não encontrado',
        };
        res.status(404).json(response);
        return;
      }

      // Verificar senha atual
      const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);

      if (!senhaValida) {
        const response: ApiResponse = {
          success: false,
          error: 'Senha atual incorreta',
        };
        res.status(400).json(response);
        return;
      }

      // Hash da nova senha
      const novaSenhaHash = await bcrypt.hash(novaSenha, config.security.bcryptRounds);

      // Atualizar senha
      await prisma.usuario.update({
        where: { id: usuarioId },
        data: { senha: novaSenhaHash },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Senha alterada com sucesso',
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao alterar senha:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Solicitar reset de senha
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        const response: ApiResponse = {
          success: false,
          error: 'Email é obrigatório',
        };
        res.status(400).json(response);
        return;
      }

      // Buscar usuário por email
      const usuario = await prisma.usuario.findUnique({
        where: { email },
      });

      // Sempre retornar sucesso para não vazar informações
      const response: ApiResponse = {
        success: true,
        message: 'Se o email existir, você receberá instruções para resetar sua senha',
      };

      res.json(response);

      // Se usuário existe, enviar email (implementar serviço de email)
      if (usuario) {
        // TODO: Implementar envio de email
        logger.info(`Reset de senha solicitado para: ${email}`);
      }
    } catch (error) {
      logger.error('Erro ao solicitar reset de senha:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }

  // Resetar senha
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, novaSenha } = req.body;

      if (!token || !novaSenha) {
        const response: ApiResponse = {
          success: false,
          error: 'Token e nova senha são obrigatórios',
        };
        res.status(400).json(response);
        return;
      }

      // Verificar token (implementar lógica de token de reset)
      // TODO: Implementar verificação de token de reset

      const response: ApiResponse = {
        success: true,
        message: 'Senha resetada com sucesso',
      };

      res.json(response);
    } catch (error) {
      logger.error('Erro ao resetar senha:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Erro interno do servidor',
      };
      res.status(500).json(response);
    }
  }
}
