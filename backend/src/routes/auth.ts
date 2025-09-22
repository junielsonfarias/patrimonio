// Rotas de autenticação
import { Router } from 'express';
import { AuthController } from '../controllers/auth-controller';
import { validateBody } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { loginSchema, createUsuarioSchema } from '../utils/validation-schemas';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();
const authController = new AuthController();

// POST /api/auth/login - Login do usuário
router.post('/login', 
  validateBody(loginSchema),
  asyncHandler(authController.login.bind(authController))
);

// POST /api/auth/logout - Logout do usuário
router.post('/logout',
  authenticate,
  asyncHandler(authController.logout.bind(authController))
);

// GET /api/auth/me - Obter dados do usuário logado
router.get('/me',
  authenticate,
  asyncHandler(authController.getMe.bind(authController))
);

// POST /api/auth/refresh - Renovar token de acesso
router.post('/refresh',
  asyncHandler(authController.refreshToken.bind(authController))
);

// POST /api/auth/change-password - Alterar senha
router.post('/change-password',
  authenticate,
  asyncHandler(authController.changePassword.bind(authController))
);

// POST /api/auth/forgot-password - Solicitar reset de senha
router.post('/forgot-password',
  asyncHandler(authController.forgotPassword.bind(authController))
);

// POST /api/auth/reset-password - Resetar senha
router.post('/reset-password',
  asyncHandler(authController.resetPassword.bind(authController))
);

export default router;
