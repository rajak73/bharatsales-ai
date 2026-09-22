// Drop-in replacement for the NestJS Logger API (log/warn/error/debug) so
// services keep `private readonly logger = new Logger(Name)` unchanged.
//
// String arguments often carry request data (emails, ids, filenames). CR/LF
// are replaced before writing so a client cannot forge extra log lines
// (log injection). Non-string arguments (Error objects, plain objects) are
// passed through: console formats them with util.inspect, which quotes and
// escapes the strings inside them, and Error stacks stay readable.
export function sanitizeLogValue<T>(value: T): T | string {
  if (typeof value !== 'string') return value;
  return value.replace(/\r\n|\r|\n/g, ' ');
}

function clean(args: any[]): any[] {
  return args.map((a) => sanitizeLogValue(a));
}

export class Logger {
  constructor(private readonly context: string = 'App') {}

  log(message: any, ...rest: any[]) {
    if (process.env.NODE_ENV === 'test') return;
    console.log(`[${sanitizeLogValue(this.context)}]`, ...clean([message, ...rest]));
  }

  warn(message: any, ...rest: any[]) {
    console.warn(`[${sanitizeLogValue(this.context)}]`, ...clean([message, ...rest]));
  }

  error(message: any, ...rest: any[]) {
    console.error(`[${sanitizeLogValue(this.context)}]`, ...clean([message, ...rest]));
  }

  debug(message: any, ...rest: any[]) {
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') return;
    console.debug(`[${sanitizeLogValue(this.context)}]`, ...clean([message, ...rest]));
  }

  verbose(message: any, ...rest: any[]) {
    this.debug(message, ...rest);
  }
}
