# Discord ipa dumper

Connects to an ios device, downloads discord using ipatool and ideviceinstaller, dumps it, and uploads it to github actions

## Note:

This script assumes you have private key authentication for the phone. You will have to edit the script for password authentication

# Guide

Clone this repo on a computer with an idevice attached. Login to ipatool. The following is a framework .env file

```
IP=
PORT=
SERVER_PORT=
SERVER_HOST=
GITHUB_TOKEN=
GITHUB_REPO=imlvna/vendetta-ipa
```

Ip and port are the ip and port of the phone's ssh server. Server port is the port express listens on. Server host is the domain that github actions will connect to.

I have github actions injecting vendetta into the ipa for security, so people are 100% sure of how and what is being injected.
