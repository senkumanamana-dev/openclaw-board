# OpenClaw-Board CLI (`ocb`)

A command-line interface for [OpenClaw-Board](https://github.com/finchinslc/openclaw-board) — manage your kanban tasks from the terminal.

Perfect for AI agents and humans who prefer the command line.

## Installation

```bash
# From npm (coming soon)
npm install -g openclaw-board-cli

# From source
cd openclaw-board/cli
npm install
npm link
```

## Configuration

By default, `ocb` connects to `http://localhost:3000/api`.

Set a custom URL:
```bash
export OCB_API_URL=http://your-board:3000/api
```

## Commands

### List tasks

```bash
ocb list                      # All tasks
ocb ls                        # Alias
ocb list --status TODO        # Filter by status
ocb list --priority HIGH      # Filter by priority
ocb list --tag bug            # Filter by tag
ocb list --all                # Include archived
ocb list --json               # JSON output

ocb todo                      # Shorthand for --status TODO
```

### Show task details

```bash
ocb show OCB-42               # By task number
ocb show 42                   # Number only works too
ocb show OCB-42 --json        # JSON output
```

### Create tasks

```bash
ocb create "Fix the login bug"
ocb create "Add feature" --priority HIGH
ocb create "Refactor" --tags refactor,tech-debt
ocb create "Big task" --description "Detailed description here"
ocb new "Shorthand alias"     # 'new' is an alias for 'create'
```

### Work on tasks

```bash
ocb start OCB-42              # Move to IN_PROGRESS + set active
ocb done OCB-42               # Mark complete
ocb review OCB-42             # Move to NEEDS_REVIEW
ocb block OCB-42 "Waiting on API access"  # Mark blocked with reason
```

### Pick next task

```bash
ocb pick                      # Grab first TODO and start it
ocb pick --priority           # Pick highest priority TODO
```

### Show active task

```bash
ocb active                    # What am I working on?
ocb active --json
```

### Comments

```bash
ocb comment OCB-42 "Found the root cause"
```

## For AI Agents

This CLI is designed to be AI-friendly:

- **Simple commands** — fewer tokens than curl + JSON
- **Predictable output** — easy to parse
- **JSON mode** — `--json` flag on most commands
- **Task IDs** — accepts `OCB-42` or just `42`

Example agent workflow:
```bash
# Check for work
ocb todo

# Pick up a task
ocb pick --priority

# Show what I'm working on
ocb active

# Add progress notes
ocb comment 43 "Implemented the core feature"

# Mark done
ocb done 43
```

## Statuses

- `TODO` — Ready to work on
- `IN_PROGRESS` — Currently being worked on
- `NEEDS_REVIEW` — Ready for human review
- `DONE` — Complete
- `BLOCKED` — Stuck, needs intervention

## Priorities

- `CRITICAL` — Drop everything
- `HIGH` — Important
- `MEDIUM` — Normal (default)
- `LOW` — Nice to have

## License

MIT
