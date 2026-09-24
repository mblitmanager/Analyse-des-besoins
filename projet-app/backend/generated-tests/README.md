# Generated Playwright Tests

Auto-generated from database on 2026-09-24T08:40:31.680Z

## Test Structure

Tests are organized as:
```
formations/
  ├── [formation-slug]/
  │   ├── [level-slug]/
  │   │   ├── parcours-1/
  │   │   │   └── test.spec.ts
  │   │   ├── parcours-2/
  │   │   └── ...
  │   └── ...
  └── ...
``
## Statistics

- **Total Tests Generated**: 171
- **Total Formations**: 19
- **Total Levels**: 88
- **Total Parcours Rules**: 40

## Running Tests

Run all tests:
```bash
npx playwright test generated-tests/
```

Run specific formation:
```bash
npx playwright test generated-tests/formations/[formation-slug]/
```

Run specific level:
```bash
npx playwright test generated-tests/formations/[formation-slug]/[level-slug]/
```

## Base URL

All tests are configured to run against: https://ns-conseil-ab.mbl-service.com

## Last Generated

24/09/2026 08:40:31
