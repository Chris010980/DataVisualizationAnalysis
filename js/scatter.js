const width = 800;
const height = 400;
const padding = 50;

// Time-Formatter and -Parser
var timeParseYear = d3.timeParse("%Y");
var timeParseSeconds = d3.timeParse("%s");
var timeFormatYear = d3.timeFormat("%Y");
var timeFormatMinSec = d3.timeFormat("%M:%S");

// define tooltip
var tooltip = d3.select(".plotarea").
append("div").
attr("id", "tooltip").
style("visibility", "hidden").
style("background-color", "lightsteelblue").
style("padding", "10px");

// First we need the data that has to be plotted
d3.json("https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/cyclist-data.json")
// then we can extract the data, process it and finally plot it
.then(data => {
  console.log(data);
  // x- and y-values in oder to determine the domain
  var xData = data.map(x => timeParseYear(x.Year));
  var yData = data.map(y => timeParseSeconds(y.Seconds));
  var dopingData = data.map(z => z.Doping);
  var nameData = data.map(name => name.Name);
  var nationalityData = data.map(nation => nation.Nationality);
  var len = xData.length;

  // next we determine the min and max for x- and y-ranges
  var xMin = d3.min(xData);
  var xMax = d3.max(xData);
  var yMin = d3.min(yData);
  var yMax = d3.max(yData);

  // we add some offset
  var xMinOff = d3.timeYear.offset(xMin, -1);
  var xMaxOff = d3.timeYear.offset(xMax, 1);
  var yMinOff = d3.timeSecond.offset(yMin, -15);
  var yMaxOff = d3.timeSecond.offset(yMax, 15);

  // we have to scale the data
  var xScale = d3.scaleTime().
  domain([xMinOff, xMaxOff]).
  range([2 * padding, width - 0.5 * padding]);
  var yScale = d3.scaleTime().
  domain([yMaxOff, yMinOff]).
  range([height - padding, 0]);

  // append svg to div with class plotarea
  var svg = d3.select(".plotarea").
  append("svg").
  attr("width", width).
  attr("height", height);

  // append rect to svg
  svg.selectAll("circle").
  data(data).
  enter().
  append("circle").
  attr('class', 'dot').
  attr('index', (d, i) => i).
  attr("cx", (d, i) => {return xScale(xData[i]);}).
  attr("cy", (d, i) => {return yScale(yData[i]) + padding;}).
  attr("data-xvalue", (d, i) => {return xData[i];}).
  attr("data-yvalue", (d, i) => {return yData[i];}).
  attr("r", 7).
  attr("transform", "translate(0," + -padding + ")").
  attr("width", 1).
  attr("height", d => {return height - yScale(d) - padding;}).
  attr("fill", (d, i) => {return dopingData[i] == "" ? "orange" : "blue";})
  // append tooltip
  .on("mouseover", function (e, d) {
    var index = this.getAttribute('index');
    if (dopingData[index] != "") {
      tooltip.html("Name: " + nameData[index] +
      "<br/>Country: " + nationalityData[index] +
      "<br/>Time: " + timeFormatMinSec(yData[index]) +
      "<br/>Year: " + timeFormatYear(xData[index]) +
      "<br/><br/>" + dopingData[index]).
      style("visibility", "visible").
      attr('data-year', xData[index]).
      style("left", xScale(xData[index]) + 600 + "px").
      style("top", height - 200 + "px");
    } else {
      tooltip.html("Name: " + nameData[index] +
      "<br/>Country: " + nationalityData[index] +
      "<br/>Time: " + timeFormatMinSec(yData[index]) +
      "<br/>Year: " + timeFormatYear(xData[index])).
      style("visibility", "visible").
      attr('data-year', xData[index]).
      style("left", xScale(xData[index]) + 600 + "px").
      style("top", height - 200 + "px");
    }
  }).
  on("mouseout", () => {
    tooltip.style("visibility", "hidden");
  });

  // append legend (manually as there are only two values)
  svg.append("rect").
  attr("id", "legend").
  attr("x", width - 50).
  attr("y", height / 2 - 50).
  attr("fill", "orange").
  attr("width", 25).
  attr("height", 25);

  svg.append('text').
  attr("id", "legend").
  attr('x', width - 210).
  attr('y', height / 2 - 33).
  text('No Doping Allegations');

  svg.append("rect").
  attr("id", "legend").
  attr("x", width - 50).
  attr("y", height / 2 - 90).
  attr("fill", "blue").
  attr("width", 25).
  attr("height", 25);

  svg.append('text').
  attr("id", "legend").
  attr('x', width - 210).
  attr('y', height / 2 - 72).
  text('Doping Allegations');

  // y-label
  svg.append('text').
  attr('transform', 'rotate(-90)').
  attr("id", "ylabel").
  attr('x', -250).
  attr('y', 30).
  text('Time in Minutes');

  // define x- and y-axis and append it to svg
  var xAxis = d3.axisBottom(xScale);
  svg.append("g").
  attr("transform", "translate(0," + (height - padding) + ")").
  attr("id", "x-axis").
  attr("class", "axis").
  call(xAxis);

  var yAxis = d3.axisLeft(yScale).
  tickFormat(timeFormatMinSec);
  svg.append("g").
  attr("transform", "translate(" + 2 * padding + ",0)").
  attr("id", "y-axis").
  attr("class", "axis").
  call(yAxis);
});