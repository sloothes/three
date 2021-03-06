/**
 * @author mrdoob / http://mrdoob.com/
 */

Menubar.File = function ( editor ) {

	var container = new UI.Panel();
	container.setClass( "menu" );

	var title = new UI.Panel();
	title.setClass( "title" );
	title.setTextContent( "File" );
	container.add( title );

	var options = new UI.Panel();
	options.setClass( "options" );
	container.add( options );

//  New.

	var option = new UI.Row();
	option.setClass( "option" );
	option.setTextContent( "New" );
	option.onClick( function () {

		if ( confirm( "Any unsaved data will be lost. Are you sure?" ) ) {

			editor.clear();

		}

	});

	options.add( option );

//  Open.

	var appFileInput = document.createElement( "input" );
	appFileInput.type = "file";
	appFileInput.addEventListener( "change", function ( event ) {

		editor.loader.loadFile( appFileInput.files[ 0 ] );

	});

	var option = new UI.Row();
	option.setClass( "option" );
	option.setTextContent( "Open" );
	option.onClick( function () {

		appFileInput.value = "";
		appFileInput.click();

	});

	options.add( option );

//  Save.

	var option = new UI.Row();
	option.setClass( "option" );
	option.setTextContent( "Save" );
	option.onClick( function () {

    //  saveState.

        var timeout;

    //  if ( editor.config.getKey( "autosave" ) === true ) return;

        clearTimeout( timeout );

        timeout = setTimeout( function () {

            editor.signals.savingStarted.dispatch();

            timeout = setTimeout( function () {

                editor.storage.set( editor.toJSON() );

                editor.signals.savingFinished.dispatch();

				var text = "Editor state saved.";
				var element = document.createElement("h4");
				var content = new UI.Element( element );
				content.setTextAlign("center");
				content.setTextContent( text );
				editor.signals.showModal.dispatch( content );

            }, 100 );

        }, 1000 );

	});

	options.add( option );

//  Save As...

	var option = new UI.Row();
	option.setClass( "option" );
	option.setTextContent( "Save As" );
	option.onClick( function () {

		var output = editor.toJSON();
		output.metadata.type = "App";
		delete output.history;

		try {

			output = JSON.stringify( output, null, "\t" );
			output = output.replace( /[\n\t]+([\d\.e\-\[\]]+)/g, "$1" );

		} catch ( e ) {

			output = JSON.stringify( output );

		}

		saveString( output, "app.json" );

	});

	options.add( option );

//
	options.add( new UI.HorizontalRule() );

//  Import 3D.

	var fileInput = document.createElement( "input" );
	fileInput.type = "file";
	fileInput.addEventListener( "change", function ( event ) {

		editor.loader.loadFile( fileInput.files[ 0 ] );

	});

	var option = new UI.Row();
	option.setClass( "option" );
	option.setTextContent( "Import 3D" );
	option.onClick( function () {

        fileInput.value = "";
		fileInput.click();

	});

	options.add( option );

//
	options.add( new UI.HorizontalRule() );

//	Import js Libraries.

	var libraryInput = document.createElement( "input" );
	libraryInput.type = "file";
	libraryInput.multiple = true;
	libraryInput.accept = ".js";
	libraryInput.addEventListener( "change", function ( event ) {

		var files = libraryInput.files;
		debugMode && console.log(files);

		for ( var i = 0; i < files.length; i++ ){

			(function(file){

				debugMode && console.log("file:", file);

				var reader = new FileReader();
				reader.addEventListener("load", function(e){

					var script = {
						"_id": file.name.split(".").shift(),
						"name": file.name,
						"source": JSON.stringify( reader.result ),
					}

					editor.javascripts.push( script );
					debugMode && console.log( "script:", script );

				});

				reader.readAsText(file);

			})( files[i] );

		}
		
	});

	var option = new UI.Row();
	option.setClass( "option" );
	option.setTextContent( "Import JS files" );
	option.onClick( function () {

        libraryInput.value = "";
		libraryInput.click();

	});

	options.add( option );

//	Clear js Libraries.
/*
	var option = new UI.Row();
	option.setClass( "option" );
	option.setTextContent( "Clear JS files" );
	option.onClick( function () {

        editor.javascripts.length = 0;

		var text = "Javascript libraries cleared.";
		var element = document.createElement("h4");
		var content = new UI.Element( element );
		content.setTextAlign("center");
		content.setTextContent( text );
		editor.signals.showModal.dispatch( content );

		debugMode && console.log( text, editor.javascripts );

	});

	options.add( option );
*/
//

	options.add( new UI.HorizontalRule() );

//  Export Geometry.

	var option = new UI.Row();
	option.setClass( "option" );
	option.setTextContent( "Export Geometry" );
	option.onClick( function () {

		var object = editor.selected;

		if ( object === null ) {

			alert( "No object selected." );
			return;

		}

		var geometry = object.geometry;

		if ( geometry === undefined ) {

			alert( "The selected object doesn\"t have geometry." );
			return;

		}

		var output = geometry.toJSON();

		try {

			output = JSON.stringify( output, null, "\t" );
			output = output.replace( /[\n\t]+([\d\.e\-\[\]]+)/g, "$1" );

		} catch ( e ) {

			output = JSON.stringify( output );

		}

		saveString( output, "geometry.json" );

	});

	options.add( option );

//  Export Object.

	var option = new UI.Row();
	option.setClass( "option" );
	option.setTextContent( "Export Object" );
	option.onClick( function () {

		var object = editor.selected;

		if ( object === null ) {

			alert( "No object selected" );
			return;

		}

		var output = object.toJSON();

		try {

			output = JSON.stringify( output, null, "\t" );
			output = output.replace( /[\n\t]+([\d\.e\-\[\]]+)/g, "$1" );

		} catch ( e ) {

			output = JSON.stringify( output );

		}

		saveString( output, "model.json" );

	});

	options.add( option );

//  Export Scene.

	var option = new UI.Row();
	option.setClass( "option" );
	option.setTextContent( "Export Scene" );
	option.onClick( function () {

		var output = editor.scene.toJSON();

		try {

			output = JSON.stringify( output, null, "\t" );
			output = output.replace( /[\n\t]+([\d\.e\-\[\]]+)/g, "$1" );

		} catch ( e ) {

			output = JSON.stringify( output );

		}

		saveString( output, "scene.json" );

	});

	options.add( option );

//  Export OBJ.

	var option = new UI.Row();
	option.setClass( "option" );
	option.setTextContent( "Export OBJ" );
	option.onClick( function () {

		var object = editor.selected;

		if ( object === null ) {

			alert( "No object selected." );
			return;

		}

		var exporter = new THREE.OBJExporter();

		saveString( exporter.parse( object ), "model.obj" );

	});

	options.add( option );

//  Export STL.

	var option = new UI.Row();
	option.setClass( "option" );
	option.setTextContent( "Export STL" );
	option.onClick( function () {

		var exporter = new THREE.STLExporter();

		saveString( exporter.parse( editor.scene ), "model.stl" );

	});

	options.add( option );

	options.add( new UI.HorizontalRule() );

//  Publish.

	var option = new UI.Row();
	option.setClass( "option" );
	option.setTextContent( "Publish" );
	option.onClick( function () {

		var zip = new JSZip();

	//

		var output = editor.toJSON();
		output.metadata.type = "App"; // important!
		delete output.history;

		var vr = output.project.vr;

		output = JSON.stringify( output, null, "\t" );
		output = output.replace( /[\n\t]+([\d\.e\-\[\]]+)/g, "$1" );

		zip.file( "app.json", output );

	//

		var manager = new THREE.LoadingManager( function () {

			save( zip.generate( { type: "blob" } ), "download.zip" );

		});

		var loader = new THREE.XHRLoader( manager );
		loader.load( "js/libs/app/index.html", function ( content ) {

			var includes = [];

			if ( vr ) {

				includes.push( "<script src=\"js/VRControls.js\"></script>" );
				includes.push( "<script src=\"js/VREffect.js\"></script>" );
				includes.push( "<script src=\"js/WebVR.js\"></script>" );

			}

			content = content.replace( "<!-- includes -->", includes.join( "\n\t\t" ) );

			zip.file( "index.html", content );

		});

	//

		loader.load( "js/libs/app.js", function ( content ) {

			zip.file( "js/app.js", content );

		});

		loader.load( "/js/rawdeflate.js", function ( content ) {

			zip.file( "js/rawdeflate.js", content );

		});

		loader.load( "/js/rawinflate.js", function ( content ) {

			zip.file( "js/rawinflate.js", content );

		});

		loader.load( "/js/ui.js", function ( content ) {

			zip.file( "js/ui.js", content );

		});

		loader.load( "/js/ui.three.js", function ( content ) {

			zip.file( "js/ui.three.js", content );

		});

		loader.load( "/js/signals.min.js", function ( content ) {

			zip.file( "js/signals.min.js", content );

		});

		loader.load( "/js/jquery.min.js", function ( content ) {

			zip.file( "js/jquery.min.js", content );

		});

		loader.load( "/js/bootbox.min.js", function ( content ) {

			zip.file( "js/bootbox.min.js", content );

		});

		loader.load( "/js/bootstrap.min.js", function ( content ) {

			zip.file( "js/bootstrap.min.js", content );

		});

		loader.load( "/three/three.min.js", function ( content ) {

			zip.file( "js/three.min.js", content );

		});

		loader.load( "/three/system.min.js", function ( content ) {

			zip.file( "js/system.min.js", content );

		});

		loader.load( "/three/Animation.js", function ( content ) {

			zip.file( "js/EditorControls.js", content );

		});

		loader.load( "/three/AnimationHandler.js", function ( content ) {

			zip.file( "js/EditorControls.js", content );

		});

		loader.load( "/three/KeyFrameAnimation.js", function ( content ) {

			zip.file( "js/EditorControls.js", content );

		});

		loader.load( "/three/EditorControls.js", function ( content ) {

			zip.file( "js/EditorControls.js", content );

		});

		loader.load( "/three/TransformControls.js", function ( content ) {

			zip.file( "js/TransformControls.js", content );

		});

	//

		if ( vr ) {

			loader.load( "../examples/js/controls/VRControls.js", function ( content ) {

				zip.file( "js/VRControls.js", content );

			});

			loader.load( "../examples/js/effects/VREffect.js", function ( content ) {

				zip.file( "js/VREffect.js", content );

			});

			loader.load( "../examples/js/WebVR.js", function ( content ) {

				zip.file( "js/WebVR.js", content );

			});

		}

	});

	options.add( option );

//

	var link = document.createElement( "a" );
	link.style.display = "none";
	document.body.appendChild( link ); // Firefox workaround, see #6594

	function save( blob, filename ) {

		link.href = URL.createObjectURL( blob );
		link.download = filename || "data.json";
		link.click();

	//	URL.revokeObjectURL( url ); breaks Firefox...

		setTimeout(function(){
			URL.revokeObjectURL( link.href );
		});

	}

	function saveString( text, filename ) {

		save( new Blob( [ text ], { type: "text/plain" } ), filename );

	}

	return container;

};









/*
//	Publish (Dropbox)

	var option = new UI.Row();
	option.setClass( "option" );
	option.setTextContent( "Publish (Dropbox)" );
	option.onClick( function () {

		var parameters = {
			files: [
				{ "url": "data:text/plain;base64," + window.btoa( "Hello, World" ), "filename": "app/test.txt" }
			]
		};

		Dropbox.save( parameters );

	});

	options.add( option );
*/
