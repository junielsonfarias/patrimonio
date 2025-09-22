// Rotas de relatórios
import { Router } from 'express';
import { RelatorioController } from '../controllers/relatorio-controller';
import { authenticate, requireOperator } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();
const relatorioController = new RelatorioController();

// GET /api/relatorios/patrimonio - Relatório de patrimônios
router.get('/patrimonio',
  authenticate,
  requireOperator,
  asyncHandler(relatorioController.relatorioPatrimonio.bind(relatorioController))
);

// GET /api/relatorios/transferencias - Relatório de transferências
router.get('/transferencias',
  authenticate,
  requireOperator,
  asyncHandler(relatorioController.relatorioTransferencias.bind(relatorioController))
);

// GET /api/relatorios/depreciacao - Relatório de depreciação
router.get('/depreciacao',
  authenticate,
  requireOperator,
  asyncHandler(relatorioController.relatorioDepreciacao.bind(relatorioController))
);

// POST /api/relatorios/personalizado - Relatório personalizado
router.post('/personalizado',
  authenticate,
  requireOperator,
  asyncHandler(relatorioController.relatorioPersonalizado.bind(relatorioController))
);

export default router;
