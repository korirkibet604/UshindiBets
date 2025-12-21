// src/constants/env.js
export const API_URL = import.meta.env.VITE_API_URL;
export const APP_NAME = import.meta.env.VITE_APP_NAME;
export const API_KEY = import.meta.env.VITE_API_KEY;
export const NODE_ENV = import.meta.env.VITE_NODE_ENV;
export const PORT = import.meta.env.VITE_APP_PORT;
export const DEBUG = import.meta.env.VITE_DEBUG === "true";
export const ENABLE_ANALYTICS =
  import.meta.env.VITE_ENABLE_ANALYTICS === "true";
export const GOOGLE_ANALYTICS_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;
export const AUTH_CLIENT_ID = import.meta.env.VITE_AUTH_CLIENT_ID;
export const UPLOAD_MAX_SIZE = parseInt(
  import.meta.env.VITE_UPLOAD_MAX_SIZE || "5242880"
);
export const DEFAULT_LOCALE = import.meta.env.VITE_DEFAULT_LOCALE || "en";
export const DEFAULT_CURRENCY = import.meta.env.VITE_DEFAULT_CURRENCY || "EUR";
export const TAX_FEE = 20;

export const BETTING_FREE = false;
