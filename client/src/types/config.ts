export const DEBUG: boolean = import.meta.env.VITE_DEBUG === 'true';

export const SUPPORTED_LNGS: string[] = import.meta.env.VITE_SUPPORTED_LANGS.split(',');
