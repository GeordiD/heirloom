#!/bin/bash

# Script to backup production database to a local file
# This script is read-only on production - it only creates a backup

set -e  # Exit on error

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load .env.production if it exists
if [ -f "$PROJECT_ROOT/.env.production" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env.production" | xargs)
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backup directory - create if it doesn't exist
BACKUP_DIR="$PROJECT_ROOT/backups"
mkdir -p "$BACKUP_DIR"

# Backup file with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/prod_backup_$TIMESTAMP.sql"

echo -e "${YELLOW}=== Production Database Backup Script ===${NC}"
echo "This script will create a backup of the production database."
echo ""

# Check if production DATABASE_URL is set
if [ -z "$PROD_DATABASE_URL" ]; then
    echo -e "${RED}Error: PROD_DATABASE_URL environment variable is not set${NC}"
    echo ""
    echo "Please set it before running this script:"
    echo "  Option 1: export PROD_DATABASE_URL='postgresql://user:pass@host:port/dbname'"
    echo "  Option 2: Create .env.production file with PROD_DATABASE_URL"
    echo ""
    exit 1
fi

# Clean the production URL by removing non-standard query parameters
# pg_dump only supports standard libpq parameters
CLEAN_PROD_URL=$(echo "$PROD_DATABASE_URL" | sed -E 's/([?&])(statusColor|[^=&]*Color)[^&]*(&|$)/\1/g' | sed 's/[?&]$//')
echo -e "${YELLOW}Using production database URL...${NC}"
echo -e "${YELLOW}Backup will be saved to: $BACKUP_FILE${NC}"
echo ""

# Dump production database using Docker
echo -e "${YELLOW}Creating backup of production database...${NC}"
if docker run --rm \
    postgres:17 \
    pg_dump "$CLEAN_PROD_URL" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists > "$BACKUP_FILE"; then
    echo -e "${GREEN}✓ Production backup created successfully${NC}"
else
    echo -e "${RED}✗ Failed to backup production database${NC}"
    exit 1
fi

# Get file size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

echo ""
echo -e "${GREEN}=== Backup Complete ===${NC}"
echo "Backup file: $BACKUP_FILE"
echo "File size: $BACKUP_SIZE"
echo "Production database was not modified (read-only operation)."
echo ""
echo "To restore this backup to local, you can use:"
echo "  docker exec -i -u postgres anise_postgres psql -U anise_user -d anise_db < $BACKUP_FILE"
