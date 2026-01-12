interface ViteTypeOptions {
    strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
    readonly VITE_LRS_BASE_URL: string
    readonly VITE_LRS_AUTH_USERNAME: string
    readonly VITE_LRS_AUTH_PASSWORD: string
    readonly OLLAMA_HOST: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}