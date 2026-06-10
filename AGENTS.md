<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:superpowers-methodology -->
# Superpowers Development Methodology

This project uses the [Superpowers](https://github.com/obra/superpowers) agentic skills framework. The plugin is installed in `opencode.json`.

## Core Workflow (always follow this order)

1. **using-superpowers** — Before ANY response, check if a skill might apply (even 1% chance). If yes, invoke it via the `skill` tool. Skills override defaults but user instructions take precedence.

2. **brainstorming** — Before writing ANY code, refine the idea through Socratic dialogue. Ask questions one at a time, propose 2-3 approaches, present design in sections, get user approval. Save to `docs/superpowers/specs/`. Do NOT implement before design approval.

3. **using-git-worktrees** — Create isolated workspace on a new branch before starting implementation. Detect existing isolation first, prefer native tools, fallback to `git worktree add`.

4. **writing-plans** — Break approved design into bite-sized tasks (2-5 min each). Every task has: exact file paths, complete code, test steps, verification commands. Save to `docs/superpowers/plans/`.

5. **subagent-driven-development** (preferred) or **executing-plans** — Execute plan: dispatch fresh subagent per task, two-stage review (spec compliance then code quality). Never skip reviews.

6. **test-driven-development** — NO production code without a failing test first. RED (write failing test) → GREEN (minimal code) → REFACTOR. Watch the test fail before implementing. Delete any code written before tests.

7. **requesting-code-review** — Review after each task. Use subagent with template. Fix Critical issues immediately, Important before proceeding.

8. **finishing-a-development-branch** — Verify tests, detect environment, present options: merge/PR/keep/discard. Only cleanup worktrees you created.

## Additional Skills

- **systematic-debugging** — No fixes without root cause. 4 phases: investigate, pattern analysis, hypothesis, implement. If 3+ fixes failed, question architecture.
- **verification-before-completion** — No completion claims without fresh verification evidence. Run the command, read output, THEN claim.
- **receiving-code-review** — Verify before implementing. No performative agreement. Push back with technical reasoning when wrong.
- **dispatching-parallel-agents** — Independent tasks run concurrently via subagents.
- **writing-skills** — Create new skills using TDD for documentation. No skill without a failing test.

## Philosophy

- TDD always — Write tests first. Watch them fail. Write minimal code.
- Systematic over ad-hoc — Process over guessing.
- Complexity reduction — Simplicity as primary goal.
- Evidence over claims — Verify before declaring success.
- YAGNI ruthlessly — Remove unnecessary features from all designs.
<!-- END:superpowers-methodology -->

<!-- BEGIN:karpathy-coding-principles -->
# Karpathy Coding Principles

Derived from Andrej Karpathy's observations on LLM coding pitfalls (`github.com/multica-ai/andrej-karpathy-skills`). Apply these alongside Superpowers.

## 1. Think Before Coding

- **State assumptions explicitly** — If uncertain, ask rather than guess
- **Present multiple interpretations** — Don't pick silently when ambiguity exists
- **Push back when warranted** — If a simpler approach exists, say so
- **Stop when confused** — Name what's unclear and ask for clarification

## 2. Simplicity First

- No features beyond what was asked
- No abstractions for single-use code
- No "flexibility" or "configurability" that wasn't requested
- No error handling for impossible scenarios
- If 200 lines could be 50, rewrite it
- **Test:** Would a senior engineer say this is overcomplicated?

## 3. Surgical Changes

- Don't "improve" adjacent code, comments, or formatting unrelated to the task
- Don't refactor things that aren't broken
- Match existing style, even if you'd do it differently
- Remove imports/variables YOUR changes made unused (not pre-existing dead code)
- **Test:** Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

- Transform "add validation" → "write tests for invalid inputs, then make them pass"
- For multi-step tasks, state a plan with verify steps after each
- Strong success criteria let you loop independently without hand-holding

## Agentic Ecosystem References

These frameworks exist in the ecosystem and may offer patterns or inspiration:

- **ECC** (`affaan-m/ECC`) — 261 skills, 64 agents, cross-harness hooks/rules/MCP. Agent "operating system."
- **Ruflo** (`ruvnet/ruflo`) — Multi-agent swarm orchestration, self-learning memory, agent federation.
- **Open Design** (`nexu-io/open-design`) — Agent-native design artifacts via CLI/MCP. 150 design systems.
- **Obsidian-CLI-skill** (`pablo-mano/Obsidian-CLI-skill`) — Skill pattern for teaching agents CLI tools via SKILL.md.
<!-- END:karpathy-coding-principles -->
