var data_graph;
var trend_graph;

var year1 = 1900;
var year2 = 2015;
var temp1 = 20;
var temp2 = 90;

var geoJson;
var setStationColorVar;

var stationColorVar = "tavg";  // should be one of "tmax", "tmin", "tavg"

// Take a string representation of CSV data and convert it to an array.
// The input string should consist of a sequence of line, each of which
// contains a YYYYMMDD date, and an integer value, separated from each
// other by a comma.   The lines in the string should be separated from
// each other by a newline.  For example:
//   s = "20110102,77\n20110103,72\n20110104,64"
// The returned value will be an array of pairs, where the first value
// in each pair is the YYYYMMDD string, and the second value is the int,
// as in:
//     [["20110102",77]
//      ["20110103",72]
//      ["20110104",64]]
function csv_string_to_data_array(s) {
    var a = [];
    var f;
    s.split(/\n/).forEach(function(t) {
        f = t.split(/,/);
        if (f.length === 2) {
            a.push([f[0].trim(), parseInt(f[1].trim(),10)]);
        }
    });
    return a;
}

// Take two data arrays of the sort returned by csv_string_to_data_array() above,
// and return a single data array containing 3 values per row: the YYYYMMDD
// datetime string, followed by the two data values for that date.  Skip any
// dates not present in both input arrays.
function merge_two_data_arrays(data1, data2) {
    var i, j, d = [];
    for (i=0, j=0; i<data1.length && j<data2.length; /**/) {
        if (data1[i][0] == data2[j][0]) {
            d.push([data1[i][0], data1[i][1], data2[j][1]]);
            ++j;
            ++i;
        } else if (data1[i][0] > data2[j][0]) {
            ++j;
        } else {
            ++i;
        }
    }
    return d;
}

// convert celsius to Fahrenheit:
function fahrenheit(c) {
    return c*9.0/5.0 + 32.0;
}

// convert 10ths of degrees Celsius to Fahrenheit.
function scale_temp(tc) {
    return fahrenheit(tc / 10.0);
}

// Take a data array where the first value in each row is a
// datetime string, and the remaining values are numbers giving
// temperature in 10ths of degrees celsius, and convert all the
// temperatures to fahrenheit.  Modifies the original array
// in-place, and returns it
function scale_temp_data_array(data) {
    var i, j;
    for (i=0; i<data.length; ++i) {
        for (j=1; j<data[i].length; ++j) {
            data[i][j] = scale_temp(data[i][j]);
        }
    }
    return data;
}


// Take a data array of the sort returned by csv_string_to_data_array() above,
// and convert it to an object whose keys are YYYYMMDD strings, and whose
// values are the int values
function data_array_to_object(data) {
    var obj = {};
    data.forEach(function(d) {
        obj[d[0]] = d[1];
    });
    return obj;
}


function get_station_tmin_tmax(id, callback) {
    $.when.apply($, [
        $.ajax({
            url: 'https://s3.amazonaws.com/nemac-ghcnd/' + id + '/TMIN.csv.gz',
            dataType: "text",
            success: function(data, textStatus, jqXHR) {
                //console.log('got TMIN');
            }
        }),
        $.ajax({
            url: 'https://s3.amazonaws.com/nemac-ghcnd/' + id + '/TMAX.csv.gz',
            dataType: "text",
            success: function(data, textStatus, jqXHR) {
                //console.log('got TMAX');
            }
        })
    ]).done(function(tmin_response, tmax_response) {
        var tmin_data = csv_string_to_data_array(tmin_response[0]);
        var tmax_data = csv_string_to_data_array(tmax_response[0]);
        var d = scale_temp_data_array(merge_two_data_arrays(tmin_data, tmax_data));
        callback(d);
    });
}

function stringify_dates(data) {
    for (i=0; i<data.length; ++i) {
        data[i][0] = data[i][0] + "0701";
    }
    return data;
}

function step_data(data) {
    var i, d = [];
    d.push([data[0][0]+"0101",data[0][1]]);
    for (i=1; i<data.length; ++i) {
        d.push([data[i][0]+"0101",data[i-1][1]]);
        d.push([data[i][0]+"0101",data[i][1]]);
    }
    d.push([(data[data.length-1][0]+1)+"0101",data[data.length-1][1]]);
    return d;
}

