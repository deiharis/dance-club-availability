---
name: stepbystep
description: End your reply with a numbered, copy-paste checklist of exactly what the user (Haris, a beginner) must do next, in order. Use when the user types /stepbystep, or asks "what do I do now", "tell me the steps", or wants the final steps after a change.
---

# stepbystep

After finishing the work, close your reply with a section titled **What you need to do**.

## Format

A numbered list, one action per step, in the exact order they must be done. Every step has:

1. **What** to do, in one plain sentence.
2. **The exact command**, for Windows PowerShell (use `;` not `&&`, quote paths containing `(` `)` `[` `]`). Put it in a code block.
3. **What output to expect** if it worked, and one line on what to do if it did not.

## Always consider these steps, and include only the ones that apply

- Stop the dev server (Ctrl+C) if a Prisma command needs it.
- `npx prisma db push`, then `npx prisma generate`, then VS Code "TypeScript: Restart TS Server" (only if `schema.prisma` changed).
- A one-off script such as `npx tsx seed.ts` (only if data needs fixing).
- `npx tsc --noEmit` (expect no output).
- `npm run dev`, then the exact URL to open and the exact thing to click or look for.
- Log out and back in (only if session or auth code changed).
- A new env var needs adding in Vercel then a redeploy (only if one was added).
- `git add .` then `git commit -m "<message>"` then `git push` (only after the checks pass).

## Rules

- Never leave a step vague ("update the database"). Give the command.
- Do not add steps that do not apply to this change.
- Keep each step to a few lines. No theory, no alternatives.
- If something needs a decision from the user first, put it as step 1.
- Never ask the user to run `npm audit fix --force`.
