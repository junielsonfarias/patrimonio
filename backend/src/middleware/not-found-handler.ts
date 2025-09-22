// Middleware para rotas não encontradas
import { Request, Response } from 'express';
import { ApiResponse } from '../types';

export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    error: `Rota ${req.method} ${req.path} não encontrada`,
  };

  res.status(404).json(response);
};
