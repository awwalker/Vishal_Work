// Globals for visualization production.
var width  = 960,
    height = 500,
    margin = {top: 10, right: 130, bottom: 30, left: 50},
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
                ];

var menu = d3.select("#metric_drop")
             .append("select")
             .attr("id", "metricselect")
             .on("change", change);
menu.selectAll("option")
    .data(d3.values(metrics))
    .enter()
    .append("option")
    .attr("width", 200)
    .attr("value", function(d) {return d;})
    .text(function(d) {return d;});

// Set up choropleth coloring.
var range = ["#edf8fb", "#b3cde3", "#9ebcda", "#8c96c6", "#8856a7", "#810f7c"];
var colorRich10  = d3.scale.threshold()
                     .domain([35, 40, 45, 50, 55, 61 ])
                     .range(range),
    colorRich5   = d3.scale.threshold()
                     .domain([25, 30, 35, 40, 45, 51])
                     .range(range)
    colorRich1   = d3.scale.threshold()
                     .domain([10, 15, 20, 25, 30, 35])
                     .range(range),
    colorRich05  = d3.scale.threshold()
                     .domain([5, 10, 15, 20, 25, 30])
                     .range(range),
    colorRich01  = d3.scale.threshold()
                     .domain([5, 8, 11, 14, 17, 20, 30])
                     .range(range),
    colorRich001 = d3.scale.threshold()
                     .domain([1, 3, 5, 7, 9, 12])
                     .range(range),
    colorAvgInc  = d3.scale.threshold()
                     .domain([30000, 40000, 50000, 60000, 70000, 80000])
                     .range(range),
    colorTotInc  = d3.scale.threshold()
                     .domain([100000000, 200000000 , 400000000,  800000000, 1600000000, 3200000000 ])
                     .range(range);

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
var states;

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
// Set up graph lines coloring based on state name.
var graphColor = d3.scale.category10();

// removeSpaces - ID tags cannot have spaces in them so states with spaces in name
// should instead have '_'
function removeSpaces(name){
    if (name.includes(" ")) {
        parts = name.split(" ");
        name = parts[0] + "_" + parts[1];
    }
    return name;
}
// Function to refresh map and graph on dropdown change.
function change() {
    d3.transition()
      .duration(1500)
      .each(redraw);
}
// Handler for clicking on states - Reveals the line for that state.
// TODO handle the names appearing/disappearing as well.
function uncoverLine() {
    currentState = d3.select(this)
    currentStateName = currentState.attr("id");
    // Translate any names with spaces so that they can be recognized.
    formattedStateName = removeSpaces(currentStateName);
    // Select the chart value.
    selectedState = d3.select("#" + formattedStateName + "-chart");
    // Select the line part of the current state.
    selectedStateLine = selectedState.selectAll(".line");
    // Toggle the line drawn/not drawn based on whether it is currently drawn.
    selectedStateLine.style("opacity", function() {
        if(selectedStateLine.attr("isDrawn") == "true") {
            selectedStateLine.attr("isDrawn", "false");
            return "0";
        } else {
            selectedStateLine.attr("isDrawn", "true");
            return "1";
        }
    })

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
    // Hide loading message.
    d3.select("#Loading").style("display", "none")
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
        d3.min(transpose, function(c) { return d3.min(c.values, function(v) { return +v.stat; }); }),
        d3.max(transpose, function(c) { return d3.max(c.values, function(v) { return +v.stat; }); })
    ]);

    var state = chart.selectAll(".state")
                     .data(transpose);
    var stateEnter = state.enter().append("g")
                          .attr("class", "state")
                          .attr("id", function(d) { return removeSpaces(d.name) + "-chart"; });
    stateEnter.append("path")
              .attr("class", "line")
              .attr("d", function(d) { return line(d.values); })
              .attr("fill", "none")
              .attr("id", function(d) {return removeSpaces(d.name) + "-line"; })
              .style("stroke", function(d) { return graphColor(d.name); });
    stateEnter.append("text")
              .attr("class", "names")
              .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
              .attr("transform", function(d) { return "translate(" + x(d.value.year) + "," + y(d.value.stat) + ")"; })
              .attr("x", 4)
              .attr("dy", ".1em")
              .attr("id", function(d) { return removeSpaces(d.name); })
              .text(function(d) { return d.name; });
    // Initially set all lines and names to not show
    d3.selectAll(".line")
      .attr("isDrawn", "false")
      .style("opacity","0");

    d3.selectAll(".names").style("opacity", "0");
    // On each new load draw in United States line.
    United_States = d3.select("#United_States-chart");
    USLine = United_States.selectAll(".line")
                          .attr("isDrawn", "true")
                          .style("opacity", "1");


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
        var currentMetric = d3.select("#metricselect").property("value");
        if(currentState != "Puerto Rico" &&
            currentState !="Virgin Islands of the United States" &&
            currentState != "states-borders") {
                var colors = null;
                transpose.forEach(function(d) {
                    if (d.name == currentState) {
                        if (currentMetric != metrics[7]) {
                            colors = +d.values[95].stat;
                        }
                        else{ // Three corrupted rows of data for Adj. Inc.
                            colors = +d.values[92].stat;
                        }
                     }
                });
                switch (currentMetric) {
                    case metrics[0]: return colorRich10(colors);
                    case metrics[1]: return colorRich5(colors);
                    case metrics[2]: return colorRich1(colors);
                    case metrics[3]: return colorRich05(colors);
                    case metrics[4]: return colorRich01(colors);
                    case metrics[5]: return colorRich001(colors);
                    case metrics[6]: return colorTotInc(colors);
                    case metrics[7]: return colorTotInc(colors);
                    case metrics[8]: return colorAvgInc(colors);
                }
        };
    }
    // Style states using choropleth coloring
    // showing relationships for latest year of data.
    var mapStates = america.selectAll("path")
        mapStates.style("fill", colorMap);
        // Implement state clicking to reveal state line on graph.
        mapStates.on("click", uncoverLine);

}
