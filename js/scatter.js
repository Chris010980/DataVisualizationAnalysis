// --------------------
// Layout & helpers
// --------------------
const container = d3.select(".plotarea");
const containerWidth = container.node().clientWidth;

const width = containerWidth;
const height = 450;

const margin = { top: 40, right: 30, bottom: 70, left: 80 };

// Time helpers
const parseYear = d3.timeParse("%Y");
const parseSeconds = d3.timeParse("%s");
const formatYear = d3.timeFormat("%Y");
const formatMinSec = d3.timeFormat("%M:%S");

// Tooltip
const tooltip = d3.select("#tooltip");

// --------------------
// Load data
// --------------------
d3.json("https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/cyclist-data.json")
  .then(data => {

    // --------------------
    // Data preparation
    // --------------------
    data.forEach(d => {
      d.YearParsed = parseYear(d.Year);
      d.TimeParsed = parseSeconds(d.Seconds);
      d.HasDoping = d.Doping !== "";
    });

    const xExtent = d3.extent(data, d => d.YearParsed);
    const yExtent = d3.extent(data, d => d.TimeParsed);

    // Add padding
    const xDomain = [
      d3.timeYear.offset(xExtent[0], -1),
      d3.timeYear.offset(xExtent[1], 1)
    ];

    const yDomain = [
      d3.timeSecond.offset(yExtent[1], 15),
      d3.timeSecond.offset(yExtent[0], -15)
    ];

    // --------------------
    // Scales
    // --------------------
    const xScale = d3.scaleTime()
      .domain(xDomain)
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleTime()
      .domain(yDomain)
      .range([height - margin.bottom, margin.top]);

    const colorScale = d3.scaleOrdinal()
      .domain([true, false])
      .range(["#4575b4", "#fdae61"]); // blue / orange (ColorBrewer-like)

    // --------------------
    // SVG
    // --------------------
    const svg = container.append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("width", "100%")
      .style("height", "auto");

    // --------------------
    // Points
    // --------------------
    svg.selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.YearParsed))
      .attr("cy", d => yScale(d.TimeParsed))
      .attr("r", 6)
      .attr("fill", d => colorScale(d.HasDoping))
      .attr("data-xvalue", d => d.YearParsed)
      .attr("data-yvalue", d => d.TimeParsed)
      .on("mouseover", (event, d) => {
        tooltip
          .style("visibility", "visible")
          .html(`
            <strong>${d.Name}</strong> (${d.Nationality})<br>
            Year: ${formatYear(d.YearParsed)}<br>
            Time: ${formatMinSec(d.TimeParsed)}<br>
            ${d.HasDoping ? `<br><em>${d.Doping}</em>` : "No doping allegations"}
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

    // --------------------
    // Axes
    // --------------------
    svg.append("g")
      .attr("id", "x-axis")
      .attr("class", "axis")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(8));

    svg.append("g")
      .attr("id", "y-axis")
      .attr("class", "axis")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale).tickFormat(formatMinSec));

    // Axis labels
    svg.append("text")
      .attr("class", "axis-label")
      .attr("x", width / 2)
      .attr("y", height - 20)
      .attr("text-anchor", "middle")
      .text("Year");

    svg.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .text("Time (minutes)");

    // --------------------
    // Legend (same style as other plots)
    // --------------------
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - margin.right - 160},${margin.top})`);

    const legendItems = [
      { label: "Doping allegations", value: true },
      { label: "No allegations", value: false }
    ];

    legend.selectAll("rect")
      .data(legendItems)
      .enter()
      .append("rect")
      .attr("x", 0)
      .attr("y", (d, i) => i * 24)
      .attr("width", 14)
      .attr("height", 14)
      .attr("fill", d => colorScale(d.value));

    legend.selectAll("text")
      .data(legendItems)
      .enter()
      .append("text")
      .attr("x", 22)
      .attr("y", (d, i) => i * 24 + 11)
      .attr("class", "legend-label")
      .text(d => d.label);

  });
