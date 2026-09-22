/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the BharatSales API. */
  readonly VITE_API_URL?: string;
  /** URL of the field-rep PWA, linked from the sidebar. */
  readonly VITE_FIELD_PWA_URL?: string;
  /** WhatsApp number (with country code, e.g. 919000012345) for the floating chat button on public pages. Unset = no button. */
  readonly VITE_WHATSAPP_NUMBER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
