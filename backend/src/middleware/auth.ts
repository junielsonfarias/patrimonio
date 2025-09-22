// Middleware de autenticação e autorização
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { createUnauthorizedError, createForbiddenError } from './error-handler';
import { RoleUsuario } from '../types';

// Estender interface Request para incluir usuário
declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: string;
        email: string;
        role: RoleUsuario;
        funcionarioId?: string;
      };
    }
  }
}

const prisma = new PrismaClient();

// Interface para payload do JWT
interface JwtPayload {
  id: string;
  email: string;
  role: RoleUsuario;
  funcionarioId?: string;
  iat: number;
  exp: number;
}

// Middleware de autenticação
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createUnauthorizedError('Token de acesso não fornecido');
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verificar e decodificar token
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

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
      throw createUnauthorizedError('Usuário não encontrado ou inativo');
    }

    // Adicionar informações do usuário à requisição
    req.usuario = {
      id: usuario.id,
      email: usuario.email,
      role: usuario.role as RoleUsuario,
      funcionarioId: usuario.funcionarioId || undefined,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createUnauthorizedError('Token inválido'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(createUnauthorizedError('Token expirado'));
    } else {
      next(error);
    }
  }
};

// Middleware de autorização baseado em roles
export const authorize = (...roles: RoleUsuario[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      next(createUnauthorizedError('Usuário não autenticado'));
      return;
    }

    if (!roles.includes(req.usuario.role)) {
      next(createForbiddenError('Acesso negado. Permissões insuficientes'));
      return;
    }

    next();
  };
};

// Middleware para verificar se usuário é supervisor
export const requireSupervisor = authorize(RoleUsuario.SUPERVISOR);

// Middleware para verificar se usuário é administrador ou supervisor
export const requireAdmin = authorize(RoleUsuario.ADMINISTRADOR, RoleUsuario.SUPERVISOR);

// Middleware para verificar se usuário é operador, administrador ou supervisor
export const requireOperator = authorize(
  RoleUsuario.OPERADOR,
  RoleUsuario.ADMINISTRADOR,
  RoleUsuario.SUPERVISOR
);

// Middleware para verificar acesso a secretaria específica
export const requireSecretariaAccess = (secretariaIdParam: string = 'secretariaId') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.usuario) {
        next(createUnauthorizedError('Usuário não autenticado'));
        return;
      }

      // Supervisores têm acesso a todas as secretarias
      if (req.usuario.role === RoleUsuario.SUPERVISOR) {
        next();
        return;
      }

      const secretariaId = req.params[secretariaIdParam] || req.body.secretariaId;

      if (!secretariaId) {
        next(createForbiddenError('ID da secretaria não fornecido'));
        return;
      }

      // Verificar se o funcionário pertence à secretaria
      if (req.usuario.funcionarioId) {
        const funcionario = await prisma.funcionario.findUnique({
          where: { id: req.usuario.funcionarioId },
          select: { secretariaId: true },
        });

        if (!funcionario || funcionario.secretariaId !== secretariaId) {
          next(createForbiddenError('Acesso negado a esta secretaria'));
          return;
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware para verificar acesso a patrimônio específico
export const requirePatrimonioAccess = () => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.usuario) {
        next(createUnauthorizedError('Usuário não autenticado'));
        return;
      }

      // Supervisores têm acesso a todos os patrimônios
      if (req.usuario.role === RoleUsuario.SUPERVISOR) {
        next();
        return;
      }

      const patrimonioId = req.params.id || req.params.patrimonioId;

      if (!patrimonioId) {
        next(createForbiddenError('ID do patrimônio não fornecido'));
        return;
      }

      // Verificar se o patrimônio pertence à secretaria do funcionário
      if (req.usuario.funcionarioId) {
        const patrimonio = await prisma.patrimonio.findUnique({
          where: { id: patrimonioId },
          select: { secretariaId: true },
        });

        if (!patrimonio) {
          next(createForbiddenError('Patrimônio não encontrado'));
          return;
        }

        const funcionario = await prisma.funcionario.findUnique({
          where: { id: req.usuario.funcionarioId },
          select: { secretariaId: true },
        });

        if (!funcionario || funcionario.secretariaId !== patrimonio.secretariaId) {
          next(createForbiddenError('Acesso negado a este patrimônio'));
          return;
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware para verificar se usuário pode aprovar transferências
export const requireTransferApproval = () => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.usuario) {
        next(createUnauthorizedError('Usuário não autenticado'));
        return;
      }

      // Apenas supervisores podem aprovar transferências
      if (req.usuario.role !== RoleUsuario.SUPERVISOR) {
        next(createForbiddenError('Apenas supervisores podem aprovar transferências'));
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware opcional de autenticação (não falha se não houver token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

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

    if (usuario && usuario.isActive) {
      req.usuario = {
        id: usuario.id,
        email: usuario.email,
        role: usuario.role as RoleUsuario,
        funcionarioId: usuario.funcionarioId || undefined,
      };
    }

    next();
  } catch (error) {
    // Em caso de erro, continua sem autenticação
    next();
  }
};
