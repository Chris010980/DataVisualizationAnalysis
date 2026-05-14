const DATA_URL = "https://raw.githubusercontent.com/Chris010980/openproject-analytics/main/output/metrics.json";

function validateData(data) {
  if (!Array.isArray(data)) {
    throw new Error("Expected array from metrics.json");
  }

  data.forEach(d => {
    if (d.id === undefined || d.combined_score === undefined) {
      throw new Error(`Invalid milestone entry: ${JSON.stringify(d)}`);
    }
  });
}

export function renderMilestoneChart(data) {
  // Sort descending
  data.sort((a, b) => b.combined_score - a.combined_score);

  const container = document.querySelector("#milestone-chart");
  const containerWidth = Math.max(container.clientWidth, 480);
  const margin = {
    top: 20,
    right: 120,
    bottom: 40,
    left: containerWidth < 560 ? 120 : containerWidth < 760 ? 180 : 250
  };
  const width = Math.max(containerWidth - margin.left - margin.right, 320);
  const height = Math.max(data.length * 28, 320);

  const svg = d3.select("#milestone-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${containerWidth} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMinYMin meet")
    .style("width", "100%")
    .style("height", "auto")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Scales
  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.combined_score) || 0])
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(data.map(d => d.title))
    .range([0, height])
    .padding(0.2);

  // Continuous color scale with 5 color stops
  const minRisk = d3.min(data, d => d.risk_exposure) || 0;
  const maxRisk = d3.max(data, d => d.risk_exposure) || 0;
  
  const color = d3.scaleLinear()
    .domain([
      minRisk,
      minRisk + (maxRisk - minRisk) * 0.25,
      minRisk + (maxRisk - minRisk) * 0.5,
      minRisk + (maxRisk - minRisk) * 0.75,
      maxRisk
    ])
    .range([
      "#ffffb2",  // Very Low
      "#fecc5c",  // Low
      "#fd8d3c",  // Intermediate
      "#f03b20",  // High
      "#bd0026"   // Very High
    ])
    .clamp(true);

  const tooltip = d3.select("#tooltip");
  const maxLabelLength = containerWidth < 520 ? 10 : containerWidth < 700 ? 15 : 20;
  const truncateTitle = title => title.length > maxLabelLength ? `${title.slice(0, maxLabelLength)}…` : title;

  const formatRiskItem = r => {
    const name = r.title || r.name || `Risk #${r.id}`;
    const prob = r.probability ? ` (${r.probability})` : "";
    return `<li>${name}${prob}</li>`;
  };

  // Bars
  svg.selectAll("rect")
    .data(data, d => d.id)
    .join("rect")
    .attr("x", 0)
    .attr("y", d => y(d.title))
    .attr("width", d => x(d.combined_score))
    .attr("height", y.bandwidth())
    .attr("fill", d => color(d.risk_exposure))
    .attr("rx", 4)
    .on("mouseover", (event, d) => {
      const risks = Array.isArray(d.risks) ? d.risks : [];
      const riskList = risks.length > 0
        ? `<ul>${risks.map(formatRiskItem).join("")}</ul>`
        : "<div class='tooltip-empty'>No risks listed</div>";

      tooltip
        .style("visibility", "visible")
        .html(`
          <strong>${d.title}</strong><br>
          Priority: ${d.priority ?? "–"}<br>
          Risk Exposure: ${d.risk_exposure ?? "–"}<br>
          Combined Score: ${d.combined_score ?? "–"}<br>
          <div class="tooltip-heading">Risks</div>
          ${riskList}
        `);
    })
    .on("mousemove", event => {
      tooltip
        .style("left", `${event.pageX + 15}px`)
        .style("top", `${event.pageY - 30}px`);
    })
    .on("mouseout", () => {
      tooltip.style("visibility", "hidden");
    });

  svg.selectAll("text.label")
    .data(data)
    .join("text")
    .attr("x", d => x(d.combined_score) + 5)
    .attr("y", d => y(d.title) + y.bandwidth() / 2)
    .attr("dominant-baseline", "middle")
    .attr("font-size", "10px")
    .attr("fill", "#666")
    .text(d => d.combined_score);

    // Y Axis
  svg.append("g")
    .call(d3.axisLeft(y).tickFormat(truncateTitle))
    .selectAll("text")
    .attr("font-size", "13px")
    .attr("font-weight", "500")
    .append("title")
    .text(d => d);

  // X Axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(5))
    .selectAll("text")
    .attr("font-size", "10px")
    .attr("fill", "#888");
}


