define({ "api": [
  {
    "type": "post",
    "url": "/isViable",
    "title": "Request if optional trip is viable to the current trip",
    "version": "1.0.0",
    "name": "IsViable",
    "group": "Carpooling",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number[]",
            "optional": false,
            "field": "currentLocation",
            "description": "<p>location of driver [lat,lng]</p>"
          },
          {
            "group": "Parameter",
            "type": "Number[]",
            "optional": true,
            "field": "currentPickup",
            "description": "<p>pick up location of current rider [lat,lng]</p>"
          },
          {
            "group": "Parameter",
            "type": "Number[]",
            "optional": false,
            "field": "currentDropoff",
            "description": "<p>drop off location of current rider [lat,lng]</p>"
          },
          {
            "group": "Parameter",
            "type": "Number[]",
            "optional": false,
            "field": "optionPickup",
            "description": "<p>pick up location of optional rider [lat,lng]</p>"
          },
          {
            "group": "Parameter",
            "type": "Number[]",
            "optional": false,
            "field": "optionDropoff",
            "description": "<p>drop off location of optional rider[lat,lng]</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "currentPickupTime",
            "description": "<p>pick up time of current trip 16:45</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "currentAppointmentTime",
            "description": "<p>appointment time of current trip 16:45</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "optionAppointmentTime",
            "description": "<p>appointment time of optional trip 16:45</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "boolean",
            "optional": false,
            "field": "result",
            "description": "<p>if optional trip is viable</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\"result\":true}",
          "type": "json"
        }
      ]
    },
    "filename": "src/isviable.js",
    "groupTitle": "Carpooling"
  }
] });
