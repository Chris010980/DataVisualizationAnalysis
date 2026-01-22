// ---------- Layout ----------
const BREAKPOINTS = {
  mobile: 480,
  small: 700
};

const container = d3.select("#scatter");
const width  = container.node().clientWidth;
const isMobile = width < BREAKPOINTS.mobile;

const ASPECT_RATIOS = {
  heatmap: isMobile ? 0.6 : 0.5,
  scatter: isMobile ? 0.65 : 0.55
};

const height = Math.round(width * ASPECT_RATIOS.scatter);

const margin = {
  top: 40,
  right: isMobile ? 10 : 30,
  bottom: 70,
  left: isMobile ? 40 : 80
};

const innerWidth  = width  - margin.left - margin.right;
const innerHeight = height - margin.top  - margin.bottom;

const LEGEND_LAYOUT = {
  mobile: {
    offsetY: 40,
    itemSpacingX: 140,
    itemSpacingY: 0
  },
  desktop: {
    offsetY: 10,
    itemSpacingX: 0,
    itemSpacingY: 22
  }
};

const layout = isMobile ? LEGEND_LAYOUT.mobile : LEGEND_LAYOUT.desktop;

// ---------- Time helpers ----------
const parseYear     = d3.timeParse("%Y");
const parseSeconds  = d3.timeParse("%s");
const formatYear    = d3.timeFormat("%Y");
const formatMinSec  = d3.timeFormat("%M:%S");

// ---------- Tooltip ----------
const tooltip = d3.select("#tooltip");

// ---------- SVG ----------
const svg = container.append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .style("width", "100%")
  .style("height", "auto");

const g = svg.append("g")
  .attr("class", "plot")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// ---------- Load data ----------
d3.json("https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/cyclist-data.json")
  .then(data => {

    // ---------- Data preparation ----------
    data.forEach(d => {
      d.YearParsed = parseYear(d.Year);
      d.TimeParsed = parseSeconds(d.Seconds);
      d.HasDoping  = d.Doping !== "";
    });

    const xExtent = d3.extent(data, d => d.YearParsed);
    const yExtent = d3.extent(data, d => d.TimeParsed);

    const xDomain = [
      d3.timeYear.offset(xExtent[0], -1),
      d3.timeYear.offset(xExtent[1],  1)
    ];

    const yDomain = [
      d3.timeSecond.offset(yExtent[1],  15),
      d3.timeSecond.offset(yExtent[0], -15)
    ];

    // ---------- Scales ----------
    const xScale = d3.scaleTime()
      .domain(xDomain)
      .range([0, innerWidth]);

    const yScale = d3.scaleTime()
      .domain(yDomain)
      .range([innerHeight, 0]);

    const colorScale = d3.scaleOrdinal()
      .domain([true, false])
      .range(["#4575b4", "#fdae61"]);

    // ---------- Points ----------
    g.selectAll(".dot")
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
          .style("left", `${event.pageX + 12}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

    // ---------- Axes ----------
    function responsiveTicks(size, breakpoints) {
      for (const [limit, ticks] of breakpoints) {
        if (size < limit) return ticks;
      }
      return breakpoints.at(-1)[1];
    }

    const xTicks = responsiveTicks(innerWidth, [
      [400, 4],
      [700, 6],
      [Infinity, 8]
    ]);

    const yTicks =
      innerHeight < 300 ? 4 : 6;

    g.append("g")
      .attr("id", "x-axis")
      .attr("class", "axis axis-x")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(xTicks));

    const formatTimeMobile = d3.timeFormat("%M");
    const formatTimeFull   = d3.timeFormat("%M:%S");

    const yAxis = d3.axisLeft(yScale)
      .ticks(yTicks)
      .tickFormat(d => isMobile ? formatTimeMobile(d) : formatTimeFull(d));

    g.append("g")
      .attr("id", "y-axis")
      .attr("class", "axis axis-y")
      .call(yAxis);

    // ---------- Axis labels ----------
    svg.append("text")
      .attr("class", "axis-label axis-label-x")
      .attr("x", margin.left + innerWidth / 2)
      .attr("y", isMobile ? height - 40 : height - 5)
      .attr("text-anchor", "middle")
      .text("Year");

    svg.append("text")
      .attr("class", "axis-label axis-label-y")
      .attr("transform", "rotate(-90)")
      .attr("x", -(margin.top + innerHeight / 2))
      .attr("y", isMobile ? 10 : 18 )
      .attr("text-anchor", "middle")
      .text(isMobile ? "Time (minutes)" : "Time (mm:ss)");

      // ---------- Legend ----------
      const legendItems = [
        { label: "Doping allegations", value: true },
        { label: "No allegations", value: false }
      ];

      // Position abhängig vom Viewport
      let legendX, legendY;

      if (isMobile) {
        // unterhalb des Plots
        legendX = margin.left;
        legendY = innerHeight + layout.offsetY;
      } else {
        // inside plot, top-right
        legendX = innerWidth - 160;
        legendY = layout.offsetY;
      }

      const legend = g.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${legendX}, ${legendY})`);

      // Optional: horizontal layout auf Mobile
      legend.selectAll("rect")
        .data(legendItems)
        .enter()
        .append("rect")
        .attr("x", (d, i) => i * layout.itemSpacingX)
        .attr("y", (d, i) => i * layout.itemSpacingY)
        .attr("width", 14)
        .attr("height", 14)
        .attr("fill", d => colorScale(d.value));

      legend.selectAll("text")
        .data(legendItems)
        .enter()
        .append("text")
        .attr("x", (d, i) => i * layout.itemSpacingX + 22)
        .attr("y", (d, i) => i * layout.itemSpacingY + 11)
        .attr("class", "legend-label")
        .text(d => d.label);

  });
