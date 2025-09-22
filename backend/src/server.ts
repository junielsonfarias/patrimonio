// Servidor principal do Sistema de Gestão Patrimonial
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found-handler';

// Importar rotas
import authRoutes from './routes/auth';
import patrimonioRoutes from './routes/patrimonio';
import secretariaRoutes from './routes/secretaria';
import funcionarioRoutes from './routes/funcionario';
import documentoRoutes from './routes/documento';
import manutencaoRoutes from './routes/manutencao';
import transferenciaRoutes from './routes/transferencia';
import relatorioRoutes from './routes/relatorio';
import publicRoutes from './routes/public';
import dashboardRoutes from './routes/dashboard';

// Inicializar Prisma Client
export const prisma = new PrismaClient({
  log: config.server.nodeEnv === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Criar aplicação Express
const app = express();

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Middleware CORS
app.use(cors(config.server.cors));

// Middleware de compressão
app.use(compression());

// Middleware de rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Muitas tentativas. Tente novamente em alguns minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Middleware de logging
if (config.server.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }));
}

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para servir arquivos estáticos
app.use('/uploads', express.static(config.upload.destination));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Sistema de Gestão Patrimonial está funcionando',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.server.nodeEnv,
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/patrimonio', patrimonioRoutes);
app.use('/api/secretarias', secretariaRoutes);
app.use('/api/funcionarios', funcionarioRoutes);
app.use('/api/documentos', documentoRoutes);
app.use('/api/manutencoes', manutencaoRoutes);
app.use('/api/transferencias', transferenciaRoutes);
app.use('/api/relatorios', relatorioRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/public', publicRoutes);

// Middleware para rotas não encontradas
app.use(notFoundHandler);

// Middleware de tratamento de erros
app.use(errorHandler);

// Função para inicializar o servidor
const startServer = async (): Promise<void> => {
  try {
    // Conectar ao banco de dados
    await prisma.$connect();
    logger.info('✅ Conectado ao banco de dados PostgreSQL');

    // Iniciar servidor
    const server = app.listen(config.server.port, () => {
      logger.info(`🚀 Servidor rodando na porta ${config.server.port}`);
      logger.info(`📊 Ambiente: ${config.server.nodeEnv}`);
      logger.info(`🔗 Health check: http://localhost:${config.server.port}/health`);
    });

    // Configurar graceful shutdown
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`📡 Recebido sinal ${signal}. Iniciando shutdown graceful...`);
      
      server.close(async () => {
        logger.info('🔌 Servidor HTTP fechado');
        
        try {
          await prisma.$disconnect();
          logger.info('🔌 Conexão com banco de dados fechada');
          process.exit(0);
        } catch (error) {
          logger.error('❌ Erro ao fechar conexão com banco de dados:', error);
          process.exit(1);
        }
      });
    };

    // Capturar sinais de shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Capturar erros não tratados
    process.on('uncaughtException', (error) => {
      logger.error('❌ Erro não capturado:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('❌ Promise rejeitada não tratada:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
};

// Inicializar servidor se este arquivo for executado diretamente
if (require.main === module) {
  startServer();
}

export default app;
