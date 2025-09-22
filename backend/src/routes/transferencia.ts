// Rotas de transferências
import { Router } from 'express';
import { TransferenciaController } from '../controllers/transferencia-controller';
import { validateBody, validateParams } from '../middleware/validation';
import { authenticate, requireOperator, requireTransferApproval } from '../middleware/auth';
import { 
  createTransferenciaSchema,
  updateTransferenciaStatusSchema,
  uuidParamSchema
} from '../utils/validation-schemas';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();
const transferenciaController = new TransferenciaController();

// GET /api/transferencias/:id - Obter transferência por ID
router.get('/:id',
  authenticate,
  validateParams(uuidParamSchema),
  asyncHandler(transferenciaController.obterPorId.bind(transferenciaController))
);

// POST /api/transferencias - Criar nova transferência
router.post('/',
  authenticate,
  requireOperator,
  validateBody(createTransferenciaSchema),
  asyncHandler(transferenciaController.criar.bind(transferenciaController))
);

// PUT /api/transferencias/:id/status - Aprovar/rejeitar transferência
router.put('/:id/status',
  authenticate,
  requireTransferApproval,
  validateParams(uuidParamSchema),
  validateBody(updateTransferenciaStatusSchema),
  asyncHandler(transferenciaController.atualizarStatus.bind(transferenciaController))
);

export default router;
