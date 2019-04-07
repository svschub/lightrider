FROM ubuntu:16.04

ARG DEBIAN_FRONTEND=noninteractive
ARG MAVEN_CENTRAL_URL=http://repo1.maven.org/maven2

ENV JAVA_HOME /usr/lib/jvm/java-8-openjdk-amd64
ENV SAXON_VERSION 9.9.1-2
ENV SAXON_HOME "/opt/saxon-HE-$SAXON_VERSION"

# Install necessary base packages:
RUN \
  apt-get -q update && \
  apt-get -y -q install --no-install-recommends \
    build-essential \
    default-jre \
    wget \
    curl \
    unzip \
    python python-pip python-dev python-tk

# Install nodejs 11:
RUN \
  curl -sL https://deb.nodesource.com/setup_11.x | bash - && \
  apt-get -y -q install --no-install-recommends nodejs && \
  rm -rf /var/lib/apt/lists/*

# Install Python packages:
RUN \
  pip install --upgrade pip=='9.0.1' && \
  pip install --upgrade setuptools && \
  pip install numpy scipy matplotlib Pillow

# Install minimizer for GLSL shader scripts, JS/CSS and XML:
RUN \
  npm install -g glslmin && \
  npm install -g uglify-js && \
  npm install -g uglifycss && \
  npm install -g minify-xml

# Add Saxon XML/XSLT transformer:
RUN \
  mkdir -p "$SAXON_HOME" && \
  cd "$SAXON_HOME" && \
  wget -q "$MAVEN_CENTRAL_URL/net/sf/saxon/Saxon-HE/$SAXON_VERSION/Saxon-HE-$SAXON_VERSION.jar"

ADD saxon/saxon /usr/local/bin

WORKDIR /host
