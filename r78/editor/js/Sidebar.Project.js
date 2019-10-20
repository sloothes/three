/**
 * @author mrdoob / http://mrdoob.com/
 */

Sidebar.Project = function ( editor ) {

	var config = editor.config;
	var signals = editor.signals;

	var rendererTypes = {

		"WebGLRenderer": THREE.WebGLRenderer,
		"CanvasRenderer": THREE.CanvasRenderer,
		"SVGRenderer": THREE.SVGRenderer,
		"SoftwareRenderer": THREE.SoftwareRenderer,
		"RaytracingRenderer": THREE.RaytracingRenderer

	};

	var container = new UI.Panel();
	container.setBorderTop( "0" );
	container.setPaddingTop( "20px" );

//	Class.

	var options = {};

	for ( var key in rendererTypes ) {

		if ( key.indexOf( "WebGL" ) >= 0 && System.support.webgl === false ) continue;

		options[ key ] = key;

	}

	var rendererTypeRow = new UI.Row();
	var rendererType = new UI.Select().setOptions( options ).setWidth( "150px" ).onChange( function () {

		var value = this.getValue();

		config.setKey( "project/renderer", value );

		updateRenderer();

	});

	rendererTypeRow.add( new UI.Text( "Renderer" ).setWidth( "90px" ) );
	rendererTypeRow.add( rendererType );

	container.add( rendererTypeRow );

	if ( config.getKey( "project/renderer" ) !== undefined ) {

		rendererType.setValue( config.getKey( "project/renderer" ) );

	}

//	Antialiasing.

	var rendererPropertiesRow = new UI.Row();
	rendererPropertiesRow.add( new UI.Text( "" ).setWidth( "90px" ) );

	var rendererAntialias = new UI.THREE.Boolean( config.getKey( "project/renderer/antialias" ), "antialias" ).onChange( function () {

		config.setKey( "project/renderer/antialias", this.getValue() );
		updateRenderer();

	});

	rendererPropertiesRow.add( rendererAntialias );

//	Shadow.

	var rendererShadows = new UI.THREE.Boolean( config.getKey( "project/renderer/shadows" ), "shadows" ).onChange( function () {

		config.setKey( "project/renderer/shadows", this.getValue() );
		updateRenderer();

	});
	rendererPropertiesRow.add( rendererShadows );

	container.add( rendererPropertiesRow );

// DebugMode.
    
    var debugRow = new UI.Row();
	var debugMode = new UI.Checkbox( config.getKey( "project/debugMode" ) ).setLeft( "100px" ).onChange( function () {

		config.setKey( "project/debugMode", this.getValue() );

	});

	debugRow.add( new UI.Text( "Debug" ).setWidth( "90px" ) );
	debugRow.add( debugMode );

	container.add( debugRow );

// THREE.Cache.

	var cacheRow = new UI.Row();
	var cache = new UI.Checkbox( config.getKey( "project/cache" ) ).setLeft( "100px" ).onChange( function () {

		config.setKey( "project/cache", this.getValue() );

	});

	cacheRow.add( new UI.Text( "Cache" ).setWidth( "90px" ) );
	cacheRow.add( cache );

	container.add( cacheRow );

//	Editable.

	var editableRow = new UI.Row();
	var editable = new UI.Checkbox( config.getKey( "project/editable" ) ).setLeft( "100px" ).onChange( function () {

		config.setKey( "project/editable", this.getValue() );

	});

	editableRow.add( new UI.Text( "Editable" ).setWidth( "90px" ) );
	editableRow.add( editable );

	container.add( editableRow );

//	VR.

	var vrRow = new UI.Row();
	var vr = new UI.Checkbox( config.getKey( "project/vr" ) ).setLeft( "100px" ).onChange( function () {

		config.setKey( "project/vr", this.getValue() );
		// updateRenderer();

	});

	vrRow.add( new UI.Text( "VR" ).setWidth( "90px" ) );
	vrRow.add( vr );

	container.add( vrRow );

//
	container.add( new UI.HorizontalRule() );

//	JS libraries.

	var libsInput = document.createElement( "input" );
	libsInput.type = "file";
	libsInput.multiple = true;
	libsInput.accept = ".js";
	libsInput.addEventListener( "change", function ( event ) {

		var files = libsInput.files;
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

    var libsRow = new UI.Row();
	libsRow.setTextAlign("center");

	var addLibs = new UI.Button( "Add JS Libraries" );
	addLibs.onClick( function () {

        libsInput.value = "";
		libsInput.click();

	});

	libsRow.add( addLibs );

//

	var clearLibs = new UI.Button( "Clear JS Libraries" );
	clearLibs.setMarginLeft("5px");
	clearLibs.onClick( function () {

        editor.javascripts.length = 0;

		var text = "Javascript libraries cleared.";
		var element = document.createElement("h4");
		var content = new UI.Element( element );
		content.setTextAlign("center");
		content.setTextContent( text );
		editor.signals.showModal.dispatch( content );

		debugMode && console.log( text, editor.javascripts );

	});

	libsRow.add( clearLibs );

	container.add( libsRow );

//

	container.add( new UI.HorizontalRule() );

//	Upload to imgur.com

	var uploadPanel = new UI.Panel();
	container.add( uploadPanel );

    var uploadRow = new UI.Row();
	uploadRow.setTextAlign("center");

	var uploadImg = new UI.Button( "Upload Texture images" );
	uploadImg.onClick( function () {

		var images = editor.toJSON().scene.images; // important!

		if ( !images || !images.length ) {

			console.warn( "[Editor]:", "There are not images for upload.", images );

			return;
		}

		for ( var i = 0; i < images.length; i++ ) {

			var row = new UI.Row();

			var upload = new UI.Button( "Upload" );
			var remove = new UI.Button( "Remove" ).setFloat("right");
			var progress = new UI.Span().setMarginLeft("5px").setWidth("100px");

			var bar = document.createElement( "input" );
			bar.disabled = true;
			bar.style.width = "0px";
			bar.style.maxWidth = "100%";
			bar.style.marginLeft = "5px";
			bar.style.background = "#0f0";
			progress.dom.appendChild( bar );

			row.dom.appendChild( upload );
			row.dom.appendChild( progress );
			row.dom.appendChild( remove );
			




			setTimeout( function(){

			//	For upload to imgur.com, "data" must be pure dataURL,
			//	without prefix "data:image/[type];base64," so we replace it.

				var array = images[i].url.replace("data:", "").split(";base64,");

				if ( array.length !== 2 ) {
					throw "Error: data array out of length range.";
					return;
				}

				var type = array[0];
				var data = array[1];
				var name = "texture";

				debugMode && console.log({name:name, type:type, data:data});

			});

		}

	});

	uploadRow.add( uploadImg );
	container.add( uploadRow );

	function uploadDataURL(data, type, name){

	//  Returns a resolved promise with record data from imgur.com.
		debugMode && console.log("uploading", file.name);
		return new Promise(function( resolve, reject ){

			var formdata = new FormData();
			formdata.append("image", data);
			formdata.append("type",  type);
			formdata.append("name",  name);

			var endpoint = "https://api.imgur.com/3/image";
			var clientID = "06217f601180652";  // sloothes app Client-ID.

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

//

	container.add( new UI.HorizontalRule() );

//

	function updateRenderer() {

		createRenderer( rendererType.getValue(), rendererAntialias.getValue(), rendererShadows.getValue() );

	}

	function createRenderer( type, antialias, shadows ) {

		if ( type === "WebGLRenderer" && System.support.webgl === false ) {

			type = "CanvasRenderer";

		}

		rendererPropertiesRow.setDisplay( type === "WebGLRenderer" ? "" : "none" );

		var renderer = new rendererTypes[ type ]( { antialias: antialias } );

		if ( shadows && renderer.shadowMap ) {

			renderer.shadowMap.enabled = true;
		//	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		}

		signals.rendererChanged.dispatch( renderer );

	}

	createRenderer( config.getKey( "project/renderer" ), config.getKey( "project/renderer/antialias" ), config.getKey( "project/renderer/shadows" ) );

	return container;

};
