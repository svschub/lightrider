
uniform float beta;
uniform float gamma;

uniform vec3 horizonBackgroundColor;

varying vec3 vColor;

void main() {
    gl_FragColor = vec4( vColor, 1.0 );
}
