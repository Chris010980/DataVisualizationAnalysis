// ---------- Layout ----------
const container = document.querySelector(".plotarea");
const width = container.clientWidth;
const height = Math.round(width * 0.6);

const margin = { top: 20, right: 20, bottom: 20, left: 20 };

// Tooltip
const tooltip = d3.select(".plotarea")
  .append("div")
  .attr("id", "tooltip")
  .style("visibility", "hidden");

// SVG
const svg = d3.select(".plotarea")
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .attr("preserveAspectRatio", "xMidYMid meet")
  .style("width", "100%")
  .style("height", "auto");

// Description & legend containers
const description = d3.select("#description");
const legendContainer = d3.select("#legend");

// Geo
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

  // Color scale (sequential, like Heatmap)
  const colorScale = d3.scaleSequential()
    .interpolator(d3.interpolateGreens)
    .domain([minEdu, maxEdu]);

  // Topo → Geo
  const geojson = topojson.feature(counties, counties.objects.counties);
  projection.fitSize([width, height], geojson);

  // ---------- Map ----------
  svg.append("g")
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
    .attr("stroke-width", 0.2)
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
          Bachelor's degree or higher: ${edu.bachelorsOrHigher.toFixed(1)} %
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

  // ---------- Description ----------
  description.html(`
    <h3>Educational Attainment in the United States</h3>
    <p>
      Share of adults (25+) holding at least a bachelor's degree,
      shown at county level.
    </p>
  `);

  // ---------- Legend (same style as Heatmap) ----------
  const legendWidth = Math.min(300, width * 0.5);
  const legendHeight = 12;

  const legendScale = d3.scaleLinear()
    .domain([minEdu, maxEdu])
    .range([0, legendWidth]);

  const legendSvg = legendContainer
    .append("svg")
    .attr("viewBox", `0 0 ${legendWidth + 160} 110`)
    .style("width", "100%")
    .style("height", "auto");

  const gradient = legendSvg.append("defs")
    .append("linearGradient")
    .attr("id", "legend-gradient");

  d3.range(0, 1.01, 0.01).forEach(t => {
    gradient.append("stop")
      .attr("offset", `${t * 100}%`)
      .attr("stop-color", colorScale(minEdu + t * (maxEdu - minEdu)));
  });

  legendSvg.append("rect")
    .attr("x", 80)
    .attr("y", 16)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)");

  legendSvg.append("g")
    .attr("transform", `translate(80,${16 + legendHeight + 8})`)
    .attr("class", "legend-axis2")
    .call(
      d3.axisBottom(legendScale)
        .ticks(5)
        .tickFormat(d => `${d}%`)
    );

  legendSvg.append("text")
    .attr("x", (legendWidth + 160) / 2)
    .attr("y", 72)
    .attr("text-anchor", "middle")
    .attr("class", "legend-label2")
    .text("Population with bachelor's degree (%)");

  legendSvg.append("text")
    .attr("x", (legendWidth + 160) / 2)
    .attr("y", 92)
    .attr("text-anchor", "middle")
    .attr("class", "legend-caption2")
    .text("County-level data; darker green indicates higher values.");
});
