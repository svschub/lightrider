
uniform int boostEnabled;
uniform float beta;
uniform float gamma;

uniform float opacity;

varying vec3 vLightFront;

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

	#ifndef HORIZON
		#ifdef DOUBLE_SIDED
			if ( gl_FrontFacing )
				gl_FragColor.xyz *= vLightFront;
			else
				gl_FragColor.xyz *= vLightBack;
		#else
			gl_FragColor.xyz *= vLightFront;
		#endif
    #endif

	#ifdef USE_COLOR
		gl_FragColor = gl_FragColor * vec4( vColor, opacity );
	#endif	
	
	#ifdef GAMMA_OUTPUT
        gl_FragColor.xyz = sqrt( gl_FragColor.xyz );
    #endif

//  TODO: if boostEnabled: modify gl_FragColor according to Doppler effect
}
