var e=function(){};e.roundNumber=function(e,t){var r=Math.pow(10,t);return Math.round(e*r)/r},e.sample=function(e){return e[Math.floor(Math.random()*e.length)]},e.distanceToSquared=function(e,t){var r=e.x-t.x,n=e.y-t.y,o=e.z-t.z;return r*r+n*n+o*o},e.isPointInPoly=function(e,t){for(var r=!1,n=-1,o=e.length,i=o-1;++n<o;i=n)(e[n].z<=t.z&&t.z<e[i].z||e[i].z<=t.z&&t.z<e[n].z)&&t.x<(e[i].x-e[n].x)*(t.z-e[n].z)/(e[i].z-e[n].z)+e[n].x&&(r=!r);return r},e.isVectorInPolygon=function(e,t,r){var n=1e5,o=-1e5,i=[];return t.vertexIds.forEach(function(e){n=Math.min(r[e].y,n),o=Math.max(r[e].y,o),i.push(r[e])}),!!(e.y<o+.5&&e.y>n-.5&&this.isPointInPoly(i,e))},e.triarea2=function(e,t,r){return(r.x-e.x)*(t.z-e.z)-(t.x-e.x)*(r.z-e.z)},e.vequal=function(e,t){return this.distanceToSquared(e,t)<1e-5};var t=function(e){this.content=[],this.scoreFunction=e};t.prototype.push=function(e){this.content.push(e),this.sinkDown(this.content.length-1)},t.prototype.pop=function(){var e=this.content[0],t=this.content.pop();return this.content.length>0&&(this.content[0]=t,this.bubbleUp(0)),e},t.prototype.remove=function(e){var t=this.content.indexOf(e),r=this.content.pop();t!==this.content.length-1&&(this.content[t]=r,this.scoreFunction(r)<this.scoreFunction(e)?this.sinkDown(t):this.bubbleUp(t))},t.prototype.size=function(){return this.content.length},t.prototype.rescoreElement=function(e){this.sinkDown(this.content.indexOf(e))},t.prototype.sinkDown=function(e){for(var t=this.content[e];e>0;){var r=(e+1>>1)-1,n=this.content[r];if(!(this.scoreFunction(t)<this.scoreFunction(n)))break;this.content[r]=t,this.content[e]=n,e=r}},t.prototype.bubbleUp=function(e){for(var t=this.content.length,r=this.content[e],n=this.scoreFunction(r);;){var o=e+1<<1,i=o-1,s=null,a=void 0;if(i<t)(a=this.scoreFunction(this.content[i]))<n&&(s=i);if(o<t)this.scoreFunction(this.content[o])<(null===s?n:a)&&(s=o);if(null===s)break;this.content[e]=this.content[s],this.content[s]=r,e=s}};var r=function(){};r.init=function(e){for(var t=0;t<e.length;t++){var r=e[t];r.f=0,r.g=0,r.h=0,r.cost=1,r.visited=!1,r.closed=!1,r.parent=null}},r.cleanUp=function(e){for(var t=0;t<e.length;t++){var r=e[t];delete r.f,delete r.g,delete r.h,delete r.cost,delete r.visited,delete r.closed,delete r.parent}},r.heap=function(){return new t(function(e){return e.f})},r.search=function(e,t,r){this.init(e);var n=this.heap();for(n.push(t);n.size()>0;){var o=n.pop();if(o===r){for(var i=o,s=[];i.parent;)s.push(i),i=i.parent;return this.cleanUp(s),s.reverse()}o.closed=!0;for(var a=this.neighbours(e,o),h=0,c=a.length;h<c;h++){var u=a[h];if(!u.closed){var p=o.g+u.cost,l=u.visited;if(!l||p<u.g){if(u.visited=!0,u.parent=o,!u.centroid||!r.centroid)throw new Error("Unexpected state");u.h=u.h||this.heuristic(u.centroid,r.centroid),u.g=p,u.f=u.g+u.h,l?n.rescoreElement(u):n.push(u)}}}}return[]},r.heuristic=function(t,r){return e.distanceToSquared(t,r)},r.neighbours=function(e,t){for(var r=[],n=0;n<t.neighbours.length;n++)r.push(e[t.neighbours[n]]);return r};var n=function(){};n.buildZone=function(t){var r=this,n=this._buildNavigationMesh(t),o={};n.vertices.forEach(function(t){t.x=e.roundNumber(t.x,2),t.y=e.roundNumber(t.y,2),t.z=e.roundNumber(t.z,2)}),o.vertices=n.vertices;var i=this._buildPolygonGroups(n);return o.groups=new Array(i.length),i.forEach(function(t,n){var i=new Map;t.forEach(function(e,t){i.set(e,t)});var s=new Array(t.length);t.forEach(function(t,n){var a=[];t.neighbours.forEach(function(e){return a.push(i.get(e))});var h=[];t.neighbours.forEach(function(e){return h.push(r._getSharedVerticesInOrder(t,e))});var c=new THREE.Vector3(0,0,0);c.add(o.vertices[t.vertexIds[0]]),c.add(o.vertices[t.vertexIds[1]]),c.add(o.vertices[t.vertexIds[2]]),c.divideScalar(3),c.x=e.roundNumber(c.x,2),c.y=e.roundNumber(c.y,2),c.z=e.roundNumber(c.z,2),s[n]={id:n,neighbours:a,vertexIds:t.vertexIds,centroid:c,portals:h}}),o.groups[n]=s}),o},n._buildNavigationMesh=function(e){return e.mergeVertices(),this._buildPolygonsFromGeometry(e)},n._buildPolygonGroups=function(e){var t=[],r=function(e){e.neighbours.forEach(function(t){void 0===t.group&&(t.group=e.group,r(t))})};return e.polygons.forEach(function(e){void 0!==e.group?t[e.group].push(e):(e.group=t.length,r(e),t.push([e]))}),t},n._buildPolygonNeighbours=function(e,t){var r=new Set,n=t[e.vertexIds[1]],o=t[e.vertexIds[2]];return t[e.vertexIds[0]].forEach(function(t){t!==e&&(n.includes(t)||o.includes(t))&&r.add(t)}),n.forEach(function(t){t!==e&&o.includes(t)&&r.add(t)}),r},n._buildPolygonsFromGeometry=function(e){for(var t=this,r=[],n=e.vertices,o=new Array(n.length),i=0;i<n.length;i++)o[i]=[];return e.faces.forEach(function(e){var t={vertexIds:[e.a,e.b,e.c],neighbours:null};r.push(t),o[e.a].push(t),o[e.b].push(t),o[e.c].push(t)}),r.forEach(function(e){e.neighbours=t._buildPolygonNeighbours(e,o)}),{polygons:r,vertices:n}},n._getSharedVerticesInOrder=function(e,t){var r=e.vertexIds,n=r[0],o=r[1],i=r[2],s=t.vertexIds,a=s.includes(n),h=s.includes(o),c=s.includes(i);return a&&h&&c?Array.from(r):a&&h?[n,o]:h&&c?[o,i]:a&&c?[i,n]:(console.warn("Error processing navigation mesh neighbors; neighbors with <2 shared vertices found."),[])};var o=function(){this.portals=[]};o.prototype.push=function(e,t){void 0===t&&(t=e),this.portals.push({left:e,right:t})},o.prototype.stringPull=function(){var t,r,n,o=this.portals,i=[],s=0,a=0,h=0;r=o[0].left,n=o[0].right,i.push(t=o[0].left);for(var c=1;c<o.length;c++){var u=o[c].left,p=o[c].right;if(e.triarea2(t,n,p)<=0){if(!(e.vequal(t,n)||e.triarea2(t,r,p)>0)){i.push(r),r=t=r,n=t,a=s=a,h=s,c=s;continue}n=p,h=c}if(e.triarea2(t,r,u)>=0){if(!(e.vequal(t,r)||e.triarea2(t,n,u)<0)){i.push(n),r=t=n,n=t,a=s=h,h=s,c=s;continue}r=u,a=c}}return 0!==i.length&&e.vequal(i[i.length-1],o[o.length-1].left)||i.push(o[o.length-1].left),this.path=i,i};var i,s=function(){this.zones={}};s.createZone=function(e){return e.isGeometry?console.warn("[three-pathfinding]: Use THREE.BufferGeometry, not THREE.Geometry, to create zone."):e=(new THREE.Geometry).fromBufferGeometry(e),n.buildZone(e)},s.prototype.setZoneData=function(e,t){this.zones[e]=t},s.prototype.getRandomNode=function(t,r,n,o){if(!this.zones[t])return new THREE.Vector3;n=n||null,o=o||0;var i=[];return this.zones[t].groups[r].forEach(function(t){n&&o?e.distanceToSquared(n,t.centroid)<o*o&&i.push(t.centroid):i.push(t.centroid)}),e.sample(i)||new THREE.Vector3},s.prototype.getClosestNode=function(t,r,n,o){void 0===o&&(o=!1);var i=this.zones[r].vertices,s=null,a=Infinity;return this.zones[r].groups[n].forEach(function(r){var n=e.distanceToSquared(r.centroid,t);n<a&&(!o||e.isVectorInPolygon(t,r,i))&&(s=r,a=n)}),s},s.prototype.findPath=function(e,t,n,i){var s=this.zones[n].groups[i],a=this.zones[n].vertices,h=this.getClosestNode(e,n,i,!0),c=this.getClosestNode(t,n,i,!0);if(!h||!c)return null;var u=r.search(s,h,c),p=function(e,t){for(var r=0;r<e.neighbours.length;r++)if(e.neighbours[r]===t.id)return e.portals[r]},l=new o;l.push(e);for(var f=0;f<u.length;f++){var d=u[f+1];if(d){var v=p(u[f],d);l.push(a[v[0]],a[v[1]])}}l.push(t),l.stringPull();var E=l.path.map(function(e){return new THREE.Vector3(e.x,e.y,e.z)});return E.shift(),E},s.prototype.getGroup=(i=new THREE.Plane,function(t,r,n){if(void 0===n&&(n=!1),!this.zones[t])return null;for(var o=null,s=Math.pow(50,2),a=this.zones[t],h=0;h<a.groups.length;h++)for(var c=0,u=a.groups[h];c<u.length;c+=1){var p=u[c];if(n&&(i.setFromCoplanarPoints(a.vertices[p.vertexIds[0]],a.vertices[p.vertexIds[1]],a.vertices[p.vertexIds[2]]),Math.abs(i.distanceToPoint(r))<.01&&e.isPointInPoly([a.vertices[p.vertexIds[0]],a.vertices[p.vertexIds[1]],a.vertices[p.vertexIds[2]]],r)))return h;var l=e.distanceToSquared(p.centroid,r);l<s&&(o=h,s=l)}return o}),s.prototype.clampStep=function(){var e,t,r=new THREE.Vector3,n=new THREE.Plane,o=new THREE.Triangle,i=new THREE.Vector3,s=new THREE.Vector3;return function(a,h,c,u,p,l){var f=this.zones[u].vertices,d=this.zones[u].groups[p],v=[c],E={};E[c.id]=0,e=void 0,s.set(0,0,0),t=Infinity,n.setFromCoplanarPoints(f[c.vertexIds[0]],f[c.vertexIds[1]],f[c.vertexIds[2]]),n.projectPoint(h,r),i.copy(r);for(var g=v.pop();g;g=v.pop()){o.set(f[g.vertexIds[0]],f[g.vertexIds[1]],f[g.vertexIds[2]]),o.closestPointToPoint(i,r),r.distanceToSquared(i)<t&&(e=g,s.copy(r),t=r.distanceToSquared(i));var y=E[g.id];if(!(y>2))for(var T=0;T<g.neighbours.length;T++){var M=d[g.neighbours[T]];M.id in E||(v.push(M),E[M.id]=y+1)}}return l.copy(s),e}}();var a={PLAYER:new THREE.Color(15631215).convertGammaToLinear(2.2).getHex(),TARGET:new THREE.Color(14469912).convertGammaToLinear(2.2).getHex(),PATH:new THREE.Color(41903).convertGammaToLinear(2.2).getHex(),WAYPOINT:new THREE.Color(41903).convertGammaToLinear(2.2).getHex(),CLAMPED_STEP:new THREE.Color(14472114).convertGammaToLinear(2.2).getHex(),CLOSEST_NODE:new THREE.Color(4417387).convertGammaToLinear(2.2).getHex()},h=function(e){function t(){var t=this;e.call(this),this._playerMarker=new THREE.Mesh(new THREE.SphereGeometry(.25,32,32),new THREE.MeshBasicMaterial({color:a.PLAYER})),this._targetMarker=new THREE.Mesh(new THREE.BoxGeometry(.3,.3,.3),new THREE.MeshBasicMaterial({color:a.TARGET})),this._nodeMarker=new THREE.Mesh(new THREE.BoxGeometry(.1,.8,.1),new THREE.MeshBasicMaterial({color:a.CLOSEST_NODE})),this._stepMarker=new THREE.Mesh(new THREE.BoxGeometry(.1,1,.1),new THREE.MeshBasicMaterial({color:a.CLAMPED_STEP})),this._pathMarker=new THREE.Object3D,this._pathLineMaterial=new THREE.LineBasicMaterial({color:a.PATH,linewidth:2}),this._pathPointMaterial=new THREE.MeshBasicMaterial({color:a.WAYPOINT}),this._pathPointGeometry=new THREE.SphereBufferGeometry(.08),this._markers=[this._playerMarker,this._targetMarker,this._nodeMarker,this._stepMarker,this._pathMarker],this._markers.forEach(function(e){e.visible=!1,t.add(e)})}return e&&(t.__proto__=e),(t.prototype=Object.create(e&&e.prototype)).constructor=t,t.prototype.setPath=function(e){for(;this._pathMarker.children.length;)this._pathMarker.children[0].visible=!1,this._pathMarker.remove(this._pathMarker.children[0]);e=[this._playerMarker.position].concat(e);for(var t=new THREE.Geometry,r=0;r<e.length;r++)t.vertices.push(e[r].clone().add(new THREE.Vector3(0,.2,0)));this._pathMarker.add(new THREE.Line(t,this._pathLineMaterial));for(var n=0;n<e.length-1;n++){var o=new THREE.Mesh(this._pathPointGeometry,this._pathPointMaterial);o.position.copy(e[n]),o.position.y+=.2,this._pathMarker.add(o)}return this._pathMarker.visible=!0,this},t.prototype.setPlayerPosition=function(e){return this._playerMarker.position.copy(e),this._playerMarker.visible=!0,this},t.prototype.setTargetPosition=function(e){return this._targetMarker.position.copy(e),this._targetMarker.visible=!0,this},t.prototype.setNodePosition=function(e){return this._nodeMarker.position.copy(e),this._nodeMarker.visible=!0,this},t.prototype.setStepPosition=function(e){return this._stepMarker.position.copy(e),this._stepMarker.visible=!0,this},t.prototype.reset=function(){for(;this._pathMarker.children.length;)this._pathMarker.children[0].visible=!1,this._pathMarker.remove(this._pathMarker.children[0]);return this._markers.forEach(function(e){e.visible=!1}),this},t}(THREE.Object3D);exports.Pathfinding=s,exports.PathfindingHelper=h;
//# sourceMappingURL=three-pathfinding.js.map