
#define LAMBERT
uniform int isBoostEnabled;uniform float beta;uniform float gamma;varying vec4 vertexPosition;vec4 a(in vec4 b){vec4 c=b;if(isBoostEnabled!=0){c.z=gamma*(b.z-beta*length(b.xyz));}return c;}varying vec3 vLightFront;
#ifdef DOUBLE_SIDED
varying vec3 vLightBack;
#endif

#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP )
varying vec2 vUv;uniform vec4 offsetRepeat;
#endif

#ifdef USE_LIGHTMAP
varying vec2 vUv2;
#endif

#if defined( USE_ENVMAP ) && ! defined( USE_BUMPMAP ) && ! defined( USE_NORMALMAP )
varying vec3 vReflect;uniform float refractionRatio;uniform bool useRefract;
#endif
uniform vec3 ambient;uniform vec3 diffuse;uniform vec3 emissive;uniform vec3 ambientLightColor;
#if MAX_DIR_LIGHTS > 0
uniform vec3 directionalLightColor[MAX_DIR_LIGHTS];uniform vec3 directionalLightDirection[MAX_DIR_LIGHTS];
#endif

#if MAX_HEMI_LIGHTS > 0
uniform vec3 hemisphereLightSkyColor[MAX_HEMI_LIGHTS];uniform vec3 hemisphereLightGroundColor[MAX_HEMI_LIGHTS];uniform vec3 hemisphereLightDirection[MAX_HEMI_LIGHTS];
#endif

#if MAX_POINT_LIGHTS > 0
uniform vec3 pointLightColor[MAX_POINT_LIGHTS];uniform vec3 pointLightPosition[MAX_POINT_LIGHTS];uniform float pointLightDistance[MAX_POINT_LIGHTS];
#endif

#if MAX_SPOT_LIGHTS > 0
uniform vec3 spotLightColor[MAX_SPOT_LIGHTS];uniform vec3 spotLightPosition[MAX_SPOT_LIGHTS];uniform vec3 spotLightDirection[MAX_SPOT_LIGHTS];uniform float spotLightDistance[MAX_SPOT_LIGHTS];uniform float spotLightAngleCos[MAX_SPOT_LIGHTS];uniform float spotLightExponent[MAX_SPOT_LIGHTS];
#endif

#ifdef WRAP_AROUND
uniform vec3 wrapRGB;
#endif

#ifdef USE_COLOR
varying vec3 vColor;
#endif

#ifdef USE_MORPHTARGETS

#ifndef USE_MORPHNORMALS
uniform float morphTargetInfluences[8];
#else
uniform float morphTargetInfluences[4];
#endif

#endif

#ifdef USE_SKINNING

#ifdef BONE_TEXTURE
uniform sampler2D boneTexture;uniform int boneTextureWidth;uniform int boneTextureHeight;mat4 d(const in float e){float f=e*4.0;float g=mod(f,float(boneTextureWidth));float h=floor(f/float(boneTextureWidth));float i=1.0/float(boneTextureWidth);float j=1.0/float(boneTextureHeight);h=j*(h+0.5);vec4 k=texture2D(boneTexture,vec2(i*(g+0.5),h));vec4 l=texture2D(boneTexture,vec2(i*(g+1.5),h));vec4 m=texture2D(boneTexture,vec2(i*(g+2.5),h));vec4 n=texture2D(boneTexture,vec2(i*(g+3.5),h));mat4 o=mat4(k,l,m,n);return o;}
#else
uniform mat4 boneGlobalMatrices[MAX_BONES];mat4 d(const in float e){mat4 o=boneGlobalMatrices[int(e)];return o;}
#endif

#endif

