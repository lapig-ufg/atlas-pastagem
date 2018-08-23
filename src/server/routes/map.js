module.exports = function (app) {

	var map = app.controllers.map;
	
	app.get('/service/map/test', map.test);
	app.get('/service/map/layers', map.layers);
	app.get('/service/map/charts', map.charts);
	app.get('/service/map/chartsByYear', map.chartByYear);

}
