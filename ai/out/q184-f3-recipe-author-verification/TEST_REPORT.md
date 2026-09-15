# Q184-F3 Test Report

## Result

Controlled verification passed. Evidence grade is E2. Runtime Typesense migration and reindex on the current stack were not executed, so live indexed-data readiness is not claimed.

## Passed

- Agent OS: 123 passes, 0 failures.
- Frontend focused Jest: 2 suites, 9 tests, 0 failures.
- Frontend ESLint: 0 warnings, 0 errors.
- Frontend TypeScript: passed with no errors.
- Culinary Maven: 2 tests, 0 failures (`AsyncHelperTest`, `DraftServiceTest`).
- Application Maven: 6 tests, 0 failures (`TypesenseCollectionInitializerTest`, `TypesenseDataSyncerTest`).
- Frontend and monolith `git diff --check`: passed.
- Pass 3 search: no production `isVerified: false` recipe mapping remains; all authoritative `AuthorResponse` copy paths preserve verification.

## Commands

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ai/tools/verify-agent-os.ps1
```

```powershell
npm test -- --runInBand src/lib/__tests__/recipe-author-verification.test.ts src/lib/__tests__/search-result-truth.test.ts
npm run lint
npm run typecheck
```

```powershell
.\mvnw.cmd --% -pl culinary -am -Dtest=AsyncHelperTest,DraftServiceTest -Dsurefire.failIfNoSpecifiedTests=false test
.\mvnw.cmd --% -pl application -Dtest=TypesenseDataSyncerTest,TypesenseCollectionInitializerTest test
```

## Non-Product Invocation Failures

Two initial Maven commands were rejected by PowerShell argument parsing before compilation. Re-running with `--%` produced the passing results above. These failures provide no product evidence.

## Coverage Gaps

- No current-session boot of the application against a real Typesense instance.
- No proof that an existing collection accepted both additive fields and completed startup reindex.
- No authenticated runtime walkthrough showing the same verified creator in People Search, Explore, and a Collection.
- No representative-user evidence that badge meaning or placement is understood; layout and badge component were unchanged in this cluster.

## Runtime Acceptance Still Required

1. Restart the application with Typesense healthy and confirm both field migrations report success.
2. Confirm startup sync completes and a known verified profile produces `users.isVerified=true` and `recipes.authorVerified=true`.
3. Walk People Search, Explore, and Collections with that creator and verify consistent badge rendering.
4. Confirm an unverified creator and a legacy sparse document remain unbadged.
