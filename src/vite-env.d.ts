/// <reference types="vite/client" />
/// <reference types="@testing-library/jest-dom" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}