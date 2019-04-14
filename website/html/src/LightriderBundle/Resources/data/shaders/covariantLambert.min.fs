uniform int isBoostEnabled;uniform int isDopplerEffectEnabled;uniform float beta;uniform float gamma;uniform float tanObserverViewConeAngle;uniform sampler2D dopplerShift;uniform sampler2D dopplerMap;uniform vec4 rgbmin;uniform vec4 rgbrange;varying vec4 vertexPosition;uniform float opacity;varying vec3 vLightFront;
#ifdef DOUBLE_SIDED
varying vec3 vLightBack;
#endif

#ifdef USE_COLOR
varying vec3 vColor;
#endif

#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP )
varying vec2 vUv;
#endif

#ifdef USE_MAP
uniform sampler2D map;
#endif

#ifdef USE_LIGHTMAP
varying vec2 vUv2;uniform sampler2D lightMap;
#endif

#ifdef USE_ENVMAP
uniform float reflectivity;uniform samplerCube envMap;uniform float flipEnvMap;uniform int combine;
#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP )
uniform bool useRefract;uniform float refractionRatio;
#else
varying vec3 vReflect;
#endif

#endif

#ifdef USE_FOG
uniform vec3 fogColor;
#ifdef FOG_EXP2
uniform float fogDensity;
#else
uniform float fogNear;uniform float fogFar;
#endif

#endif

#ifdef USE_SHADOWMAP
uniform sampler2D shadowMap[MAX_SHADOWS];uniform vec2 shadowMapSize[MAX_SHADOWS];uniform float shadowDarkness[MAX_SHADOWS];uniform float shadowBias[MAX_SHADOWS];varying vec4 vShadowCoord[MAX_SHADOWS];float a(const in vec4 b){const vec4 c=vec4(1.0/(256.0*256.0*256.0),1.0/(256.0*256.0),1.0/256.0,1.0);float d=dot(b,c);return d;}
#endif

