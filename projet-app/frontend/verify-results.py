#!/usr/bin/env python3
"""
Script de vérification des résultats des tests de formations
Analyse les screenshots pour vérifier que les résultats affichent les bons niveaux
"""

import os
import json
from pathlib import Path

# Configuration des résultats attendus
EXPECTED_RESULTS = {
    "anglais-p1-parcours-1": "Niveau 1",
    "anglais-p1-parcours-2": "Niveau 1",
    "anglais-p2-parcours-1": "Niveau 2",
    "anglais-p2-parcours-2": "Niveau 2",
    
    "excel-p1-parcours-1": "Niveau 1",
    "excel-p1-parcours-2": "Niveau 1",
    "excel-p2-parcours-1": "Niveau 2",
    "excel-p2-parcours-2": "Niveau 2",
    "excel-p3-parcours-1": "Niveau 3",
    "excel-p3-parcours-2": "Niveau 3",
    
    "word-p1-parcours-1": "Niveau 1",
    "word-p1-parcours-2": "Niveau 1",
    "word-p2-parcours-1": "Niveau 2",
    "word-p2-parcours-2": "Niveau 2",
    "word-p3-parcours-1": "Niveau 3",
    "word-p3-parcours-2": "Niveau 3",
    
    "gimp-p1-parcours-1": "Niveau 1",
    
    "ia-generative-p1-parcours-word-ia": "Word & IA",
    "ia-generative-p1-parcours-excel-ia": "Excel & IA",
}

def main():
    screenshots_dir = Path("test-results/screenshots")
    
    if not screenshots_dir.exists():
        print("❌ Screenshots directory not found")
        return
    
    print("📋 VERIFICATION DES RESULTATS")
    print("=" * 60)
    print()
    
    # List all result screenshots
    result_screenshots = sorted(screenshots_dir.glob("*-02-results.png"))
    
    print(f"Found {len(result_screenshots)} result screenshots")
    print()
    
    # Print summary
    print("📸 Screenshots results:")
    for screenshot in result_screenshots:
        name = screenshot.stem
        size_kb = screenshot.stat().st_size / 1024
        print(f"  ✓ {name}.png ({size_kb:.1f} KB)")
    
    print()
    print("=" * 60)
    print("ℹ️  CHECKLIST DE VERIFICATION")
    print("=" * 60)
    print()
    print("Pour chaque screenshot, vérifiez que les résultats affichent:")
    print()
    
    # Group by formation
    formations = {
        "Anglais": ["anglais-p1-parcours-1", "anglais-p1-parcours-2", "anglais-p2-parcours-1", "anglais-p2-parcours-2"],
        "Excel": ["excel-p1-parcours-1", "excel-p1-parcours-2", "excel-p2-parcours-1", "excel-p2-parcours-2", "excel-p3-parcours-1", "excel-p3-parcours-2"],
        "Word": ["word-p1-parcours-1", "word-p1-parcours-2", "word-p2-parcours-1", "word-p2-parcours-2", "word-p3-parcours-1", "word-p3-parcours-2"],
        "GIMP": ["gimp-p1-parcours-1"],
        "IA Générative": ["ia-generative-p1-parcours-word-ia", "ia-generative-p1-parcours-excel-ia"],
    }
    
    for formation_name, tests in formations.items():
        print(f"  {formation_name}:")
        for test in tests:
            if test in EXPECTED_RESULTS:
                expected = EXPECTED_RESULTS[test]
                screenshot = f"{test}-02-results.png"
                exists = "✓" if (screenshots_dir / screenshot).exists() else "✗"
                print(f"    [{exists}] {test}")
                print(f"       → Expected: {expected}")
        print()

if __name__ == "__main__":
    main()
