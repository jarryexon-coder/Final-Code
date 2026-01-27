// utils/logger.js - BACKEND ONLY
import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define log transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  // Error log file
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.uncolorize(),
      winston.format.json()
    )
  }),
  // Combined log file
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/combined.log'),
    format: winston.format.combine(
      winston.format.uncolorize(),
      winston.format.json()
    )
  }),
  // Audit log for authentication events
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/auth.log'),
    level: 'info',
    format: winston.format.combine(
      winston.format.uncolorize(),
      winston.format.json()
    ),
    filter: (log) => log.context === 'auth'
  })
];

// Create logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  format,
  transports
});

// Helper methods for different contexts
export const authLogger = {
  loginAttempt: (email, ip, userAgent) => {
    logger.info('Login attempt', {
      context: 'auth',
      email,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },
  
  loginSuccess: (userId, email, ip) => {
    logger.info('Login successful', {
      context: 'auth',
      userId,
      email,
      ip,
      timestamp: new Date().toISOString()
    });
  },
  
  loginFailed: (email, ip, reason) => {
    logger.warn('Login failed', {
      context: 'auth',
      email,
      ip,
      reason,
      timestamp: new Date().toISOString()
    });
  },
  
  registration: (email, ip) => {
    logger.info('User registration', {
      context: 'auth',
      email,
      ip,
      timestamp: new Date().toISOString()
    });
  },
  
  tokenRefresh: (userId, ip) => {
    logger.info('Token refresh', {
      context: 'auth',
      userId,
      ip,
      timestamp: new Date().toISOString()
    });
  },
  
  logout: (userId, ip) => {
    logger.info('User logout', {
      context: 'auth',
      userId,
      ip,
      timestamp: new Date().toISOString()
    });
  }
};

// General logging methods
export const appLogger = {
  error: (message, error = null, metadata = {}) => {
    logger.error(message, {
      ...metadata,
      error: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toISOString()
    });
  },
  
  warn: (message, metadata = {}) => {
    logger.warn(message, {
      ...metadata,
      timestamp: new Date().toISOString()
    });
  },
  
  info: (message, metadata = {}) => {
    logger.info(message, {
      ...metadata,
      timestamp: new Date().toISOString()
    });
  },
  
  debug: (message, metadata = {}) => {
    logger.debug(message, {
      ...metadata,
      timestamp: new Date().toISOString()
    });
  },
  
  http: (req, res, metadata = {}) => {
    const responseTime = res.get('X-Response-Time');
    logger.http(`${req.method} ${req.originalUrl} ${res.statusCode}`, {
      context: 'http',
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      ...metadata,
      timestamp: new Date().toISOString()
    });
  }
};

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Capture response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.set('X-Response-Time', `${duration}ms`);
    appLogger.http(req, res, { duration });
  });
  
  next();
};

export default logger;
