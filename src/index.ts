import dotenv from 'dotenv';
dotenv.config();

interface LogData {
  method: string;
  path: string;
  status: number;
  duration_ms: string;
  timestamp: string;
  client_ip?: string;
  user_agent?: string;
  origin?: string;
  referer?: string;
  host?: string;
  content_type?: string;
  errorMessage?: string;
}

class LogBuilder {
  private startTime: bigint;
  private responseBody: any = null;

  constructor() {
    this.startTime = process.hrtime.bigint();
  }

  setResponseBody(body: any) {
    this.responseBody = body;
  }

  build(req: any, res: any): LogData {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - this.startTime) / 1_000_000;
    const status = res.statusCode;

    return {
      method: req.method || "UNKNOWN",
      path: req.originalUrl || req.url || "/",
      status: status,
      duration_ms: durationMs.toFixed(2),
      timestamp: new Date().toISOString(),
      client_ip: this.extractClientIp(req),
      user_agent: this.extractHeader(req, "user-agent"),
      origin: this.extractHeader(req, "origin"),
      referer: this.extractHeader(req, "referer"),
      host: this.extractHeader(req, "host"),
      content_type: this.extractHeader(req, "content-type"),
      errorMessage: this.extractErrorMessage(req, res, status),
    };
  }

  private extractErrorMessage(req: any, res: any, status: number): string | undefined {
    // Só extrai mensagem de erro se o status estiver entre 400 e 599
    if (status < 400 || status >= 600) {
      return undefined;
    }

    // Tenta extrair de res.locals.error (comum em middlewares de erro do Express)
    if (res.locals?.error) {
      const error = res.locals.error;
      if (typeof error === 'string') return error;
      if (error?.message) return error.message;
      if (error?.error) return error.error;
    }

    // Tenta extrair do body da resposta
    if (this.responseBody) {
      if (typeof this.responseBody === 'string') {
        try {
          const parsed = JSON.parse(this.responseBody);
          return parsed.message || parsed.error || parsed.errorMessage || this.responseBody;
        } catch {
          return this.responseBody;
        }
      }
      if (typeof this.responseBody === 'object') {
        return this.responseBody.message || 
               this.responseBody.error || 
               this.responseBody.errorMessage ||
               JSON.stringify(this.responseBody);
      }
    }

    // Tenta extrair de req.error se existir
    if (req.error) {
      if (typeof req.error === 'string') return req.error;
      if (req.error?.message) return req.error.message;
    }

    return undefined;
  }

  private extractClientIp(req: any): string | undefined {
    const forwardedFor = this.extractHeader(req, "x-forwarded-for");
    if (forwardedFor) {
      return forwardedFor.split(",")[0].trim();
    }
    const realIp = this.extractHeader(req, "x-real-ip");
    if (realIp) {
      return realIp;
    }
    if (req.ip) {
      return req.ip;
    }
    if (req.socket?.remoteAddress) {
      return req.socket.remoteAddress;
    }
    if (req.connection?.remoteAddress) {
      return req.connection.remoteAddress;
    }
    return undefined;
  }

  private extractHeader(
    req: any,
    headerName: string
  ): string | undefined {
    const headers = req.headers || {};
    const headerValue = headers[headerName] || headers[headerName.toLowerCase()];
    if (!headerValue) return undefined;
    return Array.isArray(headerValue) ? headerValue[0] : headerValue;
  }
}

function saveLog(logData: LogData) {
  const SERVER_KEY = process.env.SERVER_KEY || '';
 
  const url = `https://api.noodown.com/v1/logs/${SERVER_KEY}`;
  
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(logData),
    keepalive: true,
  }).catch(() => {});
}

function observabilityRoutes(
  req: any,
  res: any,
  next: any
) {
  const logBuilder = new LogBuilder();
  
  // Intercepta res.json() para capturar o body da resposta
  const originalJson = res.json.bind(res);
  res.json = function(body: any) {
    logBuilder.setResponseBody(body);
    return originalJson(body);
  };

  // Intercepta res.send() para capturar o body da resposta
  const originalSend = res.send.bind(res);
  res.send = function(body: any) {
    logBuilder.setResponseBody(body);
    return originalSend(body);
  };
  
  res.on('close', () => {
    const log = logBuilder.build(req, res);
    saveLog(log);
  });
  
  next();
}

export default observabilityRoutes;

