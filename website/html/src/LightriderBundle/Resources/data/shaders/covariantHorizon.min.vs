uniform float beta;uniform float gamma;varying vec4 vertexPosition;varying vec3 vLightFront;varying vec3 vLightBack;varying vec3 vColor;
#ifdef HORIZON_ARC
uniform vec3 horizonArcColor;
#endif

#ifdef HORIZON_BACKGROUND
uniform vec3 horizonBackgroundColor;
#endif
void main(){
#ifdef HORIZON_ARC
vColor=horizonArcColor;
#endif
#ifdef HORIZON_BACKGROUND
vColor=horizonBackgroundColor;
#endif
vLightFront=vec3(1.0);vLightBack=vec3(1.0);vertexPosition=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*vertexPosition;}