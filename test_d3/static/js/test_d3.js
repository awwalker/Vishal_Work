// set the stage for the visualization
var margin = {top: 20, right: 80, bottom: 30, left: 50},
    w = 660 - margin.left - margin.right,
    h = 400 - margin.top - margin.bottom,
    x = d3.time.scale().range([0, w]),
    y = d3.scale.linear().range([h, 0]);
    parseDate = d3.time.format("%Y").parse;

var color = d3.scale.category10(); // to generate a different color for each line

// to be used later
var countries,
    filtered,
    transpose;

// where the line gets its properties, how it will be interpolated
var line = d3.svg.line()
   .interpolate("basis")
   .x(function(d) { return x(d.year); })
   .y(function(d) { return y(d.stat); });

// add svg box where viz will go
var svg = d3.select("body").append("svg")
    .attr("width", w + margin.left + margin.right)
    .attr("height", h + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// define the x axis and its class, append it to svg
var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
   svg.append("svg:g")
    .attr("class", "x axis");

// define the y axis and its class, append it to svg
var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    svg.append("svg:g")
    .attr("class", "y axis");

// force data to update when menu is changed
var menu = d3.select("#menu select")
.on("change", change);

// put data from csv into countries variable
//run redraw function that will refresh whenever a new data series is selected
d3.csv("../static/data/brics-mist.csv", function(csv) {
	countries = csv;
    redraw();
});

d3.select(window)
.on("keydown", function() { altKey = d3.event.altKey; })
.on("keyup", function() { altKey = false; });

var altKey;

// set terms of transition that will take place
// when a new economic indicator is chosen
function change() {
clearTimeout(timeout);

d3.transition()
  .duration(altKey ? 7500 : 1500)
  .each(redraw);
}

// all the meat goes in the redraw function
function redraw() {

// create data nests based on economic indicator (series)
var nested = d3.nest()
	.key(function(d) { return d.indicatorCode; })
	.map(countries)
console.log(nested);
// get value from menu selection
// the option values are set in HTML and correspond
//to the [indicatorCode] value we used to nest the data
var series = menu.property("value");
console.log(series);
// only retrieve data from the selected series, using the nest we just created
var data = nested[series];
console.log(data);
// for object constancy we will need to set "keys", one for each country.
// the keyring variable contains only the names of the countries
var keyring = d3.keys(data[0]).filter(function(key) {
 	    return (key !== "indicatorName" && key !== "yearCode" && key !== "indicatorCode" && key !== "year");
 	});
console.log(keyring);
// get the year and related statistics, map them to each country separately
var transpose = keyring.map(function(name) {
        return {
          name: name,
          values: data.map(function(d) {
            return {year: parseDate(d.year), stat: +d[name]};
          })
        };
    });
console.log(transpose);
// set the x and y domains as the max and min
// of the related year and statistics, respectively
x.domain([
d3.min(transpose, function(c) { return d3.min(c.values, function(v) { return v.year; }); }),
d3.max(transpose, function(c) { return d3.max(c.values, function(v) { return v.year; }); })
]);

y.domain([
d3.min(transpose, function(c) { return d3.min(c.values, function(v) { return v.stat; }); }),
d3.max(transpose, function(c) { return d3.max(c.values, function(v) { return v.stat; }); })
]);

// announce to d3 that we will be using something called
// "country" that makes use of the transposed data
var country = svg.selectAll(".country")
  .data(transpose);

// create separate groups for each country
// assign them a class and individual IDs (for styling)
var countryEnter = country.enter().append("g")
  .attr("class", "country")
  .attr("id", function(d) { return d.name; });

// draw the lines and color them according to their names
countryEnter.append("path")
  .attr("class", "line")
  .attr("d", function(d) { return line(d.values); })
  .style("stroke", function(d) { return color(d.name); });

// create lables for each country
// set their position to that of the last year and stat
countryEnter.append("text")
 .attr("class", "names")
 .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
 .attr("transform", function(d) { return "translate(" + x(d.value.year) + "," + y(d.value.stat) + ")"; })
 .attr("x", 4)
 .attr("dy", ".35em")
 .text(function(d) { return d.name; });

// set variable for updating visualization
var countryUpdate = d3.transition(country);

// change values of path to those of the new series
countryUpdate.select("path")
  .attr("d", function(d) { return line(d.values); });

// change position of text alongside the moving path
countryUpdate.select("text")
   .attr("transform", function(d) { return "translate(" + x(d.values[d.values.length - 1].year) + "," + y(d.values[d.values.length - 1].stat) + ")"; });

// update the axes, though only the y axis will change
  d3.transition(svg).select(".y.axis")
      .call(yAxis);

  d3.transition(svg).select(".x.axis")
        .attr("transform", "translate(0," + h + ")")
      .call(xAxis);

// that concludes redraw()
}

// automatically change value after a few seconds
var timeout = setTimeout(function() {
    menu.property("value", "ENEUSE").node().focus();
    change();
}, 7000);

// ugly javascript for highlighting the two groups of countries
function briclight() {
var chkbox = document.getElementById("bric");
if (chkbox.checked) {
    document.getElementById("China").style.cssText = "opacity:1;",
    document.getElementById("Brazil").style.cssText = "opacity:1;",
    document.getElementById("India").style.cssText = "opacity:1;",
    document.getElementById("Russia").style.cssText = "opacity:1;"
} else {
    document.getElementById("China").style.cssText = "",
    document.getElementById("Brazil").style.cssText = "",
    document.getElementById("India").style.cssText = "",
    document.getElementById("Russia").style.cssText = "";
}};

function mistlight() {
var chkbox = document.getElementById("mist")
if (chkbox.checked) {
    document.getElementById("Mexico").style.cssText = "opacity:1;",
    document.getElementById("Indonesia").style.cssText = "opacity:1;",
    document.getElementById("S Korea").style.cssText = "opacity:1;",
    document.getElementById("Turkey").style.cssText = "opacity:1;"
} else {
    document.getElementById("Mexico").style.cssText = "",
    document.getElementById("Indonesia").style.cssText = "",
    document.getElementById("S Korea").style.cssText = "",
    document.getElementById("Turkey").style.cssText = "";
}};
