// Rotas de dashboard
import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard-controller';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();
const dashboardController = new DashboardController();

// GET /api/dashboard/stats - Estatísticas do dashboard
router.get('/stats',
  authenticate,
  asyncHandler(dashboardController.obterEstatisticas.bind(dashboardController))
);

// GET /api/dashboard/graficos - Dados para gráficos
router.get('/graficos',
  authenticate,
  asyncHandler(dashboardController.obterDadosGraficos.bind(dashboardController))
);

// GET /api/dashboard/alertas - Alertas e notificações
router.get('/alertas',
  authenticate,
  asyncHandler(dashboardController.obterAlertas.bind(dashboardController))
);

export default router;
