/**
 * @author mrdoob / http://mrdoob.com/
 */

Sidebar.Geometry.Modifiers = function ( editor, object ) {

	var signals = editor.signals;

	var container = new UI.Row().setPaddingLeft( "90px" );

	var geometry = object.geometry;

//	Compute Vertex Normals.

	var button = new UI.Button( "Compute Vertex Normals" );

	button.onClick( function () {

		object.geometry.computeVertexNormals();

		if ( object.geometry instanceof THREE.BufferGeometry ) {

			object.geometry.attributes.normal.needsUpdate = true;

		} else {

			object.geometry.normalsNeedUpdate = true;

		}

		signals.geometryChanged.dispatch( object );

	});

	container.add( button );

//

	return container;

};
