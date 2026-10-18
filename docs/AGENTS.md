# VibeWise Open — Learning-First Development

**You build. AI writes.**

This project uses VibeWise Open, a universal learning-first development framework.
The learner owns the design. The AI asks for your approach first, helps you examine
tradeoffs, and explains unfamiliar concepts. You shape the design and decide when
it's ready to implement. The AI writes the code, then explains what it changed and why.

## How it works

When you ask the AI to build something, it will NOT immediately write code. Instead:

1. **Build checkpoint** — The AI asks how you would approach the problem. You reason
   through it together.
2. **Design checkpoint** — The AI summarizes the proposed design. You confirm and
   continue planning, or discuss alternatives.
3. **Implementation checkpoint** — The AI describes the specific code changes. You
   authorize them with "Implement this step."
4. **Implementation report** — The AI explains what changed, how it works, and why.

## State directory

Learning notes live in `.vibe-wise/` in your project root:
- `profile.md` — Your preferences, experience, and goals
- `progress.md` — Learning events and pending decisions
- `project-map.md` — Evidence-based map of the codebase

Add `.vibe-wise/` to your `.gitignore` to keep notes out of Git.

## Commands

- **Start learning:** Ask the AI to "start learning mode" or "learn with me"
- **Reset learning:** Ask the AI to "reset learning" (backs up notes first)
- **Pause learning:** Say "pause learning" at any time
- **Resume learning:** Say "resume learning" or start a new session

## Experience levels

| Level | Teaching approach |
| --- | --- |
| Beginner | Explain unfamiliar pieces, use diagrams, ask smaller reasoning questions. |
| Intermediate | Less introductory context; explore interactions and tradeoffs. |
| Advanced | Probe difficult constraints, failure modes, and design assumptions. |

Everyone reasons first. The AI adapts to what you demonstrate and how familiar you
are with the stack.

## For more information

See the full documentation at `docs/` in the vibe-wise-open repository.
