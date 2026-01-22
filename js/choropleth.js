
// ---------- Layout ----------
const container = document.querySelector("#choropleth");
const width  = container.clientWidth;
const height = Math.round(width * 0.6);

const isMobile = width < 480;

const margin = {
  top: 20,
  right: isMobile ? 5 : 20,
  bottom: isMobile ? 20 : 30,
  left: isMobile ? 10 : 20
};
const innerWidth  = width  - margin.left - margin.right;
const innerHeight = height - margin.top  - margin.bottom;

// ---------- Tooltip ----------
const tooltip = d3.select("#choropleth")
  .append("div")
  .attr("id", "tooltip")
  .style("visibility", "hidden");

// ---------- SVG ----------
const svg = d3.select("#choropleth")
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .style("width", isMobile ? "123%" : "113%")
  .style("height", "auto");

const g = svg.append("g")
  .attr("class", "plot")
  .attr("transform", isMobile ? `translate(-45,20)` : `translate(-85,20)`);

// ---------- Description & Legend ----------
const description = d3.select("#description");
const legendContainer = d3.select("#legend");

// ---------- Projection ----------
const projection = d3.geoIdentity();
const path = d3.geoPath(projection);

// ---------- Data ----------
Promise.all([
  d3.json("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json"),
  d3.json("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json")
]).then(([education, counties]) => {

  const educationByFips = new Map(
    education.map(d => [d.fips, d])
  );

  const minEdu = d3.min(education, d => d.bachelorsOrHigher);
  const maxEdu = d3.max(education, d => d.bachelorsOrHigher);

  // ---------- Color Scale ----------
  const colorScale = d3.scaleSequential()
    .domain([minEdu, maxEdu])
    .interpolator(d3.interpolateGreens);

  // ---------- Geo ----------
  const geojson = topojson.feature(counties, counties.objects.counties);
  projection.fitSize([innerWidth, innerHeight], geojson);

  // ---------- Map ----------
  g.append("g")
    .selectAll("path")
    .data(geojson.features)
    .enter()
    .append("path")
    .attr("class", "county")
    .attr("d", path)
    .attr("fill", d => {
      const edu = educationByFips.get(d.id);
      return edu ? colorScale(edu.bachelorsOrHigher) : "#eee";
    })
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.3)
    .attr("data-fips", d => d.id)
    .attr("data-education", d => {
      const edu = educationByFips.get(d.id);
      return edu ? edu.bachelorsOrHigher : 0;
    })
    .on("mouseover", (event, d) => {
      const edu = educationByFips.get(d.id);
      if (!edu) return;

      tooltip
        .style("visibility", "visible")
        .html(`
          <strong>${edu.area_name}, ${edu.state}</strong><br>
          Bachelor's degree or higher: ${edu.bachelorsOrHigher.toFixed(1)}%
        `);
    })
    .on("mousemove", event => {
      tooltip
        .style("left", `${event.pageX + 12}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mouseout", () => {
      tooltip.style("visibility", "hidden");
    });

  // ---------- Description ----------
  description.html(`
    <h3 class="figure-title">Educational Attainment in the United States</h3>
    <p class="figure-meta">
      Share of adults aged 25+ holding at least a bachelor's degree,
      shown at county level.
    </p>
  `);

  // ---------- Legend ----------
  const legendWidth  = Math.min(320, width * 0.6);
  const legendHeight = 12;

  const legendScale = d3.scaleLinear()
    .domain([minEdu, maxEdu])
    .range([0, legendWidth]);

  const legendSvg = legendContainer
    .append("svg")
    .attr("viewBox", `0 0 ${legendWidth + 160} 110`)
    .style("width", "100%")
    .style("height", "auto");

  // Gradient
  const gradient = legendSvg.append("defs")
    .append("linearGradient")
    .attr("id", "choropleth-gradient");

  d3.range(0, 1.01, 0.01).forEach(t => {
    gradient.append("stop")
      .attr("offset", `${t * 100}%`)
      .attr("stop-color", colorScale(minEdu + t * (maxEdu - minEdu)));
  });

  legendSvg.append("rect")
    .attr("x", 80)
    .attr("y", 18)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#choropleth-gradient)");

  legendSvg.append("g")
    .attr("class", "legend-axis")
    .attr("transform", `translate(80,${18 + legendHeight + 8})`)
    .call(
      d3.axisBottom(legendScale)
        .ticks(5)
        .tickFormat(d => `${d}%`)
    );

  legendSvg.append("text")
    .attr("x", (legendWidth + 160) / 2)
    .attr("y", 74)
    .attr("text-anchor", "middle")
    .attr("class", "legend-label")
    .text("Population with bachelor's degree (%)");

  legendSvg.append("text")
    .attr("x", (legendWidth + 160) / 2)
    .attr("y", 94)
    .attr("text-anchor", "middle")
    .attr("class", "legend-caption")
    .text("County-level data; darker green indicates higher values.");
});
