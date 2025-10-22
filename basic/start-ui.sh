#!/bin/bash

# Compliance-Aware Data Concierge - UI Setup and Start Script
# This script sets up and starts both the workflow server and UI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Compliance-Aware Data Concierge - UI Setup${NC}"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "pyproject.toml" ] || [ ! -d "ui" ]; then
    echo -e "${RED}❌ Error: Please run this script from the basic/ directory${NC}"
    echo "Expected structure:"
    echo "  basic/"
    echo "  ├── pyproject.toml"
    echo "  ├── ui/"
    echo "  └── src/"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Warning: .env file not found${NC}"
    echo "Please create a .env file with:"
    echo "  OPENAI_API_KEY=your_openai_api_key_here"
    echo "  WEAVIATE_URL=https://your-cluster.weaviate.network"
    echo "  WEAVIATE_API_KEY=your_weaviate_api_key_here"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo -e "${YELLOW}⚠️  Python virtual environment not found. Creating one...${NC}"
    python3 -m venv .venv
fi

# Activate virtual environment
echo -e "${BLUE}📦 Activating Python virtual environment...${NC}"
source .venv/bin/activate

# Install Python dependencies
echo -e "${BLUE}📦 Installing Python dependencies...${NC}"
pip install -e .

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js is required but not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Error: npm is required but not installed${NC}"
    echo "Please install npm (usually comes with Node.js)"
    exit 1
fi

# Setup UI
echo -e "${BLUE}🎨 Setting up Next.js UI...${NC}"
cd ui

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing UI dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}✅ UI dependencies already installed${NC}"
fi

# Go back to main directory
cd ..

# Check if llamactl is available
if ! command -v llamactl &> /dev/null; then
    echo -e "${YELLOW}⚠️  llamactl not found. Installing...${NC}"
    pip install llamactl
fi

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""

# Function to cleanup background processes
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
    if [ ! -z "$WORKFLOW_PID" ]; then
        kill $WORKFLOW_PID 2>/dev/null || true
        echo -e "${GREEN}✅ Workflow server stopped${NC}"
    fi
    if [ ! -z "$UI_PID" ]; then
        kill $UI_PID 2>/dev/null || true
        echo -e "${GREEN}✅ UI server stopped${NC}"
    fi
    exit 0
}

# Trap cleanup function
trap cleanup SIGINT SIGTERM

echo -e "${BLUE}🚀 Starting servers...${NC}"
echo ""

# Start workflow server in background
echo -e "${BLUE}📊 Starting workflow server on port 4501...${NC}"
llamactl serve --port 4501 > workflow.log 2>&1 &
WORKFLOW_PID=$!

# Wait a moment for workflow server to start
sleep 3

# Check if workflow server is running
if ! curl -s http://127.0.0.1:4501/health > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Workflow server health check failed, but continuing...${NC}"
    echo "Check workflow.log for details if you encounter issues"
else
    echo -e "${GREEN}✅ Workflow server is running${NC}"
fi

# Start UI server
echo -e "${BLUE}🎨 Starting UI server on port 3000...${NC}"
cd ui
npm run dev > ../ui.log 2>&1 &
UI_PID=$!
cd ..

# Wait for UI to start
sleep 5

echo ""
echo -e "${GREEN}🎉 All servers are running!${NC}"
echo "=================================================="
echo -e "${GREEN}🌐 UI:${NC}       http://localhost:3000"
echo -e "${GREEN}🔧 API:${NC}      http://localhost:4501"
echo -e "${GREEN}📋 Logs:${NC}     workflow.log, ui.log"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "   • Try different user roles (HR, Engineering Manager, etc.)"
echo "   • Example query: 'Show performance_summary for employee_id 101'"
echo "   • Watch the tool calls and workflow steps in the UI"
echo ""
echo -e "${BLUE}Press Ctrl+C to stop all servers${NC}"

# Wait for background processes
wait $WORKFLOW_PID $UI_PID
