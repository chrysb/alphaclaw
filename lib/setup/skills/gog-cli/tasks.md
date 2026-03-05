## Tasks

```bash
# List task lists
gog tasks lists

# List tasks in a list
gog tasks list <tasklistId> --max 50

# Get single task
gog tasks get <tasklistId> <taskId>

# Create task list
gog tasks lists create "My List"

# Add task
gog tasks add <tasklistId> --title "Task title"
gog tasks add <tasklistId> --title "Weekly sync" --due 2025-02-01 --repeat weekly --repeat-count 4

# Update task
gog tasks update <tasklistId> <taskId> --title "Updated title"

# Complete / uncomplete task
gog tasks done <tasklistId> <taskId>
gog tasks undo <tasklistId> <taskId>

# Delete task / clear completed
gog tasks delete <tasklistId> <taskId>
gog tasks clear <tasklistId>
```

Due dates are date-only; time components may be ignored by Google Tasks.
