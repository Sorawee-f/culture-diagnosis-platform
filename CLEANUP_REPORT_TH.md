# Culture Diagnosis Platform — Safe Cleanup Report

## Removed accidental duplicate/misplaced files

The canonical Next.js API routes are under `src/app/api/...`.
These accidental duplicates were removed from this clean snapshot:

- `src/api/admin/operations/route.ts`
- `src/api/admin/employees/sync-google-sheets/route.ts`
- `src/app/api/api/admin/operations/route.ts`
- `src/app/api/api/admin/employees/sync-google-sheets/route.ts`

## Removed generated build cache

- `tsconfig.tsbuildinfo`

A `.gitignore` was added to prevent common local/build artifacts from being committed again.

## Intentionally retained

Legacy pilot-related files were left in place in this cleanup because this is a safe structural cleanup only. Some production code still imports `src/lib/pilot.ts`, so legacy cleanup should be a separate refactor with a full build/test pass.

## Important

The corrected employee login route is present at:
`src/app/api/auth/employee/login/route.ts`

Employee logout remains at:
`src/app/api/auth/employee/logout/route.ts`
