// Rotas de secretarias
import { Router } from 'express';
import { SecretariaController } from '../controllers/secretaria-controller';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { authenticate, requireAdmin } from '../middleware/auth';
import { 
  createSecretariaSchema, 
  updateSecretariaSchema,
  updateSecretariaStatusSchema,
  secretariaIdParamSchema,
  secretariaFiltersQuerySchema 
} from '../utils/validation-schemas';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();
const secretariaController = new SecretariaController();

// GET /api/secretarias - Listar secretarias com filtros
router.get('/',
  authenticate,
  validateQuery(secretariaFiltersQuerySchema),
  asyncHandler(secretariaController.listar.bind(secretariaController))
);

// GET /api/secretarias/:id - Obter secretaria por ID
router.get('/:id',
  authenticate,
  validateParams(secretariaIdParamSchema),
  asyncHandler(secretariaController.obterPorId.bind(secretariaController))
);

// POST /api/secretarias - Criar nova secretaria
router.post('/',
  authenticate,
  requireAdmin,
  validateBody(createSecretariaSchema),
  asyncHandler(secretariaController.criar.bind(secretariaController))
);

// PUT /api/secretarias/:id - Atualizar secretaria
router.put('/:id',
  authenticate,
  requireAdmin,
  validateParams(secretariaIdParamSchema),
  validateBody(updateSecretariaSchema),
  asyncHandler(secretariaController.atualizar.bind(secretariaController))
);

// PUT /api/secretarias/:id/status - Atualizar status da secretaria
router.put('/:id/status',
  authenticate,
  requireAdmin,
  validateParams(secretariaIdParamSchema),
  validateBody(updateSecretariaStatusSchema),
  asyncHandler(secretariaController.atualizarStatus.bind(secretariaController))
);

// GET /api/secretarias/:id/patrimonios - Obter patrimônios da secretaria
router.get('/:id/patrimonios',
  authenticate,
  validateParams(secretariaIdParamSchema),
  asyncHandler(secretariaController.obterPatrimonios.bind(secretariaController))
);

// GET /api/secretarias/:id/funcionarios - Obter funcionários da secretaria
router.get('/:id/funcionarios',
  authenticate,
  validateParams(secretariaIdParamSchema),
  asyncHandler(secretariaController.obterFuncionarios.bind(secretariaController))
);

export default router;
