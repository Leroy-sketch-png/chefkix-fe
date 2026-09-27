# Q184-F3 Diff Record

### AREA CLEARED: Creator Verification Contract

- Trigger Finding: Explore and collection recipe cards passed `isVerified: false` regardless of creator identity.
- Seed of Suspicion: verification was being lost at multiple module boundaries rather than only at the two UI call sites.
- Blast Radius Findings (Pass 2): culinary `AsyncHelper` dropped `BasicProfileInfo.verified`; `DraftService` dropped it again while copying authors; recipe Typesense documents had no verification field.
- Systemic Sweep (Pass 3): people search consumed `isVerified` through a cast, but user Typesense documents and schema never supplied it. Explicit no-profile fallback authors correctly remain unverified.
- Total Eradications: 8 contract losses or false assumptions across DTO, mapping, indexing, schema migration, typing, and rendering.

## File Changes

[file:chefkix-monolith/culinary/src/main/java/com/chefkix/culinary/common/dto/response/AuthorResponse.java] no verification field -> JSON `isVerified` backed by a boolean DTO property.

[file:chefkix-monolith/culinary/src/main/java/com/chefkix/culinary/common/helper/AsyncHelper.java] identity verification discarded -> `BasicProfileInfo.verified` preserved.

[file:chefkix-monolith/culinary/src/main/java/com/chefkix/culinary/features/recipe/service/DraftService.java] copied author omitted verification -> copied author preserves verification.

[file:chefkix-monolith/application/src/main/java/com/chefkix/config/TypesenseCollectionInitializer.java] recipe and user schemas lacked verification -> optional boolean fields declared and migrated.

[file:chefkix-monolith/application/src/main/java/com/chefkix/config/TypesenseDataSyncer.java] recipe/user index documents omitted verification -> bulk recipe sync, real-time recipe indexing, and user sync preserve server-owned values.

[file:chefkix-monolith/application/src/test/java/com/chefkix/config/TypesenseCollectionInitializerTest.java] no migration proof -> recipe and user verification fields asserted.

[file:chefkix-monolith/application/src/test/java/com/chefkix/config/TypesenseDataSyncerTest.java] no indexing proof -> bulk recipe, real-time recipe, and user verification asserted.

[file:chefkix-monolith/culinary/src/test/java/com/chefkix/culinary/common/helper/AsyncHelperTest.java] absent -> identity-to-author verification regression proof.

[file:chefkix-monolith/culinary/src/test/java/com/chefkix/culinary/features/recipe/service/DraftServiceTest.java] absent -> draft author-copy regression proof.

[file:src/lib/types/recipe.ts] recipe author untyped -> optional `isVerified` contract.

[file:src/lib/types/search.ts] search verification untyped -> optional recipe-author and user verification contracts.

[file:src/lib/search-result.ts] recipe search mapping dropped verification -> preserves explicit values and leaves missing values absent.

[file:src/app/(main)/explore/ExploreClient.tsx] hardcoded false -> authoritative recipe author value in browse and search cards.

[file:src/app/(main)/collections/[collectionId]/page.tsx] hardcoded false -> authoritative recipe author value.

[file:src/app/(main)/search/page.tsx] verification hidden behind a cast -> consumes the typed user search contract directly.

[file:src/lib/__tests__/recipe-author-verification.test.ts] absent -> verified, missing, UI source, and no-cast regression coverage.

## Structural Verification

- Pass 1: both hardcoded recipe-card values removed.
- Pass 2: culinary and search projection boundaries preserve the identity bit.
- Pass 3: global recipe-card and author-builder sweep found no additional authoritative values being dropped.
- `git diff --check`: passed in frontend and monolith repositories; line-ending warnings are repository-wide working-copy notices, not whitespace errors.
