/**
 * @author mrdoob / http://mrdoob.com/
 */

var Viewport = function ( editor ) {

	renderer = null; // (TODO: local?)

	var signals = editor.signals;

	var container = new UI.Panel();
	container.setId( "viewport" );
	container.setPosition( "absolute" );

	container.add( new Viewport.Info( editor ) );

	var scene = editor.scene;
	var sceneHelpers = editor.sceneHelpers;

	var objects = [];

//	Helpers.

	var grid = new THREE.GridHelper( 30, 1 );
	sceneHelpers.add( grid );

//	Camera.

	var camera = editor.camera;

//
	var selectionBox = new THREE.BoxHelper();
	selectionBox.material.depthTest = false;
	selectionBox.material.transparent = true;
	selectionBox.visible = false;
	sceneHelpers.add( selectionBox );

	var objectPositionOnDown = null;
	var objectRotationOnDown = null;
	var objectScaleOnDown = null;

	var transformControls = new THREE.TransformControls( camera, container.dom );
	transformControls.addEventListener( "change", function () {

		var object = transformControls.object;

		if ( object !== undefined ) {

			selectionBox.update( object );

			if ( editor.helpers[ object.id ] !== undefined ) {

				editor.helpers[ object.id ].update();

			}

			signals.refreshSidebarObject3D.dispatch( object );

		}

		render();

	});

	transformControls.addEventListener( "mouseDown", function () {

		var object = transformControls.object;

		objectPositionOnDown = object.position.clone();
		objectRotationOnDown = object.rotation.clone();
		objectScaleOnDown = object.scale.clone();

		controls.enabled = false;

	});

	transformControls.addEventListener( "mouseUp", function () {

		var object = transformControls.object;

		if ( object !== undefined ) {

			switch ( transformControls.getMode() ) {

				case "translate":

					if ( ! objectPositionOnDown.equals( object.position ) ) {

						editor.execute( new SetPositionCommand( object, object.position, objectPositionOnDown ) );

					}

					break;

				case "rotate":

					if ( ! objectRotationOnDown.equals( object.rotation ) ) {

						editor.execute( new SetRotationCommand( object, object.rotation, objectRotationOnDown ) );

					}

					break;

				case "scale":

					if ( ! objectScaleOnDown.equals( object.scale ) ) {

						editor.execute( new SetScaleCommand( object, object.scale, objectScaleOnDown ) );

					}

					break;

			}

		}

		controls.enabled = true;

	});

	sceneHelpers.add( transformControls );

//	fog.

	var oldFogType = "None";
	var oldFogColor = 0xaaaaaa;
	var oldFogNear = 1;
	var oldFogFar = 5000;
	var oldFogDensity = 0.00025;

//	object picking.

	var raycaster = new THREE.Raycaster();
	var mouse = new THREE.Vector2();

//	events.

	function getIntersects( point, objects ) {

		mouse.set( ( point.x * 2 ) - 1, - ( point.y * 2 ) + 1 );

		raycaster.setFromCamera( mouse, camera );

		return raycaster.intersectObjects( objects );

	}

	var onDownPosition = new THREE.Vector2();
	var onUpPosition = new THREE.Vector2();
	var onDoubleClickPosition = new THREE.Vector2();

	function getMousePosition( dom, x, y ) {

		var rect = dom.getBoundingClientRect();
		return [ ( x - rect.left ) / rect.width, ( y - rect.top ) / rect.height ];

	}

	function handleClick() {

		if ( onDownPosition.distanceTo( onUpPosition ) === 0 ) {

			var intersects = getIntersects( onUpPosition, objects );

			if ( intersects.length > 0 ) {

				var object = intersects[ 0 ].object;

				if ( object.userData.object !== undefined ) {

				//	helper.

					editor.select( object.userData.object );

				} else {

					editor.select( object );

				}

			} else {

				editor.select( null );

			}

			render();

		}

	}

	function onMouseDown( event ) {

		event.preventDefault();

		var array = getMousePosition( container.dom, event.clientX, event.clientY );
		onDownPosition.fromArray( array );

		document.addEventListener( "mouseup", onMouseUp, false );

	}

	function onMouseUp( event ) {

		var array = getMousePosition( container.dom, event.clientX, event.clientY );
		onUpPosition.fromArray( array );

		handleClick();

		document.removeEventListener( "mouseup", onMouseUp, false );

	}

	function onTouchStart( event ) {

		var touch = event.changedTouches[ 0 ];

		var array = getMousePosition( container.dom, touch.clientX, touch.clientY );
		onDownPosition.fromArray( array );

		document.addEventListener( "touchend", onTouchEnd, false );

	}

	function onTouchEnd( event ) {

		var touch = event.changedTouches[ 0 ];

		var array = getMousePosition( container.dom, touch.clientX, touch.clientY );
		onUpPosition.fromArray( array );

		handleClick();

		document.removeEventListener( "touchend", onTouchEnd, false );

	}

	function onDoubleClick( event ) {

		var array = getMousePosition( container.dom, event.clientX, event.clientY );
		onDoubleClickPosition.fromArray( array );

		var intersects = getIntersects( onDoubleClickPosition, objects );

		if ( intersects.length > 0 ) {

			var intersect = intersects[ 0 ];

			signals.objectFocused.dispatch( intersect.object );

		}

	}

	container.dom.addEventListener( "mousedown", onMouseDown, false );
	container.dom.addEventListener( "touchstart", onTouchStart, false );
	container.dom.addEventListener( "dblclick", onDoubleClick, false );


//	Editor controls.

	//	Editor controls need to be added "after" main logic,
	//	otherwise controls.enabled doesn't work. important!

	var controls = new THREE.EditorControls( camera, container.dom );

	center = controls.center; // for passing to player controls on startup ( global! ).

	controls.addEventListener( "change", function () {

	//	Update light position (by name) important!
		var light = scene.getObjectByName( editor.lights.name );
		if ( light ) light.position.copy( camera.position );

    //	Update center.
		center = controls.center;

		transformControls.update();
		signals.cameraChanged.dispatch( camera );

	});


//	Signals.

	signals.editorCleared.add( function () {

		controls.center.set( 0, 0, 0 );

	//	Add camera directional light.
	//	scene.add( editor.lights ); // bypass push in "objects" to avoid helper creation.
        editor.addObject( editor.lights );

	//	Update camera light position (by uuid) important!
		var uuid = editor.lights.uuid;
		var light = editor.objectByUuid( uuid );
		if ( light ) light.position.copy( camera.position );

		render();

	});

/*
	signals.sceneLoaded.add( function () {

	//	Save state.

		setTimeout( function () {

			editor.signals.savingStarted.dispatch();

			setTimeout( function () {

				editor.storage.set( editor.toJSON() );

				editor.signals.savingFinished.dispatch();

			}, 100 );

		}, 1000 );

	});
*/

	var clearColor;

	signals.themeChanged.add( function ( value ) {

		switch ( value ) {

			case "css/light.css":
				sceneHelpers.remove( grid );
				grid = new THREE.GridHelper( 30, 1, 0x444444, 0x888888 );
				sceneHelpers.add( grid );
				clearColor = 0xaaaaaa;
				break;
			case "css/dark.css":
				sceneHelpers.remove( grid );
				grid = new THREE.GridHelper( 30, 1, 0xbbbbbb, 0x888888 );
				sceneHelpers.add( grid );
				clearColor = 0x333333;
				break;

		}

		renderer.setClearColor( clearColor );

		render();

	});

	signals.transformModeChanged.add( function ( mode ) {

		transformControls.setMode( mode );

	});

	signals.snapChanged.add( function ( dist ) {

		transformControls.setTranslationSnap( dist );

	});

	signals.spaceChanged.add( function ( space ) {

		transformControls.setSpace( space );

	});

	signals.rendererChanged.add( function ( newRenderer ) {

		if ( renderer !== null ) {

			container.dom.removeChild( renderer.domElement );

		}

		renderer = newRenderer;

		renderer.autoClear = false;
		renderer.autoUpdateScene = false;
		renderer.setClearColor( clearColor );
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( container.dom.offsetWidth, container.dom.offsetHeight );

		container.dom.appendChild( renderer.domElement );

		render();

	});

	signals.sceneGraphChanged.add( function () {

		render();

	});

	var saveTimeout;

	signals.cameraChanged.add( function () {

		render();

	});

	signals.objectSelected.add( function ( object ) {

		selectionBox.visible = false;
		transformControls.detach();

		if ( object !== null ) {

			if ( object.geometry !== undefined ) {

				selectionBox.update( object );
				selectionBox.visible = true;

			}

			transformControls.attach( object );

		}

		render();

	});

	signals.objectFocused.add( function ( object ) {

		if ( object === undefined ) return;

		controls.focus( object );

	});

	signals.geometryChanged.add( function ( object ) {

		if ( object !== undefined ) {

			selectionBox.update( object );

		}

		render();

	});

	signals.objectAdded.add( function ( object ) {

		if ( object === undefined ) return;

		object.traverse( function ( child ) {

			objects.push( child );

		});

	});

	signals.objectChanged.add( function ( object ) {

		if ( object && editor.selected === object ) {

			selectionBox.update( object );
			transformControls.update();

		}

		if ( object && object instanceof THREE.PerspectiveCamera ) {

			object.updateProjectionMatrix();

		}

		if ( object && editor.helpers[ object.id ] !== undefined ) {

			editor.helpers[ object.id ].update();

		}

		render();

	});

	signals.objectRemoved.add( function ( object ) {

		if ( object === undefined ) return;

		object.traverse( function ( child ) {

			if ( child.geometry ) child.geometry.dispose();

		//  Dispose textures and materials. !important

			if ( child.material && !child.material.materials ) {
                
			//  Single material.

                Object.keys( child ).filter( function(key) {

                    return child.material[ key ] instanceof THREE.Texture;

                }).forEach( function(key) {

                    child.material[ key ].dispose();

                //  DO NOT NULL OR DELETE TEXTURE.  important!

                });

                child.material.dispose();

            } else if ( child.material && child.material.materials ) {

			//  Multi material.

                child.material.materials.forEach(function(material){

                    Object.keys(material).filter(function(key){

                        return material[ key ] instanceof THREE.Texture;

                    }).forEach(function(key){

                        material[ key ].dispose();

                    //  DO NOT NULL OR DELETE TEXTURE.  important!

                    });

                    material.dispose();

                });

            }

		//  Dispose bones texture. !important

			if ( child.skeleton ) child.skeleton.boneTexture.dispose();

			objects.splice( objects.indexOf( child ), 1 );

		});

	});

	signals.helperAdded.add( function ( object ) {

		if ( object === undefined ) return;

		objects.push( object.getObjectByName( "picker" ) );

	});

	signals.helperRemoved.add( function ( object ) {

		if ( object === undefined ) return;

		objects.splice( objects.indexOf( object.getObjectByName( "picker" ) ), 1 );

	});

	signals.materialChanged.add( function ( material ) {

		render();

	});

	signals.fogTypeChanged.add( function ( fogType ) {

		if ( fogType !== oldFogType ) {

			if ( fogType === "None" ) {

				scene.fog = null;

			} else if ( fogType === "Fog" ) {

				scene.fog = new THREE.Fog( oldFogColor, oldFogNear, oldFogFar );

			} else if ( fogType === "FogExp2" ) {

				scene.fog = new THREE.FogExp2( oldFogColor, oldFogDensity );

			}

			oldFogType = fogType;

		}

		render();

	});

	signals.fogColorChanged.add( function ( fogColor ) {

		oldFogColor = fogColor;

		updateFog( scene );

		render();

	});

	signals.fogParametersChanged.add( function ( near, far, density ) {

		oldFogNear = near;
		oldFogFar = far;
		oldFogDensity = density;

		updateFog( scene );

		render();

	});

	signals.windowResize.add( function () {

	//	TODO: Move this out?

		editor.DEFAULT_CAMERA.aspect = container.dom.offsetWidth / container.dom.offsetHeight;
		editor.DEFAULT_CAMERA.updateProjectionMatrix();

		camera.aspect = container.dom.offsetWidth / container.dom.offsetHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( container.dom.offsetWidth, container.dom.offsetHeight );

		render();

	});

	signals.showGridChanged.add( function ( showGrid ) {

		grid.visible = showGrid;
		render();

	});


//	var renderer = null;

	animate();

//

	function updateFog( root ) {

		if ( root.fog ) {

			root.fog.color.setHex( oldFogColor );

			if ( root.fog.near !== undefined ) root.fog.near = oldFogNear;
			if ( root.fog.far !== undefined ) root.fog.far = oldFogFar;
			if ( root.fog.density !== undefined ) root.fog.density = oldFogDensity;

		}

	}

	function animate() {

		requestAnimationFrame( animate );

/*

	//	animations

		if ( THREE.AnimationHandler.animations.length > 0 ) {

			THREE.AnimationHandler.update( 0.016 );

			for ( var i = 0, l = sceneHelpers.children.length; i < l; i ++ ) {

				var helper = sceneHelpers.children[ i ];

				if ( helper instanceof THREE.SkeletonHelper ) {

					helper.update();

				}

			}

			render();

		}

*/

	}

	function render() {

		sceneHelpers.updateMatrixWorld();
		scene.updateMatrixWorld();

		renderer.clear();
		renderer.render( scene, camera );

		if ( renderer instanceof THREE.RaytracingRenderer === false ) {

			renderer.render( sceneHelpers, camera );

		}

	}

	return container;

};
