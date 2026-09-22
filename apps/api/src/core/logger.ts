// Drop-in replacement for the NestJS Logger API (log/warn/error/debug) so
// services keep `private readonly logger = new Logger(Name)` unchanged.
export class Logger {
  constructor(private readonly context: string = 'App') {}

  log(message: any, ...rest: any[]) {
    if (process.env.NODE_ENV === 'test') return;
    console.log(`[${this.context}]`, message, ...rest);
  }

  warn(message: any, ...rest: any[]) {
    console.warn(`[${this.context}]`, message, ...rest);
  }

  error(message: any, ...rest: any[]) {
    console.error(`[${this.context}]`, message, ...rest);
  }

  debug(message: any, ...rest: any[]) {
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') return;
    console.debug(`[${this.context}]`, message, ...rest);
  }

  verbose(message: any, ...rest: any[]) {
    this.debug(message, ...rest);
  }
}
