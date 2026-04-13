import { access, cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

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
  "proof.html"
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
    const source = join(root, entry);
    const target = join(distDir, entry);
    await cp(source, target, {
      recursive: true,
      force: true
    });
  }

  if (await pathExists(join(root, "favicon.ico"))) {
    await cp(join(root, "favicon.ico"), join(distDir, "favicon.ico"), { force: true });
  }

  console.log("Static site build complete: dist/");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
