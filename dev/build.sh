#!/bin/bash

BUILDENV_IMAGE="lightrider-buildenv:1.0"

if [ "$(docker images -q "$BUILDENV_IMAGE")" = "" ] || [ "$1" = "--force" ]; then
   docker build -t "$BUILDENV_IMAGE" "$(dirname "$0")/buildenv-image" 
fi

if [ "$1" = "--force" ]; then
   shift
fi

docker run \
  --rm -it \
  -u $(id -u):$(id -g) \
  -v "$PWD":/host \
  -v /tmp/.X11-unix:/tmp/.X11-unix \
  -e DISPLAY="$DISPLAY" \
  "$BUILDENV_IMAGE" \
  "$@"
