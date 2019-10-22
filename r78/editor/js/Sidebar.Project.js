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

		THREE.Cache.enabled = this.getValue();

		config.setKey( "project/cache", this.getValue() );

		console.log( "Cache enabled:", THREE.Cache.enabled );
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

//	Imgur.

	var ImgurRow = new UI.Row();
	var ImgUpload = new UI.Checkbox( false ).setId("imgur").setLeft( "100px" );
	ImgurRow.add( new UI.Text( "ImgUpload" ).setWidth( "90px" ) );
	ImgurRow.add( ImgUpload );

	container.add( ImgurRow );


//	Import js libraries.

    var importLibrariesRow = new UI.Row();
	importLibrariesRow.add( new UI.Text( "" ).setWidth( "90px" ) );

	var libInput = document.createElement( "input" );
	libInput.type = "file";
	libInput.multiple = true;
	libInput.accept = ".js";
	libInput.addEventListener( "change", function ( event ) {

		var files = libInput.files;
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

	var importLibraries = new UI.Button( "Import JS Libraries" ).setWidth("150px").setOverflow("hidden").setTextOverflow("ellipsis");
	importLibraries.onClick( function () {

        libInput.value = "";
		libInput.click();

	});

	importLibrariesRow.add( importLibraries );

	container.add( importLibrariesRow );

//	Clear js libraries

    var clearLibrariesRow = new UI.Row();
	clearLibrariesRow.add( new UI.Text( "" ).setWidth( "90px" ) );

	var clearLibraries = new UI.Button( "Clear JS Libraries" ).setWidth("150px").setOverflow("hidden").setTextOverflow("ellipsis");
	clearLibraries.onClick( function () {

		if ( confirm("Are you sure?") ) {

			editor.javascripts.length = 0;

			var dom = document.createElement("h4");
			var dialog = new UI.Element( dom ).setTextAlign("center");
			dialog.setTextContent( "Javascript libraries cleared." );
			editor.signals.showModal.dispatch( dialog );
			debugMode && console.log( dom.textContent, editor.javascripts );

		}

	});

	clearLibrariesRow.add( clearLibraries );

	container.add( clearLibrariesRow );


//	Texture upload.

	const endpoint = "https://api.imgur.com/3/image";
	const clientID = "06217f601180652";  // sloothes app Client-ID.

	var uploadPanel = new UI.Panel().setId("upload-panel");

	var uploadTextures = new UI.Button( "Upload Texture images" ).setWidth("100%");

	uploadTextures.onClick( createUploads );

	function createUploads() {

	//	"#imgur" must be checked to allow uploading.

		if ( ImgUpload.getValue() === false ) return;

	//	Reset "#imgur" checkbox value.

		ImgUpload.setValue( false ); // important!

	//	Remove "click" listener to avoid multipe uploaders (disable button).

		uploadTextures.off("click"); // important!

	//	TODO: Get textures direct from editor.materials???

	//  Get texture images from "editor.toJSON".

		var json = editor.toJSON();

		var images = json.scene.images; // important!

		if ( !images || !images.length ) {

			console.warn( "[Editor]:", "There are not images for upload.", images );

			return;
		}

		debugMode && console.log("editor toJSON:", json);

	//	Create texture uploaders.

		for ( var i = 0; i < images.length; i++ ) {

			(function(image){

				var url = image.url;
				var uuid = image.uuid;

			//  Find editor material and
			//  texture that image belong.

				var row = new UI.Row();
				var upload = new UI.Button( "Upload" );
				var del = new UI.Button( "Delete" ).setDisplay("none");
				var remove = new UI.Button( "Remove" ).setFloat("right");
				var progress = new UI.Span().setMarginLeft("5px").setBorder("1px solid #fff");

				var bar = document.createElement( "input" );
				bar.disabled = true;
				bar.style.width = "0px";
				bar.style.maxWidth = "100px";
				bar.style.color = "#fff";
				bar.style.textAlign = "center";
				bar.style.borderRadius = "4px";
				bar.style.background = "#18b91b";
				progress.dom.appendChild( bar );

			//	Event listeners.

				del.onClick( deleteUploaded );
				upload.onClick( uploadHandler );
				remove.onClick( removeUploader );

				function enableButton(){
					if (uploadPanel.dom.childElementCount) return;
					uploadTextures.onClick( createUploads );
				}

				function uploadHandler(){

				//	Avoid multiple uploads.
					clearTimeout( this.interval );

				//	Reset "#imgur" checkbox value.
					ImgUpload.setValue( false ); // important!

					this.interval = setTimeout( uploader, 250 );

				}

				function removeUploader(){

					row.addClass("fade","out");

				//	Reset "#imgur" checkbox value.
					ImgUpload.setValue( false ); // important!

					setTimeout(function(){
						row.dom.remove();
						setTimeout( enableButton );
					}, 500);

				}

				function deleteUploaded(){

					if ( this.data === undefined ) return;

				//	Avoid multiple clicks.
					clearTimeout( this.interval );

					if ( confirm("Are you sure?") ) {
						var data = this.data;
						deleteUploadedImage( data ).then( function( results ){
							console.log( "results:", {deleted:data, results:results} );
						});
					}

				}

				function uploader(){

				//	Remove "click" listener to avoid 
				//	multiply uploads (disable button).

					upload.off("click"); // important!

				//	For upload to imgur.com, "data" must be pure dataURL,
				//	without prefix "data:image/[type];base64," so we replace it.

					var array = url.replace("data:", "").split(";base64,");

				//  Validate.

					if ( array.length !== 2 ) {
						throw "Error: data array out of length range.";
						return;
					}

					var name = uuid;
					var type = array[0];
					var data = array[1];

			/*
				//	Demo.

					function fakeProgress(requestID){ 

						while ( bar.offsetWidth < 100 ){
							var width = bar.offsetWidth + 1;
							bar.style.width = width + "px"; 
							bar.value = width + "%"; 
							return requestAnimationFrame(fakeProgress);
						}

						cancelAnimationFrame(requestID);
						debugMode && console.log({name:name, type:type, data:data});

					//	Remove successfull uploader.
						setTimeout( removeUploader, 3000 );

					}

					var requestID = requestAnimationFrame(fakeProgress); // demo!
			*/

					return new Promise(function( resolve, reject ){

						var formdata = new FormData();
						formdata.append("image", data);
						formdata.append("type",  type);
						formdata.append("name",  name);

						var xhttp = new XMLHttpRequest();

                        xhttp.upload.onloadstart = function(){
							bar.value = "0%"; 
							bar.style.width = "0px";
							bar.style.background = "##18b91b";
                            debugMode && console.log("Starting upload of", name);
                        };

                        xhttp.upload.onprogress = function( event ){
                            if ( event.lengthComputable ) {
                                var percentComplete = event.loaded / event.total * 100;
                                var width = parseInt(percentComplete);
								bar.value = width + "%"; 
								bar.style.width = width + "px"; 
                            } else {
								var width = bar.offsetWidth + 1;
								bar.value = "Uploading..."; 
								bar.style.width = width + "px"; 
                            }
                        };

                        xhttp.upload.onload = function() {
							bar.value = "Complete 100%"; 
							bar.style.width = "100px";
							bar.style.background = "##18b91b";
                            debugMode && console.log(name, "Upload completed.");
                        };

                        xhttp.upload.onerror = function() {
                            var err = "An error occurred while uploading " + name;
							bar.value = "Failed"; 
							bar.style.width = "100px";
							bar.style.background = "##ee0404";
                            throw Error(err);
                        };

                        xhttp.upload.onabort = function() {
                            var err = "Upload has been canceled by the user.";
							bar.value = "Canceled"; 
							bar.style.width = "100px";
							bar.style.background = "##ee0404";
                            throw Error(err);
                        };

					//	var endpoint = "https://api.imgur.com/3/image";
					//	var clientID = "06217f601180652";  // sloothes app Client-ID.

						xhttp.open("POST", endpoint, true);
						xhttp.setRequestHeader("Authorization", "Client-ID " + clientID);
						xhttp.onreadystatechange = function () {
							if (this.readyState === 4) {
								var response = "";
								if (this.status > 199 && this.status < 300) {
									response = JSON.parse(this.responseText);
								//	debugMode && console.log(response.data);
									resolve( response.data ); // resolve promise.
								} else {
									var err = JSON.parse(this.responseText).data.error;
									console.error( err.type, err );
									throw err;
								}
							}
						};

						xhttp.send(formdata);
						xhttp = null;

					}).then( function( data ){

						image.url = data.link; // important!

						data.clientID = clientID;
						data.endpoint = endpoint;
						data.getpoint = endpoint + "/" + data.id; // important!
						data.deletepoint = endpoint + "/" + data.deletehash; // important!

						return data;

					}).then( function( data ){

						if ( del ) del.data = data; // for delete button.

						json && json.images && json.images.push && json.images.push( data );

					//	Ensure THREE.Cache.enabled.
						THREE.Cache.enabled = false;

					//	TODO: Find and replace texture image 
					//  dataURL in editor materials with data.link.

					//	Load texture.
						var loader = new THREE.TextureLoader();
						loader.setCrossOrigin = "anonymous"; // important!
						loader.load( data.link, function( texture ){
							debugMode && console.log( "texture:", texture );

							editor.textures[ texture.uuid ] = texture;

							try {
								texture.image.img.src = data.link; // important!
							} catch(err){
								console.error(err);
							}

						});

						debugMode && console.log( "editor json:", json );

						return json;

					}).catch(function(err){
						console.error(err);
					});
	
				}

				row.add( upload );
				row.add( progress );
				row.add( remove );
				uploadPanel.add(row);

			})(images[i]);

		}

	}

	container.add( uploadPanel );
	container.add( uploadTextures );

	function uploadDataURL(data, type, name){

	//  Returns a resolved promise with record data from imgur.com.
		debugMode && console.log("uploading", name);

		var formdata = new FormData();
		formdata.append("image", data);
		formdata.append("type",  type);
		formdata.append("name",  name);

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

//

	function deleteUploadedImage( data ){

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