function step_int_data(data) {
    var i, d = [];
    for (i=1; i<data.length; ++i) {
        d.push([data[i][0],data[i][1]]);
        d.push([data[i][0]+1,data[i][1]]);
    }
    return d;
}

function make_mugl(daily_minmax_data, annual_min_data, annual_max_data) {
    return {
        "window": {
            "border": 1,
            "bordercolor": "0x000000",
            "padding": 0,
            "margin": 0
        },
        "plotarea": {
            "marginbottom": 40,
            "margintop": 45,
            "marginleft": 38,
            "marginright": 15
        },
        "background": {
            "color": "0xFFFFFF"
        },
        "horizontalaxis": {
            "id": "Time",
            "type": "datetime",
            "length": "1",
            "base": [-1, -1],
            "anchor": -1,
            "min": "19000101",
            "max": "20150101",
            "tickmin": -5,
            "tickmax": 5,
            "title": {},
            "labels": {
                //"format": "%d %n",
                //"spacing": ["1M", "7D", "1D", "12H", "6H", "4H", "2H", "1H", "30m", "10m", "5m"],
                "label" : [
                    { "format": "%Y",       "spacing": ["20Y", "10Y", "5Y", "2Y", "1Y"] },
                    { "format": "%n %Y",    "spacing": ["6M", "3M", "2M", "1M"] },
                    { "format": "%d %n %Y", "spacing": ["7D", "2D", "1D"] }
                ],
                "position": [0, -10]
            }
        },
        "verticalaxis": {
            "id": "temp",
            "length": "1",
            "min": -40,
            "max": 100,
            "title": {
                "text": "Degrees Fahrenheit",
                "anchor": [0, 1],
                "position": [-30, 0],
                "angle": 90
            },
//            "grid": {
//                "color": "0xC9C9C1"
//            },
            "labels": {
                "format": "%.0f",
                "spacing": [100, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01],
                "start": 0,
                "anchor": [0, 0],
                "position": [-10, 0],
                "angle": 0
            }
        },
        "plots": [{
            "style": "rangebar",
            "options": {
                "fillcolor": "0x0000ff",
                "linecolor": "0x000000",
                "linewidth": 1,
                "barwidth": "22H"
            },
            "horizontalaxis": {"Time": "Time"},
            "verticalaxis": {"temp": ["minTemperature", "maxTemperature"]},
            "legend": { "label": "Daily Max/Min Temp" }
        },{
            "style": "line",
            "options": {
                "linecolor": "0xff0000",
                "linewidth": 2
            },
            "horizontalaxis": {"Time": "annual-tmax-time"},
            "verticalaxis": {"temp": "annual-tmax"},
            "legend": { "label": "Annual Avg Daily Max Temp" }
        },{
            "style": "line",
            "options": {
                "linecolor": "0x00ffff",
                "linewidth": 2
            },
            "horizontalaxis": {"Time": "annual-tmin-time"},
            "verticalaxis": {"temp": "annual-tmin"},
            "legend": { "label": "Annual Avg Daily Min Temp" }
        }],
        "legend": {
            "visible": "true",
            "rows": 1,
            "border": 0,
            "opacity": 0,
            "anchor": [0, -1],
            "base": [0, 1]
        },
        "data": [{
            "variables": [
                {"column": 0, "id": "Time", "type": "datetime"},
                {"column": 1, "id": "minTemperature"},
                {"column": 2, "id": "maxTemperature"}
            ],
            "values": daily_minmax_data
        },{
            "variables": [
                {"column": 0, "id": "annual-tmin-time", "type": "datetime"},
                {"column": 1, "id": "annual-tmin"}
            ],
            "values": stringify_dates(annual_min_data)
        },{
            "variables": [
                {"column": 0, "id": "annual-tmax-time", "type": "datetime"},
                {"column": 1, "id": "annual-tmax"}
            ],
            "values": stringify_dates(annual_max_data)
        }]
    };
}

