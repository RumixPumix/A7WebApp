#!/bin/bash

# Check if the Minecraft version was provided
if [ -z "$1" ]; then
    echo "Usage: $0 <minecraft_version> <output_path>"
    exit 1
fi

# Check if the output path was provided
if [ -z "$2" ]; then
    echo "Usage: $0 <minecraft_version> <output_path>"
    exit 1
fi

PROJECT="paper"
MINECRAFT_VERSION="$1"
OUTPUT_PATH="$2"

# Make sure the output path exists
if [ ! -d "$OUTPUT_PATH" ]; then
    echo "Error: Output path '$OUTPUT_PATH' does not exist."
    exit 1
fi

LATEST_BUILD=$(curl -s "https://api.papermc.io/v2/projects/${PROJECT}/versions/${MINECRAFT_VERSION}/builds" | \
    jq -r '.builds | map(select(.channel == "default") | .build) | .[-1]')

if [ "$LATEST_BUILD" != "null" ]; then
    JAR_NAME="${PROJECT}-${MINECRAFT_VERSION}-${LATEST_BUILD}.jar"
    PAPERMC_URL="https://api.papermc.io/v2/projects/${PROJECT}/versions/${MINECRAFT_VERSION}/builds/${LATEST_BUILD}/downloads/${JAR_NAME}"

    # Download the latest Paper version
    curl -o "${OUTPUT_PATH}/server.jar" "$PAPERMC_URL"
    echo "Download completed for Minecraft version $MINECRAFT_VERSION, build $LATEST_BUILD."
else
    echo "No stable build for version $MINECRAFT_VERSION found :("
fi
