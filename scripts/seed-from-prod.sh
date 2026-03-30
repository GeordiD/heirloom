#!/bin/bash

# Script to sync production database to local database
# This script is read-only on production and destructive on local

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

# Local database configuration (from .env.example)
LOCAL_DB_USER="anise_user"
LOCAL_DB_NAME="anise_db"
LOCAL_CONTAINER="anise_postgres"

# Temporary dump file
DUMP_FILE="/tmp/anise_prod_dump_$(date +%Y%m%d_%H%M%S).sql"

echo -e "${YELLOW}=== Anise Database Sync Script ===${NC}"
echo "This script will copy production data to your local database."
echo ""
echo -e "${RED}WARNING: This will DESTROY all data in your local database!${NC}"
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

# Confirm with user
read -p "Are you sure you want to proceed? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Sync cancelled."
    exit 0
fi

# Step 1: Dump production database using Docker
echo -e "${YELLOW}Step 1: Dumping production database...${NC}"
if docker run --rm \
    postgres:17 \
    pg_dump "$CLEAN_PROD_URL" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists > "$DUMP_FILE"; then
    echo -e "${GREEN}✓ Production dump created: $DUMP_FILE${NC}"
else
    echo -e "${RED}✗ Failed to dump production database${NC}"
    exit 1
fi

# Step 2: Drop local database and recreate
echo -e "${YELLOW}Step 2: Resetting local database...${NC}"
docker exec -u postgres "$LOCAL_CONTAINER" psql -U "$LOCAL_DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $LOCAL_DB_NAME;"
docker exec -u postgres "$LOCAL_CONTAINER" psql -U "$LOCAL_DB_USER" -d postgres -c "CREATE DATABASE $LOCAL_DB_NAME;"
echo -e "${GREEN}✓ Local database reset${NC}"

# Step 3: Restore dump to local
echo -e "${YELLOW}Step 3: Restoring production data to local...${NC}"
if docker exec -i -u postgres "$LOCAL_CONTAINER" psql -U "$LOCAL_DB_USER" -d "$LOCAL_DB_NAME" < "$DUMP_FILE"; then
    echo -e "${GREEN}✓ Data restored to local database${NC}"
else
    echo -e "${RED}✗ Failed to restore data${NC}"
    exit 1
fi

# Step 4: Clean up dump file
echo -e "${YELLOW}Step 4: Cleaning up...${NC}"
rm "$DUMP_FILE"
echo -e "${GREEN}✓ Temporary dump file removed${NC}"

echo ""
echo -e "${GREEN}=== Sync Complete ===${NC}"
echo "Your local database now contains a copy of production data."
echo "Production database was not modified (read-only operation)."
