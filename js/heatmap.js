//import * as d3Colorbar from "https://cdn.skypack.dev/d3-colorbar@0.0.1";
const width = 1200;
const height = 600;
const padding = 50;

// Time-Formatter and -Parser
var timeParseYear = d3.timeParse("%Y");
var timeParseMonth = d3.timeParse("%m");
var timeFormatYear = d3.timeFormat("%Y");
var timeFormatMonth = d3.timeFormat("%B");

// define tooltip
var tooltip = d3.select("#tooltip").
append("div").
attr("id", "tooltip").
style("visibility", "hidden").
style("background-color", "lightsteelblue").
style("padding", "10px");

// description
var descript = d3.select(".header").
append("description");

// legend
var legend = d3.select(".header").
append("legend").
attr("height", 0).
attr("margin-bottom", 0);

// First we need the data that has to be plotted

//d3.json("https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json")
// use local storage for development
d3.json("./temperature.json")

// then we can extract the data, process it and finally plot it
.then(data => {
  var baseTemp = data.baseTemperature;
  var dataArr = data.monthlyVariance;
  var xData = dataArr.map(x => x.year);
  var yData = dataArr.map(y => y.month);
  var zData = dataArr.map(z => z.variance);

  // next we determine the min and max for z-range
  var zMin = d3.min(zData);
  var zMax = d3.max(zData);

  // we have to scale the data
  var xScale = d3.scaleBand().
  domain(xData).
  range([2 * padding, width - 0.5 * padding]);
  var yScale = d3.scaleBand().
  domain(yData).
  range([0, height - padding]);
  var myColor = d3.scaleSequential().
  interpolator(d3.interpolateRdYlBu).
  domain([zMax, zMin]);
  var colorScale = d3.scaleLinear().
  domain([zMin, (zMin + zMax) / 2, zMax]).
  range(['#4575b4', '#ffffbf', '#d73027']);
  var zScale = d3.scaleLinear().
  domain([zMin, zMax]).
  range([0, 500]);

  // append svg to div with class plotarea
  var svg = d3.select("#heatmap").
  append("svg").
  attr("width", width).
  attr("height", height);

  // append description
  descript.append("h3").
  attr("id", "description").
  html("Period: " + xData[0] + " - " + xData[xData.length - 1] +
  "<br/>Base Temperature: " + baseTemp + "°C");
  // append legend
  legend.append("text").
  attr("id", "legend-text").
  text("Temperature Deviation: " + zMin.toFixed(1) + "°C");

  legend.append("svg").
  attr("height", 50).
  attr("id", "legend").
  selectAll("rect").
  data(zData).
  enter().
  append("rect").
  attr("x", (d, i) => {var val = zMin + i / zData.length * (zMax - zMin);return zScale(val);}).
  attr("y", 20).
  attr("height", 30).
  attr("width", 2).
  attr("fill", (d, i) => {var val = zMin + i / zData.length * (zMax - zMin);return colorScale(val);});

  legend.append("text").
  attr("id", "legend-text").
  text(zMax.toFixed(1) + "°C");

  // append rect to svg
  svg.selectAll("rect").
  data(dataArr).
  enter().
  append("rect").
  attr('class', 'cell').
  attr('index', (d, i) => i).
  attr("x", (d, i) => {return xScale(xData[i]);}).
  attr("y", (d, i) => {return yScale(yData[i]);}).
  attr("width", xScale.bandwidth()).
  attr("height", yScale.bandwidth()).
  attr("fill", (d, i) => {return myColor(zData[i]);}).
  attr("data-year", (d, i) => {return xData[i];}).
  attr("data-month", (d, i) => {return yData[i] - 1;}).
  attr("data-temp", (d, i) => {return zData[i];})
  // append tooltip
  .on("mouseover", function (e, d) {
    var index = this.getAttribute('index');
    tooltip.html("Year: " + xData[index] +
    "<br/>Month: " + timeFormatMonth(timeParseMonth(yData[index])) +
    "<br/>Deviation: " + zData[index].toFixed(1)).
    style("visibility", "visible").
    attr('data-year', xData[index]).
    style("left", xScale(xData[index]) + 300 + "px").
    style("top", yScale(yData[index]) + 150 + "px");
  }).
  on("mouseout", () => {tooltip.style("visibility", "hidden");});

  // append x-label
  svg.append('text').
  attr("id", "xlabel").
  attr('x', 600).
  attr('y', 600).
  text('Year');

  // define x- and y-axis and append it to svg
  var xAxis = d3.axisBottom().
  scale(xScale).
  tickValues(xScale.domain().filter(year => {
    // set ticks to years divisible by 10
    return year % 20 === 0;
  })).

  tickFormat(year => {return timeFormatYear(timeParseYear(year));}).
  tickSize(10, 1);

  svg.append("g").
  attr("transform", "translate(0," + (height - padding) + ")").
  attr("class", "axis").
  attr("id", "x-axis").
  call(xAxis);

  var yAxis = d3.axisLeft().
  scale(yScale).
  tickValues(yScale.domain()).
  tickFormat(month => {return timeFormatMonth(timeParseMonth(month));}).
  tickSize(10, 1);
  svg.append("g").
  attr("transform", "translate(" + 2 * padding + ",0)").
  attr("id", "y-axis").
  attr("class", "axis").
  call(yAxis);

});
