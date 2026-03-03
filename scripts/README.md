# ChefKix Scripts

Utility scripts for project maintenance and health checks.

## Available Scripts

### `health-check.ps1` (PowerShell)

Comprehensive pre-deployment health check that verifies:

- ✅ Dependencies installed (node_modules)
- ✅ Old `[username]` route deleted
- ✅ New `[userId]` route exists
- ✅ No console.log in production code
- ✅ TypeScript compilation succeeds
- ✅ Environment variables configured
- ✅ Package scripts configured

**Usage**:

```powershell
.\scripts\health-check.ps1
```

**Expected Output** (when passing):

```
🔍 ChefKix Frontend Health Check
=================================

📦 Checking dependencies...
✅ Dependencies installed

📁 Verifying route cleanup...
✅ Old [username] route deleted

📁 Verifying new route...
✅ New [userId] route exists

🔍 Scanning for console.log...
✅ No console.log found in production code

🔨 Running TypeScript check...
✅ TypeScript compilation successful

🔐 Checking environment...
✅ .env.local exists

📜 Verifying package scripts...
✅ Build scripts configured

=================================
🎉 Health Check PASSED
   Project is ready for integration testing

Next steps:
  1. Start backend: cd ../chefkix-infrastructure && .\dev.bat
  2. Start frontend: npm run dev
  3. Test critical flows (see SESSION_SUMMARY_2024-11-05.md)
=================================
```

## Adding New Scripts

1. Create script file in this directory
2. Make it executable (if bash): `chmod +x script-name.sh`
3. Document it in this README
4. Add usage examples

## Script Conventions

- Use `.ps1` for PowerShell scripts (Windows-friendly)
- Use `.sh` for Bash scripts (Unix-friendly)
- Include help text at the top of each script
- Use color-coded output for clarity
- Exit with non-zero code on errors
