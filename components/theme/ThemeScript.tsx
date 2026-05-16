import { THEME_STORAGE_KEY } from "./storage";

/** Runs before paint to avoid theme flash; keep in sync with ThemeProvider. */
export function ThemeScript() {
  const code = `
(function(){
  try {
    var k = '${THEME_STORAGE_KEY}';
    var t = localStorage.getItem(k);
    var d = document.documentElement;
    var dark = false;
    if (t === 'dark') dark = true;
    else if (t === 'light') dark = false;
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) dark = true;
    if (dark) d.classList.add('dark'); else d.classList.remove('dark');
  } catch (e) {}
})();`;
  return (
    <script
      dangerouslySetInnerHTML={{ __html: code }}
      suppressHydrationWarning
    />
  );
}
