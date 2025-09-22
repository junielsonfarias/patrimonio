// Configurações do Sistema de Gestão Patrimonial
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
dotenv.config();

export const config = {
  // Configurações do Servidor
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
    },
  },

  // Configurações do Banco de Dados
  database: {
    url: process.env.DATABASE_URL || 'postgresql://usuario:senha@localhost:5432/patrimonio_db',
  },

  // Configurações do Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Configurações JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'seu_jwt_secret_muito_seguro_aqui',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'seu_refresh_secret_muito_seguro_aqui',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Configurações de Upload
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760', 10), // 10MB
    allowedTypes: process.env.UPLOAD_ALLOWED_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    destination: path.join(__dirname, '../../uploads'),
  },

  // Configurações AWS S3 (opcional)
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    bucketName: process.env.S3_BUCKET_NAME || '',
  },

  // Configurações de Email
  email: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@prefeitura.gov.br',
  },

  // Configurações de Segurança
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutos
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '28800000', 10), // 8 horas
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900000', 10), // 15 minutos
  },

  // Configurações de Log
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
    maxSize: '20m',
    maxFiles: 5,
  },

  // Configurações de Backup
  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // 2h da manhã
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '90', 10),
  },

  // Configurações de Monitoramento
  monitoring: {
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10),
    prometheus: {
      enabled: process.env.PROMETHEUS_ENABLED === 'true',
      port: parseInt(process.env.PROMETHEUS_PORT || '9090', 10),
    },
  },

  // Configurações do Sistema
  system: {
    // Configurações de numeração de patrimônio
    numeracaoPatrimonio: {
      formato: 'YYYYNNNNNNN', // Ano (4) + Sequência (6)
      resetAnual: true,
    },

    // Configurações de depreciação
    depreciacao: {
      metodo: 'linear',
      tabelas: {
        VEICULOS: {
          vidaUtil: 5,
          taxaAnual: 0.20,
        },
        MOVEIS_UTENSILIOS: {
          vidaUtil: 10,
          taxaAnual: 0.10,
        },
        EQUIPAMENTOS_INFORMATICA: {
          vidaUtil: 4,
          taxaAnual: 0.25,
        },
        MAQUINAS_EQUIPAMENTOS: {
          vidaUtil: 10,
          taxaAnual: 0.10,
        },
        IMOVEIS: {
          vidaUtil: 25,
          taxaAnual: 0.04,
        },
        INSTALACOES: {
          vidaUtil: 10,
          taxaAnual: 0.10,
        },
      },
    },

    // Configurações de QR Code
    qrCode: {
      size: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    },

    // Configurações de Etiquetas
    etiquetas: {
      largura: 100, // mm
      altura: 60, // mm
      margem: 5, // mm
      fonte: 'Arial',
      tamanhoFonte: 12,
    },
  },
};

// Validação das configurações obrigatórias
export const validateConfig = (): void => {
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Variáveis de ambiente obrigatórias não encontradas: ${missingVars.join(', ')}`
    );
  }

  // Validações específicas
  if (config.jwt.secret === 'seu_jwt_secret_muito_seguro_aqui') {
    console.warn('⚠️  ATENÇÃO: JWT_SECRET está usando valor padrão. Configure uma chave segura em produção!');
  }

  if (config.jwt.refreshSecret === 'seu_refresh_secret_muito_seguro_aqui') {
    console.warn('⚠️  ATENÇÃO: JWT_REFRESH_SECRET está usando valor padrão. Configure uma chave segura em produção!');
  }

  if (config.server.nodeEnv === 'production' && config.database.url.includes('localhost')) {
    throw new Error('❌ DATABASE_URL não pode apontar para localhost em produção!');
  }
};

// Executar validação ao importar o módulo
validateConfig();

export default config;
