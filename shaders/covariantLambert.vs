
uniform int isBoostEnabled;

uniform float beta;
uniform float gamma;

varying vec4 vertexPosition;

varying vec3 vLightFront;

#ifdef DOUBLE_SIDED
    varying vec3 vLightBack;
#endif

#ifdef USE_MAP
    varying vec2 vUv;
    uniform vec4 offsetRepeat;
#endif

uniform vec3 ambient;
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 ambientLightColor;

#if MAX_DIR_LIGHTS > 0
    uniform vec3 directionalLightColor[ MAX_DIR_LIGHTS ];
    uniform vec3 directionalLightDirection[ MAX_DIR_LIGHTS ];
#endif

#if MAX_POINT_LIGHTS > 0
    uniform vec3 pointLightColor[ MAX_POINT_LIGHTS ];
    uniform vec3 pointLightPosition[ MAX_POINT_LIGHTS ];
    uniform float pointLightDistance[ MAX_POINT_LIGHTS ];
#endif

#if MAX_SPOT_LIGHTS > 0
    uniform vec3 spotLightColor[ MAX_SPOT_LIGHTS ];
    uniform vec3 spotLightPosition[ MAX_SPOT_LIGHTS ];
    uniform vec3 spotLightDirection[ MAX_SPOT_LIGHTS ];
    uniform float spotLightDistance[ MAX_SPOT_LIGHTS ];
    uniform float spotLightAngle[ MAX_SPOT_LIGHTS ];
    uniform float spotLightExponent[ MAX_SPOT_LIGHTS ];
#endif

#ifdef WRAP_AROUND
    uniform vec3 wrapRGB;
#endif

#ifdef USE_COLOR
    varying vec3 vColor;
#endif

#ifdef USE_SKINNING
    uniform mat4 boneGlobalMatrices[ MAX_BONES ];
#endif

#ifdef USE_MORPHTARGETS
    #ifndef USE_MORPHNORMALS
        uniform float morphTargetInfluences[ 8 ];
    #else
        uniform float morphTargetInfluences[ 4 ];
    #endif
#endif

vec4 boostedVertexPosition(in vec4 mvPosition) {
	vec4 boostedVertex = mvPosition;
	
    if (isBoostEnabled != 0) { 
		boostedVertex.z = gamma*( mvPosition.z - beta * length( mvPosition.xyz ) );
	}
	return boostedVertex;
}

