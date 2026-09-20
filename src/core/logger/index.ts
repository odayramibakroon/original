type LogPayload = Record<string, unknown>;

function redact(payload?: LogPayload) {
  if (!payload) {
    return undefined;
  }

  const sensitiveKeys = ["password", "token", "secret", "key"];

  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      sensitiveKeys.some((sensitiveKey) =>
        key.toLowerCase().includes(sensitiveKey),
      )
        ? "[redacted]"
        : value,
    ]),
  );
}

export const logger = {
  error(message: string, payload?: LogPayload) {
    console.error(message, redact(payload));
  },
  warn(message: string, payload?: LogPayload) {
    console.warn(message, redact(payload));
  },
  info(message: string, payload?: LogPayload) {
    console.info(message, redact(payload));
  },
};
