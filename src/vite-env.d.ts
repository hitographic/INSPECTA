/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_APPS_SCRIPT_URL: string;
  readonly VITE_GOOGLE_DRIVE_FOLDER_ID: string;
  readonly VITE_GOOGLE_SHEET_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
