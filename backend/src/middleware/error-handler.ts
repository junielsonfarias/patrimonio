// Middleware de tratamento de erros
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

// Interface para erros customizados
interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

// Função para determinar o status code baseado no tipo de erro
const getStatusCode = (error: CustomError): number => {
  if (error.statusCode) {
    return error.statusCode;
  }

  // Erros do Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return 409; // Conflict - violação de constraint única
      case 'P2025':
        return 404; // Not Found - registro não encontrado
      case 'P2003':
        return 400; // Bad Request - violação de foreign key
      default:
        return 400;
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return 400; // Bad Request - erro de validação
  }

  // Erros de validação Zod
  if (error instanceof ZodError) {
    return 400; // Bad Request
  }

  // Erros de sintaxe JSON
  if (error instanceof SyntaxError && 'body' in error) {
    return 400; // Bad Request
  }

  // Erro padrão
  return 500;
};

// Função para formatar mensagem de erro
const getErrorMessage = (error: CustomError): string => {
  // Erros do Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return 'Registro já existe com os dados fornecidos';
      case 'P2025':
        return 'Registro não encontrado';
      case 'P2003':
        return 'Violação de integridade referencial';
      default:
        return 'Erro no banco de dados';
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return 'Dados inválidos fornecidos';
  }

  // Erros de validação Zod
  if (error instanceof ZodError) {
    return 'Dados de entrada inválidos';
  }

  // Erros de sintaxe JSON
  if (error instanceof SyntaxError && 'body' in error) {
    return 'JSON inválido';
  }

  // Retornar mensagem do erro ou mensagem padrão
  return error.message || 'Erro interno do servidor';
};

// Função para formatar detalhes de erro
const getErrorDetails = (error: CustomError): any => {
  // Erros de validação Zod
  if (error instanceof ZodError) {
    return error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));
  }

  // Erros do Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return {
      code: error.code,
      meta: error.meta,
    };
  }

  // Detalhes customizados
  if (error.details) {
    return error.details;
  }

  return undefined;
};

// Middleware principal de tratamento de erros
export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = getStatusCode(error);
  const message = getErrorMessage(error);
  const details = getErrorDetails(error);

  // Log do erro
  if (statusCode >= 500) {
    logger.error('Erro interno do servidor:', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  } else {
    logger.warn('Erro de requisição:', {
      error: error.message,
      statusCode,
      url: req.url,
      method: req.method,
      ip: req.ip,
    });
  }

  // Resposta de erro
  const response: ApiResponse = {
    success: false,
    error: message,
  };

  // Adicionar detalhes se disponíveis
  if (details) {
    response.errors = details;
  }

  // Adicionar stack trace apenas em desenvolvimento
  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    (response as any).stack = error.stack;
  }

  res.status(statusCode).json(response);
};

// Middleware para capturar erros assíncronos
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Classe para erros customizados
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Funções para criar erros específicos
export const createError = (message: string, statusCode: number = 500): AppError => {
  return new AppError(message, statusCode);
};

export const createValidationError = (message: string): AppError => {
  return new AppError(message, 400);
};

export const createNotFoundError = (resource: string): AppError => {
  return new AppError(`${resource} não encontrado`, 404);
};

export const createUnauthorizedError = (message: string = 'Não autorizado'): AppError => {
  return new AppError(message, 401);
};

export const createForbiddenError = (message: string = 'Acesso negado'): AppError => {
  return new AppError(message, 403);
};

export const createConflictError = (message: string): AppError => {
  return new AppError(message, 409);
};