#ifdef USE_SHADOWMAP
varying vec4 vShadowCoord[MAX_SHADOWS];uniform mat4 shadowMatrix[MAX_SHADOWS];
#endif
void main(){
#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP )
vUv=uv*offsetRepeat.zw+offsetRepeat.xy;
#endif
#ifdef USE_LIGHTMAP
vUv2=uv2;
#endif
#ifdef USE_COLOR
#ifdef GAMMA_INPUT
vColor=color*color;
#else
vColor=color;
#endif
#endif
#ifdef USE_MORPHNORMALS
vec3 p=vec3(0.0);p+=(morphNormal0-normal)*morphTargetInfluences[0];p+=(morphNormal1-normal)*morphTargetInfluences[1];p+=(morphNormal2-normal)*morphTargetInfluences[2];p+=(morphNormal3-normal)*morphTargetInfluences[3];p+=normal;
#endif
#ifdef USE_SKINNING
mat4 q=d(skinIndex.x);mat4 r=d(skinIndex.y);
#endif
#ifdef USE_SKINNING
mat4 s=skinWeight.x*q;s+=skinWeight.y*r;
#ifdef USE_MORPHNORMALS
vec4 t=s*vec4(p,0.0);
#else
vec4 t=s*vec4(normal,0.0);
#endif
#endif
vec3 u;
#ifdef USE_SKINNING
u=t.xyz;
#endif
#if !defined( USE_SKINNING ) && defined( USE_MORPHNORMALS )  
u=p;
#endif
#if !defined( USE_SKINNING ) && ! defined( USE_MORPHNORMALS )
u=normal;
#endif
#ifdef FLIP_SIDED
u=-u;
#endif
vec3 v=normalMatrix*u;
#ifdef USE_MORPHTARGETS
vec3 w=vec3(0.0);w+=(morphTarget0-position)*morphTargetInfluences[0];w+=(morphTarget1-position)*morphTargetInfluences[1];w+=(morphTarget2-position)*morphTargetInfluences[2];w+=(morphTarget3-position)*morphTargetInfluences[3];
#ifndef USE_MORPHNORMALS
w+=(morphTarget4-position)*morphTargetInfluences[4];w+=(morphTarget5-position)*morphTargetInfluences[5];w+=(morphTarget6-position)*morphTargetInfluences[6];w+=(morphTarget7-position)*morphTargetInfluences[7];
#endif
w+=position;
#endif
#ifdef USE_SKINNING
#ifdef USE_MORPHTARGETS
vec4 x=vec4(w,1.0);
#else
vec4 x=vec4(position,1.0);
#endif
vec4 y=q*x*skinWeight.x;y+=r*x*skinWeight.y;
#endif
vec4 b;
#ifdef USE_SKINNING
b=modelViewMatrix*y;
#endif
#if !defined( USE_SKINNING ) && defined( USE_MORPHTARGETS )
b=modelViewMatrix*vec4(w,1.0);
#endif
#if !defined( USE_SKINNING ) && ! defined( USE_MORPHTARGETS )
b=modelViewMatrix*vec4(position,1.0);
#endif
vertexPosition=a(b);gl_Position=projectionMatrix*vertexPosition;
#if defined( USE_ENVMAP ) || defined( PHONG ) || defined( LAMBERT ) || defined ( USE_SHADOWMAP )
#ifdef USE_SKINNING
vec4 z=modelMatrix*y;
#endif
#if defined( USE_MORPHTARGETS ) && ! defined( USE_SKINNING )
vec4 z=modelMatrix*vec4(w,1.0);
#endif
#if ! defined( USE_MORPHTARGETS ) && ! defined( USE_SKINNING )
vec4 z=modelMatrix*vec4(position,1.0);
#endif
#endif
#if defined( USE_ENVMAP ) && ! defined( USE_BUMPMAP ) && ! defined( USE_NORMALMAP )
vec3 A=mat3(modelMatrix[0].xyz,modelMatrix[1].xyz,modelMatrix[2].xyz)*u;A=normalize(A);vec3 B=normalize(z.xyz-cameraPosition);if(useRefract){vReflect=refract(B,A,refractionRatio);}else{vReflect=reflect(B,A);}
#endif
vLightFront=vec3(0.0);
#ifdef DOUBLE_SIDED
vLightBack=vec3(0.0);
#endif
v=normalize(v);
#if MAX_DIR_LIGHTS > 0
for(int e=0;e<MAX_DIR_LIGHTS;e++){vec4 C=viewMatrix*vec4(directionalLightDirection[e],0.0);vec3 D=normalize(C.xyz);float E=dot(v,D);vec3 F=vec3(max(E,0.0));
#ifdef DOUBLE_SIDED
vec3 G=vec3(max(-E,0.0));
#ifdef WRAP_AROUND
vec3 H=vec3(max(-0.5*E+0.5,0.0));
#endif
#endif
#ifdef WRAP_AROUND
vec3 I=vec3(max(0.5*E+0.5,0.0));F=mix(F,I,wrapRGB);
#ifdef DOUBLE_SIDED
G=mix(G,H,wrapRGB);
#endif
#endif
vLightFront+=directionalLightColor[e]*F;
#ifdef DOUBLE_SIDED
vLightBack+=directionalLightColor[e]*G;
#endif
}
#endif
#if MAX_POINT_LIGHTS > 0
for(int e=0;e<MAX_POINT_LIGHTS;e++){vec4 J=viewMatrix*vec4(pointLightPosition[e],1.0);vec3 K=J.xyz-b.xyz;float L=1.0;if(pointLightDistance[e]>0.0) L=1.0-min((length(K)/pointLightDistance[e]),1.0);K=normalize(K);float E=dot(v,K);vec3 M=vec3(max(E,0.0));
#ifdef DOUBLE_SIDED
vec3 N=vec3(max(-E,0.0));
#ifdef WRAP_AROUND
vec3 O=vec3(max(-0.5*E+0.5,0.0));
#endif
#endif
#ifdef WRAP_AROUND
vec3 P=vec3(max(0.5*E+0.5,0.0));M=mix(M,P,wrapRGB);
#ifdef DOUBLE_SIDED
N=mix(N,O,wrapRGB);
#endif
#endif
vLightFront+=pointLightColor[e]*M*L;
#ifdef DOUBLE_SIDED
vLightBack+=pointLightColor[e]*N*L;
#endif
}
#endif
#if MAX_SPOT_LIGHTS > 0
for(int e=0;e<MAX_SPOT_LIGHTS;e++){vec4 J=viewMatrix*vec4(spotLightPosition[e],1.0);vec3 K=J.xyz-b.xyz;float Q=dot(spotLightDirection[e],normalize(spotLightPosition[e]-z.xyz));if(Q>spotLightAngleCos[e]){Q=max(pow(Q,spotLightExponent[e]),0.0);float L=1.0;if(spotLightDistance[e]>0.0) L=1.0-min((length(K)/spotLightDistance[e]),1.0);K=normalize(K);float E=dot(v,K);vec3 R=vec3(max(E,0.0));
#ifdef DOUBLE_SIDED
vec3 S=vec3(max(-E,0.0));
#ifdef WRAP_AROUND
vec3 T=vec3(max(-0.5*E+0.5,0.0));
#endif
#endif
#ifdef WRAP_AROUND
vec3 U=vec3(max(0.5*E+0.5,0.0));R=mix(R,U,wrapRGB);
#ifdef DOUBLE_SIDED
S=mix(S,T,wrapRGB);
#endif
#endif
vLightFront+=spotLightColor[e]*R*L*Q;
#ifdef DOUBLE_SIDED
vLightBack+=spotLightColor[e]*S*L*Q;
#endif
}}
#endif
#if MAX_HEMI_LIGHTS > 0
for(int e=0;e<MAX_HEMI_LIGHTS;e++){vec4 C=viewMatrix*vec4(hemisphereLightDirection[e],0.0);vec3 K=normalize(C.xyz);float E=dot(v,K);float V=0.5*E+0.5;float W=-0.5*E+0.5;vLightFront+=mix(hemisphereLightGroundColor[e],hemisphereLightSkyColor[e],V);
#ifdef DOUBLE_SIDED
vLightBack+=mix(hemisphereLightGroundColor[e],hemisphereLightSkyColor[e],W);
#endif
}
#endif
vLightFront=vLightFront*diffuse+ambient*ambientLightColor+emissive;
#ifdef DOUBLE_SIDED
vLightBack=vLightBack*diffuse+ambient*ambientLightColor+emissive;
#endif
#ifdef USE_SHADOWMAP
for(int e=0;e<MAX_SHADOWS;e++){vShadowCoord[e]=shadowMatrix[e]*z;}
#endif
}