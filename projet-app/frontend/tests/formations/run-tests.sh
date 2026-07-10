#!/usr/bin/env bash
# Test Runner Script - Execute formation tests by category

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Formation Test Matrix - Playwright Runner            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Command help
if [[ "$1" == "help" || "$1" == "-h" ]]; then
  echo -e "${GREEN}Usage:${NC}"
  echo "  ./run-tests.sh [command] [options]"
  echo ""
  echo -e "${GREEN}Commands:${NC}"
  echo "  all                    Run all formation tests"
  echo "  anglais                Run all Anglais tests"
  echo "  excel                  Run all Excel tests"
  echo "  word                   Run all Word tests"
  echo "  gimp                   Run all GIMP tests"
  echo "  ia                     Run all IA Générative tests"
  echo "  p1                     Run all P1 level tests"
  echo "  p2                     Run all P2 level tests"
  echo "  p3                     Run all P3 level tests"
  echo "  [formation]/[level]    Run specific formation level (e.g., excel/p1)"
  echo "  ui                     Run with UI mode"
  echo "  debug [path]           Debug specific test"
  echo "  report                 Show test report"
  echo ""
  echo -e "${GREEN}Examples:${NC}"
  echo "  ./run-tests.sh all"
  echo "  ./run-tests.sh excel"
  echo "  ./run-tests.sh excel/p3"
  echo "  ./run-tests.sh ui"
  echo "  ./run-tests.sh debug formations/anglais/p1/parcours-1"
  exit 0
fi

run_tests() {
  local test_path=$1
  local mode=${2:-""}
  
  if [[ "$mode" == "ui" ]]; then
    echo -e "${BLUE}Running tests with UI mode...${NC}"
    npx playwright test "$test_path" --ui
  elif [[ "$mode" == "debug" ]]; then
    echo -e "${BLUE}Running tests in debug mode...${NC}"
    npx playwright test "$test_path" --debug
  else
    echo -e "${BLUE}Running tests...${NC}"
    npx playwright test "$test_path" --reporter=list
  fi
}

case "$1" in
  all)
    echo -e "${GREEN}Running ALL tests...${NC}\n"
    run_tests "tests/formations/" "" 
    ;;
  anglais)
    echo -e "${GREEN}Running ANGLAIS tests...${NC}\n"
    run_tests "tests/formations/anglais/" ""
    ;;
  excel)
    echo -e "${GREEN}Running EXCEL tests...${NC}\n"
    run_tests "tests/formations/excel/" ""
    ;;
  word)
    echo -e "${GREEN}Running WORD tests...${NC}\n"
    run_tests "tests/formations/word/" ""
    ;;
  gimp)
    echo -e "${GREEN}Running GIMP tests...${NC}\n"
    run_tests "tests/formations/gimp/" ""
    ;;
  ia)
    echo -e "${GREEN}Running IA GÉNÉRATIVE tests...${NC}\n"
    run_tests "tests/formations/ia-generative/" ""
    ;;
  p1)
    echo -e "${GREEN}Running all P1 tests...${NC}\n"
    run_tests "tests/formations/*/p1/" ""
    ;;
  p2)
    echo -e "${GREEN}Running all P2 tests...${NC}\n"
    run_tests "tests/formations/*/p2/" ""
    ;;
  p3)
    echo -e "${GREEN}Running all P3 tests...${NC}\n"
    run_tests "tests/formations/*/p3/" ""
    ;;
  ui)
    echo -e "${GREEN}Running all tests with UI...${NC}\n"
    run_tests "tests/formations/" "ui"
    ;;
  debug)
    if [[ -z "$2" ]]; then
      echo -e "${RED}Error: Please specify test path to debug${NC}"
      echo "Example: ./run-tests.sh debug formations/anglais/p1"
      exit 1
    fi
    echo -e "${GREEN}Debugging: $2${NC}\n"
    run_tests "tests/$2" "debug"
    ;;
  report)
    echo -e "${GREEN}Showing test report...${NC}\n"
    npx playwright show-report
    ;;
  *)
    if [[ -n "$1" ]]; then
      # Assume it's a path like "excel/p1"
      echo -e "${GREEN}Running: $1${NC}\n"
      run_tests "tests/formations/$1/" ""
    else
      echo -e "${YELLOW}No command specified. Use 'help' for options.${NC}"
      exit 1
    fi
    ;;
esac

echo ""
echo -e "${GREEN}✅ Test execution completed${NC}"
