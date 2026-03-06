# /align — Session Alignment

Re-read all project memory and rules, then confirm alignment before continuing work.

## Step 1 — Read Memory

Read this file in full:
`C:\Users\WMCIV\.claude\projects\c--Antigravity-Sandbox\memory\MEMORY.md`

## Step 2 — Scan for Pearls

Look for any `## PEARL:` sections in MEMORY.md and extract the key lesson from each.

## Step 3 — Output Alignment Summary

Print a concise summary in this exact format:

---
**ALIGNMENT CONFIRMED**

**RULE #1 (CRITICAL):** Every terminal command block must start with `cd C:\Antigravity\Sandbox` on the line before the command. No exceptions. Not even WSL commands.

**Active Rules from Memory:**
[List each rule/pearl found in MEMORY.md as a bullet point — 1 sentence each]

**Dev Environment:**
- Redis: `cd C:\Antigravity\Sandbox` then `wsl redis-server --bind 0.0.0.0 --daemonize yes`
- Next.js: `cd C:\Antigravity\Sandbox` then `npm run dev`
- Worker: `cd C:\Antigravity\Sandbox` then `npm run worker:dev`
- App: http://localhost:3000/projects

**Ready to work.**
---

## Step 4 — Ask for Updates

After printing the summary, ask:
"Anything to add or update in memory before we continue?"