void main() {
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

	#ifdef USE_MAP
        vUv = uv * offsetRepeat.zw + offsetRepeat.xy;
    #endif

	#ifdef USE_COLOR
        #ifdef GAMMA_INPUT
            vColor = color * color;
        #else
            vColor = color;
        #endif
    #endif

	#ifdef USE_MORPHNORMALS
        vec3 morphedNormal = vec3( 0.0 );
        morphedNormal +=  ( morphNormal0 - normal ) * morphTargetInfluences[ 0 ];
        morphedNormal +=  ( morphNormal1 - normal ) * morphTargetInfluences[ 1 ];
        morphedNormal +=  ( morphNormal2 - normal ) * morphTargetInfluences[ 2 ];
        morphedNormal +=  ( morphNormal3 - normal ) * morphTargetInfluences[ 3 ];
        morphedNormal += normal;
        vec3 transformedNormal = normalMatrix * morphedNormal;
    #else
        vec3 transformedNormal = normalMatrix * normal;
    #endif

	#ifndef USE_ENVMAP
        vec4 mPosition = objectMatrix * vec4( position, 1.0 );
    #endif

	vLightFront = vec3( 0.0 );
    #ifdef DOUBLE_SIDED
        vLightBack = vec3( 0.0 );
    #endif

    transformedNormal = normalize( transformedNormal );

    #if MAX_DIR_LIGHTS > 0
        for( int i = 0; i < MAX_DIR_LIGHTS; i ++ ) {
            vec4 lDirection = viewMatrix * vec4( directionalLightDirection[ i ], 0.0 );
            vec3 dirVector = normalize( lDirection.xyz );
            float dotProduct = dot( transformedNormal, dirVector );
            vec3 directionalLightWeighting = vec3( max( dotProduct, 0.0 ) );

            #ifdef DOUBLE_SIDED
                vec3 directionalLightWeightingBack = vec3( max( -dotProduct, 0.0 ) );
                #ifdef WRAP_AROUND
                    vec3 directionalLightWeightingHalfBack = vec3( max( -0.5 * dotProduct + 0.5, 0.0 ) );
                #endif
            #endif

            #ifdef WRAP_AROUND
                vec3 directionalLightWeightingHalf = vec3( max( 0.5 * dotProduct + 0.5, 0.0 ) );
                directionalLightWeighting = mix( directionalLightWeighting, directionalLightWeightingHalf, wrapRGB );

				#ifdef DOUBLE_SIDED
                    directionalLightWeightingBack = mix( directionalLightWeightingBack, directionalLightWeightingHalfBack, wrapRGB );
                #endif
            #endif

			vLightFront += directionalLightColor[ i ] * directionalLightWeighting;
			#ifdef DOUBLE_SIDED
                 vLightBack += directionalLightColor[ i ] * directionalLightWeightingBack;
            #endif
        }
    #endif

	#if MAX_POINT_LIGHTS > 0
        for( int i = 0; i < MAX_POINT_LIGHTS; i ++ ) {
            vec4 lPosition = viewMatrix * vec4( pointLightPosition[ i ], 1.0 );
            vec3 lVector = lPosition.xyz - mvPosition.xyz;
            float lDistance = 1.0;
            if ( pointLightDistance[ i ] > 0.0 ) {
                lDistance = 1.0 - min( ( length( lVector ) / pointLightDistance[ i ] ), 1.0 );
			}
            lVector = normalize( lVector );
            float dotProduct = dot( transformedNormal, lVector );
            vec3 pointLightWeighting = vec3( max( dotProduct, 0.0 ) );

			#ifdef DOUBLE_SIDED
                vec3 pointLightWeightingBack = vec3( max( -dotProduct, 0.0 ) );
                #ifdef WRAP_AROUND
                    vec3 pointLightWeightingHalfBack = vec3( max( -0.5 * dotProduct + 0.5, 0.0 ) );
                #endif
            #endif

			#ifdef WRAP_AROUND
                vec3 pointLightWeightingHalf = vec3( max( 0.5 * dotProduct + 0.5, 0.0 ) );
                pointLightWeighting = mix( pointLightWeighting, pointLightWeightingHalf, wrapRGB );
                #ifdef DOUBLE_SIDED
                    pointLightWeightingBack = mix( pointLightWeightingBack, pointLightWeightingHalfBack, wrapRGB );
                #endif
            #endif

			vLightFront += pointLightColor[ i ] * pointLightWeighting * lDistance;
			#ifdef DOUBLE_SIDED
                vLightBack += pointLightColor[ i ] * pointLightWeightingBack * lDistance;
            #endif
        }
	#endif

	#if MAX_SPOT_LIGHTS > 0
        for( int i = 0; i < MAX_SPOT_LIGHTS; i ++ ) {
            vec4 lPosition = viewMatrix * vec4( spotLightPosition[ i ], 1.0 );
            vec3 lVector = lPosition.xyz - mvPosition.xyz;
            lVector = normalize( lVector );
            float spotEffect = dot( spotLightDirection[ i ], normalize( spotLightPosition[ i ] - mPosition.xyz ) );
            if ( spotEffect > spotLightAngle[ i ] ) {
                spotEffect = pow( spotEffect, spotLightExponent[ i ] );
                float lDistance = 1.0;
                if ( spotLightDistance[ i ] > 0.0 ) {
                    lDistance = 1.0 - min( ( length( lVector ) / spotLightDistance[ i ] ), 1.0 );
				}
                float dotProduct = dot( transformedNormal, lVector );
                vec3 spotLightWeighting = vec3( max( dotProduct, 0.0 ) );

                #ifdef DOUBLE_SIDED
                    vec3 spotLightWeightingBack = vec3( max( -dotProduct, 0.0 ) );
                    #ifdef WRAP_AROUND
 			            vec3 spotLightWeightingHalfBack = vec3( max( -0.5 * dotProduct + 0.5, 0.0 ) );
                    #endif
                #endif

				#ifdef WRAP_AROUND
                    vec3 spotLightWeightingHalf = vec3( max( 0.5 * dotProduct + 0.5, 0.0 ) );
                    spotLightWeighting = mix( spotLightWeighting, spotLightWeightingHalf, wrapRGB );
                    #ifdef DOUBLE_SIDED
                        spotLightWeightingBack = mix( spotLightWeightingBack, spotLightWeightingHalfBack, wrapRGB );
                    #endif
                #endif

                vLightFront += spotLightColor[ i ] * spotLightWeighting * lDistance * spotEffect;
                #ifdef DOUBLE_SIDED
                    vLightBack += spotLightColor[ i ] * spotLightWeightingBack * lDistance * spotEffect;
                #endif
            }
        }
    #endif

	vLightFront = vLightFront * diffuse + ambient * ambientLightColor + emissive;
    #ifdef DOUBLE_SIDED
        vLightBack = vLightBack * diffuse + ambient * ambientLightColor + emissive;
    #endif

    #ifdef USE_SKINNING
        vertexPosition = ( boneGlobalMatrices[ int( skinIndex.x ) ] * skinVertexA ) * skinWeight.x;
        vertexPosition += ( boneGlobalMatrices[ int( skinIndex.y ) ] * skinVertexB ) * skinWeight.y;
        vertexPosition = boostedVertexPosition( modelViewMatrix * vertexPosition );
    #endif

	#ifdef USE_MORPHTARGETS
        vec3 morphed = vec3( 0.0 );
        morphed += ( morphTarget0 - position ) * morphTargetInfluences[ 0 ];
        morphed += ( morphTarget1 - position ) * morphTargetInfluences[ 1 ];
        morphed += ( morphTarget2 - position ) * morphTargetInfluences[ 2 ];
        morphed += ( morphTarget3 - position ) * morphTargetInfluences[ 3 ];
        #ifndef USE_MORPHNORMALS
            morphed += ( morphTarget4 - position ) * morphTargetInfluences[ 4 ];
            morphed += ( morphTarget5 - position ) * morphTargetInfluences[ 5 ];
            morphed += ( morphTarget6 - position ) * morphTargetInfluences[ 6 ];
            morphed += ( morphTarget7 - position ) * morphTargetInfluences[ 7 ];
        #endif
        morphed += position;
		vertexPosition = boostedVertexPosition( modelViewMatrix * vec4( morphed, 1.0 ) );
    #endif  // #else, #elif

    #ifndef USE_MORPHTARGETS
        #ifndef USE_SKINNING
			vertexPosition = boostedVertexPosition( mvPosition );
        #endif
    #endif
	
	gl_Position = projectionMatrix * vertexPosition;
}
