queue()
	.defer(d3.json, '/vishal/crime')
	.defer(d3.json, 'static/geojson/us-states.json')
	.await(makeGraphs);

/*
SHOULD DO RATES OR RAW NUMBERS????
*/
function makeGraphs(error, projectJson, statesJson){

	var crimeDocuments = projectJson;
	//clean data
	
	var cf = crossfilter(crimeDocuments);

	var rapeChart = dc.lineChart("#rape-chart");
	var usChart = dc.geoChoroplethChart("#us-chart");

	function reduceFieldsAdd(fields){
		return function(p, v){
			fields.forEach(function(f){
				p[f] += +v[f];
			});
			return p;
		};
	}
	function reduceFieldsRemove(fields){
		return function(p, v){
			fields.forEach(function(f){
				p[f] -= +v[f];
			});
			return p;
		};
	}
	function reduceFieldsInit(fields){
		return function(){
			var ret = {};
			fields.forEach(function(f){
				ret[f] = 0;
			});
			return ret;
		};
	}
	//LEAVE SEPARATE ARRAYS FOR EACH GROUP!!!!

	var fields = ['Prison Population', 'Incarceration Rate', "Robbery", "Forcible rape",
	'Aggravated assault'];

	//year dimension
	///to act like time
	var yearsDimension = cf.dimension(function(d) {
		return d['Year'];
	});

	//group by years
	var yearsDimensionGroup = yearsDimension.group().reduce(
		reduceFieldsAdd(fields),
		reduceFieldsRemove(fields),
		reduceFieldsInit(fields)
		);

	//state dimension
	//for map
	var stateDimension = cf.dimension(function(d) {
		return d['State'];
	});
/*
	var crimeDimension = cf.dimension(function(d) {

	})*/
	//group by state
	var stateDimensionGroup = stateDimension.group().reduce(
		reduceFieldsAdd(fields),
		reduceFieldsRemove(fields),
		reduceFieldsInit(fields)
		);
/*
	var crimeDimensionGroup = crimeDimension.group().reduce(
		reduceFieldsAdd(fields),
		reduceFieldsRemove(fields),
		reduceFieldsInit(fields)
	})*/
	//console.log(stateDimensionGroup.all());
	//console.log(yearsDimensionGroup.top(1));
	//console.log(stateDimensionGroup.top(1)[0].value['Forcible rape']);
	var max_state = stateDimensionGroup.top(1)[0].value['Forcible rape'];
	console.log(max_state);
	rapeChart.width(600)
		.renderArea(false)
		.height(150)
		.margins({top: 10, right: 50, bottom: 30, left: 60})
		.dimension(yearsDimension)
		//Rape
		.group(yearsDimensionGroup, "Rape")
		.valueAccessor(function(d){
			return d.value["Forcible rape"];
		})
		.mouseZoomable(true)

		///THIS IS THE WAY TO GGGGGGOOOOOOOOOOOOOO
		.stack(yearsDimensionGroup, 'Robbery', function(d){
			return d.value['Robbery'];
		})
		.stack(yearsDimensionGroup, 'Aggravated assault', function(d){
			return d.value['Aggravated assault'];
		})
		.x(d3.scale.linear().domain([1978, 2012]))
		.xUnits(d3.time.months)
		.renderHorizontalGridLines(true)
		.elasticY(true)
		//.brushOn(true)
		.title(function(d){
			return d.key + "\n" + 
			"\n" + "Aggravated Assualts: " + d.value["Aggravated assault"]
			+ "\n" + "Robbery Incidents: " + d.value["Robbery"] 
			+ "\n" + "Rape Cases: " + d.value["Forcible rape"];
		})
		/*
		Build Legend
		*/
		.legend(dc.legend().x(500).y(10).itemHeight(13).gap(5))
		.brushOn(false)
		//Ticks
		.xAxis().ticks(25).tickFormat(d3.format("d"));

	usChart.width(1000)
		.height(330)
		.dimension(stateDimension)
		.group(stateDimensionGroup)
		.colors(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", 
			"#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"])
		.colorDomain([13,30 ])
		.overlayGeoJson(statesJson['features'], 'state', function(d){
			return d.properties.name;
		})
		.projection(d3.geo.albersUsa()
			.scale(600)
			.translate([340, 150]))
		.title(function(d){
			return "State: " + d.key
			+ "\nRape incidents: " + Math.round(d.value['Forcible rape']);
		});
	dc.renderAll();
};
