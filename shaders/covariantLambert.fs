
uniform float opacity;
varying vec3 vLightFront;

uniform float beta;
uniform float gamma;

#ifdef DOUBLE_SIDED
    varying vec3 vLightBack;
#endif

#ifdef USE_COLOR
    varying vec3 vColor;
#endif

#ifdef USE_MAP
    varying vec2 vUv;
    uniform sampler2D map;
#endif

#ifdef USE_LIGHTMAP
    varying vec2 vUv2;
    uniform sampler2D lightMap;
#endif

#ifdef USE_ENVMAP
    varying vec3 vReflect;
    uniform float reflectivity;
    uniform samplerCube envMap;
    uniform float flipEnvMap;
    uniform int combine;
#endif

#ifdef USE_FOG
    uniform vec3 fogColor;
    #ifdef FOG_EXP2
        uniform float fogDensity;
    #else
        uniform float fogNear;
        uniform float fogFar;
    #endif
#endif

#ifdef USE_SHADOWMAP
    uniform sampler2D shadowMap[ MAX_SHADOWS ];
    uniform vec2 shadowMapSize[ MAX_SHADOWS ];
    uniform float shadowDarkness[ MAX_SHADOWS ];
    uniform float shadowBias[ MAX_SHADOWS ];
    varying vec4 vShadowCoord[ MAX_SHADOWS ];

    float unpackDepth( const in vec4 rgba_depth ) {
        const vec4 bit_shift = vec4( 1.0 / ( 256.0 * 256.0 * 256.0 ), 1.0 / ( 256.0 * 256.0 ), 1.0 / 256.0, 1.0 );
        float depth = dot( rgba_depth, bit_shift );
        return depth;
    }
#endif

