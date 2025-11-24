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
}

class LogBuilder {
  private startTime: bigint;

  constructor() {
    this.startTime = process.hrtime.bigint();
  }

  build(req: any, res: any): LogData {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - this.startTime) / 1_000_000;

    return {
      method: req.method || "UNKNOWN",
      path: req.originalUrl || req.url || "/",
      status: res.statusCode,
      duration_ms: durationMs.toFixed(2),
      timestamp: new Date().toISOString(),
      client_ip: this.extractClientIp(req),
      user_agent: this.extractHeader(req, "user-agent"),
      origin: this.extractHeader(req, "origin"),
      referer: this.extractHeader(req, "referer"),
      host: this.extractHeader(req, "host"),
      content_type: this.extractHeader(req, "content-type"),
    };
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
  
  res.on('close', () => {
    const log = logBuilder.build(req, res);
    saveLog(log);
  });
  
  next();
}

export default observabilityRoutes;

