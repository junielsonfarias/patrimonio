// Middleware de validação com Zod
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { createValidationError } from './error-handler';

// Middleware para validar body da requisição
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        
        next(createValidationError('Dados de entrada inválidos', validationErrors));
      } else {
        next(error);
      }
    }
  };
};

// Middleware para validar parâmetros da URL
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        
        next(createValidationError('Parâmetros inválidos', validationErrors));
      } else {
        next(error);
      }
    }
  };
};

// Middleware para validar query parameters
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        
        next(createValidationError('Parâmetros de consulta inválidos', validationErrors));
      } else {
        next(error);
      }
    }
  };
};

// Middleware para validar headers
export const validateHeaders = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.headers = schema.parse(req.headers);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        
        next(createValidationError('Headers inválidos', validationErrors));
      } else {
        next(error);
      }
    }
  };
};

// Função para criar erro de validação customizado
const createValidationError = (message: string, details?: any) => {
  const error = new Error(message) as any;
  error.statusCode = 400;
  error.details = details;
  return error;
};
