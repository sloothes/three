/**
 * @author mrdoob / http://mrdoob.com/
 */

var Editor = function () {

	this.JS_LIBRARIES = [];

	this.DEFAULT_CAMERA = new THREE.PerspectiveCamera( 50, 1, 0.1, 10000 );
	this.DEFAULT_CAMERA.name = "Camera";
	this.DEFAULT_CAMERA.position.set( 20, 10, 20 );
	this.DEFAULT_CAMERA.lookAt( new THREE.Vector3() );

	var Signal = signals.Signal;

	this.signals = {

	// script.

		editScript: new Signal(),

	// player.

		startPlayer: new Signal(),
		stopPlayer: new Signal(),

	// actions.

		showModal: new Signal(),

	// notifications.

		editorCleared: new Signal(),

		savingStarted: new Signal(),
		savingFinished: new Signal(),

		themeChanged: new Signal(),

		transformModeChanged: new Signal(),
		snapChanged: new Signal(),
		spaceChanged: new Signal(),
		rendererChanged: new Signal(),

		sceneGraphChanged: new Signal(),

		cameraChanged: new Signal(),

		geometryChanged: new Signal(),

		objectSelected: new Signal(),
		objectFocused: new Signal(),

		objectAdded: new Signal(),
		objectChanged: new Signal(),
		objectRemoved: new Signal(),

		helperAdded: new Signal(),
		helperRemoved: new Signal(),

		materialChanged: new Signal(),

		scriptAdded: new Signal(),
		scriptChanged: new Signal(),
		scriptRemoved: new Signal(),

		fogTypeChanged: new Signal(),
		fogColorChanged: new Signal(),
		fogParametersChanged: new Signal(),
		windowResize: new Signal(),

		showGridChanged: new Signal(),
		refreshSidebarObject3D: new Signal(),
		historyChanged: new Signal(),
		refreshScriptEditor: new Signal()

	};

//

	this.config = new Config( "threejs-editor" );
	this.history = new History( this );
	this.storage = new Storage();
	this.loader = new Loader( this );

	this.camera = this.DEFAULT_CAMERA.clone();

	this.scene = new THREE.Scene();
	this.scene.name = "Scene";

	this.sceneHelpers = new THREE.Scene();
	this.sceneHelpers.name = "Helpers";

//	Editor.

	this.object = {};
	this.scripts = {};
	this.textures = {};
	this.materials = {};
	this.geometries = {};

	this.helpers = {};
	this.selected = null;

	this.functions = [];
	this.javascripts = [];
	this.stylesheets = [];

};

