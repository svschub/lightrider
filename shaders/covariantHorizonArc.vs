
uniform float beta;
uniform float gamma;

uniform vec3 horizonArcColor;

varying vec3 vColor;

void main() {
    vColor = horizonArcColor;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_Position  = projectionMatrix * mvPosition;
}
