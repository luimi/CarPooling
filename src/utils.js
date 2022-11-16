var jsts = require('jsts');
var moment = require('moment-timezone');
var http = require('http');
var https = require('https');
module.exports = {
	decode: function (str) {
		var index = 0,
			lat = 0,
			lng = 0,
			coordinates = [],
			shift = 0,
			result = 0,
			byte = null,
			latitude_change,
			longitude_change,
			factor = Math.pow(10, 5);
		while (index < str.length) {
			byte = null;
			shift = 0;
			result = 0;
			do {
				byte = str.charCodeAt(index++) - 63;
				result |= (byte & 0x1f) << shift;
				shift += 5;
			} while (byte >= 0x20);

			latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

			shift = result = 0;

			do {
				byte = str.charCodeAt(index++) - 63;
				result |= (byte & 0x1f) << shift;
				shift += 5;
			} while (byte >= 0x20);

			longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

			lat += latitude_change;
			lng += longitude_change;

			//coordinates.push({x:lat / factor,y: lng / factor});
			coordinates.push(new jsts.geom.Coordinate(lat / factor, lng / factor));
		}
		return coordinates;
	}, containsLocation: function (point, polygon, geodesic) {
		size = polygon.length;
		if (size == 0) {
			return false;
		} else {
			lat3 = Math.toRadians(point.x);
			lng3 = Math.toRadians(point.y);
			prev = polygon[size - 1];
			lat1 = Math.toRadians(prev.x);
			lng1 = Math.toRadians(prev.y);
			nIntersect = 0;

			lng2 = 0;
			for (i = 0; i < size; i++) {
				point2 = polygon[i];

				dLng3 = MathUtil.wrap(lng3 - lng1, -3.141592653589793, 3.141592653589793);
				if (lat3 == lat1 && dLng3 == 0.0) {
					return true;
				}

				lat2 = Math.toRadians(point2.x);
				lng2 = Math.toRadians(point2.y);
				if (intersects(lat1, lat2, MathUtil.wrap(lng2 - lng1, -3.141592653589793, 3.141592653589793), lat3, dLng3, geodesic)) {
					++nIntersect;
				}

				lat1 = lat2;
				lng1 = lng2;
			}
			return (nIntersect & 1) != 0;
		}
	}, polyline2Polygon: function (array) {
		var geometryFactory = new jsts.geom.GeometryFactory();
		var distance = (1610 * 0.0011) / 111.12;
		var shell = geometryFactory.createLineString(array);
		var polygon = shell.buffer(distance);
		return polygon.getCoordinates();
	}, osrm: {
		getLink: function (locations) {
			let link = "https://router.project-osrm.org/route/v1/driving/";
			locations.forEach(function (location, index) {
				if (location)
					link += (index == 0 ? '' : ';') + location[1] + "," + location[0];
			});
			return link;
		}, getPaths: function (result) {
			return [result.routes[0].geometry];
		}
	}, time: {
		parse: function (time) {
			return moment.tz(moment(time + " -0400", "hh:mm Z"), "America/Havana");
		}
	}, fixOrder: function (currentLocation, currentPickup, currentDropoff, optionPickup, optionDropoff) {
		let locations = [currentLocation];
		let compare = function (from, to1, to2, close1, close2) {
			if (distanceBetwen(from, to1) <
				distanceBetwen(from, to2)) {
				close1();
			} else {
				close2();
			}
		}
		let organize = function (prev, opt1, opt2, pair) {
			compare(prev, opt1, opt2, function () {
				locations.push(opt1);
				compare(opt1, opt2, pair, function () {
					locations.push(opt2, pair);
				}, function () {
					locations.push(pair, opt2);
				});
			}, function () {
				locations.push(opt2, opt1, pair);
			});
		}
		if (currentPickup) {
			compare(currentLocation, currentPickup, optionPickup,
				function () {
					locations.push(currentPickup);
					organize(currentPickup, optionPickup, currentDropoff,
						optionDropoff);
				}, function () {
					locations.push(optionPickup);
					organize(optionPickup, currentPickup, optionDropoff,
						currentDropoff);
				});
		} else {
			organize(currentLocation, optionPickup, currentDropoff,
				optionDropoff);
		}
		return locations;
	}, rest: {
		get: function (link, callback) {
			https.get(link, res => {
				res.setEncoding("utf8");
				body = "";
				res.on("data", data => { body += data; });
				res.on("end", () => {
					let result;
					try {
						result = JSON.parse(body);
					} catch (e) {
						console.error("Parsing body");
					}
					callback(result);
				});
			});
		}
	}, validate: {
		notNull: (values) => {
			status = true;
			values.forEach((val) => {
				if (!val || val === "") {
					status = false;
				}
			});
			return status;
		}
	}, search: {
		nearIndex: function (locations, location) {
			nearest = 0;
			for (let i = 1; i < locations.length; i++) {
				if (distanceBetwen(location, invertLocation(locations[i].location)) <
					distanceBetwen(location, invertLocation(locations[nearest].location))) {
					nearest = i;
				}
			}
			return nearest;
		}
	}
}
Math.toRadians = function (degrees) {
	return degrees * (Math.PI / 180);
}
MathUtil = {
	wrap: function (n, min, max) {
		return n >= min && n < max ? n : mod(n - min, max - min) + min;
	},
	mod: function (x, m) {
		return (x % m + m) % m;
	},
	mercator: function (lat) {
		return Math.log(Math.tan(lat * 0.5 + 0.7853981633974483));
	}
};
intersects = function (lat1, lat2, lng2, lat3, lng3, geodesic) {
	if ((lng3 < 0.0 || lng3 < lng2) && (lng3 >= 0.0 || lng3 >= lng2)) {
		if (lat3 <= -1.5707963267948966) {
			return false;
		} else if (lat1 > -1.5707963267948966 && lat2 > -1.5707963267948966 && lat1 < 1.5707963267948966 && lat2 < 1.5707963267948966) {
			if (lng2 <= -3.141592653589793) {
				return false;
			} else {
				linearLat = (lat1 * (lng2 - lng3) + lat2 * lng3) / lng2;
				return lat1 >= 0.0 && lat2 >= 0.0 && lat3 < linearLat ? false : (lat1 <= 0.0 && lat2 <= 0.0 && lat3 >= linearLat ? true : (lat3 >= 1.5707963267948966 ? true : (geodesic ? Math.tan(lat3) >= tanLatGC(lat1, lat2, lng2, lng3) : MathUtil.mercator(lat3) >= mercatorLatRhumb(lat1, lat2, lng2, lng3))));
			}
		} else {
			return false;
		}
	} else {
		return false;
	}
};
tanLatGC = function (lat1, lat2, lng2, lng3) {
	return (Math.tan(lat1) * Math.sin(lng2 - lng3) + Math.tan(lat2) * Math.sin(lng3)) / Math.sin(lng2);
};
mercatorLatRhumb = function (lat1, lat2, lng2, lng3) {
	return (MathUtil.mercator(lat1) * (lng2 - lng3) + MathUtil.mercator(lat2) * lng3) / lng2;
};
distanceBetwen = function (from, to) {
	let radFromLat = Math.toRadians(from[0]);
	let radFromLng = Math.toRadians(from[1]);
	let radToLat = Math.toRadians(to[0]);
	let radToLng = Math.toRadians(to[1]);
	return 2 * Math.asin(Math.sqrt(
		Math.pow(Math.sin((radFromLat - radToLat) / 2), 2)
		+ Math.cos(radFromLat) * Math.cos(radToLat) *
		Math.pow(Math.sin((radFromLng - radToLng) / 2), 2)
	)) * 6378137;
}
invertLocation = function (location) {
	return [location[1], location[0]];
}