Editor.prototype = {

	setTheme: function ( value ) {

		document.getElementById( "theme" ).href = value;

		this.signals.themeChanged.dispatch( value );

	},

//

	setScene: function ( scene ) {

		this.scene.uuid = scene.uuid;
		this.scene.name = scene.name;
		this.scene.userData = JSON.parse( JSON.stringify( scene.userData ) );

	//	avoid render per object.

		this.signals.sceneGraphChanged.active = false; 

		while ( scene.children.length > 0 ) {

			this.addObject( scene.children[ 0 ] );

		}

		this.signals.sceneGraphChanged.active = true;
		this.signals.sceneGraphChanged.dispatch();

	},

//

	addObject: function ( object ) {

		var scope = this;

		object.traverse( function ( child ) {

			if ( child.geometry !== undefined ) scope.addGeometry( child.geometry );
			if ( child.material !== undefined ) scope.addMaterial( child.material );

			scope.addHelper( child );

		});

		this.scene.add( object );

		this.signals.objectAdded.dispatch( object );
		this.signals.sceneGraphChanged.dispatch();

	},

	moveObject: function ( object, parent, before ) {

		if ( parent === undefined ) {

			parent = this.scene;

		}

		parent.add( object );

	//	sort children array.

		if ( before !== undefined ) {

			var index = parent.children.indexOf( before );
			parent.children.splice( index, 0, object );
			parent.children.pop();

		}

		this.signals.sceneGraphChanged.dispatch();

	},

	nameObject: function ( object, name ) {

		object.name = name;
		this.signals.sceneGraphChanged.dispatch();

	},

	removeObject: function ( object ) {

	//	avoid deleting the camera or scene.

	//	if ( object.parent === null ) return; // not need?

		var scope = this;

		object.traverse( function ( child ) {

			scope.removeHelper( child );

		});

		object.parent.remove( object );

		this.signals.objectRemoved.dispatch( object );
		this.signals.sceneGraphChanged.dispatch();

	},

	addGeometry: function ( geometry ) {

		this.geometries[ geometry.uuid ] = geometry;

	},

	setGeometryName: function ( geometry, name ) {

		geometry.name = name;
		this.signals.sceneGraphChanged.dispatch();

	},

	addMaterial: function ( material ) {

		this.materials[ material.uuid ] = material;

	},

	setMaterialName: function ( material, name ) {

		material.name = name;
		this.signals.sceneGraphChanged.dispatch();

	},

	addTexture: function ( texture ) {

		this.textures[ texture.uuid ] = texture;

	},

//

	addHelper: function () {

		var geometry = new THREE.SphereBufferGeometry( 2, 4, 2 );
		var material = new THREE.MeshBasicMaterial( { color: 0xff0000, visible: false } );

		return function ( object ) {

			var helper;

			if ( object instanceof THREE.Camera ) {

				helper = new THREE.CameraHelper( object, 1 );

			} else if ( object instanceof THREE.PointLight ) {

				helper = new THREE.PointLightHelper( object, 1 );

			} else if ( object instanceof THREE.DirectionalLight ) {

				helper = new THREE.DirectionalLightHelper( object, 1 );

			} else if ( object instanceof THREE.SpotLight ) {

				helper = new THREE.SpotLightHelper( object, 1 );

			} else if ( object instanceof THREE.HemisphereLight ) {

				helper = new THREE.HemisphereLightHelper( object, 1 );

			} else if ( object instanceof THREE.SkinnedMesh ) {

				helper = new THREE.SkeletonHelper( object );

			} else {
			
				return; // no helper for this object type.

			}

			var picker = new THREE.Mesh( geometry, material );
			picker.name = "picker";
			picker.userData.object = object;
			helper.add( picker );

			this.sceneHelpers.add( helper );
			this.helpers[ object.id ] = helper;

			this.signals.helperAdded.dispatch( helper );

		};

	}(),

	removeHelper: function ( object ) {

		if ( this.helpers[ object.id ] !== undefined ) {

			var helper = this.helpers[ object.id ];
			helper.parent.remove( helper );

			delete this.helpers[ object.id ];

			this.signals.helperRemoved.dispatch( helper );

		}

	},

//

	addScript: function ( object, script ) {

		if ( this.scripts[ object.uuid ] === undefined ) {

			this.scripts[ object.uuid ] = [];

		}

		this.scripts[ object.uuid ].push( script );

		this.signals.scriptAdded.dispatch( script );

	},

	removeScript: function ( object, script ) {

		if ( this.scripts[ object.uuid ] === undefined ) return;

		var index = this.scripts[ object.uuid ].indexOf( script );

		if ( index !== - 1 ) {

			this.scripts[ object.uuid ].splice( index, 1 );

		}

		this.signals.scriptRemoved.dispatch( script );

	},

//

	select: function ( object ) {

		if ( this.selected === object ) return;

		var uuid = null;

		if ( object !== null ) {

			uuid = object.uuid;

		}

		this.selected = object;

		this.config.setKey( "selected", uuid );
		this.signals.objectSelected.dispatch( object );

	},

	selectById: function ( id ) {

		if ( id === this.camera.id ) {

			this.select( this.camera );
			return;

		}

		this.select( this.scene.getObjectById( id, true ) );

	},

	selectByUuid: function ( uuid ) {

		var scope = this;

		this.scene.traverse( function ( child ) {

			if ( child.uuid === uuid ) {

				scope.select( child );

			}

		});

	},

	deselect: function () {

		this.select( null );

	},

	focus: function ( object ) {

		this.signals.objectFocused.dispatch( object );

	},

	focusById: function ( id ) {

		this.focus( this.scene.getObjectById( id, true ) );

	},

	clear: function () {

		this.history.clear();
		this.storage.clear();

		this.camera.copy( this.DEFAULT_CAMERA );

	//	Scene.

		var objects = this.scene.children;

		while ( objects.length > 0 ) {

			this.removeObject( objects[ 0 ] );

		}

	//	this.functions = [];
	//	this.javascripts = [];
	//	this.stylesheets = [];

		this.scripts = {};
		this.textures = {};
		this.materials = {};
		this.geometries = {};

		this.deselect();

		this.signals.editorCleared.dispatch();

	},

//

	fromJSON: function ( json ) {

		var timeout;

		var scope = this;

		var loader = new THREE.ObjectLoader();

	//  backwards.

		if ( json.scene === undefined ) {

			this.setScene( loader.parse( json ) );

			return;

		}

	//	Camera.

		var camera = loader.parse( json.camera );
		this.camera.copy( camera );
		this.camera.aspect = this.DEFAULT_CAMERA.aspect;
		this.camera.updateProjectionMatrix();

	//	css.
		
		if ( json.stylesheets ) {
			this.stylesheets = json.stylesheets;
		}

	//  js libraries.

		if ( json.javascripts ) {
			this.javascripts = json.javascripts;
		} else if ( json.jslibraries ) {
			this.javascripts = json.jslibraries; // backward.
		}

	//	js functions.

		if ( json.functions ) {
			this.functions = json.functions;
		} else if ( json.gbfunctions ) {
			this.functions = json.gbfunctions; // backward.
		}

	//	editor images.

		if ( json.images === undefined ) {
			this.images = {}; // important!
		} else {
			this.images = json.images;
		}

	//	scene scripts.

		if ( json.scripts === undefined ) {
			this.scripts = {}; // important!
		} else {
			this.scripts = json.scripts;
		}

	//	material textures.

		if ( json.textures === undefined ) {
			this.textures = {}; // important!
		} else {
			this.textures = json.textures;
		}

		this.history.fromJSON( json.history );
		this.setScene( loader.parse( json.scene ) );

	},

	toJSON: function () {

	//	scripts clean up.

		var scene = this.scene;
		var scripts = this.scripts;

		for ( var key in scripts ) {

			var script = scripts[ key ];

			if ( script.length === 0 ) delete scripts[ key ];
	/*
		//	Do not delete orphan scripts? Orphan scripts gets "window" as "this".

			if ( scene.getObjectByProperty( "uuid", key ) === undefined ) {

				delete scripts[ key ]; 

			}
	*/
		}

	//	editor to json.

		return {

			metadata: {},

			project: {

				vr: this.config.getKey( "project/vr" ),
				cache: this.config.getKey( "project/cache" ),
				editable: this.config.getKey( "project/editable" ),
				debugMode: this.config.getKey( "project/debugMode" ),
				shadows: this.config.getKey( "project/renderer/shadows" ),

			},

			functions: this.functions,
			javascripts: this.javascripts,
			stylesheets: this.stylesheets,

			scripts: this.scripts,
			camera: this.camera.toJSON(),
			scene: this.scene.toJSON(),
			history: this.history.toJSON(),

		};

	},

	objectByUuid: function ( uuid ) {

		return this.scene.getObjectByProperty( "uuid", uuid, true );

	},

	execute: function ( cmd, optionalName ) {

		this.history.execute( cmd, optionalName );

	},

	undo: function () {

		this.history.undo();

	},

	redo: function () {

		this.history.redo();

	}

};

