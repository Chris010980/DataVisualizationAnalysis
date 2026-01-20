const container = document.querySelector("#heatmap");
const width = container.clientWidth;
const height = Math.round(width * 0.5);

const isMobile = width < 480;

const margin = {
  top: 40,
  right: isMobile ? 5 : 30,
  bottom: isMobile ? 50 : 70,
  left: isMobile ? 50 : 80
};

const legend = {
  barX: 80,
  barY: 16,
  barHeight: 14,
  axisOffset: 10,
  sidePadding: 80,
  labelY: 70,
  captionY: 90
};

const innerWidth  = width  - margin.left - margin.right;
const innerHeight = height - margin.top  - margin.bottom;

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
    .range([0, innerWidth])
    .padding(0);

  const yScale = d3.scaleBand()
    .domain(months)
    .range([0, innerHeight])
    .padding(0);

  const colorScale = d3.scaleSequential()
    .interpolator(d3.interpolateRdYlBu)
    .domain([zMax, zMin]);

  // SVG
  const svg = d3.select("#heatmap")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("width", "100%")
    .style("height", "auto");

  const g = svg.append("g")
    .attr("class", "plot")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Description
  description.html(`
    <h3 class="figure-title">Global Temperature Variance</h3>
    <p class="figure-meta">
      Period: ${years[0]} – ${years[years.length - 1]}<br>
      Base temperature: ${baseTemp} °C
    </p>
  `);

  // Heatmap cells
  g.selectAll(".cell")
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
  const xTickStep =
    innerWidth < 500 ? 50 :
    innerWidth < 800 ? 30 :
    20;

  const xAxis = d3.axisBottom(xScale)
    .tickValues(years.filter(y => y % xTickStep === 0))
    .tickFormat(d => formatYear(parseYear(d)));

  g.append("g")
    .attr("class", "axis axis-x")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(xAxis);

  svg.append("text")
    .attr("class", "axis-label axis-label-x")
    .attr("x", margin.left + innerWidth / 2)
    .attr("y", height - 6)
    .text("Year");

  // Y axis
  const yAxis = d3.axisLeft(yScale)
    .tickFormat(d =>
      width < 500
        ? formatMonth(parseMonth(d)).slice(0, 3)
        : formatMonth(parseMonth(d))
    );

    g.append("g")
      .attr("class", "axis axis-y")
      .call(yAxis);

    // -------- Legend --------
    const legendWidth = Math.min(300, width * 0.6);
    const legendSvgWidth = legendWidth + 2 * legend.sidePadding;

    const legendScale = d3.scaleLinear()
      .domain([zMin, zMax])
      .range([0, legendWidth]);

    const legendSvg = legendContainer.append("svg")
      .attr("viewBox", `0 0 ${legendSvgWidth} 120`)
      .style("width", "100%")
      .style("height", "auto");

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
      .attr("x", legend.barX)
      .attr("y", legend.barY)
      .attr("width", legendWidth)
      .attr("height", legend.barHeight)
      .attr("fill", "url(#legend-gradient)");

    // Axis BELOW the bar with spacing
    legendSvg.append("g")
      .attr("transform",
        `translate(${legend.barX},${legend.barY + legend.barHeight + legend.axisOffset})`
      )
      .call(d3.axisBottom(legendScale).ticks(5));

    // Label with generous spacing
    legendSvg.append("text")
      .attr("x", legendSvgWidth / 2)
      .attr("y", legend.labelY)
      .attr("text-anchor", "middle")
      .attr("class", "legend-label")
      .text("Temperature deviation (°C)");

    // Label descriptopm
    legendSvg.append("text")
      .attr("x", legendSvgWidth / 2)
      .attr("y", legend.captionY)
      .attr("text-anchor", "middle")
      .attr("class", "legend-caption")
      .text("Blue colors indicate colder-than-average years, red colors warmer-than-average.");
});
