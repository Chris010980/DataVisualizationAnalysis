async function loadCodeBlock(id, file, startMarker, endMarker) {
  const res = await fetch(file);
  const text = await res.text();

  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker);

  if (start === -1 || end === -1) {
    console.warn("Marker not found:", startMarker, endMarker);
    return;
  }

  const snippet = text.substring(start + startMarker.length, end).trim();
  document.getElementById(id).textContent = snippet;
  const el = document.getElementById(id);
  el.textContent = snippet;

  if (window.Prism) {
    Prism.highlightElement(el);
  }
}

const blockMap = window.blockMap;

document.querySelectorAll(".d3-code-block").forEach(block => {
  let loaded = false;

  block.addEventListener("toggle", () => {
    if (block.open && !loaded) {
      const key = block.dataset.block;
      const [id, start, end] = blockMap[key];

      loadCodeBlock(id, "../js/heatmap.js", start, end);
      loaded = true;
    }
  });
});