//	================================================================  //

//	Move array item from one position to another position.
//	https://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another.

function array_move( array, from_index, to_index ) {

	if (to_index >= array.length) {
		var k = to_index - array.length + 1;
		while (k--) {
			array.push(undefined);
		}
	}

	array.splice(to_index, 0, array.splice(from_index, 1)[0]);

	debugMode && console.log( array );
}

//	================================================================  //

/*
	//	javascript functions toJSON.

		var jslibraries = this.jslibraries.map(function( script ){
		//  because script is in function, first we convert 
		//	function to string and then we stringify to json.
			var code = script.toString();	// important!
			return JSON.stringify( code );	// important!
		});
*/
//	================================================================  //

/*
//	Upload texture imate to imgur.com.

	this.uploadImage = function uploadDataURL(dataURL, type, name){

	//	Remove prefix "data:image/<ext>;base64," before upload image.
	// "dataURL" must be pure data without "data:image/<ext>;base64,"
	//  Returns a resolved promise with record data from imgur.com.

		debugMode && console.log("uploading", name);

		var formdata = new FormData();
		formdata.append("name",  name);
		formdata.append("type",  type);
		formdata.append("image", dataURL);

		var endpoint = "https://api.imgur.com/3/image";
		var clientID = "06217f601180652";  // sloothes app Client-ID.

		return new Promise(function( resolve, reject ){

			var xhttp = new XMLHttpRequest();
			xhttp.open("POST", endpoint, true);
			xhttp.setRequestHeader("Authorization", "Client-ID " + clientID);
			xhttp.onreadystatechange = function () {
				if (this.readyState === 4) {
					var response = "";
					if (this.status >= 200 && this.status < 300) {
						response = JSON.parse(this.responseText);
						debugMode && console.log(response.data);
						resolve(response.data); // resolve promise.
					} else {
						var err = JSON.parse(this.responseText).data.error;
						console.error( err.type, err );
						throw err;
					}
				}
			};

			xhttp.send(formdata);
			xhttp = null;

		});

	}

//	================================================================  //

//	Delete uploaded image from imgur.com 

//	Usage:
//
//		var json = editor.toJSON();
//		for (var i = 0; i < json.images.length; i++ ) {
//			editor.deleteImage( json.images[i] );
//		}
//
	this.deleteImage = function deleteUploadedImage( data ){

	//  Returns a resolved promise with success data from imgur.com.
		debugMode && console.log("deleting", data.name);

		var endpoint = data.endpoint || "https://api.imgur.com/3/image";
		var clientID = data.clientID || "06217f601180652"; // sloothes app Client-ID.
		var deletepoint = data.deletepoint || "https://api.imgur.com/3/image/" + data.deletehash;

		return new Promise(function( resolve, reject ){

			xhttp = new XMLHttpRequest();
			xhttp.open("DELETE", deletepoint, true);
			xhttp.setRequestHeader("Authorization", "Client-ID " + clientID);
			xhttp.onreadystatechange = function () {
				if (this.readyState === 4) {
					var response = "";
					if (this.status > 199 && this.status < 300) {
						response = JSON.parse(this.responseText);
						debugMode && console.log(response);
						resolve(response); // resolve promise.
					} else {
						var err = JSON.parse(this.responseText).data.error;
						console.error( err.type, err );
						throw err;
					}
				}
			};

			xhttp.send();
			xhttp = null;

		});

	}
*/

//	================================================================  //
