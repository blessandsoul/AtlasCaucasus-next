# Tourism Server - Claude Assistant Rules

This directory contains project-specific rules and guidelines for Claude working on the Tourism Server project.

## 📁 Directory Structure

```
.claude/
├── README.md                    # This file
├── rules/                       # Project rules
│   ├── client/                  # Client-side rules
│   ├── server/                  # Server-side rules
│   └── global/                  # Global rules
└── QUICK_REFERENCE.md           # Condensed version of all rules
```

## 🤖 For Claude

If you are using Claude via an extension or CLI that supports context loading:
- This directory serves as the source of truth for project rules.
- If automatic loading is not supported, ask Claude to: "Read the rules in `.claude/rules`".

## 🎯 Key Principles (TL;DR)

- **Stack**: Node.js, Fastify, TypeScript, MySQL, Prisma, Redis
- **Architecture**: Routes → Controllers → Services → Repositories → DB
- **API**: All routes prefixed with `/api/v1`
- **Response Format**: 
  - Success: `{ success: true, message: "...", data: {...} }`
  - Error: `{ success: false, error: { code: "...", message: "..." } }`
- **Safety**: Keep changes minimal, preserve existing behavior
