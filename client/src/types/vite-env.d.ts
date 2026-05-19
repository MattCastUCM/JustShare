interface ViteTypeOptions {
    strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
    readonly VITE_LRS_URL: string
    readonly VITE_LRS_USERNAME: string
    readonly VITE_LRS_PASSWORD: string
    readonly VITE_API_URL: string
    readonly VITE_DEBUG: string
    readonly VITE_SUPPORTED_LANGS: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}