export function renderNetwork(data) {
  const width = 800;
  const height = 500;

  

  const svg = d3.select("#network")
    .append("svg")
    .attr("viewBox", [0, 0, width, height]);

  // ---------------------------
  // Build nodes
  // ---------------------------
  const milestoneTitleById = Object.fromEntries(
    data.milestones.map(m => [m.id, m.title])
  );

  const riskTitleById = Object.fromEntries(
    data.risks.map(r => [r.id, r.title])
  );

  const milestoneNodes = data.milestones.map(m => ({
    id: `m${m.id}`,
    label: m.title,
    type: "milestone",
    priority: m.priority,
    story_points: m.story_points,
    risks: m.risks
  }));

  const connectedRiskIds = new Set();

  data.milestones.forEach(m => {
    m.risks.forEach(r => connectedRiskIds.add(r.id));
  });

  const riskNodes = data.risks
    .filter(r => connectedRiskIds.has(r.id))
    .map(r => ({
      id: `r${r.id}`,
      label: r.title,
      type: "risk",
      probability: r.probability,
      status: r.status,
      milestones: r.milestones
    }));

  const nodes = [...milestoneNodes, ...riskNodes];

  // ---------------------------
  // Build links
  // ---------------------------
  const links = [];

  data.milestones.forEach(m => {
    m.risks.forEach(r => {
      links.push({
        source: `m${m.id}`,
        target: `r${r.id}`
      });
    });
  });

  // ---------------------------
  // Color scale
  // ---------------------------
  const color = {
    "Very Low": "#ffffb2",
    "Low": "#fecc5c",
    "Intermediate": "#fd8d3c",
    "High": "#f03b20",
    "Very High": "#bd0026"
  };

  // ---------------------------
  // Simulation
  // ---------------------------
  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(120))
    .force("charge", d3.forceManyBody().strength(-200))
    .force("center", d3.forceCenter(width / 2, height / 2));

  // ---------------------------
  // Links
  // ---------------------------
  const link = svg.append("g")
    .attr("stroke", "#ccc")
    .selectAll("line")
    .data(links)
    .join("line");

  // ---------------------------
  // Nodes
  // ---------------------------
  const node = svg.append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended)
    );

  // Shapes
  node.each(function(d) {
    const shape = d3.select(this).append(d.type === "milestone" ? "circle" : "rect");

    if (d.type === "milestone") {
      shape
        .attr("r", 6)
        .attr("fill", "#555");
    } else {
      shape
        .attr("width", 10)
        .attr("height", 10)
        .attr("x", -5)
        .attr("y", -5)
        .attr("fill", color[d.probability] || "#999");
    }
  });

  // Tooltip
  const tooltip = d3.select("#tooltip");

  const formatMilestoneRiskInfo = d => {
    const risks = Array.isArray(d.risks) ? d.risks : [];
    return risks.length > 0
      ? `<ul>${risks.map(r => `<li>${riskTitleById[r.id] ?? `Risk #${r.id}`} (${r.probability ?? "?"})</li>`).join("")}</ul>`
      : "<div class='tooltip-empty'>No connected risks</div>";
  };

  const formatRiskMilestoneInfo = d => {
    const milestones = Array.isArray(d.milestones) ? d.milestones : [];
    return milestones.length > 0
      ? `<ul>${milestones.map(m => `<li>${milestoneTitleById[m.id] ?? `Milestone #${m.id}`}${m.story_points ? ` — ${m.story_points}sp` : ""}${m.priority ? ` (${m.priority})` : ""}</li>`).join("")}</ul>`
      : "<div class='tooltip-empty'>No linked milestones</div>";
  };

  node.on("mouseover", (event, d) => {
      const html = d.type === "milestone"
        ? `
            <strong>${d.label}</strong><br>
            Type: Milestone<br>
            Priority: ${d.priority ?? "–"}<br>
            Story Points: ${d.story_points ?? "–"}<br>
            <div class="tooltip-heading">Connected Risks</div>
            ${formatMilestoneRiskInfo(d)}
          `
        : `
            <strong>${d.label}</strong><br>
            Type: Risk<br>
            Probability: ${d.probability ?? "–"}<br>
            <div class="tooltip-heading">Linked Milestones</div>
            ${formatRiskMilestoneInfo(d)}
          `;

      tooltip
        .style("visibility", "visible")
        .html(html);
    })
    .on("mousemove", event => {
      tooltip
        .style("left", `${event.pageX + 15}px`)
        .style("top", `${event.pageY - 30}px`);
    })
    .on("mouseout", () => {
      tooltip.style("visibility", "hidden");
    });

  // ---------------------------
  // Legend
  // ---------------------------
  const legendData = [
    { label: "Very Low", color: color["Very Low"] },
    { label: "Low", color: color["Low"] },
    { label: "Intermediate", color: color["Intermediate"] },
    { label: "High", color: color["High"] },
    { label: "Very High", color: color["Very High"] }
  ];

  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - 180}, 20)`);

  legend.append("text")
    .attr("x", 0)
    .attr("y", -10)
    .attr("font-size", 12)
    .attr("font-weight", "bold")
    .text("Risk probability");

  const legendItem = legend.selectAll("g")
    .data(legendData)
    .join("g")
    .attr("transform", (d, i) => `translate(0, ${i * 22})`);

  legendItem.append("rect")
    .attr("width", 14)
    .attr("height", 14)
    .attr("fill", d => d.color)
    .attr("stroke", "#333")
    .attr("stroke-width", 0.5);

  legendItem.append("text")
    .attr("x", 20)
    .attr("y", 11)
    .attr("font-size", 11)
    .text(d => d.label);

  // ---------------------------
  // Tick
  // ---------------------------
  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node.attr("transform", d => `translate(${d.x},${d.y})`);
  });

  // ---------------------------
  // Drag functions
  // ---------------------------
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
}