function trendcoords(trend, x1, x2) {
    function y(x) {
        return trend[0] + x * trend[1];
    }
    var ans = [[x1,y(x1)],[x2,y(x2)]];
    return ans;
}
function only_trendcoords(trend, x1, x2, y1, y2) {
    var ymid = (y1 + y2) / 2;
    var xmid = (x1 + x2) / 2;
    var m = trend[1] * 10;
    function y(x) {
        return ymid - m *xmid + x * m;
    }
    var ans = [[x1,y(x1)],[x2,y(x2)]];
    return ans;
}

function makeGraph(options) {
    // Set the dimensions of the canvas / graph
    var margin = options.margin || {top: 10, right: 10, bottom: 25, left: 28},
        width = options.$elem.width() - margin.left - margin.right,
        height = options.$elem.height() - margin.top - margin.bottom;

    var axes = {
        x: { ticks: 5, draw: true },
        y: { ticks: 5, draw: true }
    };
    if (typeof(options.axes) === "boolean") {
        axes.x.draw = options.axes;
        axes.y.draw = options.axes;
    } else if (typeof(options.axes) === "object") {
        ["x","y"].forEach(function(a) {
            if (typeof(options.axes[a]) === "boolean") {
                axes[a].draw = options.axes[a];
            } else if (typeof(options.axes[a]) === "object") {
                axes[a] = $.extend(axes[a], options.axes[a]);
            }
        });
    }

    // Set the ranges
    //var x = d3.time.scale().range([0, width]);
    var x = d3.scale.linear().range([0, width]);
    var y = d3.scale.linear().range([height, 0]);

    // Define the axes
    var xAxis = d3.svg.axis().scale(x)
            .orient("bottom").ticks(axes.x.ticks)
            .tickFormat(d3.format("1d"));

    var yAxis = d3.svg.axis().scale(y)
            .orient("left").ticks(axes.y.ticks);

    // Define the line
    var valueline = d3.svg.line()
            .x(function(d) { return x(d[0]); })
            .y(function(d) { return y(d[1]); });

    // Adds the svg canvas
    var svg = d3.selectAll(options.$elem.toArray())
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", 
                  "translate(" + margin.left + "," + margin.top + ")");

    // Scale the range of the data
    x.domain(options.domain.x);
    y.domain(options.domain.y);

    if (axes.x.draw) {
        // Add the X Axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
    }
    if (axes.y.draw) {
        // Add the Y Axis
        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);
    }

    Object.keys(options.series).forEach(function(seriesName) {
        svg.append("path")
            .attr("class", seriesName);
        if (options.series[seriesName].length > 0) {
            svg.select(".data")
                .attr("d", valueline(options.series[seriesName]));
        }
    });

    var setSeries = function(args) {
        var svg = d3.selectAll(options.$elem.toArray());
        Object.keys(args.series).forEach(function(seriesName) {
            svg.select("."+seriesName)
                .attr("d", valueline(args.series[seriesName]));
        });
    };

    var transitionToSeries = function(args) {
        var svg = d3.selectAll(options.$elem.toArray()).transition();
        var dura = args.dura || 0;
        Object.keys(args.series).forEach(function(seriesName) {
            svg.select("."+seriesName)
                .duration(dura)
                .attr("d", valueline(args.series[seriesName]));
        });
    };

    if (options.data !== undefined) {
        setSeries(options);
    }

    return {
        setSeries: setSeries,
        transitionToSeries:  transitionToSeries
    };
};

function pageArgs() {
    var href = window.location.toString();
    var paramString = href.replace(/^.*\?/, "");
    var assigns = paramString.split("&");
    args = {};
    assigns.forEach(function(assign) {
        if (typeof(assign) === "string") {
            var a = assign.split("=");
            if (a.length === 2) {
                args[a[0]] = a[1];
            }
        }
    });
    return args;
}

