interface ViteTypeOptions {
    strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
    readonly VITE_LRS_BASE_URL: string
    readonly VITE_LRS_USERNAME: string
    readonly VITE_LRS_PASSWORD: string
    readonly VITE_ML_BASE_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}