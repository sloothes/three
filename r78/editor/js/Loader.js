/**
 * @author mrdoob / http://mrdoob.com/
 */

var Loader = function ( editor ) {

	var debugMode = editor.config.getKey( "project/debugMode" );

	var scope = this;
	var signals = editor.signals;

	this.texturePath = "";

	this.loadFile = function ( file ) {

		var filename = file.name;
		var extension = filename.split( "." ).pop().toLowerCase();

		var reader = new FileReader();
		reader.addEventListener( "progress", function ( event ) {

			var size = "(" + Math.floor( event.total / 1000 ).format() + " KB)";
			var progress = Math.floor( ( event.loaded / event.total ) * 100 ) + "%";
			console.log( "Loading", filename, size, progress );

		});

		switch ( extension ) {

			case "amf":

				reader.addEventListener( "load", function ( event ) {

					var loader = new THREE.AMFLoader();
					var amfobject = loader.parse( event.target.result );

					editor.execute( new AddObjectCommand( amfobject ) );

				}, false );

				reader.readAsArrayBuffer( file );

				break;

			case "awd":

				reader.addEventListener( "load", function ( event ) {

					var loader = new THREE.AWDLoader();
					var scene = loader.parse( event.target.result );

					editor.execute( new SetSceneCommand( scene ) );

				}, false );

				reader.readAsArrayBuffer( file );

				break;

			case "babylon":

				reader.addEventListener( "load", function ( event ) {

					var contents = event.target.result;
					var json = JSON.parse( contents );

					var loader = new THREE.BabylonLoader();
					var scene = loader.parse( json );

					editor.execute( new SetSceneCommand( scene ) );

				}, false );

				reader.readAsText( file );

				break;

			case "babylonmeshdata":

				reader.addEventListener( "load", function ( event ) {

					var contents = event.target.result;
					var json = JSON.parse( contents );

					var loader = new THREE.BabylonLoader();

					var geometry = loader.parseGeometry( json );
					var material = new THREE.MeshStandardMaterial();

					var mesh = new THREE.Mesh( geometry, material );
					mesh.name = filename;

					editor.execute( new AddObjectCommand( mesh ) );

				}, false );

				reader.readAsText( file );

				break;

			case "ctm":

				reader.addEventListener( "load", function ( event ) {

					var data = new Uint8Array( event.target.result );

					var stream = new CTM.Stream( data );
					stream.offset = 0;

					var loader = new THREE.CTMLoader();
					loader.createModel( new CTM.File( stream ), function( geometry ) {

						geometry.sourceType = "ctm";
						geometry.sourceFile = file.name;

						var material = new THREE.MeshStandardMaterial();

						var mesh = new THREE.Mesh( geometry, material );
						mesh.name = filename;

						editor.execute( new AddObjectCommand( mesh ) );

					});

				}, false );

				reader.readAsArrayBuffer( file );

				break;

			case "dae":

				reader.addEventListener( "load", function ( event ) {

					var contents = event.target.result;

					var loader = new THREE.ColladaLoader();
					var collada = loader.parse( contents );

					collada.scene.name = filename;

					editor.execute( new AddObjectCommand( collada.scene ) );

				}, false );

				reader.readAsText( file );

				break;

			case "fbx":

				reader.addEventListener( "load", function ( event ) {

					var contents = event.target.result;

					var loader = new THREE.FBXLoader();
					var object = loader.parse( contents );

					editor.execute( new AddObjectCommand( object ) );

				}, false );

				reader.readAsText( file );

				break;

            case "gltf":

				reader.addEventListener( "load", function ( event ) {

                    var contents = event.target.result;
                    var json = JSON.parse( contents );

                    var loader = new THREE.GLTFLoader();
                    var collada = loader.parse( json );

                    collada.scene.name = filename;

                    editor.execute( new AddObjectCommand( collada.scene ) );

                }, false );

                reader.readAsText( file );

                break;

			case "js":
			case "json":

			case "3geo":
			case "3mat":
			case "3obj":
			case "3scn":

				reader.addEventListener( "load", function ( event ) {

					var contents = event.target.result;

                /*
					//  v2.0. (conflicts the "app.json" case)

					if ( contents.indexOf( "postMessage" ) !== - 1 ) {

						var blob = new Blob( [ contents ], { type: "text/javascript" } );
						var url = URL.createObjectURL( blob );

						var worker = new Worker( url );

						worker.onmessage = function ( event ) {

							event.data.metadata = { version: 2 };
							handleJSON( event.data, file, filename );

						};

						worker.postMessage( Date.now() );

						return;

					}
                */

				//  version >= v3.0.

					var data;

					try {

						data = JSON.parse( contents );

					} catch ( error ) {

						alert( error );
						return;

					}

					handleJSON( data, file, filename );

				}, false );

				reader.readAsText( file );

				break;


			case "kmz":

				reader.addEventListener( "load", function ( event ) {

					var loader = new THREE.KMZLoader();
					var collada = loader.parse( event.target.result );

					collada.scene.name = filename;

					editor.execute( new AddObjectCommand( collada.scene ) );

				}, false );

				reader.readAsArrayBuffer( file );

				break;

			case "md2":

				reader.addEventListener( "load", function ( event ) {

					var contents = event.target.result;

					var geometry = new THREE.MD2Loader().parse( contents );
					var material = new THREE.MeshStandardMaterial( {
						morphTargets: true,
						morphNormals: true
					});

					var mesh = new THREE.Mesh( geometry, material );
					mesh.mixer = new THREE.AnimationMixer( mesh );
					mesh.name = filename;

					editor.execute( new AddObjectCommand( mesh ) );

				}, false );

				reader.readAsArrayBuffer( file );

				break;

			case "obj":

				reader.addEventListener( "load", function ( event ) {

					var contents = event.target.result;

					var object = new THREE.OBJLoader().parse( contents );
					object.name = filename;

					editor.execute( new AddObjectCommand( object ) );

				}, false );

				reader.readAsText( file );

				break;

			case "playcanvas":

				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;
					var json = JSON.parse( contents );

					var loader = new THREE.PlayCanvasLoader();
					var object = loader.parse( json );

					editor.execute( new AddObjectCommand( object ) );

				}, false );

				reader.readAsText( file );

				break;

			case "ply":

				reader.addEventListener( "load", function ( event ) {

					var contents = event.target.result;

					var geometry = new THREE.PLYLoader().parse( contents );
					geometry.sourceType = "ply";
					geometry.sourceFile = file.name;

					var material = new THREE.MeshStandardMaterial();

					var mesh = new THREE.Mesh( geometry, material );
					mesh.name = filename;

					editor.execute( new AddObjectCommand( mesh ) );

				}, false );

				reader.readAsText( file );

				break;

			case "stl":

				reader.addEventListener( "load", function ( event ) {

					var contents = event.target.result;

					var geometry = new THREE.STLLoader().parse( contents );
					geometry.sourceType = "stl";
					geometry.sourceFile = file.name;

					var material = new THREE.MeshStandardMaterial();

					var mesh = new THREE.Mesh( geometry, material );
					mesh.name = filename;

					editor.execute( new AddObjectCommand( mesh ) );

				}, false );

				if ( reader.readAsBinaryString !== undefined ) {

					reader.readAsBinaryString( file );

				} else {

					reader.readAsArrayBuffer( file );

				}

				break;

		/*
			case "utf8":

				reader.addEventListener( "load", function ( event ) {

					var contents = event.target.result;

					var geometry = new THREE.UTF8Loader().parse( contents );
					var material = new THREE.MeshLambertMaterial();

					var mesh = new THREE.Mesh( geometry, material );

					editor.execute( new AddObjectCommand( mesh ) );

				}, false );
				reader.readAsBinaryString( file );

				break;
		*/

			case "vtk":

				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

					var geometry = new THREE.VTKLoader().parse( contents );
					geometry.sourceType = "vtk";
					geometry.sourceFile = file.name;

					var material = new THREE.MeshStandardMaterial();

					var mesh = new THREE.Mesh( geometry, material );
					mesh.name = filename;

					editor.execute( new AddObjectCommand( mesh ) );

				}, false );

				reader.readAsText( file );

				break;

			case "wrl":

				reader.addEventListener( "load", function ( event ) {

					var contents = event.target.result;

					var result = new THREE.VRMLLoader().parse( contents );

					editor.execute( new SetSceneCommand( result ) );

				}, false );

				reader.readAsText( file );

				break;

			default:

				alert( "Unsupported file format (" + extension +  ")." );

				break;

		}

	};

	function handleJSON( data, file, filename ) {

		if ( data.metadata === undefined ) {

			data.metadata = { type: "Geometry" };  // 2.0

		}

		if ( data.metadata.type === undefined ) {

			data.metadata.type = "Geometry";       // 3.0

		}

		if ( data.metadata.formatVersion !== undefined ) {

			data.metadata.version = data.metadata.formatVersion;

		}

        debugMode && console.log( "metadata:", data.metadata ); // debug.

		switch ( data.metadata.type.toLowerCase() ) {

			case "app":

                if ( confirm( "Any unsaved data will be lost. Are you sure?" ) ) {

                    editor.clear();

                    debugMode && console.log( "data:", data ); // debug.

                    editor.fromJSON( data );

                }

				break;

			case "buffergeometry":

				var loader = new THREE.BufferGeometryLoader();
				var result = loader.parse( data );

				var mesh = new THREE.Mesh( result );

				editor.execute( new AddObjectCommand( mesh ) );

				break;

			case "geometry":

				var loader = new THREE.JSONLoader();
				loader.setTexturePath( scope.texturePath );

				var result = loader.parse( data );

				var geometry = result.geometry;
				geometry.computeFaceNormals();
				geometry.computeVertexNormals();
				geometry.computeBoundingBox();
				geometry.computeBoundingSphere();
				geometry.sourceType = "ascii";
				geometry.sourceFile = file.name;

				var material;

				if ( result.materials !== undefined ) {

					if ( result.materials.length > 1 ) {

						material = new THREE.MultiMaterial( result.materials );

					} else {

						material = result.materials[ 0 ];

					}

				} else {

					material = new THREE.MeshStandardMaterial();

				}

				var mesh;

			//	if ( geometry.bones || ( geometry.animation && geometry.animation.hierarchy ) ) {

				if ( data.bones && data.skinIndices && data.skinWeights ) {

					var mesh = new THREE.Object3D();

				//	mesh = new THREE.Mesh( geometry, material );

				//	mesh = new THREE.SkinnedMesh( geometry, material );

					mesh.name = filename.replace(".json", "") + " (skinned)";

				//	remove-this.js
			/*
					var source = (function(){

						var source = "scene.remove( this );";

						return source;

					})();

					editor.addScript( mesh, {

						name: "remove-this.js",
						source: source,

					});
			*/
				//  skinned-mesh.js

					var source = (function(){

						var source = "";

					//	data.

						if (data.name) source += "var name = \"" + data.name + "\";\n";
						if (data.uvs)  source += "var uvs = " + JSON.stringify( data.uvs ) + ";\n";
						if (data.faces) source += "var faces = " + JSON.stringify( data.faces ) + ";\n";
						if (data.vertices) source += "var vertices = " + JSON.stringify( data.vertices ) + ";\n";
						if (data.skinIndices) source += "var skinIndices = " + JSON.stringify( data.skinIndices ) + ";\n";
						if (data.skinWeights) source += "var skinWeights = " + JSON.stringify( data.skinWeights ) + ";\n";
						if (data.materials) source += "var materials = " + JSON.stringify( data.materials ) + ";\n";
						if (data.metadata) source += "var metadata = " + JSON.stringify( data.metadata ) + ";\n";
						if (data.bones) source += "var bones = " + JSON.stringify( data.bones ) + ";\n";
						if (data.influencesPerVertex) source += "var influencesPerVertex = " + data.influencesPerVertex + ";\n\n";

					//	json.

						source += "var json = {\n";
						if (data.name) source += "\tname: name,\n";
						if (data.uvs)  source += "\tuvs: uvs,\n";
						if (data.faces) source += "\tfaces: faces,\n";
						if (data.vertices) source += "\tvertices: vertices,\n";
						if (data.skinIndices) source += "\tskinIndices: skinIndices,\n";
						if (data.skinWeights) source += "\tskinWeights: skinWeights,\n";
						if (data.materials) source += "\tmaterials: materials,\n";
						if (data.metadata) source += "\tmetadata: metadata,\n";
						if (data.bones) source += "\tbones: bones,\n";
						if (data.influencesPerVertex) source += "\tinfluencesPerVertex: " + data.influencesPerVertex + "\n";
						source += "};\n\n";
						source += "//\tGeometries.push( json );\n\n";

					//  loader.

						source += "var loader = new THREE.JSONLoader();\n";
						source += "var object = loader.parse( json );\n\n";
						source += "//\tgeometry.\n\n";
						source += "var geometry = object.geometry;\n\n";
						source += "geometry.name = json.name || \"\";\n";
						source += "geometry.computeFaceNormals();\n";
						source += "geometry.computeVertexNormals();\n";
						source += "geometry.computeBoundingBox();\n";
						source += "geometry.computeBoundingSphere();\n";
						source += "geometry.sourceType = \"json\";\n";
						source += "geometry.sourceFile = json;\n\n";
						source += "//\tmaterial.\n\n";
						source += "var material = new THREE.MeshStandardMaterial({skinning:true});\n\n";
						source += "//\tskinned.\n\n";
						source += "var skinned = new THREE.SkinnedMesh( geometry, material );\n\n";
						source += "skinned.renderDepth = 1;\n";
						source += "skinned.frustumCulled = false;\n";
						source += "skinned.position.set( 0, 0, 0 );\n";
						source += "skinned.rotation.set( 0, 0, 0 );\n";
						source += "skinned.scale.set( 1, 1, 1 );\n";
						source += "skinned.castShadow = true;\n";
						source += "skinned.name = \"\";\n\n\n\n";

						return source;

					})();

					editor.addScript( mesh, {

						name: "skinned-mesh.js",
						source: source,

					});

				} else {

					mesh = new THREE.Mesh( geometry, material );
					mesh.geometry.name = filename;
					mesh.geometry.sourceFile = filename;
					mesh.name = filename.replace(".json", "");

				}

				editor.execute( new AddObjectCommand( mesh ) );

			break;

			case "object":

				var loader = new THREE.ObjectLoader();
				loader.setTexturePath( scope.texturePath );

				var result = loader.parse( data );

				if ( result instanceof THREE.Scene ) {

					editor.execute( new SetSceneCommand( result ) );

				} else {

					editor.execute( new AddObjectCommand( result ) );

				}

			break;

			case "scene":

			//  DEPRECATED.

				var loader = new THREE.SceneLoader();
				loader.parse( data, function ( result ) {

					editor.execute( new SetSceneCommand( result.scene ) );

				}, "" );

			break;

		}

	}

};

