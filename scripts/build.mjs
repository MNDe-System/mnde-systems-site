import { access, cp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { buildBundle } from "./make-bundle.mjs";

const root = process.cwd();
const distDir = join(root, "dist");

const entriesToCopy = [
  "_headers",
  "assets",
  "blog",
  "blog.html",
  "contact.html",
  "examples.html",
  "faq.html",
  "how-it-works.html",
  "index.html",
  "pricing.html",
  "product.html",
  "proof.html",
  "robots.txt",
  "sitemap.xml"
];

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  for (const entry of entriesToCopy) {
    if (!(await pathExists(join(root, entry)))) continue;
    const source = join(root, entry);
    const target = join(distDir, entry);
    await cp(source, target, { recursive: true, force: true });
  }

  if (await pathExists(join(root, "favicon.ico"))) {
    await cp(join(root, "favicon.ico"), join(distDir, "favicon.ico"), { force: true });
  }

  // Deterministic proof bundle + published checksum.
  const { buffer, sha256 } = await buildBundle();
  await writeFile(join(distDir, "proof-bundle.zip"), buffer);
  await writeFile(join(distDir, "proof-bundle.sha256.txt"), `${sha256}  proof-bundle.zip\n`, "utf8");

  console.log(`Static site build complete: dist/ (proof-bundle.zip sha256=${sha256})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
