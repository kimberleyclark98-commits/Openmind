> **BrainSync Context Pumper** 🧠
> Dynamically loaded for active file: `.env` (Domain: **Config/Infrastructure**)

### 🔴 Config/Infrastructure Gotchas
- **Surprising bridge detected: decentralized-orchestrator.ts → autonomous-wallet.ts**: A rare connection exists between Domain Cluster undefined and Cluster undefined. This bridge may indicate a hidden dependency or an abstraction leak where logic from two unrelated modules is tightly coupled.
- **Circular dependency: claude-reasoner-skill.ts ↔ skill-router.ts**: Files claude-reasoner-skill.ts and skill-router.ts import each other, creating a circular dependency. This can cause initialization order bugs, undefined imports at runtime, and makes refactoring harder. Consider extracting shared types into a separate file.
- **Circular dependency: cyber-ui-skill.ts ↔ skill-router.ts**: Files cyber-ui-skill.ts and skill-router.ts import each other, creating a circular dependency. This can cause initialization order bugs, undefined imports at runtime, and makes refactoring harder. Consider extracting shared types into a separate file.
- **Circular dependency: n8n-orchestrator-skill.ts ↔ skill-router.ts**: Files n8n-orchestrator-skill.ts and skill-router.ts import each other, creating a circular dependency. This can cause initialization order bugs, undefined imports at runtime, and makes refactoring harder. Consider extracting shared types into a separate file.
- **Circular dependency: skill-router.ts ↔ visual-oracle-skill.ts**: Files skill-router.ts and visual-oracle-skill.ts import each other, creating a circular dependency. This can cause initialization order bugs, undefined imports at runtime, and makes refactoring harder. Consider extracting shared types into a separate file.
- **Low cohesion detected in Domain Cluster 5**: Cluster 5 (11 nodes) has a very low cohesion score (0.09). This suggests the community is a "spaghetti" module containing unrelated logic that should be separated into cleaner domain boundaries.

### 📐 Config/Infrastructure Conventions & Fixes
- **[problem-fix] problem-fix in .gitignore**: File updated (external): .gitignore

Content summary (60 lines):
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

.genkit/*
.env*

# firebase
firebase-debug.log
firestore-debug.log

.cursor/
