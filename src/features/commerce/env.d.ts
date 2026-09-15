// src/vite-env.d.ts declares ImportMetaEnv without Vite's built-in flags.
// Merged into that global interface so api.ts can gate the dev mock on DEV,
// which Vite replaces with a literal at build time.
interface ImportMetaEnv {
  readonly DEV: boolean;
}
