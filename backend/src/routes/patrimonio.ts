// Rotas de patrimônio
import { Router } from 'express';
import { PatrimonioController } from '../controllers/patrimonio-controller';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { authenticate, requireOperator, requirePatrimonioAccess } from '../middleware/auth';
import { 
  createPatrimonioSchema, 
  updatePatrimonioSchema, 
  patrimonioIdParamSchema,
  patrimonioFiltersQuerySchema 
} from '../utils/validation-schemas';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();
const patrimonioController = new PatrimonioController();

// GET /api/patrimonio - Listar patrimônios com filtros
router.get('/',
  authenticate,
  validateQuery(patrimonioFiltersQuerySchema),
  asyncHandler(patrimonioController.listar.bind(patrimonioController))
);

// GET /api/patrimonio/:id - Obter patrimônio por ID
router.get('/:id',
  authenticate,
  validateParams(patrimonioIdParamSchema),
  requirePatrimonioAccess(),
  asyncHandler(patrimonioController.obterPorId.bind(patrimonioController))
);

// POST /api/patrimonio - Criar novo patrimônio
router.post('/',
  authenticate,
  requireOperator,
  validateBody(createPatrimonioSchema),
  asyncHandler(patrimonioController.criar.bind(patrimonioController))
);

// PUT /api/patrimonio/:id - Atualizar patrimônio
router.put('/:id',
  authenticate,
  requireOperator,
  validateParams(patrimonioIdParamSchema),
  requirePatrimonioAccess(),
  validateBody(updatePatrimonioSchema),
  asyncHandler(patrimonioController.atualizar.bind(patrimonioController))
);

// DELETE /api/patrimonio/:id - Excluir patrimônio
router.delete('/:id',
  authenticate,
  requireOperator,
  validateParams(patrimonioIdParamSchema),
  requirePatrimonioAccess(),
  asyncHandler(patrimonioController.excluir.bind(patrimonioController))
);

// POST /api/patrimonio/:id/upload - Upload de fotos/documentos
router.post('/:id/upload',
  authenticate,
  requireOperator,
  validateParams(patrimonioIdParamSchema),
  requirePatrimonioAccess(),
  asyncHandler(patrimonioController.uploadArquivo.bind(patrimonioController))
);

// GET /api/patrimonio/:id/qr-code - Gerar QR Code
router.get('/:id/qr-code',
  authenticate,
  validateParams(patrimonioIdParamSchema),
  requirePatrimonioAccess(),
  asyncHandler(patrimonioController.gerarQRCode.bind(patrimonioController))
);

// POST /api/patrimonio/:id/transfer - Transferir patrimônio
router.post('/:id/transfer',
  authenticate,
  requireOperator,
  validateParams(patrimonioIdParamSchema),
  requirePatrimonioAccess(),
  asyncHandler(patrimonioController.transferir.bind(patrimonioController))
);

// POST /api/patrimonio/:id/baixa - Dar baixa no patrimônio
router.post('/:id/baixa',
  authenticate,
  requireOperator,
  validateParams(patrimonioIdParamSchema),
  requirePatrimonioAccess(),
  asyncHandler(patrimonioController.darBaixa.bind(patrimonioController))
);

// GET /api/patrimonio/:id/historico - Obter histórico do patrimônio
router.get('/:id/historico',
  authenticate,
  validateParams(patrimonioIdParamSchema),
  requirePatrimonioAccess(),
  asyncHandler(patrimonioController.obterHistorico.bind(patrimonioController))
);

// GET /api/patrimonio/:id/depreciacao - Calcular depreciação
router.get('/:id/depreciacao',
  authenticate,
  validateParams(patrimonioIdParamSchema),
  requirePatrimonioAccess(),
  asyncHandler(patrimonioController.calcularDepreciacao.bind(patrimonioController))
);

export default router;
