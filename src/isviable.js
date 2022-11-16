const utils = require('./utils.js');
const moment = require('moment-timezone');
/**
 * @api {post} /isViable Request if optional trip is viable to the current trip
 * @apiVersion 1.0.0
 * @apiName IsViable
 * @apiGroup Carpooling
 * @apiParam {Number[]} currentLocation location of driver [lat,lng]
 * @apiParam {Number[]} [currentPickup] pick up location of current rider [lat,lng]
 * @apiParam {Number[]} currentDropoff drop off location of current rider [lat,lng]
 * @apiParam {Number[]} optionPickup pick up location of optional rider [lat,lng]
 * @apiParam {Number[]} optionDropoff drop off location of optional rider[lat,lng]
 * @apiParam {String} [currentPickupTime] pick up time of current trip 16:45
 * @apiParam {String} [currentAppointmentTime] appointment time of current trip 16:45
 * @apiParam {String} [optionAppointmentTime] appointment time of optional trip 16:45
 * 
 * @apiSuccess {boolean} result if optional trip is viable
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {"result":true}
 * 
 */
module.exports = (request, response) => {
	const respond = (value) => {
		response.send({ result: value });
	};
	let config = {
		maxTime: 60 * 60,
		windowTime: 60 * 5,
		beforeAppointment: 60 * 10
	};
	let dataResult = { current: {}, option: {} };
	let currentLocation;
	let currentPickup;
	let currentPickupTime;
	let currentDropoff;
	let currentAppointmentTime;
	let optionPickup;
	let optionDropoff;
	let optionAppointmentTime;
	try {
		currentLocation = request.body.currentLocation;
		currentPickup = request.body.currentPickup;
		currentDropoff = request.body.currentDropoff;
		optionPickup = request.body.optionPickup;
		currentPickupTime = request.body.currentPickupTime;
		currentAppointmentTime = request.body.currentAppointmentTime;
		optionDropoff = request.body.optionDropoff;
		optionAppointmentTime = request.body.optionAppointmentTime;
	} catch (e) {
	}

	let locations = [];
	if (utils.validate.notNull([currentLocation, currentDropoff, optionPickup, optionDropoff]) && (!currentPickup ? currentPickupTime : true)) {
		locations.push([currentLocation[0], currentLocation[1]]);
		if (currentPickup)
			locations.push([currentPickup[0], currentPickup[1]]);
		locations.push([currentDropoff[0], currentDropoff[1]]);
		utils.rest.get(utils.osrm.getLink(locations), (resp) => {
			let route = resp.routes[0];
			let elapsedTime = currentPickup ? 0 :
				(moment().diff(utils.time.parse(currentPickupTime)) / 1000);
			let tripTime = elapsedTime + route.duration;
			let currentDuration = currentPickup ? route.legs[1].duration :
				tripTime;
			dataResult.current.directTime = currentDuration;
			let isEnoughTime = (appointmentTime, duration) => {
				isEnough = true;
				if (appointmentTime) {
					let timeLeft = utils.time.parse(appointmentTime).diff(moment()) / 1000;
					dataResult.currentTimeLeft = timeLeft;
					isEnough = timeLeft > duration;
				}
				return isEnough;
			};
			let appointment = isEnoughTime(currentAppointmentTime, route.duration);

			if (tripTime < config.maxTime && appointment) {
				let polyline = utils.decode(route.geometry);
				let polygon = utils.polyline2Polygon(polyline);
				if (utils.containsLocation({ x: optionPickup[0], y: optionPickup[1] },
					polygon, true)) {
					locations = utils.fixOrder(currentLocation, currentPickup, currentDropoff, optionPickup, optionDropoff);
					utils.rest.get(utils.osrm.getLink(locations), (resp) => {
						let sumTime = (start, end) => {
							let time = 0;
							for (let i = start; i < end; i++) {
								time += resp.routes[0].legs[i].duration;
							}
							return time;
						}
						let currentStartIndex = !currentPickup ? 0 :
							utils.search.nearIndex(resp.waypoints, currentPickup);
						let currentEndIndex = utils.search.nearIndex(resp.waypoints, currentDropoff);
						let currentPathTime = sumTime(currentStartIndex, currentEndIndex) + elapsedTime;
						let currentAppt = isEnoughTime(currentAppointmentTime,
							sumTime(0, currentEndIndex) + config.windowTime);
						let optionStartIndex = utils.search.nearIndex(resp.waypoints, optionPickup);
						let optionEndIndex = utils.search.nearIndex(resp.waypoints, optionDropoff);
						let optionPathTime = sumTime(optionStartIndex, optionEndIndex);
						let optionAppt = isEnoughTime(optionAppointmentTime,
							sumTime(0, optionEndIndex) + config.windowTime);
						dataResult.current.start = currentStartIndex;
						dataResult.current.end = currentEndIndex;
						dataResult.current.pathTime = currentPathTime;
						dataResult.option.start = optionStartIndex;
						dataResult.option.end = optionEndIndex;
						dataResult.option.pathTime = optionPathTime;
						if (currentPathTime < config.maxTime && currentAppt && optionPathTime < config.maxTime && optionAppt) {
							utils.rest.get(utils.osrm.getLink([optionPickup, optionDropoff]), (resp) => {
								dataResult.option.directTime = resp.routes[0].duration;
								if (dataResult.current.pathTime < dataResult.current.directTime * 2 &&
									dataResult.option.pathTime < dataResult.option.directTime * 2) {
									return respond(true);
								} else {
									return respond(false);
								}
							});

						} else {
							return respond(false);
						}
					});

				} else {
					return respond(false);
				}
			} else {
				return respond(false);
			}
		});
	} else {
		return response.status(400).send({ error: "Missing parameters" });
	}
};