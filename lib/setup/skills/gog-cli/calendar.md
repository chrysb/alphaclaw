## Calendar

```bash
# List calendars
gog calendar calendars

# Today's events
gog calendar events <calendarId> --today
gog calendar events <calendarId> --tomorrow
gog calendar events <calendarId> --week
gog calendar events <calendarId> --days 3

# Events from all calendars
gog calendar events --all --today

# Date range
gog calendar events <calendarId> --from 2025-01-15T00:00:00Z --to 2025-01-22T00:00:00Z

# Search events
gog calendar search "meeting" --today
gog calendar search "standup" --days 30

# Get single event
gog calendar event <calendarId> <eventId>

# Create event
gog calendar create <calendarId> --summary "Meeting" --from 2025-01-15T10:00:00Z --to 2025-01-15T11:00:00Z
gog calendar create <calendarId> --summary "Team Sync" --from 2025-01-15T14:00:00Z --to 2025-01-15T15:00:00Z --attendees "alice@example.com,bob@example.com" --location "Zoom"

# Recurrence + reminders
gog calendar create <calendarId> --summary "Weekly" --from 2025-01-15T09:00:00Z --to 2025-01-15T09:30:00Z --rrule "RRULE:FREQ=WEEKLY" --reminder "popup:15m"

# Update event
gog calendar update <calendarId> <eventId> --summary "Updated" --from 2025-01-15T11:00:00Z --to 2025-01-15T12:00:00Z

# Add attendees without replacing existing
gog calendar update <calendarId> <eventId> --add-attendee "alice@example.com"

# Send notifications
gog calendar create <calendarId> --summary "Sync" --from ... --to ... --send-updates all
gog calendar update <calendarId> <eventId> --send-updates externalOnly

# Delete event
gog calendar delete <calendarId> <eventId>

# RSVP to invitation
gog calendar respond <calendarId> <eventId> --status accepted
gog calendar respond <calendarId> <eventId> --status declined
gog calendar respond <calendarId> <eventId> --status tentative

# Free/busy check
gog calendar freebusy --calendars "primary,work@example.com" --from 2025-01-15T00:00:00Z --to 2025-01-16T00:00:00Z

# Conflict detection
gog calendar conflicts --calendars "primary" --today

# Special event types
gog calendar create primary --event-type focus-time --from ... --to ...
gog calendar create primary --event-type out-of-office --from ... --to ... --all-day
```

JSON output includes `startDayOfWeek`, `endDayOfWeek`, `timezone`, and `startLocal`/`endLocal` fields.
Use `primary` as calendarId for the user's default calendar.
