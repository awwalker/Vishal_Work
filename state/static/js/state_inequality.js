// Globals for visualization production.
var width  = 960,
    height = 500,
    margin = {top: 40, right: 80, bottom: 30, left: 200},
    chartWidth = width - margin.left - margin.right,
    chartHeight = height - margin.top - margin.bottom,
    x = d3.time.scale().range([0, chartWidth]),
    y = d3.scale.linear().range([chartHeight, 0]),
    centered;
// Set up dropdown.
// Variables for selection.
var metrics = ["Share of Total Wealth Earned by Richest 10%",
                "Share of Total Wealth Earned by Richest 5%",
                "Share of Total Wealth Earned by Richest 1%",
                "Share of Total Wealth Earned by Richest 0.5%",
                "Share of Total Wealth Earned by Richest 0.1%",
                "Share of Total Wealth Earned by Richest 0.01%",
                "Total Income",
                "Adjusted Gross Income",
                "Average Income",
                "Consumer Price Index (CPI) 2014"
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
// Need to add better range domain values...
var color = d3.scale.threshold()
                    .domain([ 1, 3, 10, 15, 20, 25, 30, 35, 40])
                    .range(["#F0F8FF", "#BBFFFF", "#BCD2EE", "#6D9BF1",
                            "#436EEE", "#2E37FE", "#3232CC", "00008B", "000033"]);
// For graph lines coloring based on state name.
var graphColor = d3.scale.category10();
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

// To be used later.
var altKey,
    states;
// Set up graph.
var line = d3.svg.line()
             .interpolate("basis")
             .x(function(d) {return x(d.year); })
             .y(function(d) {return y(d.stat); });

var chart = d3.select("#rate_chart").append("svg")
              .attr("width", chartWidth + margin.left + margin.right)
              .attr("height", chartHeight + margin.top + margin.bottom)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
// Set up axises.
var xAxis = d3.svg.axis()
              .scale(x)
              .orient("bottom")
            chart.append("svg:g")
               .attr("class", "x axis");
var yAxis = d3.svg.axis()
              .scale(y)
              .orient("left")
            chart.append("svg:g")
               .attr("class", "y axis");

// Function to refresh map and graph on dropdown change.
function change() {
    d3.transition()
      .duration(altKey ? 7500 : 1500)
      .each(redraw);
}
// Handler for clicking on states - Reveals the line for that state.
function uncoverLine() {
    currentState = d3.select(this).attr("id");
    // Reformat names with spaces to include _ instead.
    if (currentState.includes(" ")){
        res = currentState.split(" ");
        currentState = res[0] + "_" + res[1];
    }
    d3.selectAll("#" + currentState).style("opacity", "1");
}

// Must read in and draw map first so that data is used only after available.
d3.json("../static/json/us-named.json", function(error, us) {
        drawMap(error, us);
        // Load CSV data for graph production/map manipulation.
        d3.csv("../static/data/state_inequality_nest.csv", function(error, csv) {
                csv.forEach(function(d) {
                    d.Year = new Date(+d.Year, 0, 1)
                })
                states = csv;
                redraw(error);
        });
});

// Draw basic map template.
function drawMap(error, us) {
    if (error) return error;
    d3.select("#Loading").style("display", "none") // Hide loading message.
    america.selectAll("path")
        .data(topojson.feature(us, us.objects["states"]).features)
        .enter()
        .append("path")
        .attr("id", function(d) {return d.properties.name;})
        .attr("d", path);

    america.append("path")
        .datum(topojson.mesh(us, us.objects.states, function(a,b) {
            return a!==b;
        }))
        .attr("id", "states-borders")
        .attr("d", path);
}
// Create choropleth coloring/line graph.
function redraw(error) {
    if (error) return error;
    var nested = d3.nest()
                   .key(function(d) { return d.Label; })
                   .map(states)

    // Selected menu item.
    var series = menu.property("value");

    // Retrieve only data for selected metric (all states / all years).
    var data = nested[series];

    // keys are each individual state & DC stored in array.
    var keyring = d3.keys(data[0]).filter(function(key) {
        return (key !== "Label 2" && key !== "Year" && key !== "Label");
    });

    // Get the year and related statistics and map them to each state separately.
    // This is data only pertaining to the selected statistic / menu selection.
    // Key = state name; Value = Array of objects w/ statval / year.
    // 95 is last array value (95 years of data).
    var transpose = keyring.map(function(name) {
        return {
            name: name,
            values: data.map(function(d) {
                return {year: d.Year, stat: +d[name]};
            })
        };
    });
    // Create dynamic x / y domains according to current values.
    x.domain([
        d3.min(transpose, function(c) { return d3.min(c.values, function(v) { return v.year; }); }),
        d3.max(transpose, function(c) { return d3.max(c.values, function(v) { return v.year; }); })
    ]);
    y.domain([
        d3.min(transpose, function(c) { return d3.min(c.values, function(v) { return v.stat; }); }),
        d3.max(transpose, function(c) { return d3.max(c.values, function(v) { return v.stat; }); })
    ]);

    var state = chart.selectAll(".state")
                     .data(transpose);
    var stateEnter = state.enter().append("g")
                          .attr("class", "state")
                          .attr("id", function(d) {
                              if ( d.name.includes(" ")) {
                                  var res = d.name.split(" ");
                                  return res[0] + "_" + res[1];
                              }
                              return d.name; });
/* TO DO */
// Restrict first call to graph drawing to just US line.
// Only draw in other states when they are clicked.
    stateEnter.append("path")
              .attr("class", "line")
              .attr("d", function(d) { return line(d.values); })
              .attr("fill", "none")
              .attr("id", function(d) {
                  if ( d.name.includes(" ")) {
                      var res = d.name.split(" ");
                      return res[0] + "_" + res[1];
                  }
                  return d.name;
               })
              .style("stroke", function(d) { return graphColor(d.name); });
    stateEnter.append("text")
              .attr("class", "names")
              .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
              .attr("transform", function(d) { return "translate(" + x(d.value.year) + "," + y(d.value.stat) + ")"; })
              .attr("x", 4)
              .attr("dy", ".1em")
              .attr("id", function(d) {
                  if ( d.name.includes(" ")) {
                      var res = d.name.split(" ");
                      return res[0] + "_" + res[1];
                  }
                  return d.name; })
              .text(function(d) { return d.name; });
    //Initially set all lines and names to not show
    d3.selectAll(".line").style("opacity","0");
    d3.selectAll(".names").style("opacity", "0");
    // On each new load draw in United States line.
    d3.selectAll("#United_States").style("opacity", "1");

    // Allow menu changes to update axis values/scale and name locations.
    var stateUpdate = d3.transition(state);

    stateUpdate.select("path")
               .attr("d", function(d) { return line(d.values); });

    stateUpdate.select("text")
               .attr("transform", function(d) { return "translate(" + x(d.values[d.values.length - 1].year) + "," + y(d.values[d.values.length - 1].stat) + ")";})
    d3.transition(chart).select(".y.axis")
                        .call(yAxis);
    d3.transition(chart).select(".x.axis")
                        .attr("transform", "translate(0," + chartHeight + ")")
                        .call(xAxis);
    // Adjust map to selected metric simultaneously as graph is redrawn.
    function colorMap() {
        var currentState = d3.select(this).attr("id");
        if(currentState != "Puerto Rico" &&
            currentState !="Virgin Islands of the United States" &&
            currentState != "states-borders") {
                var colors = null;
                transpose.forEach(function(data) {
                    // Need additional check against ADJ GROSS INC...
                    // Less Data means less indeces...cant go to 95...
                    if (data.name == currentState) {
                        colors = +data.values[95].stat;
                    }
                });
                return color(colors);
        };
    }
    // Style states using choropleth coloring
    // showing relationships for latest year of data.
    var mapStates = america.selectAll("path")
        mapStates.style("fill", colorMap);
        // Implement state clicking to reveal state line on graph.
        mapStates.on("click", uncoverLine);

}
