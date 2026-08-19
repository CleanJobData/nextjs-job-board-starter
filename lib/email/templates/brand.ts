/**
 * Email clients can't read CSS custom properties, so templates can't
 * consume app/globals.css's tokens or theme.config.ts presets directly -
 * these are literal hex fallbacks mirroring the "default" preset's
 * --primary/--foreground/--muted-foreground. If you change the app's theme
 * preset, update these to match (there's no way to keep them wired up
 * automatically without a build step that inlines CSS vars into email HTML).
 */
export const emailBrand = {
  primary: "#10b981",
  foreground: "#1a1a17",
  mutedForeground: "#78716c",
  background: "#faf7f2",
  border: "#f0ede8",
};
