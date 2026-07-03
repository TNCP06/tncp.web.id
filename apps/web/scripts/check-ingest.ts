import { markdownToLexical, readingTimeMinutes } from "../src/lib/ingest";

async function main() {
  const md = "# Judul\n\nParagraf **tebal** dengan [tautan](https://x.id).\n\n- satu\n- dua";
  const lex = await markdownToLexical(md);
  if (!lex || typeof lex !== "object" || !("root" in lex)) throw new Error("lexical output invalid");
  if (readingTimeMinutes("kata ".repeat(400)) !== 2) throw new Error("reading time wrong");
  console.log("check-ingest OK");
}
main().catch((e) => { console.error(e); process.exit(1); });
