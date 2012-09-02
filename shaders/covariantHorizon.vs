
uniform float beta;
uniform float gamma;

#ifdef HORIZON_ARC
    uniform vec3 horizonArcColor;
#endif

#ifdef HORIZON_BACKGROUND
    uniform vec3 horizonBackgroundColor;
#endif

varying vec3 vColor;

void main() {
    #ifdef HORIZON_ARC
        vColor = horizonArcColor;
    #endif

    #ifdef HORIZON_BACKGROUND
        vColor = horizonBackgroundColor;
    #endif

    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_Position  = projectionMatrix * mvPosition;
}