void main() {
    gl_FragColor = vec4( vec3 ( 1.0 ), opacity );
    #ifdef USE_MAP
        #ifdef GAMMA_INPUT
            vec4 texelColor = texture2D( map, vUv );
            texelColor.xyz *= texelColor.xyz;
            gl_FragColor = gl_FragColor * texelColor;
        #else
            gl_FragColor = gl_FragColor * texture2D( map, vUv );
        #endif
    #endif

	#ifdef ALPHATEST
        if ( gl_FragColor.a < ALPHATEST ) discard;
    #endif

	#ifdef DOUBLE_SIDED
        if ( gl_FrontFacing )
            gl_FragColor.xyz *= vLightFront;
        else
            gl_FragColor.xyz *= vLightBack;
    #else
        gl_FragColor.xyz *= vLightFront;
    #endif

	#ifdef USE_LIGHTMAP
        gl_FragColor = gl_FragColor * texture2D( lightMap, vUv2 );
    #endif

    #ifdef USE_COLOR
        gl_FragColor = gl_FragColor * vec4( vColor, opacity );
    #endif

	#ifdef USE_ENVMAP
        #ifdef DOUBLE_SIDED
            float flipNormal = ( -1.0 + 2.0 * float( gl_FrontFacing ) );
            vec4 cubeColor = textureCube( envMap, flipNormal * vec3( flipEnvMap * vReflect.x, vReflect.yz ) );
        #else
            vec4 cubeColor = textureCube( envMap, vec3( flipEnvMap * vReflect.x, vReflect.yz ) );
        #endif

	    #ifdef GAMMA_INPUT
            cubeColor.xyz *= cubeColor.xyz;
        #endif

        if ( combine == 1 ) {
            gl_FragColor.xyz = mix( gl_FragColor.xyz, cubeColor.xyz, reflectivity );
        } else {
            gl_FragColor.xyz = gl_FragColor.xyz * cubeColor.xyz;
        }
    #endif

	#ifdef USE_SHADOWMAP
        #ifdef SHADOWMAP_DEBUG
            vec3 frustumColors[3];
            frustumColors[0] = vec3( 1.0, 0.5, 0.0 );
            frustumColors[1] = vec3( 0.0, 1.0, 0.8 );
            frustumColors[2] = vec3( 0.0, 0.5, 1.0 );
        #endif

		#ifdef SHADOWMAP_CASCADE
            int inFrustumCount = 0;
        #endif

		float fDepth;
        vec3 shadowColor = vec3( 1.0 );
        for( int i = 0; i < MAX_SHADOWS; i ++ ) {
            vec3 shadowCoord = vShadowCoord[ i ].xyz / vShadowCoord[ i ].w;
            bvec4 inFrustumVec = bvec4 ( shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0 );
            bool inFrustum = all( inFrustumVec );

			#ifdef SHADOWMAP_CASCADE
                inFrustumCount += int( inFrustum );
                bvec3 frustumTestVec = bvec3( inFrustum, inFrustumCount == 1, shadowCoord.z <= 1.0 );
            #else
                bvec2 frustumTestVec = bvec2( inFrustum, shadowCoord.z <= 1.0 );
            #endif
            
			bool frustumTest = all( frustumTestVec );

			if ( frustumTest ) {
                shadowCoord.z += shadowBias[ i ];
                #ifdef SHADOWMAP_SOFT
                    float shadow = 0.0;
                    const float shadowDelta = 1.0 / 9.0;
                    float xPixelOffset = 1.0 / shadowMapSize[ i ].x;
                    float yPixelOffset = 1.0 / shadowMapSize[ i ].y;
                    float dx0 = -1.25 * xPixelOffset;
                    float dy0 = -1.25 * yPixelOffset;
                    float dx1 = 1.25 * xPixelOffset;
                    float dy1 = 1.25 * yPixelOffset;

                    fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx0, dy0 ) ) );
                    if ( fDepth < shadowCoord.z ) shadow += shadowDelta;
                    fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( 0.0, dy0 ) ) );
                    if ( fDepth < shadowCoord.z ) shadow += shadowDelta;
                    fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx1, dy0 ) ) );
                    if ( fDepth < shadowCoord.z ) shadow += shadowDelta;
                    fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx0, 0.0 ) ) );
                    if ( fDepth < shadowCoord.z ) shadow += shadowDelta;
                    fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy ) );
                    if ( fDepth < shadowCoord.z ) shadow += shadowDelta;
                    fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx1, 0.0 ) ) );
                    if ( fDepth < shadowCoord.z ) shadow += shadowDelta;
                    fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx0, dy1 ) ) );
                    if ( fDepth < shadowCoord.z ) shadow += shadowDelta;
                    fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( 0.0, dy1 ) ) );
                    if ( fDepth < shadowCoord.z ) shadow += shadowDelta;
                    fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx1, dy1 ) ) );
                    if ( fDepth < shadowCoord.z ) shadow += shadowDelta;
                    shadowColor = shadowColor * vec3( ( 1.0 - shadowDarkness[ i ] * shadow ) );
                #else
                    vec4 rgbaDepth = texture2D( shadowMap[ i ], shadowCoord.xy );
                    float fDepth = unpackDepth( rgbaDepth );

                    if ( fDepth < shadowCoord.z ) {
                        shadowColor = shadowColor * vec3( 1.0 - shadowDarkness[ i ] );
                    }
                #endif
            }
			
            #ifdef SHADOWMAP_DEBUG
                #ifdef SHADOWMAP_CASCADE
                    if ( inFrustum && inFrustumCount == 1 ) gl_FragColor.xyz *= frustumColors[ i ];
                #else
                    if ( inFrustum ) gl_FragColor.xyz *= frustumColors[ i ];
                #endif
            #endif
        }
		
        #ifdef GAMMA_OUTPUT
            shadowColor *= shadowColor;
        #endif

		gl_FragColor.xyz = gl_FragColor.xyz * shadowColor;
    #endif

	#ifdef GAMMA_OUTPUT
        gl_FragColor.xyz = sqrt( gl_FragColor.xyz );
    #endif

	#ifdef USE_FOG
        float depth = gl_FragCoord.z / gl_FragCoord.w;
        #ifdef FOG_EXP2
            const float LOG2 = 1.442695;
            float fogFactor = exp2( - fogDensity * fogDensity * depth * depth * LOG2 );
            fogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );
        #else
            float fogFactor = smoothstep( fogNear, fogFar, depth );
        #endif
        gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );
    #endif

//    gl_FragColor = gl_FragColor * vec4( beta, beta, beta, 1.0 );
}
