import config from "@payload-config";
import { convertMarkdownToLexical, editorConfigFactory } from "@payloadcms/richtext-lexical";

export async function markdownToLexical(markdown: string) {
  const editorConfig = await editorConfigFactory.default({ config: await config });
  return convertMarkdownToLexical({ editorConfig, markdown });
}

/** ~200 words/min, min 1. */
export function readingTimeMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
