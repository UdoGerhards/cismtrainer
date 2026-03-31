#!/usr/bin/env bash
set -e

# === Konfiguration ===
SERVER_USER="udogerhards"
SERVER_HOST="172.16.0.28"

PROJECT="cismtrainer"

VERSION=$(date +"%Y%m%d-%H%M%S")
BUILD_DIR=".deploy-$PROJECT-$VERSION"
ARCHIVE_NAME="$PROJECT-$VERSION.tar.gz"

echo "Starte Deployment (Expo Web)..."
echo "Projekt: $PROJECT"
echo "Version: $VERSION"

# 1. Produktions-Build erstellen
echo "Erzeuge Web-Build..."
npx expo export --platform web

# Ergebnis liegt in dist/
SOURCE_DIR="dist"

# 2. Build-Verzeichnis vorbereiten
rm -rf "$BUILD_DIR"
mkdir "$BUILD_DIR"

# 3. Build-Artefakte kopieren
rsync -av "$SOURCE_DIR/" "$BUILD_DIR/"

# 4. Archiv erstellen
tar -czf "$ARCHIVE_NAME" -C "$BUILD_DIR" .

echo "Übertrage Archiv nach $SERVER_HOST..."
scp "$ARCHIVE_NAME" "$SERVER_USER@$SERVER_HOST:/tmp/"

echo "Führe Remote-Deployment aus..."
ssh "$SERVER_USER@$SERVER_HOST" \
  "sudo /var/www/deploy_remote.sh $PROJECT $VERSION $ARCHIVE_NAME"

# 5. Lokales Cleanup
echo "Bereinige lokale Artefakte..."
rm -rf "$BUILD_DIR"
rm -f "$ARCHIVE_NAME"

echo "Deployment abgeschlossen!"