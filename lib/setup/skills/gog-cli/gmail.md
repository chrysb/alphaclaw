## Gmail

```bash
# Search threads (returns thread IDs + snippets)
gog gmail search 'newer_than:7d' --max 10
gog gmail search 'from:alice@example.com subject:invoice' --max 20

# Search individual messages (add --include-body to fetch bodies)
gog gmail messages search 'newer_than:7d' --max 10 --include-body

# Read a thread and optionally download attachments
gog gmail thread get <threadId>
gog gmail thread get <threadId> --download --out-dir ./attachments

# Read a single message
gog gmail get <messageId>

# Modify labels on a thread
gog gmail thread modify <threadId> --add STARRED --remove INBOX

# Send email (plain text)
gog gmail send --to recipient@example.com --subject "Subject" --body "Body text"

# Send email (HTML)
gog gmail send --to recipient@example.com --subject "Subject" --body "Plain fallback" --body-html "<p>Hello</p>"

# Reply to a message (with quoted original)
gog gmail send --reply-to-message-id <messageId> --quote --to recipient@example.com --subject "Re: Subject" --body "Reply text"

# Send with body from file or stdin
gog gmail send --to recipient@example.com --subject "Subject" --body-file ./message.txt
gog gmail send --to recipient@example.com --subject "Subject" --body-file -

# Labels
gog gmail labels list
gog gmail labels get INBOX --json
gog gmail labels create "My Label"
gog gmail labels delete <labelIdOrName>

# Drafts
gog gmail drafts list
gog gmail drafts create --to recipient@example.com --subject "Draft" --body "Body"
gog gmail drafts update <draftId> --subject "Updated" --body "New body"
gog gmail drafts send <draftId>

# Batch operations
gog gmail batch modify <messageId1> <messageId2> --add STARRED --remove INBOX
gog gmail batch delete <messageId1> <messageId2>

# Filters
gog gmail filters list
gog gmail filters create --from 'noreply@example.com' --add-label 'Notifications'
gog gmail filters delete <filterId>

# Vacation / auto-reply
gog gmail vacation get
gog gmail vacation enable --subject "Out of office" --message "I'm away"
gog gmail vacation disable

# History (for incremental sync)
gog gmail history --since <historyId>
```

Output: use `--json` for structured output, `--plain` for TSV.
