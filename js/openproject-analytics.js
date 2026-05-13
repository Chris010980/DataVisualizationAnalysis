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

  const margin = { top: 20, right: 30, bottom: 40, left: 250 };
  const width = 900 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3.select("#milestone-chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Scales
  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.combined_score)])
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(data.map(d => d.title))
    .range([0, height])
    .padding(0.2);

  const color = d3.scaleSequential()
    .domain([0, d3.max(data, d => d.risk_exposure)])
    .interpolator(d3.interpolateOrRd);

  // Bars
  svg.selectAll("rect")
    .data(data, d => d.id)
    .join("rect")
    .attr("x", 0)
    .attr("y", d => y(d.title))
    .attr("width", d => x(d.combined_score))
    .attr("height", y.bandwidth())
    .attr("fill", d => color(d.risk_exposure))
    .attr("rx", 4);            // leichte Rundung

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
    .call(d3.axisLeft(y))
    .selectAll("text")
    .attr("font-size", "13px")
    .attr("font-weight", "500");

  // X Axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(5))
    .selectAll("text")
    .attr("font-size", "10px")
    .attr("fill", "#888");
}


