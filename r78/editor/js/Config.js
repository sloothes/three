/**
 * @author mrdoob / http://mrdoob.com/
 */

var Config = function ( name ) {

	var storage = {

		"autosave": true,
		"theme": "css/light.css",

		"project/vr": false,
		"project/cache":false,
		"project/editable": false,
        "project/debugMode": true,
		"project/renderer/shadows": true,
		"project/renderer/antialias": true,
		"project/renderer": "WebGLRenderer",

		"settings/history": false,

		"ui/sidebar/script/collapsed": true,
		"ui/sidebar/animation/collapsed": true,

	};

	if ( window.localStorage[ name ] === undefined ) {

		window.localStorage[ name ] = JSON.stringify( storage );

	} else {

		var data = JSON.parse( window.localStorage[ name ] );

		for ( var key in data ) {

			storage[ key ] = data[ key ];

		}

	}

	return {

		getKey: function ( key ) {

			return storage[ key ];

		},

		setKey: function () { // key, value, key, value ...

			for ( var i = 0, l = arguments.length; i < l; i += 2 ) {

				storage[ arguments[ i ] ] = arguments[ i + 1 ];

			}

		//  Update.

		//	on Startup update from "json.project" in app.js.
			debugMode = storage["project/debugMode"];
			THREE.Cache.enabled = storage["project/cache"];

		//	Save storage.

			window.localStorage[ name ] = JSON.stringify( storage );

			debugMode && console.log( "[" + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + "]", "Saved config to LocalStorage." );

		},

		clear: function () {

			delete window.localStorage[ name ];

		}

	};

};
