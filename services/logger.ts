const isProd = process.env.NODE_ENV === 'production';

export function info(...args: any[]) {
  if (!isProd) console.log(...args);
}

export function warn(...args: any[]) {
  if (!isProd) console.warn(...args);
}

export function error(...args: any[]) {
  console.error(...args);
}

export default { info, warn, error };
