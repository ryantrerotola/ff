type LogLevel = "info" | "warn" | "error" | "debug" | "success";

const LEVEL_PREFIX: Record<LogLevel, string> = {
  info: "[INFO]",
  warn: "[WARN]",
  error: "[ERR ]",
  debug: "[DBG ]",
  success: "[ OK ]",
};

const LEVEL_COLOR: Record<LogLevel, string> = {
  info: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  debug: "\x1b[90m",
  success: "\x1b[32m",
};

const RESET = "\x1b[0m";

function log(level: LogLevel, context: string, message: string, data?: Record<string, unknown>) {
  const color = LEVEL_COLOR[level];
  const prefix = LEVEL_PREFIX[level];
  const timestamp = new Date().toISOString().slice(11, 23);

  let line = `${color}${prefix}${RESET} ${timestamp} [${context}] ${message}`;

  if (data) {
    const pairs = Object.entries(data)
      .map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`)
      .join(" ");
    line += ` ${LEVEL_COLOR.debug}${pairs}${RESET}`;
  }

  if (level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export function createLogger(context: string) {
  return {
    info: (msg: string, data?: Record<string, unknown>) => log("info", context, msg, data),
    warn: (msg: string, data?: Record<string, unknown>) => log("warn", context, msg, data),
    error: (msg: string, data?: Record<string, unknown>) => log("error", context, msg, data),
    debug: (msg: string, data?: Record<string, unknown>) => log("debug", context, msg, data),
    success: (msg: string, data?: Record<string, unknown>) => log("success", context, msg, data),
  };
}

export function progressBar(current: number, total: number, label: string): string {
  const width = 30;
  const filled = Math.round((current / total) * width);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  const pct = Math.round((current / total) * 100);
  return `${bar} ${pct}% (${current}/${total}) ${label}`;
}
