// Rotas de funcionários
import { Router } from 'express';
import { FuncionarioController } from '../controllers/funcionario-controller';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { authenticate, requireAdmin } from '../middleware/auth';
import { 
  createFuncionarioSchema, 
  updateFuncionarioSchema,
  funcionarioIdParamSchema,
  funcionarioFiltersQuerySchema 
} from '../utils/validation-schemas';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();
const funcionarioController = new FuncionarioController();

// GET /api/funcionarios - Listar funcionários com filtros
router.get('/',
  authenticate,
  validateQuery(funcionarioFiltersQuerySchema),
  asyncHandler(funcionarioController.listar.bind(funcionarioController))
);

// GET /api/funcionarios/:id - Obter funcionário por ID
router.get('/:id',
  authenticate,
  validateParams(funcionarioIdParamSchema),
  asyncHandler(funcionarioController.obterPorId.bind(funcionarioController))
);

// POST /api/funcionarios - Criar novo funcionário
router.post('/',
  authenticate,
  requireAdmin,
  validateBody(createFuncionarioSchema),
  asyncHandler(funcionarioController.criar.bind(funcionarioController))
);

// PUT /api/funcionarios/:id - Atualizar funcionário
router.put('/:id',
  authenticate,
  requireAdmin,
  validateParams(funcionarioIdParamSchema),
  validateBody(updateFuncionarioSchema),
  asyncHandler(funcionarioController.atualizar.bind(funcionarioController))
);

// GET /api/funcionarios/:id/patrimonios - Obter patrimônios do funcionário
router.get('/:id/patrimonios',
  authenticate,
  validateParams(funcionarioIdParamSchema),
  asyncHandler(funcionarioController.obterPatrimonios.bind(funcionarioController))
);

export default router;
