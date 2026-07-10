# Test Runner Script - Execute formation tests by category
# PowerShell version for Windows

param(
    [string]$Command = "",
    [string]$Option = ""
)

$BaseDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       Formation Test Matrix - Playwright Runner            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

function Show-Help {
    Write-Host "Usage:" -ForegroundColor Green
    Write-Host "  .\run-tests.ps1 -Command [command] -Option [option]"
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Green
    Write-Host "  all        Run all formation tests"
    Write-Host "  anglais    Run all Anglais tests"
    Write-Host "  excel      Run all Excel tests"
    Write-Host "  word       Run all Word tests"
    Write-Host "  gimp       Run all GIMP tests"
    Write-Host "  ia         Run all IA Générative tests"
    Write-Host "  p1         Run all P1 level tests"
    Write-Host "  p2         Run all P2 level tests"
    Write-Host "  p3         Run all P3 level tests"
    Write-Host "  ui         Run with UI mode"
    Write-Host "  debug      Debug specific test"
    Write-Host "  report     Show test report"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Green
    Write-Host "  .\run-tests.ps1 -Command all"
    Write-Host "  .\run-tests.ps1 -Command excel"
    Write-Host "  .\run-tests.ps1 -Command excel -Option p3"
    Write-Host "  .\run-tests.ps1 -Command ui"
    Write-Host "  .\run-tests.ps1 -Command debug -Option formations/anglais/p1/parcours-1"
}

function Run-Tests {
    param(
        [string]$TestPath,
        [string]$Mode = ""
    )
    
    if ($Mode -eq "ui") {
        Write-Host "Running tests with UI mode..." -ForegroundColor Blue
        npx playwright test $TestPath --ui
    } elseif ($Mode -eq "debug") {
        Write-Host "Running tests in debug mode..." -ForegroundColor Blue
        npx playwright test $TestPath --debug
    } else {
        Write-Host "Running tests..." -ForegroundColor Blue
        npx playwright test $TestPath --reporter=list
    }
}

if ($Command -eq "help" -or $Command -eq "-h" -or $Command -eq "") {
    Show-Help
    exit 0
}

switch ($Command.ToLower()) {
    "all" {
        Write-Host "Running ALL tests..." -ForegroundColor Green
        Write-Host ""
        Run-Tests "tests/formations/"
    }
    "anglais" {
        Write-Host "Running ANGLAIS tests..." -ForegroundColor Green
        Write-Host ""
        Run-Tests "tests/formations/anglais/"
    }
    "excel" {
        Write-Host "Running EXCEL tests..." -ForegroundColor Green
        Write-Host ""
        Run-Tests "tests/formations/excel/"
    }
    "word" {
        Write-Host "Running WORD tests..." -ForegroundColor Green
        Write-Host ""
        Run-Tests "tests/formations/word/"
    }
    "gimp" {
        Write-Host "Running GIMP tests..." -ForegroundColor Green
        Write-Host ""
        Run-Tests "tests/formations/gimp/"
    }
    "ia" {
        Write-Host "Running IA GÉNÉRATIVE tests..." -ForegroundColor Green
        Write-Host ""
        Run-Tests "tests/formations/ia-generative/"
    }
    "p1" {
        Write-Host "Running all P1 tests..." -ForegroundColor Green
        Write-Host ""
        Run-Tests "tests/formations/*/p1/"
    }
    "p2" {
        Write-Host "Running all P2 tests..." -ForegroundColor Green
        Write-Host ""
        Run-Tests "tests/formations/*/p2/"
    }
    "p3" {
        Write-Host "Running all P3 tests..." -ForegroundColor Green
        Write-Host ""
        Run-Tests "tests/formations/*/p3/"
    }
    "ui" {
        Write-Host "Running all tests with UI..." -ForegroundColor Green
        Write-Host ""
        Run-Tests "tests/formations/" "ui"
    }
    "debug" {
        if ([string]::IsNullOrEmpty($Option)) {
            Write-Host "Error: Please specify test path to debug" -ForegroundColor Red
            Write-Host "Example: .\run-tests.ps1 -Command debug -Option formations/anglais/p1"
            exit 1
        }
        Write-Host "Debugging: $Option" -ForegroundColor Green
        Write-Host ""
        Run-Tests "tests/$Option" "debug"
    }
    "report" {
        Write-Host "Showing test report..." -ForegroundColor Green
        Write-Host ""
        npx playwright show-report
    }
    default {
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        Write-Host "Use 'help' for available commands" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "✅ Test execution completed" -ForegroundColor Green
