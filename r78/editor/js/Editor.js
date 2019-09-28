/**
 * @author mrdoob / http://mrdoob.com/
 */

var Editor = function () {

	this.JS_LIBRARIES = [];

	this.DEFAULT_CAMERA = new THREE.PerspectiveCamera( 50, 1, 0.1, 10000 );
	this.DEFAULT_CAMERA.name = "Camera";
	this.DEFAULT_CAMERA.position.set( 20, 10, 20 );
	this.DEFAULT_CAMERA.lookAt( new THREE.Vector3() );

	this.DEFAULT_CAMERA_LIGHT = new THREE.DirectionalLight( 0xffffff, 1 );
	this.DEFAULT_CAMERA_LIGHT.name = "Default Camera Light";
	this.DEFAULT_CAMERA_LIGHT.position.copy( this.DEFAULT_CAMERA.position );


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

	this.config = new Config( "threejs-editor" );
	this.history = new History( this );
	this.storage = new Storage();
	this.loader = new Loader( this );

	this.camera = this.DEFAULT_CAMERA.clone();

	this.lights = this.DEFAULT_CAMERA_LIGHT.clone();
//  Camera light is added in editor scene "only after" 
//  editor has been cleared: this.clear() => 
//  this.signals.editorCleared.dispatch(); => 
//  Viewport.js => editor.signals.editorCleared.add();

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

//	Collections.

	this.male = [];
	this.female = [];
	this.skinned = [];
	this.skeleton = [];

	this.functions = [];
	this.animations = [];
	this.stylesheets = [];
	this.javascripts = [];

//	Editor.

	this.selected = null;
	this.helpers = {};

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

		//	if ( object.parent === null ) return; 

	//

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

	//

		this.history.clear();
		this.storage.clear();

		this.camera.copy( this.DEFAULT_CAMERA );
		this.lights.copy( this.DEFAULT_CAMERA_LIGHT );

	//

		var objects = this.scene.children;

		while ( objects.length > 0 ) {

			this.removeObject( objects[ 0 ] );

		}

	//	Collections.

		this.male = [];
		this.female = [];
		this.skinned = [];
		this.skeleton = [];

		this.functions = [];
		this.animations = [];
		this.stylesheets = [];
		this.javascripts = [];

	//	Editor.

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

		var camera = loader.parse( json.camera );

		this.camera.copy( camera );
		this.camera.aspect = this.DEFAULT_CAMERA.aspect;
		this.camera.updateProjectionMatrix();

	//  Collections.

		if ( json.javascripts ) this.javascripts = json.javascripts; // previous version.

		coltrap: if ( json.collections ) {
			
			this.stylesheets = json.collections.stylesheets;
			if ( this.stylesheets == undefined ) {
				this.stylesheets = []; // important!
			}

			debugMode && console.log( "editor.stylesheets:", this.stylesheets );

			this.javascripts = json.collections.javascripts;
			if ( this.javascripts == undefined ) {
				this.javascripts = []; // important!
			}

			debugMode && console.log( "editor.javascripts:", this.javascripts );

			this.functions = json.collections.functions;
			if ( this.functions == undefined ) {
				this.functions = []; // important!
			}

			debugMode && console.log( "editor.functions:", this.functions );

			this.animations = json.collections.animations;
			if ( this.animations == undefined ) {
				this.animations = []; // important!
			}

			debugMode && console.log( "editor.animations:", this.animations );

		//	Male - Female - Skeleton - Skinned.

			this.male = json.collections.male;
			if ( this.male == undefined ) {
				this.male = []; // important!
			}

			debugMode && console.log( "editor.male:", this.male );

			this.female = json.collections.female;
			if ( this.female == undefined ) {
				this.female = []; // important!
			}

			debugMode && console.log( "editor.female:", this.female );

			this.skeleton = json.collections.skeleton;
			if ( this.skeleton == undefined ) {
				this.skeleton = []; // important!
			}

			debugMode && console.log( "editor.skeleton:", this.skeleton );

			this.skinned = json.collections.skinned;
			if ( this.skinned == undefined ) {
				this.skinned = []; // important!
			}

			debugMode && console.log( "editor.skinned:", this.skinned );

		}

	//	Editor.

		this.scripts = json.scripts;
		this.history.fromJSON( json.history );
		this.setScene( loader.parse( json.scene ) );

	},

	toJSON: function () {

	//	scripts clean up.

		var scene = this.scene;
		var scripts = this.scripts;

		for ( var key in scripts ) {

			var script = scripts[ key ];

		//	if ( script.length === 0 ) delete scripts[ key ];

			if ( script.length === 0 || scene.getObjectByProperty( "uuid", key ) === undefined ) {

				delete scripts[ key ]; 

			}

		}

	//

		return {

			metadata: {},

			project: {

				vr: this.config.getKey( "project/vr" ),
				cache: this.config.getKey( "project/cache" ),
				editable: this.config.getKey( "project/editable" ),
				debugMode: this.config.getKey( "project/debugMode" ),
				shadows: this.config.getKey( "project/renderer/shadows" ),

			},

		//	Collections.
			
			collections: {

				male: this.male,
				female: this.female,
				skinned: this.skinned,
				skeleton: this.skeleton,

				functions: this.functions,
				animations: this.animations,
				stylesheets: this.stylesheets,
				javascripts: this.javascripts,

			},

		//	Editor.

			scripts: this.scripts,
			camera: this.camera.toJSON(),
			scene: this.scene.toJSON(),
			history: this.history.toJSON(),

			_id: "editor"

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


/*
	//	javascript functions toJSON.

		var javascripts = [];

		this.javascripts.forEach(function( script ){
		//  because script is in function, first we convert 
		//	function to string and then we stringify to json.
			var code = script.toString();				// important!
			javascripts.push( JSON.stringify( code ) );	// important!
		});
*/
