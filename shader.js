//  shader.js
    
    var vertexShader = [
    
        "attribute vec4 tangent;",
    
        "uniform float time;",
        "uniform vec2 repeat;",
        "uniform float useNormal;",
        "uniform float useRim;",
    
        "varying vec2 vUv;",
        "varying vec3 vTangent;",
        "varying vec3 vBinormal;",
        "varying vec3 vNormal;",
        "varying vec3 vEye;",
        "varying vec3 vU;",
        "varying vec2 vN;",
    
        "void main() {",
    
            "vU = normalize( vec3( modelViewMatrix * vec4( position, 1.0 ) ) );",
    
            "if( useNormal == 0. ) {",
                "vec3 n = normalize( normalMatrix * normal );",
                "vec3 r = reflect( vU, n );",
                "float m = 2.0 * sqrt( r.x * r.x + r.y * r.y + ( r.z + 1.0 ) * ( r.z+1.0 ) );",
                "vN = vec2( r.x / m + 0.5,  r.y / m + 0.5 );",
            "} else {",
                "vN = vec2( 0. );",
            "}",
    
            "vUv = repeat * uv;",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
    
            "vNormal = normalize( normalMatrix * normal );",
            "if( useNormal == 1. ) {",
                "vTangent = normalize( normalMatrix * tangent.xyz );",
                "vBinormal = normalize( cross( vNormal, vTangent ) * tangent.w );",
            "} else {",
                "vTangent = vec3( 0. );",
                "vBinormal = vec3( 0. );",
            "}",
    
            "if( useRim > 0. ) {",
                "vEye = ( modelViewMatrix * vec4( position, 1.0 ) ).xyz;",
            "} else {",
                "vEye = vec3( 0. );",
            "}",
        "}"
    ].join(" ");
    
    var fragmentShader = [
    
        "uniform float time;",
        "uniform float bump;",
        "uniform sampler2D tNormal;",
        "uniform sampler2D tMatCap;",
        "uniform float noise;",
        "uniform float useNormal;",
        "uniform float useRim;",
        "uniform float rimPower;",
        "uniform float useScreen;",
        "uniform float normalScale;",
        "uniform float normalRepeat;",
    
        "varying vec2 vUv;",
        "varying vec3 vTangent;",
        "varying vec3 vBinormal;",
        "varying vec3 vNormal;",
        "varying vec3 vEye;",
        "varying vec3 vU;",
        "varying vec2 vN;",
    
        "float random(vec3 scale,float seed){return fract(sin(dot(gl_FragCoord.xyz+seed,scale))*43758.5453+seed);}",
    
        "void main() {",
    
            "vec3 finalNormal = vNormal;",
            "vec2 calculatedNormal = vN;",
    
            "if( useNormal == 1. ) {",
                "vec3 normalTex = texture2D( tNormal, vUv * normalRepeat ).xyz * 2.0 - 1.0;",
                "normalTex.xy *= normalScale;",
                "normalTex.y *= -1.;",
                "normalTex = normalize( normalTex );",
                "mat3 tsb = mat3( normalize( vTangent ), normalize( vBinormal ), normalize( vNormal ) );",
                "finalNormal = tsb * normalTex;",
    
                "vec3 r = reflect( vU, normalize( finalNormal ) );",
                "float m = 2.0 * sqrt( r.x * r.x + r.y * r.y + ( r.z + 1.0 ) * ( r.z+1.0 ) );",
                "calculatedNormal = vec2( r.x / m + 0.5,  r.y / m + 0.5 );",
            "}",
    
            "vec3 base = texture2D( tMatCap, calculatedNormal ).rgb;",
    
            // rim lighting
    
            "if( useRim > 0. ) {",
                "float f = rimPower * abs( dot( vNormal, normalize( vEye ) ) );",
                "f = useRim * ( 1. - smoothstep( 0.0, 1., f ) );",
                "base += vec3( f );",
            "}",
    
            // screen blending
    
            "if( useScreen == 1. ) {",
                "base = vec3( 1. ) - ( vec3( 1. ) - base ) * ( vec3( 1. ) - base );",
            "}",
    
            // noise 
    
            "base += noise * ( .5 - random( vec3( 1. ), length( gl_FragCoord ) ) );",
    
            "gl_FragColor = vec4( base, 1. );",
        "}",
    ].join("");
    
    function ShaderMaterial(normalMap, matcapMap, callback){
        return new Promise( function(resolve, reject){
            var material = new THREE.ShaderMaterial( {
                uniforms: { 
                    tNormal: { type: "t", value: normalMap },
                    tMatCap: { type: "t", value: matcapMap },
                    time: { type: "f", value: 0 },
                    bump: { type: "f", value: 0 },
                    noise: { type: "f", value: 0.04 },
                    repeat: { type: "v2", value: new THREE.Vector2( 1, 1 ) },
                    useNormal: { type: "f", value: 0 },
                    useRim: { type: "f", value: 0 },
                    rimPower: { type: "f", value: 0 },
                    useScreen: { type: "f", value: 0 },
                    normalScale: { type: "f", value: 1 },
                    normalRepeat: { type: "f", value: 1 }
                },
                vertexShader: vertexShader,       //  document.getElementById( "vertexShader" ).textContent,
                fragmentShader: fragmentShader,   //  document.getElementById( "fragmentShader" ).textContent,
                shading: THREE.SmoothShading,
                side: THREE.DoubleSide
            });
    
            material.uniforms.tMatCap.value.wrapS = material.uniforms.tMatCap.value.wrapT = THREE.ClampToEdgeWrapping;
            material.uniforms.tNormal.value.wrapS = material.uniforms.tNormal.value.wrapT = THREE.RepeatWrapping;
    
            material.uniforms.tMatCap.value.needsUpdate = true;
            material.uniforms.tNormal.value.needsUpdate = true;
    
            if ( !!callback ) callback( material );
    
            resolve( material );
        });
    }

