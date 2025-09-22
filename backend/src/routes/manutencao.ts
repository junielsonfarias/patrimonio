// Rotas de manutenções
import { Router } from 'express';
import { ManutencaoController } from '../controllers/manutencao-controller';
import { validateBody, validateParams } from '../middleware/validation';
import { authenticate, requireOperator } from '../middleware/auth';
import { 
  createManutencaoSchema,
  uuidParamSchema
} from '../utils/validation-schemas';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();
const manutencaoController = new ManutencaoController();

// GET /api/manutencoes/:id - Obter manutenção por ID
router.get('/:id',
  authenticate,
  validateParams(uuidParamSchema),
  asyncHandler(manutencaoController.obterPorId.bind(manutencaoController))
);

// POST /api/manutencoes - Criar nova manutenção
router.post('/',
  authenticate,
  requireOperator,
  validateBody(createManutencaoSchema),
  asyncHandler(manutencaoController.criar.bind(manutencaoController))
);

export default router;
