/* TO DO */
    // 1. Prettify coloring
    // 2. Add bar chart for comparisons
    // 3. Add recoloring into map...for when new metrics/years are selected
    // 4. Code clean up
/* CURRENTLY */
    // Selecting State can link with selecting Date/Metric
    // Shitty coloring done by choropleth based on 1917 and share of 10%

// Globals for map production
var width  = 960,
    height = 500,
    centered;

// Zoom - implement zoom on map
function zoom() {
    g.transition()
    .duration(750)
    .attr("transform", "translate(" + d3.event.translate + ")scale(" +
    d3.event.scale + ")");
};
var color = d3.scale.threshold()
                    .domain([ 1, 3, 10, 15, 20, 25, 30, 35, 40])
                    .range(["#F0F8FF", "#BBFFFF", "#BCD2EE", "#6D9BF1",
                            "#436EEE", "#2E37FE", "#3232CC", "00008B", "000033"]);
// Add map layers
var projection = d3.geo.albersUsa().scale(1000).translate([width / 2, height / 2]);
var path = d3.geo.path().projection(projection);
var map = d3.select("#map").append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .call(d3.behavior.zoom().scaleExtent([1,8]).on("zoom", zoom));
// Base layer to interact with
var america = map.append("g")
                .attr("id", "states");

var g = map.append("g");
var data_map = d3.map();
var exclusions = ["Puerto Rico", "Virgin Islands of the United States", "states-borders"];
// Read in data.
queue()
    .defer(d3.json, "../static/json/us-named.json") // map.
    .defer(d3.csv, "../static/data/state_inequality.csv", // data.
                // store each data row as [state, date] in map
                function(d) { data_map.set([d.State, new Date(+d.Year, 0, 1)], d); })
    .await(ready);
/* SET UP MAIN MAP*/
function ready(error, us) {
    if(error) throw error;
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

    var years = []; // Years included in dropdown/data.
    for(i=1917; i < 2013; i++){
        years.push(i);
    }
    var metrics = ["Share of Total Wealth Earned by Richest 10%",
                    "Total Income", "Adjusted Gross Income",
                    "Consumer Price Index 2014",
                    "Share of Total Wealth Earned by Richest 5%",
                    "Share of Total Wealth Earned by Richest 1%",
                    "Share of Total Wealth Earned by Richest 0.5%",
                    "Share of Total Wealth Earned by Richest 0.1%",
                    "Share of Total Wealth Earned by Richest 0.01%"];
    /* SET UP DROPDOWN MENUS */
    // Allow options to show up.
    var selectedMetric = "Share of Total Wealth Earned by Richest 10%";
    var selectedYear = "1917";
    function colorMap(){
        var currentState = d3.select(this).attr("id");
        if(currentState != "Puerto Rico" &&
            currentState !="Virgin Islands of the United States" &&
            currentState != "states-borders") {
            return color(data_map.get(
                [currentState, new Date(+selectedYear, 0, 1)])[selectedMetric] );
        }
    };
    var state = america.selectAll("path");
    state.attr("fill", colorMap);
    var checkOption = function(e) {
        if(e === yrselect) {
            return d3.select(this).attr("selected", "selected");
        }
    };
    // Year dropdown.
    // Allow menu to change current year.
    function yearChanged() {
        selectedYear = d3.event.target.value; // Change year.
        state.attr("fill", colorMap); // Recolor.
    }
    var yearDrop = d3.select("#year_drop")
                        .append("select")
                        .attr("id", "yrselect")
                        .on("change", yearChanged);
        yearDrop.selectAll("option")
                        .data(d3.values(years))
                        .enter()
                        .append("option")
                        .attr("value", function(d) {return d;})
                        .text(function(d) {return d;});
        yearDrop.selectAll("option").each(checkOption);
    // Metric dropdown.
    // Allow menu to change current metric.
    function metricChanged() {
        selectedMetric = d3.event.target.value; // Change metric.
        state.attr("fill", colorMap); // Recolor.
    }
    var metricDrop = d3.select("#metric_drop")
                        .append("select")
                        .attr("id", "metricselect")
                        .on("change", metricChanged);
        metricDrop.selectAll("option")
                    .data(d3.values(metrics))
                    .enter()
                    .append("option")
                    .attr("value", function(d) {return d;})
                    .text(function(d) {return d;});
        metricDrop.selectAll("option").each(checkOption);
    /* SUPPORT STATE CLICKING */
    // On click will return data from given year and reshifts bar graphs
    // to center around that state and year
    var selectedState = "United States"; // global state
    state.on("click", function() {
        selectedState = d3.select(this).attr("id")
        console.log(data_map.get([selectedState, new Date(+selectedYear, 0, 1)])
                    [selectedMetric]);
        console.log(color(data_map.get([selectedState, new Date(+selectedYear, 0, 1)])
                    [selectedMetric]));
    });
};

d3.select(self.frameElement).style("height", height + "px");
