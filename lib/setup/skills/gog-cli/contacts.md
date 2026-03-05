## Contacts

```bash
# List personal contacts
gog contacts list --max 50

# Search contacts
gog contacts search "Ada" --max 50

# Get contact by resource name or email
gog contacts get people/<resourceName>
gog contacts get user@example.com

# Create contact
gog contacts create --given "John" --family "Doe" --email "john@example.com" --phone "+1234567890"

# Update contact
gog contacts update people/<resourceName> --given "Jane" --email "jane@example.com" --notes "Updated"

# Delete contact
gog contacts delete people/<resourceName>

# Other contacts (people you've interacted with)
gog contacts other list --max 50
gog contacts other search "John" --max 50

# Workspace directory (Google Workspace only)
gog contacts directory list --max 50
gog contacts directory search "Jane" --max 50
```
