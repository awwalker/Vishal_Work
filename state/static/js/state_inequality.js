/* TO DO */
    // 1. Prettify coloring
    // 2. Add line chart for comparisons
    // 4. Code clean up
/* CURRENTLY */
    // Selecting State can link with selecting Date/Metric
    // Shitty coloring done by choropleth based on 1917 and share of 10%

// Globals for map production
var width  = 960,
    height = 500,
    centered;
var margin = {top: 20, right: 80, bottom: 30, left: 50};
// Set up dropdown.
// Variables for selection.
var metrics = ["Share of Total Wealth Earned by Richest 10%",
                "Share of Total Wealth Earned by Richest 5%",
                "Share of Total Wealth Earned by Richest 1%",
                "Share of Total Wealth Earned by Richest 0.5%",
                "Share of Total Wealth Earned by Richest 0.1%",
                "Share of Total Wealth Earned by Richest 0.01%",
                "Total Income", "Adjusted Gross Income",
                "Consumer Price Index 2014"
                ];
var checkOption = function(e) {
     if(e === metricselect) {
         return d3.select(this).attr("selected", "selected");
     }
 };
var menu = d3.select("#metric_drop")
             .append("select")
             .attr("id", "metricselect")
             .on("change", change);
menu.selectAll("option")
    .data(d3.values(metrics))
    .enter()
    .append("option")
    .attr("value", function(d) {return d;})
    .text(function(d) {return d;});
menu.selectAll("option").each(checkOption);

// For choropleth coloring.
var color = d3.scale.threshold()
                    .domain([ 1, 3, 10, 15, 20, 25, 30, 35, 40])
                    .range(["#F0F8FF", "#BBFFFF", "#BCD2EE", "#6D9BF1",
                            "#436EEE", "#2E37FE", "#3232CC", "00008B", "000033"]);
// Add map layers.
var projection = d3.geo.albersUsa().scale(1000).translate([width / 2, height / 2]);
var path       = d3.geo.path().projection(projection);
var map        = d3.select("#map").append("svg")
                   .attr("width", width)
                   .attr("height", height)
                   .append("g");
// Base layer to interact with.
var america  = map.append("g")
                  .attr("id", "states");
var g        = map.append("g");

// To be used later.
var altKey,
    states;
// Set up graph.
var line = d3.svg.line()
             .interpolate("basis")
             .x(function(d) {return x(d.year); })
             .y(function(d) {return y(d.stat); });

var chart = d3.select("#rate_chart").append("svg")
              .attr("width", w + margin.left + margin.right)
              .attr("height", h + margin.top + margin.bottom)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
// Set up axises.
var xAxis = d3.svg.axis()
              .scale(x)
              .orient("bottom")
            svg.append("svg:g")
               .attr("class", "x axis");
var yAxis = d3.svg.axis()
              .scale(y)
              .orient("left")
            svg.append("svg:g")
               .attr("class", "y axis");

function change() {
    clearTimeout(timeout);
    d3.transition()
      .duration(altKey ? 7500 : 1500)
      .each(redraw);
}

d3.csv("../static/data/state_inequality_nest.csv", function(csv) {
    csv.forEach(function(d) {
        d.Year = new Date(+d.Year, 0, 1)
    })
    states = csv;
    redraw();
});

function redraw() {
    var nested = d3.nest()
                   .key(function(d) { return d.Label; })
                   .map(states)
    console.log(nested);
    var series = menu.property("value");
    console.log(series);
    // Retrieve only data for selected metric.
    var data = nested[series];
    // keys are each individual state & DC.
    var keyring = d3.keys(data[0]).filter(function(key) {
        return (key !== "Label 2" && key !== "Year" && key !== "Label");
    });
    console.log(keyring);
    // get the year and related statistics and map them to each state separately.
    var transpose = keyring.map(function(name) {
        return {
            name: name,
            values: data.map(function(d) {
                return {year: d.Year, stat: + d[name]};
            })
        };
    });
    console.log(transpose);
    // scale x / y domains according to current values.
    x.domain([
        d3.min(transpose, function(c) { return d3.min(c.values, function(v) { return v.year; }); });
        d3.max(transpose, function(c) { return d3.max(c.values, function(v) { return v.year; }); })
    ]);
    y.domain([
        d3.min(transpose, function(c) { return d3.min(c.values, function(v) { return v.year; }); });
        d3.max(transpose, function(c) { return d3.max(c.values, function(v) { return v. year; }); })
    ]);
}

// automatically change value after a few seconds
var timeout = setTimeout(function() {
    menu.property("value", metrics[0]).node().focus();
    change();
}, 7000);
