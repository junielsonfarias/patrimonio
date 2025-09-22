// Rotas de documentos
import { Router } from 'express';
import { DocumentoController } from '../controllers/documento-controller';
import { validateBody, validateParams } from '../middleware/validation';
import { authenticate, requireOperator } from '../middleware/auth';
import { 
  createDocumentoSchema,
  uuidParamSchema
} from '../utils/validation-schemas';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();
const documentoController = new DocumentoController();

// GET /api/documentos/:id - Obter documento por ID
router.get('/:id',
  authenticate,
  validateParams(uuidParamSchema),
  asyncHandler(documentoController.obterPorId.bind(documentoController))
);

// POST /api/documentos - Criar novo documento
router.post('/',
  authenticate,
  requireOperator,
  validateBody(createDocumentoSchema),
  asyncHandler(documentoController.criar.bind(documentoController))
);

// DELETE /api/documentos/:id - Excluir documento
router.delete('/:id',
  authenticate,
  requireOperator,
  validateParams(uuidParamSchema),
  asyncHandler(documentoController.excluir.bind(documentoController))
);

export default router;
