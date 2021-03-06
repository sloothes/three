/**
 * @author mrdoob / http://mrdoob.com/
 */


var debugMode;
var vr, controls, effect;    //	global for debug.
var camera, scene, renderer; //	global for debug.

var APP = {

	Player: function () {

		var scope = this;

		var loader = new THREE.ObjectLoader();

	//	var vr, controls, effect;
	//	var camera, scene, renderer;

		var events = {};

		this.dom = document.createElement( "div" );

		this.width = 500;
		this.height = 500;

	//	Load app.json.

		this.load = function ( json ) {

			console.clear();

		//	Project config.

			vr = json.project.vr;
			debugMode = json.project.debugMode; // global! 
			THREE.Cache.enabled = json.project.cache; // important!
			console.log({ "vr": vr, "debugMode": debugMode, "cache": THREE.Cache.enabled });

		//	Caution: renderer is global for debugging!

			renderer = new THREE.WebGLRenderer({ 
				antialias: true,
				preserveDrawingBuffer: true,
            });

			renderer.setClearColor( 0x000000 );
			renderer.setPixelRatio( window.devicePixelRatio );

			if ( json.project.shadows ) {

				renderer.shadowMap.enabled = true;
			//	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

			}

			this.dom.appendChild( renderer.domElement );
			this.setScene( loader.parse( json.scene ) );
			this.setCamera( loader.parse( json.camera ) );

			events = {
				init: [],
				start: [],
				stop: [],
				keydown: [],
				keyup: [],
				mousedown: [],
				mouseup: [],
				mousemove: [],
				touchstart: [],
				touchend: [],
				touchmove: [],
				update: [],
			};

			var scriptWrapParams = "player,renderer,scene,camera";
			var scriptWrapResultObj = {};

			for ( var eventKey in events ) {

				scriptWrapParams += "," + eventKey;
				scriptWrapResultObj[ eventKey ] = eventKey;

			}

			var scriptWrapResult = JSON.stringify( scriptWrapResultObj ).replace( /\"/g, "" );

		//

			for ( var uuid in json.scripts ) {

				var object = scene.getObjectByProperty( "uuid", uuid, true ); // important!

			//	Initialize orphan scripts.

				if ( object === undefined ) {

				//	if "object" is "null", "this" of "functions" will become the "window". important!
					console.warn( "Scripts of uuid:", uuid, "are orphan. Orphan scripts get \"window\" as \"this\"." ); // continue;

				}

				var scripts = json.scripts[ uuid ]; 

				for ( var i = 0; i < scripts.length; i ++ ) {

					var script = scripts[ i ];

					var functions = ( new Function( scriptWrapParams, script.source + "\nreturn " + scriptWrapResult + ";" ).bind( object ) )( this, renderer, scene, camera );

					for ( var name in functions ) {

						if ( functions[ name ] === undefined ) continue;

						if ( events[ name ] === undefined ) {

							console.warn( "APP: Event type not supported (", name, ")" ); 

							continue;

						}

						events[ name ].push( functions[ name ].bind( object ) );

					}

				}

			}
			
			dispatch( events.init, arguments );

		};

//

	//	Execute script in window scope.

		this.setLibrary = function() {

		//  arguments: soucre code (text).

			for (var i in arguments){

				var script = new Function( arguments[ i ] ); 
				script.bind( window ).call(); // bind and execute script.
				debugMode && console.log("Library", script.toString(), "executed.");

			}

		};

	//	Load javascript libraries.

		this.loadLibrary = function(){

			var loader = new THREE.XHRLoader();

			for ( var i in arguments ){

				loader.load( arguments[i], this.setLibrary );
				console.log( "Library", arguments[i], "loaded.");

			}

		};

		this.setCamera = function ( value ) {

			camera = value;
			camera.aspect = this.width / this.height;
			camera.updateProjectionMatrix();

			if ( vr === true ) {

				if ( camera.parent === null ) {

				//	camera needs to be in the scene so camera2 matrix updates.

					scene.add( camera );

				}

				var camera2 = camera.clone();
				camera.add( camera2 );

				camera = camera2;

				controls = new THREE.VRControls( camera );
				effect = new THREE.VREffect( renderer );

				if ( WEBVR.isAvailable() === true ) {

					this.dom.appendChild( WEBVR.getButton( effect ) );

				}

				if ( WEBVR.isLatestAvailable() === false ) {

					this.dom.appendChild( WEBVR.getMessage() );

				}

			}

		};

		this.setScene = function ( value ) {

			scene = value;

		};

		this.setSize = function ( width, height ) {

			if ( renderer && renderer._fullScreen ) return;

			this.width = width;
			this.height = height;

            if ( camera ) {

                camera.aspect = this.width / this.height;
                camera.updateProjectionMatrix();

            }

			if ( renderer ) renderer.setSize( width, height );

		};

		function dispatch( array, event ) {

			for ( var i = 0, l = array.length; i < l; i ++ ) {

				array[ i ]( event );

			}

		}

		var prevTime, request;

		function animate( time ) {

			request = requestAnimationFrame( animate );

			try {

				dispatch( events.update, { time: time, delta: time - prevTime } );

			} catch ( e ) {

				console.error( ( e.message || e ), ( e.stack || "" ) );

			}

			if ( vr === true ) {

				controls.update();
				effect.render( scene, camera );

			} else {

				renderer.render( scene, camera );

			}

			prevTime = time;

		}

		this.play = function () {

			document.addEventListener( "keydown", onDocumentKeyDown );
			document.addEventListener( "keyup", onDocumentKeyUp );
			document.addEventListener( "mousedown", onDocumentMouseDown );
			document.addEventListener( "mouseup", onDocumentMouseUp );
			document.addEventListener( "mousemove", onDocumentMouseMove );
			document.addEventListener( "touchstart", onDocumentTouchStart );
			document.addEventListener( "touchend", onDocumentTouchEnd );
			document.addEventListener( "touchmove", onDocumentTouchMove );

			dispatch( events.start, arguments );

			request = requestAnimationFrame( animate );
			prevTime = performance.now();

		};

		this.stop = function () {

			document.removeEventListener( "keydown", onDocumentKeyDown );
			document.removeEventListener( "keyup", onDocumentKeyUp );
			document.removeEventListener( "mousedown", onDocumentMouseDown );
			document.removeEventListener( "mouseup", onDocumentMouseUp );
			document.removeEventListener( "mousemove", onDocumentMouseMove );
			document.removeEventListener( "touchstart", onDocumentTouchStart );
			document.removeEventListener( "touchend", onDocumentTouchEnd );
			document.removeEventListener( "touchmove", onDocumentTouchMove );

			dispatch( events.stop, arguments );

			cancelAnimationFrame( request );

		};

		this.dispose = function () {

			while ( this.dom.children.length ) {

				this.dom.removeChild( this.dom.firstChild );

			}

			renderer.dispose();

			debugMode && console.log( "info:", renderer.info );

		};

	//

		function onDocumentKeyDown( event ) {

			dispatch( events.keydown, event );

		}

		function onDocumentKeyUp( event ) {

			dispatch( events.keyup, event );

		}

		function onDocumentMouseDown( event ) {

			dispatch( events.mousedown, event );

		}

		function onDocumentMouseUp( event ) {

			dispatch( events.mouseup, event );

		}

		function onDocumentMouseMove( event ) {

			dispatch( events.mousemove, event );

		}

		function onDocumentTouchStart( event ) {

			dispatch( events.touchstart, event );

		}

		function onDocumentTouchEnd( event ) {

			dispatch( events.touchend, event );

		}

		function onDocumentTouchMove( event ) {

			dispatch( events.touchmove, event );

		}

	}

};





//	=========================================================================================  //

/*
		//	Load external javascirpt libraries (backward).

			if ( json.javascripts && json.javascripts.length > 0 ) {

				var scripts = json.javascripts.map( parseScript );
				debugMode && console.log( "scripts:", scripts );

				function parseScript( item ){ 
					return {
						name: item.name,
						source: JSON.parse( item.source ) // important!
					};
				}

				while ( scripts.length ) {

					var object = scripts.shift(); // important!
					var script = new Function( object.source );
					script.bind( window ).call(); // bind and execute.
					console.log("Library", object.name, "loaded.");

				}

			}

		//	Load external javascirpt libraries.

			if ( json.jslibraries && json.jslibraries.length > 0 ) {

				var scripts = json.jslibraries.map( parseScript );
				debugMode && console.log( "scripts:", scripts );

				function parseScript( item ){ 
					return {
						name: item.name,
						source: JSON.parse( item.source ) // important!
					};
				}

				while ( scripts.length ) {

					var object = scripts.shift(); // important!
					var script = new Function( object.source );
					script.bind( window ).call(); // bind and execute.
					console.log("Library", object.name, "loaded.");

				}

			}
*/

/*
		//  Initialize scene object scripts first.

			var uuid = json.scene.object.uuid; // important!

			var scripts = json.scripts[ uuid ]; 

			if ( scripts && scripts.length ) {

				for ( var i = 0; i < scripts.length; i ++ ) {

					var script = scripts[ i ];

					var functions = ( new Function( scriptWrapParams, script.source + "\nreturn " + scriptWrapResult + ";" ).bind( scene ) )( this, renderer, scene, camera );

					for ( var name in functions ) {

						if ( functions[ name ] === undefined ) continue;

						if ( events[ name ] === undefined ) {

							console.warn( "APP: Event type not supported (", name, ")" ); 

							continue;

						}

						events[ name ].push( functions[ name ].bind( scene ) );

					}

				}

			}

		//  Initialize objects scripts by scene children order.

			if ( json.scene.object.children && json.scene.object.children.length ) {

				for ( var j = 0; j < json.scene.object.children.length; j ++ ) {

					var uuid = json.scene.object.children[ j ].uuid;

					var object = scene.getObjectByProperty( "uuid", uuid, true ); // important!

					var scripts = json.scripts[ uuid ];

					if ( scripts == undefined || scripts.length == 0 ) continue; // important!

					for ( var i = 0; i < scripts.length; i ++ ) {

						var script = scripts[ i ];

						var functions = ( new Function( scriptWrapParams, script.source + "\nreturn " + scriptWrapResult + ";" ).bind( object ) )( this, renderer, scene, camera );

						for ( var name in functions ) {

							if ( functions[ name ] === undefined ) continue;

							if ( events[ name ] === undefined ) {

								console.warn( "APP: Event type not supported (", name, ")" ); 

								continue;

							}

							events[ name ].push( functions[ name ].bind( object ) );

						}

					}

				}

			}
*/

//	=========================================================================================  //

/*
	for ( var i = 0; i < json.javascripts.length; i ++ ) {

		var name = json.javascript[ i ].name;
		var source = json.javascript[ i ].source;

		var script = new Function( "window", source );
		script.call( window ); // execute script in window scope. important!

		//  execute script in one line-code.
		//	( new Function( "window", json.javascript[ i ].source ) )( window ); 

		debugMode && console.log( name + " loaded.");

	}
*/
//	=========================================================================================  //

/*
	for (var i = 0; i < scripts.length; i++ ){

		var script = new Function("scope", scripts[ i ]); 
		//	script.call( window ); // execute script.
		console.log("Script", script.call( window ), "executed.");

	}
*/
//	=========================================================================================  //

/*
	while ( scripts.length ) {
		console.log( "Script", ( new Function("scope", scripts.shift() )( window ), "executed.");
	}
*/
//	=========================================================================================  //

//	this.setLibrary.apply( this, json.javascripts.map( parseJSON ) );

//	=========================================================================================  //
