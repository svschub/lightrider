
uniform float beta;
uniform float gamma;

uniform vec3 horizonBackgroundColor;

varying vec3 vColor;

void main() {
    vColor = horizonBackgroundColor;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_Position  = projectionMatrix * mvPosition;
}