$(document).ready(function() {

    var map = L.map('map', {
        zoomControl: false
    }).setView([37.09, -95.71], 5);
    map.attributionControl.setPrefix("");

    L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; 2015 FernLeaf Interactive',
        id: 'examples.map-i875mjb7'
    }).addTo(map);

    var colors = {
        "white-red":  ['rgb(254,229,217)','rgb(252,187,161)','rgb(252,146,114)','rgb(251,106,74)','rgb(222,45,38)','rgb(165,15,21)'],
        "white-blue": ['rgb(239,243,255)','rgb(198,219,239)','rgb(158,202,225)','rgb(107,174,214)','rgb(49,130,189)','rgb(8,81,156)'],
        "blue-red":   ['rgb(5,48,97)', 'rgb(33,102,172)', 'rgb(67,147,195)','rgb(146,197,222)', 'rgb(209,229,240)', 'rgb(247,247,247)',
                       'rgb(253,219,199)', 'rgb(244,165,130)', 'rgb(214,96,77)', 'rgb(178,24,43)', 'rgb(103,0,31)']
    };

    function min_max(values) {
        var min = values[0];
        var max = min;
        var i;
        for (i=1; i<values.length; ++i) {
            if (values[i] < min) { min = values[i]; }
            if (values[i] > max) { max = values[i]; }
        }
        return { min: min, max: max };
    }

    function linear_interpolator(a,b,A,B) {
        var f = (B - A) / (b - a);
        return function(x) {    // (a,b) -> (A,B)
            return (x - a) * f + A;
        };
    }

    function quantiles_classifier(values, numclasses) {
        // values: an array of numbers
        // numclasses: number of classes
        // returns: a function that converts values to a number in the range
        //          0 through numclasses-1
        var identity = function(x) { return x; };
        var myvalues = values.map(identity); // copy of values array
        myvalues.sort(function(a,b) {
            return a-b;
        });
        var d = Math.round(myvalues.length / numclasses);
        var i;
        var breaks = [];
        for (i=1; i<numclasses; ++i) {
            breaks[i-1] = myvalues[i*d];
        }
        return function(value) {
            var i;
            for (i=0; i<numclasses; ++i) {
                if (value < breaks[i]) { return i; }
            }
            return numclasses-1;
        };
    };

    function equal_intervals_classifier(a, b, numclasses) {
        var d = (b - a) / numclasses;
        var i;
        var breaks = [];
        for (i=0; i<numclasses-1; ++i) {
            breaks[i] = a + i * d;
        }
        return function(value) {
            var i;
            for (i=0; i<numclasses-1; ++i) {
                if (value < breaks[i]) { return i; }
            }
            return numclasses-1;
        };
    }
    
    function do_stations(stations) {

        // Use this stationFeatureToColor for an equal interval station coloring that guarantees
        // that slopes near 0 are colored white, and negative slopes are blue, and positive ones
        // are red:
        var stationFeatureToColor = (function() {
            function pos_neg_classifiers(vals) {
                var mm = min_max(vals);
                var pos_white_threshold = mm.max / (2 * colors["white-red"].length + 1);
                var neg_white_threshold = mm.min / (2 * colors["white-blue"].length + 1);
                return {
                    pos_white_threshold: pos_white_threshold,
                    neg_white_threshold: neg_white_threshold,
                    pos: equal_intervals_classifier(pos_white_threshold, mm.max, colors["white-red"].length),
                    neg: equal_intervals_classifier(mm.min, neg_white_threshold, colors["white-blue"].length)
                };
            }
            var classify = {
                tmin: pos_neg_classifiers(stations.map(function(s) { return s.tmin.trend[1]; })),
                tmax: pos_neg_classifiers(stations.map(function(s) { return s.tmax.trend[1]; })),
                tavg: pos_neg_classifiers(stations.map(function(s) { return s.tavg.trend[1]; }))
            };
            return function(feature) {
                var s = feature.properties[stationColorVar].trend[1];
                if (s >= 0) {
                    if (s < classify[stationColorVar]["pos_white_threshold"]) {
                        return "#ffffff";
                    } else {
                        return colors["white-red"][classify[stationColorVar]["pos"](s)];
                    }
                } else {
                    if (s > classify[stationColorVar]["neg_white_threshold"]) {
                        return "#ffffff";
                    } else {
                        return colors["white-blue"][colors["white-blue"].length-classify[stationColorVar]["neg"](s)];
                    }
                }
            };
        }());

        /*
        // Use this stationFeatureToColor for a qualtiles-based station coloring that spreads the stations more equally
        // through a blue-red color gradient, but that does not guarantee that slopes near zero correspond to white:
        var stationFeatureToColor = (function() {
            var classify = {
                tmin: quantiles_classifier(stations.map(function(s) { return s.tmin.trend[1]; }), colors["blue-red"].length),
                tmax: quantiles_classifier(stations.map(function(s) { return s.tmax.trend[1]; }), colors["blue-red"].length),
                tavg: quantiles_classifier(stations.map(function(s) { return s.tavg.trend[1]; }), colors["blue-red"].length)
            };
            return function(feature) {
                return colors["blue-red"][classify[stationColorVar](feature.properties[stationColorVar].trend[1])];
            };
        }());
        */

        $("input[name=stationColorVar][value="+stationColorVar+"]").attr('checked', true);
        $("div#station-coloring-display").html("stations colored by " + stationColorVar + " trend slope");

        geoJson = stations.map(function(station) {
            var feature = {
                "type": "Feature",
                "properties": station,
                "geometry": {
                    "type": "Point",
                    "coordinates": station.latlon
                }
            };
            return feature;
        });

        setStationColorVar = function(name) {
            stationColorVar = name;
            geoJson.forEach(function(feature) {
                feature.marker.setStyle({
                    fillColor: stationFeatureToColor(feature)
                });
            });
            $("div#station-coloring-display").html("stations colored by " + name + " trend slope");
            $("input[name=stationColorVar][value="+name+"]").attr('checked', true);
        };

        $("input[name=stationColorVar]").click(function(e) {
            setStationColorVar($(this).attr("value"));
        });


        var last_feature = undefined;
        var click_locked = false;

        function  format_slope(m) {
            return sprintf("%.3f", 100*m);
        }

        function selectFeature(marker, feature) {
            if (last_feature) {
                last_feature.marker.setStyle({
                    weight: 1,
                    color: "#000000"
                });
            }
            marker.setStyle({
                weight: 3,
                color: "#ffff00"
            });
            if (!L.Browser.ie && !L.Browser.opera) {
                marker.bringToFront();
            }
            last_feature = feature;
            $("div#data-graph-title").html(feature.properties.name);
            data_graph.transitionToSeries({
                series: {
                    "tmax-data": feature.properties.tmax.data,
                    "tmin-data": feature.properties.tmin.data,
                    "tavg-data": feature.properties.tavg.data,
                    "tmax-trend": trendcoords(feature.properties.tmax.trend, year1, year2),
                    "tmin-trend": trendcoords(feature.properties.tmin.trend, year1, year2),
                    "tavg-trend": trendcoords(feature.properties.tavg.trend, year1, year2)
                },
                dura: 0
            });
            trend_graph.transitionToSeries({
                series: {
                    "tmax-trend": only_trendcoords(feature.properties.tmax.trend, year1, year2, temp1, temp2),
                    "tmin-trend": only_trendcoords(feature.properties.tmin.trend, year1, year2, temp1, temp2),
                    "tavg-trend": only_trendcoords(feature.properties.tavg.trend, year1, year2, temp1, temp2)
                },
                dura: 0
            });

            $("#slope-display-tmax").html(format_slope(feature.properties.tmax.trend[1]));
            $("#slope-display-tavg").html(format_slope(feature.properties.tavg.trend[1]));
            $("#slope-display-tmin").html(format_slope(feature.properties.tmin.trend[1]));

            $("div#data-graph-openicon span.openicon").removeClass("invisible");
            $("div#data-graph-openicon span.openicon").addClass("visible");
        }

        $("div#data-graph-openicon span.openicon").click(function() {
            $("div#graph-overlay").removeClass("invisible");
            $("div#graph-overlay").addClass("visible");
            var $mgDiv = $('<div class="multigraph"></div>')
                    .appendTo($("#graph-overlay .graph-wrapper .multigraph-wrapper"));
            get_station_tmin_tmax(last_feature.properties.id, function(tminmax_data) {
                $mgDiv.multigraph({
                    muglString: make_mugl(tminmax_data,
                                          last_feature.properties.tmin.data,
                                          last_feature.properties.tmax.data)
                });
                $mgDiv.multigraph('done', function(m) {
                    var haxis = m.graphs().at(0).axes().at(0);
                    var daily_plot = m.graphs().at(0).plots().at(0);
                    var threshold = multigraph.core.DatetimeMeasure.parse("11Y");
                    function setDailyPlotVisibility(min, max) {
                        if (max.getRealValue() - min.getRealValue() > threshold.getRealValue()) {
                            // the range of data in view is larger than threshold, so turn daily plot off
                            daily_plot.visible(false);
                        } else {
                            daily_plot.visible(true);
                        }
                    }
                    setDailyPlotVisibility(haxis.dataMin(), haxis.dataMax());
                    haxis.addListener('dataRangeSet', function(data) {
                        setDailyPlotVisibility(data.min, data.max);
                    });
                });
            });
        });

        $("div.graph-wrapper div.close-button").click(function() {
            $("div#graph-overlay").removeClass("visible");
            $("div#graph-overlay").addClass("invisible");
            $("#graph-overlay .graph-wrapper .multigraph-wrapper").find(".multigraph").remove();
        });

        L.geoJson(geoJson, {
            pointToLayer: function (feature, latlng) {
                var marker = L.circleMarker(latlng, {
                    radius: 8,
                    fillColor: stationFeatureToColor(feature),
                    color: 0x000000,
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 1.0
                });
                feature.marker = marker;
                marker.on('click', function(e) {
                    if (click_locked) {
                        click_locked = false;
                        selectFeature(marker, feature);
                        return;
                    }
                    click_locked = true;
                });
                marker.on('mouseover', function(e) {
                    if (click_locked) { return; }
                    selectFeature(marker, feature);
                });
                return marker;
            }
        }).addTo(map);

        var args = pageArgs();
        if ("controls" in args) {
            args["controls"].split(/,/).forEach(function(key) {
                set_controls(key);
            });
        }
        if ("stationColorVar" in args) {
            setStationColorVar(args["stationColorVar"]);
        }

    }

    $.ajax({
        url: "./stations-data-trend-map.json",
        dataType: "json",
        success: function(data) {
            do_stations(data);
        }
    });

    function set_visible($elem, visible) {
        if (visible) {
            $elem.removeClass("invisible");
            $elem.addClass("visible");
        } else {
            $elem.removeClass("visible");
            $elem.addClass("invisible");
        }
    }

    function set_controls(key) {
        if (key === "0") {
            set_visible($("div#data-graph-background"), false);
            set_visible($("div#trend-graph-background"), false);
            set_visible($("div#controls"), false);
        } else if (key === "1") {
            set_visible($("div#data-graph-background"), true);
        } else if (key === "2") {
            set_visible($("div#trend-graph-background"), true);
        } else if (key === "3") {
            set_visible($("div#controls"), true);
        }
    }

    $(document).keypress(function(e) {
        var key = String.fromCharCode(e.charCode);
        if (key === "0" || key === "1" || key === "2" || key === "3" ) {
            set_controls(key);
        } else if (key === "x") {
            setStationColorVar("tmax");
        } else if (key === "g") {
            setStationColorVar("tavg");
        } else if (key === "n") {
            setStationColorVar("tmin");
        }
    });

    data_graph = makeGraph({
        $elem: $("div#data-graph"),
        margin: {top: 10, right: 10, bottom: 25, left: 28},
        axes: true,
        series: {
            "tmax-data" : [],
            "tmin-data" : [],
            "tavg-data" : [],
            "tmax-trend" : [],
            "tmin-trend" : [],
            "tavg-trend" : []
        },
        domain: {
            x: [year1, year2],
            y: [temp1, temp2]
        }
    });

    trend_graph = makeGraph({
        $elem: $("div#trend-graph"),
        margin: {top: 10, right: 10, bottom: 10, left: 10},
        axes: false,
        series: {
            "tmax-trend" : [],
            "tmin-trend" : [],
            "tavg-trend" : []
        },
        domain: {
            x: [year1, year2],
            y: [20, 90]
        }
    });
  
});

