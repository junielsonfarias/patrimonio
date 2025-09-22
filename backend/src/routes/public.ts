// Rotas públicas
import { Router } from 'express';
import { PublicController } from '../controllers/public-controller';
import { validateParams } from '../middleware/validation';
import { optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();
const publicController = new PublicController();

// GET /api/public/patrimonio/:numero - Buscar patrimônio público por número
router.get('/patrimonio/:numero',
  optionalAuth,
  asyncHandler(publicController.buscarPatrimonio.bind(publicController))
);

// GET /api/public/search - Busca pública de patrimônios
router.get('/search',
  optionalAuth,
  asyncHandler(publicController.buscarPatrimonios.bind(publicController))
);

// GET /api/public/estatisticas - Estatísticas públicas
router.get('/estatisticas',
  asyncHandler(publicController.obterEstatisticas.bind(publicController))
);

export default router;
