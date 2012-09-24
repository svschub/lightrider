
uniform int isBoostEnabled;
uniform int isDopplerEffectEnabled;

uniform float beta;
uniform float gamma;

uniform float tanObserverViewConeAngle;
uniform sampler2D dopplerShift;
uniform sampler2D dopplerMap;
uniform vec4 rgbmin;
uniform vec4 rgbrange;

uniform float opacity;

varying vec4 vertexPosition;

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
            texelColor.rgb *= texelColor.rgb;
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
                gl_FragColor.rgb *= vLightFront;
            else
                gl_FragColor.rgb *= vLightBack;
        #else
            gl_FragColor.rgb *= vLightFront;
        #endif
    #endif

    #ifdef USE_COLOR
        gl_FragColor = gl_FragColor * vec4( vColor, opacity );
    #endif    
    
    #ifdef GAMMA_OUTPUT
        gl_FragColor.rgb = sqrt( gl_FragColor.rgb );
    #endif

    if ( (isBoostEnabled > 0) && (isDopplerEffectEnabled > 0) ) {
        vec4 col = vec4(0.0, 0.0, 0.0, 1.0);
        vec4 rescaled_col = vec4(0.0, 0.0, 0.0, 1.0);

        // get normalized Doppler shift parameter by lookup:
        float radius = length( vertexPosition.xy );
        float ratio = abs( radius/(vertexPosition.z*tanObserverViewConeAngle) );
        vec2 uvVec = vec2(ratio, 0);    
        vec4 shiftVec = texture2D( dopplerShift, uvVec );
        uvVec.s = shiftVec.r;

        // shift red channel:
        uvVec.t = 0.25;
        rescaled_col = rgbrange * texture2D( dopplerMap, uvVec ) + rgbmin;
        col += gl_FragColor.r * rescaled_col;

        // shift green channel:
        uvVec.t = 0.5;
        rescaled_col = rgbrange * texture2D( dopplerMap, uvVec ) + rgbmin;
        col += gl_FragColor.g * rescaled_col;

        // shift blue channel:
        uvVec.t = 0.75;
        rescaled_col = rgbrange * texture2D( dopplerMap, uvVec ) + rgbmin;
        col += gl_FragColor.b * rescaled_col;
        
        col.rgb = clamp( col.rgb, 0.0, 1.0 );
        col.a = 1.0;
        
        gl_FragColor = col;
    }
}
