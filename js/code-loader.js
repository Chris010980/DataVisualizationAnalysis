async function loadFile(file) {
  const res = await fetch(file);
  if (!res.ok) throw new Error(`Failed to load ${file}`);
  return await res.text();
}


// Extract ALL blocks at once
function extractBlocks(text) {
  const regex = /\/\/ --- (\w+) START ---([\s\S]*?)\/\/ --- \1 END ---/g;

  const blocks = {};
  let match;

  while ((match = regex.exec(text)) !== null) {
    const key = match[1].toLowerCase();
    const content = match[2].trim();
    blocks[key] = content;
  }

  return blocks;
}


// Main init
async function initCodeBlocks() {
  const elements = document.querySelectorAll(".d3-code-block");

  if (!elements.length) return;

  // Alle benutzen dieselbe Datei → aus erstem Element lesen
  const file = elements[0].dataset.file;

  let codeText;
  try {
    codeText = await loadFile(file);
  } catch (err) {
    console.error(err);
    return;
  }

  const blocks = extractBlocks(codeText);

  elements.forEach(el => {
    const key = el.dataset.block?.toLowerCase();
    const codeEl = el.querySelector("code");

    if (!key || !codeEl) return;

    let loaded = false;

    el.addEventListener("toggle", () => {
      if (!el.open || loaded) return;

      const snippet = blocks[key];

      if (!snippet) {
        console.warn(`No block found for: ${key}`);
        return;
      }

      codeEl.textContent = snippet;

      if (window.Prism) {
        Prism.highlightElement(codeEl);
      }

      loaded = true;
    });
  });
}


// Init nach DOM ready
document.addEventListener("DOMContentLoaded", initCodeBlocks);