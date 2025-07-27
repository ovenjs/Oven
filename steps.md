# Next Steps for Discord Wrapper Package Completion

## Overview
This document outlines the remaining tasks to complete the Discord wrapper NPM package fixes. The foundation has been established with standardized build systems, workspace dependencies, and a restructured types package. The following steps need to be completed in order.

## Current Status
- ✅ **types package**: Builds successfully 
- 🔄 **rest package**: In progress - fixing import issues with route files
- 🔄 **ws package**: Needs type integration fixes
- 🔄 **core package**: Depends on rest/ws fixes
- 🔄 **builders package**: Likely has similar import issues

---

## Step 1: Complete REST Package Fixes

### Priority: HIGH
### Expected Time: 30-45 minutes

### Issues to Fix:
The rest package currently fails to build due to import issues in route files that reference non-existent types.

### Specific Tasks:

#### 1.1 Fix ChannelRoutes.ts
**File**: `/app/packages/rest/src/routes/ChannelRoutes.ts`

**Current Issue**: References non-existent types like `Channel`, `Message`, `MessageCreateOptions`, etc.

**Action Required**:
- Replace custom types with discord-api-types equivalents
- Update method signatures to use proper Discord API types
- Expected imports to fix:
  ```typescript
  import type {
    APIChannel,
    APIMessage,
    RESTPostAPIChannelMessageJSONBody,
    RESTPatchAPIChannelMessageJSONBody,
  } from 'discord-api-types/v10';
  ```

#### 1.2 Fix GuildRoutes.ts  
**File**: `/app/packages/rest/src/routes/GuildRoutes.ts`

**Expected Issues**: Similar import issues with `Guild`, `GuildCreateOptions`, etc.

**Action Required**:
- Replace with `APIGuild`, `RESTPostAPIGuildsJSONBody` from discord-api-types
- Update method signatures accordingly

#### 1.3 Fix UserRoutes.ts
**File**: `/app/packages/rest/src/routes/UserRoutes.ts`

**Expected Issues**: References to `User` type

**Action Required**:
- Replace with `APIUser` from discord-api-types

#### 1.4 Verify REST Package Build
```bash
cd /app/packages/rest && yarn build
```

**Expected Result**: Should build successfully without TypeScript errors

---

## Step 2: Fix WebSocket Package

### Priority: HIGH  
### Expected Time: 45-60 minutes

### Issues to Fix:
The ws package likely has similar import issues and missing implementations.

### Specific Tasks:

#### 2.1 Check Current Build Status
```bash
cd /app/packages/ws && yarn typecheck 2>&1 | head -20
```

#### 2.2 Fix Import Issues
**Expected Files with Issues**:
- `/app/packages/ws/src/client/WebSocketClient.ts`
- `/app/packages/ws/src/sharding/ShardManager.ts`
- `/app/packages/ws/src/handlers/EventHandler.ts`

**Common Fixes Needed**:
- Replace custom `BotToken` usage with proper typing
- Fix `GatewayInfo` imports (should work from types package)
- Update any Discord API type references to use discord-api-types

#### 2.3 Fix Missing Implementations
**Expected Issues**:
- Missing method implementations in ShardManager
- EventHandler missing methods
- HeartbeatManager incomplete

**Action Required**:
- Review each file for `TODO` comments or incomplete methods
- Implement missing functionality or add proper error throwing with descriptive messages

#### 2.4 Verify WebSocket Package Build
```bash
cd /app/packages/ws && yarn build
```

---

## Step 3: Fix Core Package

### Priority: HIGH
### Expected Time: 30-45 minutes

### Issues to Fix:
The core package orchestrates REST and WebSocket clients and likely has integration issues.

### Specific Tasks:

#### 3.1 Check Current Build Status
```bash
cd /app/packages/core && yarn typecheck 2>&1 | head -20
```

#### 3.2 Fix OvenClient.ts
**File**: `/app/packages/core/src/client/OvenClient.ts`

**Expected Issues**:
- Import issues with types from other packages
- Event handler type mismatches
- Manager initialization issues

**Action Required**:
- Update imports to use proper types from `@ovenjs/types`
- Fix event handler typing (lines 94-161 have `(this.ws as any)` casts)
- Replace `any` types with proper Discord API types

#### 3.3 Fix Manager Classes
**Expected Files with Issues**:
- `/app/packages/core/src/managers/UserManager.ts`
- `/app/packages/core/src/managers/GuildManager.ts`
- `/app/packages/core/src/managers/ChannelManager.ts`

