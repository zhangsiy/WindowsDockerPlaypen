FROM zhangsiy/win-core-dev:0.1.0
# add package folder to container
ARG artifactdir='./output/publishOutput'
ADD $artifactdir ./app
# set up working directory
WORKDIR /app
# setup entry point
ARG executable
ENV ENTRY=$executable
ENTRYPOINT %ENTRY%
