queue()
.defer(d3.json, '/vishal/crime')
.defer(d3.json, 'static/geojson/us-states.json')
.await(makeGraphs);

function makeGraphs(error, projectJson, statesJson){
	//useful rounding for rates
	function round(num){
		return parseFloat(Math.round(num * 100) / 100).toFixed(2);
	}
	//set up
	var crimeDocuments = projectJson;
	var cf = crossfilter(crimeDocuments);

	//NEEDS TO GET COLORED
	var violentRateChart = dc.compositeChart("#violent-rate-chart");

	var nonViolentRateChart = dc.compositeChart("#non-violent-rate-chart");

	//GEOMAP
	/*
	HAVE TO FIX COLORING!
	*/
	var usChart = dc.geoChoroplethChart("#us-chart");

	/*
	PIE CHART OF PERCENTAGES?? HOW TO IMPLEMENT?
	INFLUENCED BY STATE OR BY YEAR (PERCENTAGES BY STATE
	OR BY YEAR????)
	//var percentChart = dc.pieChart("#percent-chart");
	*/

	/*
	BAR CHART OF SAFEST STATES?? HOW WOULD THAT LOOK?
	LOOK AT WHICH CRIMES HERE? (WOULD HAVE TO BE AFFECTED)
	BY THE YEARLY GROUP.
	MAYBE SOME KIND OF SELECTOR WHEN YOU CLICK ON  A STATE
	YOU CAN SEE WHICH GROUP IT IS IN...?

	*/
	/*
	COULD STILL DO PIE CHART OF DIFFERENT REGIONS...BUT HOW
	HELPFUL IS THAT IN REALITY??? MIGHT LOOK COOL THOUGH
	*/

	/*
	BAR CHART WITH DIFFERENT CRIMES? HOW DO YOU GROUP LIKE THAT
	THOUGH???
	THINK THIS ONE IS A BUST
	*/

	//FUNCTIONS TO ADD/SUBTRACT/INIATIALIZE
	//Distinguish between those that need to be incremented vs those that dont...
	//i.e year/region/state
	function reduceFieldsAdd(fieldsRates, fieldsAverages){
		return function(p, v){
			++p.count;
			for(i = 0; i < fieldsRates.length; i++){
				p[fieldsRates[i]] += +v[fieldsRates[i]];
				p[fieldsAverages[i]] = p[fieldsRates[i]] / p.count;
			};
			return p;
		};
	}
	function reduceFieldsRemove(fieldsRates, fieldsAverages){
		return function(p, v){
			--p.count;
			for(i = 0; i < fieldsRates.length; i++){
				p[fieldsRates[i]] -= +v[fieldsRates[i]];
				p[fieldsAverages[i]] = p[fieldsRates[i]] / p.count;
			};
			return p;
		}
	}
	function reduceFieldsInit(fieldsRates, fieldsAverages){
		return function(){
			ret = {};
			fieldsRates.forEach(function(d){
				ret[d] = 0;
			});
			fieldsAverages.forEach(function(d){
				ret[d] = 0;
			});
			ret['count'] = 0;
			return ret;
		};
	}
	//LEAVE SEPARATE ARRAYS FOR EACH GROUP!!!!*****
	//SET OF FIELDS TO LOOK AT FOR EACH DIFFERENT GROUPING

	var fieldsRates =
	['Incarceration Rate','Violent Crime Rate', 'Murder/Manslaughter Rate',
	'Rape Rate','Robbery Rate', 'Aggravated Assault Rate',
	'Property Crime Rate','Burglary rate', 'Larceny Rate',
	'Motor Vehicle Theft Rate'];

	var fieldsAverages = ['Average Incarceration Rate', 'Average Violent Crime Rate',
	'Average Murder/Manslaughter Rate', 'Average Rape Rate',
	'Average Robbery Rate', 'Average Aggravated Assualt Rate',
	'Average Property Crime Rate', 'Average Burglary Rate', 'Average Larceny Rate',
	'Average Motor Vehicle Theft Rate'];

	//year dimension
	//to act like time
	var yearsDimension = cf.dimension(function(d) {
		return d['Year'];
	});

	//group by years
	var yearsDimensionGroup = yearsDimension.group().reduce(

		reduceFieldsAdd(fieldsRates, fieldsAverages),
		reduceFieldsRemove(fieldsRates, fieldsAverages),
		reduceFieldsInit(fieldsRates, fieldsAverages)
	);
//TO-DO
/*
Fix legend
Fix Onclick?
Fix Burglary
*/
	nonViolentRateChart.width(780)
	.height(500)
	.x(d3.scale.linear().domain([1978, 2012]))
	.yAxisLabel("Rates of Non-Violent Crime Incidents (Per 100,000)")
	.legend(dc.legend().x(100).y(40).itemHeight(10).gap(5))
	.renderHorizontalGridLines(true)
	.elasticY(true)
	.brushOn(false)
	.compose([
		//BURGLARY
		dc.lineChart(nonViolentRateChart)
			.dimension(yearsDimension)
			.group(yearsDimensionGroup, 'Burglary Rate')
			.colors('blue')
			.valueAccessor(function(d){
				return d.value['Average Buglary Rate'];
			}),
		//Property Crime
		dc.lineChart(nonViolentRateChart)
			.dimension(yearsDimension)
			.group(yearsDimensionGroup, "Property Crime Rate")
			.colors('green')
			.valueAccessor(function(d){
				return d.value['Average Property Crime Rate'];
			}),
		//Larceny Crime
		dc.lineChart(nonViolentRateChart)
			.dimension(yearsDimension)
			.group(yearsDimensionGroup, 'Larceny Rate')
			.colors('red')
			.valueAccessor(function(d){
				return d.value['Average Larceny Rate'];
			}),
		dc.lineChart(nonViolentRateChart)
			.dimension(yearsDimension)
			.group(yearsDimensionGroup, 'Motor Vehicle Theft Rate')
			.colors('purple')
			.valueAccessor(function(d){
				return d.value['Average Motor Vehicle Theft Rate'];
			})
	])
	.xAxis().ticks(15).tickFormat(d3.format("d"));
//TO-DO:
	//FIX tooltips
	//Better colors?
	//Resize
	//add way to show/hide certain lines?
	violentRateChart.width(780)
	.height(500)
	.x(d3.scale.linear().domain([1978, 2012]))
	.yAxisLabel("Rates of Violent Crime Incidents (Per 100,000)")
	.legend(dc.legend().x(100).y(40).itemHeight(10).gap(5))
	.renderHorizontalGridLines(true)
	.elasticY(true)
	.brushOn(false)
	.valueAccessor(function(d){
		return round(d.value['Average Incarceration Rate']) + ", " +
		round(d.value["Average Rape Rate"]);
	})
	.compose([
		//RAPE CHART
		dc.lineChart(violentRateChart)
			.dimension(yearsDimension)
			.group(yearsDimensionGroup, "Rape Rate")
			.colors('blue')
			.brushOn(true)
			//set up rape rate
			.valueAccessor(function(d){
				return d.value["Average Rape Rate"];
			}),
		//INCARCERATION CHART
		dc.lineChart(violentRateChart, "Incarceration Rate")
			.dimension(yearsDimension)
			.group(yearsDimensionGroup, "Incarceration Rate")
			.colors('red')
			.brushOn(true)
			.valueAccessor(function(d){
				return d.value["Average Incarceration Rate"];
			}),
		//VIOLENT CRIME
		dc.lineChart(violentRateChart, "Violent Crime Rate")
			.dimension(yearsDimension)
			.group(yearsDimensionGroup, "Violent Crime Rate")
			.colors('green')
			.brushOn(true)
			.valueAccessor(function(d){
				return d.value["Average Violent Crime Rate"];
			}),
		//MURDER/Manslaughter
		dc.lineChart(violentRateChart, "Murder/Manslaughter Rate")
			.dimension(yearsDimension)
			.group(yearsDimensionGroup, "Murder/Manslaughter Rate")
			.colors('purple')
			.valueAccessor(function(d){
				return d.value["Average Murder/Manslaughter Rate"];
			}),
		//Robbery
		dc.lineChart(violentRateChart, "Robbery Rate")
			.dimension(yearsDimension)
			.group(yearsDimensionGroup, "Robbery Rate")
			.brushOn(true)
			.colors('yellow')
			.valueAccessor(function(d){
				return d.value['Average Robbery Rate'];
			}),
		//Aggravated
		dc.lineChart(violentRateChart, "Aggravated Assualt Rate")
			.dimension(yearsDimension)
			.group(yearsDimensionGroup, "Aggravated Assault Rate")
			.colors('orange')
			.brushOn(true)
			.valueAccessor(function(d){
				return d.value['Average Aggravated Assualt Rate'];
			})
		.title(function(d){
			return d.key + "\nIncarceration Rate: " +
			d.value["Average Incarceration Rate"];
		})
	])
	.xAxis().ticks(15).tickFormat(d3.format("d"));


	//state dimension
	//for map
	var stateDimension = cf.dimension(function(d) {
		return d['State'];
	});

	//group by state

	var stateDimensionGroup = stateDimension.group().reduce(
		reduceFieldsAdd(fieldsRates, fieldsAverages),
		reduceFieldsRemove(fieldsRates, fieldsAverages),
		reduceFieldsInit(fieldsRates, fieldsAverages)
	);
	usChart.width(1000)
	.height(330)
	.dimension(stateDimension)
	.group(stateDimensionGroup)
	.colors(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF",
	"#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"])
	.colorDomain([13,30])
	//.colorAccessor(function(d){ return d.value["Average Rape Rate"];})
	.overlayGeoJson(statesJson['features'], 'state', function(d){
		return d.properties.name;
	})
	.projection(d3.geo.albersUsa()
	.scale(600)
	.translate([340, 150]))
	.title(function(d){
		return "State: " + d.key;
	});
	dc.renderAll();
};
