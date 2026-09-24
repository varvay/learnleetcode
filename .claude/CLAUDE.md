# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

learnleetcode is the owner's public LeetCode study journal, built with Astro and served from GitHub Pages at https://varvay.github.io/learnleetcode/ (base path `/learnleetcode`, set in `astro.config.mjs`).

## Faults — read these before anything else

**[.claude/skills/fault-tracker/.faults.md](skills/fault-tracker/.faults.md) holds every mistake already made here.** Read it at the start of every session, before touching the repo. Read each entry's **trigger** — the fault itself is done and unrepeatable, while the situation that produced it is what comes round again, and recognising it in the moment is the only thing that stops a repeat.

When a fault lands — the user corrects you, or you catch yourself — record it immediately through the [fault-tracker](skills/fault-tracker/SKILL.md) skill: a new entry, or the occurrence count bumped on the entry whose **guard** it already broke.

## Skills — load them all at the start

**Load every skill in [.claude/skills](skills/) before the work.** A skill reached for once the draft exists is reached for too late — the style it governs is already set. They carry the house style for source ([code-writer](skills/code-writer/SKILL.md)), prose ([doc-writer](skills/doc-writer/SKILL.md)), commit messages ([commit-writer](skills/commit-writer/SKILL.md)), and the fault record above ([fault-tracker](skills/fault-tracker/SKILL.md)).

## Working style

- **Read to the end.** Act on a document or an instruction only once its last line is read — the clause that qualifies the first half sits in the second, so a part-read is a misread.
- **Narrate commands.** Before running a shell command, announce it in the format `{main operation} [read-only|write] — {explanation}` (e.g. `git commit [write] — commit the new problem`). Keep the operation a short label, not the whole command.
- **Write lean docs.** Keep documentation concise — deliver every message with no redundancy. Don't restate what the code or another doc already says, avoid explanation that becomes a maintenance liability, and keep cross-file links to the few that earn their place.
- **Let the code speak.** Names, types, and structure carry the meaning; a comment is a last resort for a constraint they cannot express. Full rule in [code-writer](skills/code-writer/SKILL.md).
- **Define by what a thing is** — no apophasis, no litotes. A negative definition hands the reader's focus to what was denied, and loosens the rule the moment a new case appears.
- **Don't hard-wrap docs.** Write each paragraph and bullet as one physical line and let the editor soft-wrap — no manual line breaks mid-sentence.

## The journal is the owner's

- Solutions and notes under `problems/` are written by the owner. Write or change them only when asked.
- LeetCode problem statements stay on LeetCode; a problem page links to its statement.
- The README describes the project to visitors. How-to and technical detail live here.
- Claude-related files live in `.claude/`, never at the repo root.

## Adding a problem

Create `problems/<id>-<leetcode-slug>/`:

- `index.md` — frontmatter and notes; the schema is in `src/content.config.ts`.
- every other file in the folder (`solution.py`, `attempt-1.py`, …) renders on the page as highlighted code; `src/pages/problems/[slug].astro` maps file extensions to languages.

```md
---
id: 1456
title: Maximum Number of Vowels in a Substring of Given Length
link: https://leetcode.com/problems/maximum-number-of-vowels-in-a-substring-of-given-length/
difficulty: Medium        # Easy | Medium | Hard
tags: [sliding-window, string]
solved: 2026-09-24
complexity:               # optional
  time: O(n)
  space: O(1)
---
```

## Development

- `npm run dev` serves at `localhost:4321/learnleetcode/`. Start it in background mode with `astro dev --background`, and manage it with `astro dev stop|status|logs`.
- `npm run build` writes to `dist/`. Internal links go through `url()` from `src/lib/url.ts`, which adds the base path.
- Deployment is local: `npm run deploy` builds and pushes `dist/` to the `gh-pages` branch, which Pages serves. `.nojekyll` keeps the `_astro/` folder. The site changes only on a deploy.
- Docs: https://docs.astro.build

## Commit convention

Commits follow [Conventional Commits](https://www.conventionalcommits.org):

```
<type>(<scope>): short imperative summary

<optional body>
```

- **type** — `feat`, `fix`, `docs`, `refactor`, `chore` (add others as needed).
- **scope** — optional area: `problems`, `site`, `deploy`.
- Prefer **atomic commits** (one logical change); a new problem is one commit.

Example:

```
feat(problems): add 1456 maximum vowels in a substring
```

**Committing is a manual, deliberate step.** Do not auto-commit or install commit hooks; only commit when the user asks, keeping diffs easy to review.

**The index belongs to the user.** Staging is how they mark work as reviewed, so they are the only one who moves it — in either direction. Never stage (`git add`), and never unstage (`git reset`, `git restore --staged`, `git stash`). To commit, name the paths (`git commit <paths> -m …`), which writes those files and leaves the rest of the index where it stands. Untracked files can't be committed by path; the user stages them.

**Pushing and deploying are the user's.** `git push` and `npm run deploy` publish to GitHub; the user runs them.
