#!/bin/bash

echo "Uninstalling old discord"

ideviceinstaller -U com.hammerandchisel.discord

echo "Downloading discord"

ipatool download -b com.hammerandchisel.discord -o discord.ipa

echo "Installing discord"

ideviceinstaller -i discord.ipa

echo "Cleaning up"

rm discord.ipa