**Common Fixes**:
- Update to use discord-api-types
- Fix cache typing issues
- Ensure proper TypeScript strict mode compliance

#### 3.4 Fix Structure Classes
**Expected Files with Issues**:
- `/app/packages/core/src/structures/User.ts`
- `/app/packages/core/src/structures/Guild.ts`
- `/app/packages/core/src/structures/Base.ts`

#### 3.5 Verify Core Package Build
```bash
cd /app/packages/core && yarn build
```

---

## Step 4: Fix Builders Package

### Priority: MEDIUM
### Expected Time: 30-45 minutes

### Issues to Fix:
The builders package creates Discord objects like embeds and components.

### Specific Tasks:

#### 4.1 Check Current Build Status
```bash
cd /app/packages/builders && yarn typecheck 2>&1 | head -20
```

#### 4.2 Fix Builder Classes
**Expected Files with Issues**:
- `/app/packages/builders/src/embeds/EmbedBuilder.ts`
- `/app/packages/builders/src/components/ActionRowBuilder.ts` 
- `/app/packages/builders/src/components/ButtonBuilder.ts`
- `/app/packages/builders/src/components/SelectMenuBuilder.ts`

**Action Required**:
- Replace custom embed/component types with discord-api-types equivalents
- Use `APIEmbed`, `APIActionRowComponent`, `APIButtonComponent`, etc.
- Update builder methods to return proper Discord API structures

#### 4.3 Verify Builders Package Build
```bash
cd /app/packages/builders && yarn build
```

---

## Step 5: Full Integration Testing

### Priority: HIGH
### Expected Time: 15-30 minutes

### Tasks:

#### 5.1 Build All Packages
```bash
cd /app && yarn build
```

**Expected Result**: All packages should build successfully

#### 5.2 Fix Any Remaining Issues
If build fails:
1. Note which package fails
2. Check the specific error messages
3. Fix import/export issues between packages
4. Ensure proper dependency resolution

#### 5.3 Verify Package Exports
Test that packages can be imported properly:
```bash
cd /app && node -e "
const core = require('./packages/core/dist/index.js');
const rest = require('./packages/rest/dist/index.js');
const ws = require('./packages/ws/dist/index.js');
const types = require('./packages/types/dist/index.js');
const builders = require('./packages/builders/dist/index.js');
console.log('All packages exported successfully');
"
```

---

## Step 6: Code Quality Improvements (Optional)

### Priority: LOW
### Expected Time: 30-60 minutes

### Tasks:

#### 6.1 Replace `any` Types
Search for remaining `any` types and replace with proper Discord API types:
```bash
cd /app && grep -r "any" packages/*/src/**/*.ts
```

#### 6.2 Add Missing Error Handling
Review error handling in:
- REST client request methods
- WebSocket connection handling  
- Manager classes

#### 6.3 Implement Missing Methods
Look for TODO comments or methods that throw "Not implemented" errors.

---

## Important Notes for Implementation

### TypeScript Strict Mode Compliance
- All packages use `exactOptionalPropertyTypes: true`
- Ensure optional properties are typed as `T | undefined` when needed
- Avoid assigning `undefined` to non-optional properties

### Discord API Types Integration
- Prefer discord-api-types over custom types for Discord API objects
- Only create custom types for package-specific functionality
- Import from `discord-api-types/v10` for consistency

### Common Error Patterns to Watch For
1. **Import Errors**: Missing exports from types package
2. **Type Mismatches**: Custom types conflicting with discord-api-types
3. **Workspace Dependencies**: Ensure all internal package references work
4. **Build Artifacts**: Clear dist folders if builds behave unexpectedly

### Testing Commands
Use these commands to verify progress:
```bash
# Test individual package
cd /app/packages/[package-name] && yarn typecheck
cd /app/packages/[package-name] && yarn build

# Test all packages  
cd /app && yarn build

# Check for TypeScript errors
cd /app && yarn workspaces run typecheck
```

### Success Criteria
- [ ] All packages build without TypeScript errors
- [ ] All packages export their main functionality correctly
- [ ] No `any` types in critical paths
- [ ] Integration between packages works properly
- [ ] Examples in README work (after README update)

---

## Final Deliverable Checklist

After completing all steps, verify:
- [ ] `yarn build` succeeds for entire monorepo
- [ ] Each package's dist folder contains proper .js, .d.ts, and .cjs files
- [ ] Package exports can be imported without errors
- [ ] No TypeScript compilation errors in any package
- [ ] Updated README.md reflects current architecture
- [ ] All discord-api-types integration is complete

This completes the Discord wrapper package standardization and fixes.