#ifdef USE_SPECULARMAP
uniform sampler2D specularMap;
#endif
void main(){gl_FragColor=vec4(vec3(1.0),opacity);
#ifdef USE_MAP
vec4 e=texture2D(map,vUv);
#ifdef GAMMA_INPUT
e.xyz*=e.xyz;
#endif
gl_FragColor=gl_FragColor*e;
#endif
#ifdef ALPHATEST
if(gl_FragColor.a<ALPHATEST) discard;
#endif
float f;
#ifdef USE_SPECULARMAP
vec4 g=texture2D(specularMap,vUv);f=g.r;
#else
f=1.0;
#endif
#ifdef DOUBLE_SIDED
if(gl_FrontFacing) gl_FragColor.xyz*=vLightFront;else gl_FragColor.xyz*=vLightBack;
#else
gl_FragColor.xyz*=vLightFront;
#endif
#ifdef USE_LIGHTMAP
gl_FragColor=gl_FragColor*texture2D(lightMap,vUv2);
#endif
#ifdef USE_COLOR
gl_FragColor=gl_FragColor*vec4(vColor,1.0);
#endif
#ifdef USE_ENVMAP
vec3 h;
#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP )
vec3 i=normalize(vWorldPosition-cameraPosition);if(useRefract){h=refract(i,normal,refractionRatio);}else{h=reflect(i,normal);}
#else
h=vReflect;
#endif
#ifdef DOUBLE_SIDED
float j=(-1.0+2.0*float(gl_FrontFacing));vec4 k=textureCube(envMap,j*vec3(flipEnvMap*h.x,h.yz));
#else
vec4 k=textureCube(envMap,vec3(flipEnvMap*h.x,h.yz));
#endif
#ifdef GAMMA_INPUT
k.xyz*=k.xyz;
#endif
if(combine==1){gl_FragColor.xyz=mix(gl_FragColor.xyz,k.xyz,f*reflectivity);}else if(combine==2){gl_FragColor.xyz+=k.xyz*f*reflectivity;}else{gl_FragColor.xyz=mix(gl_FragColor.xyz,gl_FragColor.xyz*k.xyz,f*reflectivity);}
#endif
#ifdef USE_SHADOWMAP
#ifdef SHADOWMAP_DEBUG
vec3 l[3];l[0]=vec3(1.0,0.5,0.0);l[1]=vec3(0.0,1.0,0.8);l[2]=vec3(0.0,0.5,1.0);
#endif
#ifdef SHADOWMAP_CASCADE
int m=0;
#endif
float n;vec3 o=vec3(1.0);for(int p=0;p<MAX_SHADOWS;p++){vec3 q=vShadowCoord[p].xyz/vShadowCoord[p].w;bvec4 r=bvec4(q.x>=0.0,q.x<=1.0,q.y>=0.0,q.y<=1.0);bool s=all(r);
#ifdef SHADOWMAP_CASCADE
m+=int(s);bvec3 t=bvec3(s,m==1,q.z<=1.0);
#else
bvec2 t=bvec2(s,q.z<=1.0);
#endif
bool u=all(t);if(u){q.z+=shadowBias[p];
#if defined( SHADOWMAP_TYPE_PCF )
float v=0.0;const float w=1.0/9.0;float x=1.0/shadowMapSize[p].x;float y=1.0/shadowMapSize[p].y;float z=-1.25*x;float A=-1.25*y;float B=1.25*x;float C=1.25*y;n=a(texture2D(shadowMap[p],q.xy+vec2(z,A)));if(n<q.z) v+=w;n=a(texture2D(shadowMap[p],q.xy+vec2(0.0,A)));if(n<q.z) v+=w;n=a(texture2D(shadowMap[p],q.xy+vec2(B,A)));if(n<q.z) v+=w;n=a(texture2D(shadowMap[p],q.xy+vec2(z,0.0)));if(n<q.z) v+=w;n=a(texture2D(shadowMap[p],q.xy));if(n<q.z) v+=w;n=a(texture2D(shadowMap[p],q.xy+vec2(B,0.0)));if(n<q.z) v+=w;n=a(texture2D(shadowMap[p],q.xy+vec2(z,C)));if(n<q.z) v+=w;n=a(texture2D(shadowMap[p],q.xy+vec2(0.0,C)));if(n<q.z) v+=w;n=a(texture2D(shadowMap[p],q.xy+vec2(B,C)));if(n<q.z) v+=w;o=o*vec3((1.0-shadowDarkness[p]*v));
#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
float v=0.0;float x=1.0/shadowMapSize[p].x;float y=1.0/shadowMapSize[p].y;float z=-1.0*x;float A=-1.0*y;float B=1.0*x;float C=1.0*y;mat3 D;mat3 E;E[0][0]=a(texture2D(shadowMap[p],q.xy+vec2(z,A)));E[0][1]=a(texture2D(shadowMap[p],q.xy+vec2(z,0.0)));E[0][2]=a(texture2D(shadowMap[p],q.xy+vec2(z,C)));E[1][0]=a(texture2D(shadowMap[p],q.xy+vec2(0.0,A)));E[1][1]=a(texture2D(shadowMap[p],q.xy));E[1][2]=a(texture2D(shadowMap[p],q.xy+vec2(0.0,C)));E[2][0]=a(texture2D(shadowMap[p],q.xy+vec2(B,A)));E[2][1]=a(texture2D(shadowMap[p],q.xy+vec2(B,0.0)));E[2][2]=a(texture2D(shadowMap[p],q.xy+vec2(B,C)));vec3 F=vec3(q.z);D[0]=vec3(lessThan(E[0],F));D[0]*=vec3(0.25);D[1]=vec3(lessThan(E[1],F));D[1]*=vec3(0.25);D[2]=vec3(lessThan(E[2],F));D[2]*=vec3(0.25);vec2 G=1.0-fract(q.xy*shadowMapSize[p].xy);D[0]=mix(D[1],D[0],G.x);D[1]=mix(D[2],D[1],G.x);vec4 H;H.x=mix(D[0][1],D[0][0],G.y);H.y=mix(D[0][2],D[0][1],G.y);H.z=mix(D[1][1],D[1][0],G.y);H.w=mix(D[1][2],D[1][1],G.y);v=dot(H,vec4(1.0));o=o*vec3((1.0-shadowDarkness[p]*v));
#else
vec4 I=texture2D(shadowMap[p],q.xy);float n=a(I);if(n<q.z) o=o*vec3(1.0-shadowDarkness[p]);
#endif
}
#ifdef SHADOWMAP_DEBUG
#ifdef SHADOWMAP_CASCADE
if(s&&m==1) gl_FragColor.xyz*=l[p];
#else
if(s) gl_FragColor.xyz*=l[p];
#endif
#endif
}
#ifdef GAMMA_OUTPUT
o*=o;
#endif
gl_FragColor.xyz=gl_FragColor.xyz*o;
#endif
#ifdef GAMMA_OUTPUT
gl_FragColor.xyz=sqrt(gl_FragColor.xyz);
#endif
#ifdef USE_FOG
float d=gl_FragCoord.z/gl_FragCoord.w;
#ifdef FOG_EXP2
const float J=1.442695;float K=exp2(-fogDensity*fogDensity*d*d*J);K=1.0-clamp(K,0.0,1.0);
#else
float K=smoothstep(fogNear,fogFar,d);
#endif
gl_FragColor=mix(gl_FragColor,vec4(fogColor,gl_FragColor.w),K);
#endif
if((isBoostEnabled>0)&&(isDopplerEffectEnabled>0)){vec4 L=vec4(0.0,0.0,0.0,1.0);vec4 M=vec4(0.0,0.0,0.0,1.0);float N=length(vertexPosition.xy);float O=abs(N/(vertexPosition.z*tanObserverViewConeAngle));vec2 P=vec2(O,0);vec4 Q=texture2D(dopplerShift,P);P.s=Q.r;P.t=0.75;M=rgbrange*texture2D(dopplerMap,P)+rgbmin;L+=gl_FragColor.r*M;P.t=0.5;M=rgbrange*texture2D(dopplerMap,P)+rgbmin;L+=gl_FragColor.g*M;P.t=0.25;M=rgbrange*texture2D(dopplerMap,P)+rgbmin;L+=gl_FragColor.b*M;L.rgb=clamp(L.rgb,0.0,1.0);L.a=1.0;gl_FragColor=L;}}