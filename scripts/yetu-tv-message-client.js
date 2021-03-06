//     yetu-tv-message-client.js 1.1.0
//     https://github.com/yetu/yetu-tv-message-client
//     (c) 2015 Yetu AG
//     Yetu Tv Message Client is freely distributed under the MIT license.

(function(root, factory) {
	
	if (typeof define === 'function' && define.amd) {

		// Export global even in AMD case in case this script 
		// is loaded with others that may still expect a global _yetu.
		define(['flyer', 'JSON', 'lil-uuid', 'exports'], function(flyer, JSON, lil, exports) {
			root._yetu = factory(root, exports, flyer, JSON, lil);
		});

	} else if (typeof exports !== 'undefined') {

		// Next for Node.js or CommonJS. jQuery may not be needed as a module.
		var flyer = require('flyer');
		var JSON = require('JSON');
		var lil = require('lil-uuid');
		factory(root, exports, flyer, JSON, lil);

	} else {
		// Finally, as a browser global.
		root._yetu = factory(root, {}, root.flyer, root.JSON, root.lil);
	}

}(this, function (root, _yetu, flyer, JSON, lil) {

	// Baseline setup
	// --------------

	// Enable code to run in strict mode
	'use strict';

	// Current version.
	_yetu.VERSION = '1.1.0';

	// Default channel for yetu communication
	_yetu.CHANNEL = 'yetu';

	// Default topic for yetu Remote Control
	_yetu.CONTROL_TOPIC = 'control';

	// Default topics to send information to yetu
	_yetu.READY_TOPIC = 'action.is.ready';
	_yetu.MESSAGE_TOPIC = 'message.to.yetu';
	_yetu.INDEX_TOPIC = _yetu.CONTROL_TOPIC + '.index';
	_yetu.QUIT_TOPIC = _yetu.CONTROL_TOPIC + '.quit';
	
	// Default topics handle all actions
	_yetu.ALL_TOPICS = _yetu.CONTROL_TOPIC + '.*';

	// Default topics to handle specific key of Yetu Remote Control
	_yetu.KEY = {};
	_yetu.KEY.UP = _yetu.CONTROL_TOPIC + '.up';
	_yetu.KEY.DOWN = _yetu.CONTROL_TOPIC + '.down';
	_yetu.KEY.LEFT = _yetu.CONTROL_TOPIC + '.left';
	_yetu.KEY.RIGHT = _yetu.CONTROL_TOPIC + '.right';
	_yetu.KEY.ENTER = _yetu.CONTROL_TOPIC + '.enter';
	_yetu.KEY.BACK = _yetu.CONTROL_TOPIC + '.back';
	_yetu.KEY.MENU = _yetu.CONTROL_TOPIC + '.menu';
	_yetu.KEY.PLAY = _yetu.CONTROL_TOPIC + '.play';
	_yetu.KEY.REWIND = _yetu.CONTROL_TOPIC + '.rewind';
	_yetu.KEY.FORWARD = _yetu.CONTROL_TOPIC + '.forward';

	// Stores the handlers add through `on` method
	var handlers = [];

	// Stored the callback called when the any action happen
	var any = null;

	// This UUID will be concatenated to each topic, to allow
	// targeting applications
	var id = null;

	// this wrapper use 3d-party module to generate a 36 characters 
	// UUID (10.000+ year to collision) in compliance with the RFC4122
	var uuid = function () {
		return lil.uuid();
	};

	// Broadcasts the `data` to the `topic` on the default channel 
	var send = function(topic, data) {
		
		var wrap = _yetu.wrap(topic);

		try {
			
			flyer.wrapper.broadcast({
				channel: _yetu.CHANNEL,
				topic: wrap,
				data: {
					title: (document.title || null),
					message: data
				}
			});
			
			return {
				sent : true,
				message: "Message has been sent " + JSON.stringify(data)
			};
		}
		catch(e) {
			return {
				sent : false,
				message:  "Error on broadcasting the topic: " + wrap,
				error: e
			};
		}
	};

	// Notify the `READY_TOPIC` that
	// the yetu object is fully loaded
	var ready = function() {
		return send(_yetu.READY_TOPIC, '');
	};

	// getter for the current application UUID
	_yetu.id = function() {
		return id;
	};

	// wrap the current topic to the current UUID
	_yetu.wrap = function(topic) {
		return topic + '.' + id;
	};

	// Send a `message` to the owner in the `MESSAGE_TOPIC`
	_yetu.message = function(message) {
		return send(_yetu.MESSAGE_TOPIC,  message || '');
	};

	// Send the `index` to the `INDEX_TOPIC`
	_yetu.index = function(index) {
		return send(_yetu.INDEX_TOPIC, {index : index || 0});
	};

	// Send the `message` to the `QUIT_TOPIC`
	_yetu.quit = function(message) {
		return send(_yetu.QUIT_TOPIC, message || '');
	};

	_yetu.any = function(callback) {
		any = callback;
	};

	// Push to the handlers the current topic and callback if the 
	// current topic is already handled, change the callback
	_yetu.on = function(topic, callback) {
		
		var wrap = _yetu.wrap(topic);
		var index = _yetu.indexOf(wrap);

		if (index < 0) {
			handlers.push({topic: wrap, callback: callback});
		} else {
			handlers[index].callback = callback;
		}
	};

	// If the topic is on the array, use splice to remove it
	// work as a unsubscriber to a topic
	_yetu.off = function(topic) {

		var wrap = _yetu.wrap(topic);
		var index = _yetu.indexOf(wrap);

		if (index >= 0) {
			handlers.splice(index, 1);
		}
	};

	// Listent to any topic on the `CHANNEL` and direct the particular
	// action to his handler attachted
	_yetu.receive = function(data, topic, channel) {

		// if the current topic isn't the `QUIT_TOPIC`
		if(topic !== _yetu.wrap(_yetu.QUIT_TOPIC)) {

			// if has a callback to any action call it
			if (any && typeof any == 'function' && topic.indexOf(id) >= 0) {
				any();
			}
		}

		// check if the `handlers` object has a handler to the wrapped topic
		var index = _yetu.indexOf(topic);
		if (index >= 0) {
			handlers[index].callback();
		}
	};

	// Return the number of callbacks attached to the `handlers` object
	_yetu.size = function() {
		return handlers.length;
	};

	// Remove all callbacks including the one for any topics
	_yetu.clear = function() {
		any = null;
		handlers = [];
	};

	// indexOf based on the browser implementation ECMA5
	// focused on find the topic at the `handlers` object
	_yetu.indexOf = function(topic, start) {
		for (var i = (start || 0), j = handlers.length; i < j; i++) {
			if (handlers[i].topic === topic) { return i; }
		}
		return -1;
	};

	// subscribe to all actions of the yetu channel
	flyer.wrapper.subscribe({
		channel: _yetu.CHANNEL,
		topic: _yetu.ALL_TOPICS,
		callback: _yetu.receive
	});

	// generate the UUID
	id = uuid();

	// Add a listener to window object, when the 
	// event get triggered by the browser call
	// the ready private function to broadcast the 
	// message to the channel
	window.addEventListener('load', function() {
		if(_yetu) {
			ready();
		}
	}, false);

	return _yetu;

}));