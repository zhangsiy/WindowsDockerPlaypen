FROM microsoft/dotnet-framework:4.7
#install chocolatey
RUN @powershell -NoProfile -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"
#install nodejs
RUN choco install -y nodejs --version 8.1.2
# install gulp globally
RUN npm install gulp --global
# add package folder to container
ADD ./output/publishOutput ./app
# set up working directory
WORKDIR /app
# do local gulp install
# RUN npm install
ENTRYPOINT ["TestConsoleApp.exe"]
