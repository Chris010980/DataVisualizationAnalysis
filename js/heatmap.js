const container = document.querySelector("#heatmap");
const containerWidth = container.clientWidth;

const width = containerWidth;
const height = Math.round(containerWidth * 0.5);
const margin = { top: 40, right: 30, bottom: 80, left: 80 };

// Time helpers
const parseYear = d3.timeParse("%Y");
const parseMonth = d3.timeParse("%m");
const formatYear = d3.timeFormat("%Y");
const formatMonth = d3.timeFormat("%B");

// Tooltip
const tooltip = d3.select("#tooltip");

// Description & legend containers
const description = d3.select("#description");
const legendContainer = d3.select("#legend");

// Load data
d3.json("../data/temperature.json").then(data => {
  const baseTemp = data.baseTemperature;
  const values = data.monthlyVariance;

  const years = [...new Set(values.map(d => d.year))];
  const months = d3.range(1, 13);

  const zMin = d3.min(values, d => d.variance);
  const zMax = d3.max(values, d => d.variance);

  // Scales
  const xScale = d3.scaleBand()
    .domain(years)
    .range([margin.left, width - margin.right])
    .padding(0);

  const yScale = d3.scaleBand()
    .domain(months)
    .range([margin.top, height - margin.bottom])
    .padding(0);

  const colorScale = d3.scaleSequential()
    .interpolator(d3.interpolateRdYlBu)
    .domain([zMax, zMin]);

  // SVG
  const svg = d3.select("#heatmap")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "auto");

  // Description
  description.html(`
    <h3 class="figure-title">Global Temperature Variance</h3>
    <p class="figure-meta">
      Period: ${years[0]} – ${years[years.length - 1]}<br>
      Base temperature: ${baseTemp} °C
    </p>
  `);

  // Heatmap cells
  svg.selectAll(".cell")
    .data(values)
    .enter()
    .append("rect")
    .attr("class", "cell")
    .attr("x", d => xScale(d.year))
    .attr("y", d => yScale(d.month))
    .attr("width", xScale.bandwidth())
    .attr("height", yScale.bandwidth())
    .attr("fill", d => colorScale(d.variance))
    .attr("data-year", d => d.year)
    .attr("data-month", d => d.month - 1)
    .attr("data-temp", d => d.variance)
    .on("mouseover", (event, d) => {
      tooltip
        .style("visibility", "visible")
        .html(`
          <strong>${formatMonth(parseMonth(d.month))} ${d.year}</strong><br>
          Deviation: ${d.variance.toFixed(2)} °C
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

  // X axis
  const xAxis = d3.axisBottom(xScale)
    .tickValues(years.filter(y => y % 20 === 0))
    .tickFormat(d => formatYear(parseYear(d)));

  svg.append("g")
    .attr("id", "x-axis")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis);

  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height - 20)
    .attr("text-anchor", "middle")
    .text("Year");

  // Y axis
  const yAxis = d3.axisLeft(yScale)
    .tickFormat(d => formatMonth(parseMonth(d)));

  svg.append("g")
    .attr("id", "y-axis")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis);

    // -------- Legend --------
    const legendWidth = Math.min(360, width * 0.6);
    const legendHeight = 18;

    const legendScale = d3.scaleLinear()
      .domain([zMin, zMax])
      .range([0, legendWidth]);

    const legendSvg = legendContainer
      .append("svg")
      .attr("viewBox", `0 0 ${legendWidth + 360} 140`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .classed("legend-svg", true);

    const legendGradient = legendSvg
      .append("defs")
      .append("linearGradient")
      .attr("id", "legend-gradient");

    d3.range(0, 1.01, 0.01).forEach(t => {
      legendGradient.append("stop")
        .attr("offset", `${t * 100}%`)
        .attr("stop-color", colorScale(zMin + t * (zMax - zMin)));
    });

    // Gradient bar
    legendSvg.append("rect")
      .attr("x", 180)
      .attr("y", 15)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)");

    // Axis BELOW the bar with spacing
    legendSvg.append("g")
      .attr("transform", `translate(180,${15 + legendHeight + 12})`)
      .call(d3.axisBottom(legendScale).ticks(6))
      .attr("class", "legend-axis");

    // Label with generous spacing
    legendSvg.append("text")
      .attr("x", (legendWidth + 360) / 2)
      .attr("y", 90)
      .attr("text-anchor", "middle")
      .attr("class", "legend-label")
      .text("Temperature deviation (°C)");

    // Label descriptopm
    legendSvg.append("text")
    .attr("x", (legendWidth + 360) / 2)
    .attr("y", 115)
    .attr("text-anchor", "middle")
    .attr("class", "legend-caption")
    .text("Blue colors indicate colder-than-average years, red colors warmer-than-average.");
});
