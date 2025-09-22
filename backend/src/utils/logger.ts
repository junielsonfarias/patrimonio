// Sistema de Logging com Winston
import winston from 'winston';
import path from 'path';
import { config } from '../config';

// Definir formatos de log
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Configurar transportes
const transports: winston.transport[] = [];

// Console transport (sempre ativo)
transports.push(
  new winston.transports.Console({
    level: config.logging.level,
    format: consoleFormat,
  })
);

// File transport (apenas em produção)
if (config.server.nodeEnv === 'production') {
  // Criar diretório de logs se não existir
  const logDir = path.dirname(config.logging.file);
  
  transports.push(
    new winston.transports.File({
      filename: config.logging.file,
      level: config.logging.level,
      format: logFormat,
      maxsize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
    })
  );

  // Arquivo de erros separado
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
    })
  );
}

// Criar logger
export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Função para log de auditoria
export const auditLog = (data: {
  usuarioId: string;
  acao: string;
  entidade: string;
  entidadeId: string;
  ip: string;
  userAgent: string;
  detalhes?: any;
}): void => {
  logger.info('AUDIT_LOG', {
    type: 'audit',
    ...data,
    timestamp: new Date().toISOString(),
  });
};

// Função para log de segurança
export const securityLog = (data: {
  tipo: 'login_attempt' | 'login_success' | 'login_failure' | 'permission_denied' | 'suspicious_activity';
  usuarioId?: string;
  ip: string;
  userAgent: string;
  detalhes?: any;
}): void => {
  logger.warn('SECURITY_LOG', {
    type: 'security',
    ...data,
    timestamp: new Date().toISOString(),
  });
};

// Função para log de performance
export const performanceLog = (data: {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  ip: string;
}): void => {
  logger.info('PERFORMANCE_LOG', {
    type: 'performance',
    ...data,
    timestamp: new Date().toISOString(),
  });
};

// Função para log de erro com contexto
export const errorLog = (error: Error, context?: any): void => {
  logger.error('ERROR_LOG', {
    type: 'error',
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
};

// Middleware para log de requisições HTTP
export const requestLogger = (req: any, res: any, next: any): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    performanceLog({
      endpoint: req.path,
      method: req.method,
      duration,
      statusCode: res.statusCode,
      ip: req.ip || req.connection.remoteAddress,
    });
  });
  
  next();
};

export default logger;
