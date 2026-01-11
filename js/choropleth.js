const width = 1000;
const height = 600;
const padding = 50;

// define tooltip
var tooltip = d3.select(".plotarea").
append("div").
attr("id", "tooltip").
style("visibility", "hidden").
style("background-color", "lightsteelblue").
style("padding", "10px");

// define the path to draw the map
var identity = d3.geoIdentity();
var path = d3.geoPath(identity);

// plotarea of the svg (the canvas)
var svg = d3.select(".plotarea").
append("svg").
attr("width", width).
attr("height", height);

// description
var descript = d3.select(".header").
append("description");

// legend
var legend = d3.select(".header").
append("legend").
attr("height", 0).
attr("margin-bottom", 0);

// First we need the data that has to be plotted
Promise.all([
d3.json("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json"),
d3.json("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json")])
// then we can extract the data, process it and finally plot it
.then(data => {
  // split data into the two downloaded files
  var bachDeg = data[0];
  var usCountyMap = data[1];

  console.log(bachDeg[0]);
  // min and max values for the color scale
  var maxBach = d3.max(bachDeg.map(d => d.bachelorsOrHigher));
  var minBach = d3.min(bachDeg.map(d => d.bachelorsOrHigher));

  // define colorscale for the map
  var myColor = d3.scaleSequential().
  interpolator(d3.interpolateGreens).
  domain([minBach, maxBach]);
  var len = 500;

  // convert topoJson to geoJson in order to work with D3
  var geojson = topojson.feature(usCountyMap, usCountyMap.objects.counties);
  identity.fitSize([width, height], geojson);

  svg.append("g").
  selectAll("path").
  data(geojson.features).
  enter().
  append("path").
  attr("class", "county").
  attr("data-fips", d => {return d.id;}).
  attr("data-education", d => {
    var fips = bachDeg.filter(obj => {return obj.fips === d.id;});
    if (fips[0]) {
      return fips[0].bachelorsOrHigher;
    } else {
      console.log("Found no fips for id: " + d.id);
      return 0;
    }
  })
  // now append the actual map
  .attr("d", path).
  attr("fill", d => {
    var fips = bachDeg.filter(obj => {return obj.fips === d.id;});
    if (fips[0]) {
      return myColor(fips[0].bachelorsOrHigher);
    } else {
      console.log("Found no fips for id: " + d.id);
      return "white";
    }
  }).
  attr("stroke", "white").
  attr("stroke-width", 0.1)
  // append tooltip
  .on("mouseover", function (e, d) {
    var localBachelorData = bachDeg.filter(obj => {return obj.fips === d.id;});
    tooltip.html("State: " + localBachelorData[0].state +
    "<br/>County: " + localBachelorData[0].area_name +
    "<br/>Higher Education rate: " + localBachelorData[0].bachelorsOrHigher + "%").
    style("visibility", "visible").
    attr('data-education', this.getAttribute('data-education')).
    style('left', event.pageX + 10 + 'px').
    style('top', event.pageY - 100 + 'px');
  }).
  on("mouseout", () => {tooltip.style("visibility", "hidden");});

  //append description
  descript.append("h3").
  attr("id", "description").
  text("Percentage of adults above an age of 24 with at least a bachelors degree");

  // append legend
  legend.append("text").
  attr("id", "legend-text").
  text("Percentage Range of Higher Education: " + minBach.toFixed(1) + "%");

  legend.append("svg").
  attr("height", 50).
  attr("id", "legend").
  selectAll("rect").
  data([...Array(len).keys()]).
  enter().
  append("rect").
  attr("x", (d, i) => {return i;}).
  attr("y", 20).
  attr("height", 30).
  attr("width", 2).
  attr("fill", (d, i) => {var val = minBach + i / len * (maxBach - minBach);return myColor(val);});

  legend.append("text").
  attr("id", "legend-text").
  text(maxBach.toFixed(1) + "%");
})
// catch error and print to console
.catch(err => {console.log(err);});
