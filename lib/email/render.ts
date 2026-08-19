import { render } from "@react-email/render";
import type { ReactElement } from "react";

/** Renders a React Email template (lib/email/templates/*.tsx) to an HTML string + plain-text fallback. */
export async function renderEmail(element: ReactElement) {
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}
