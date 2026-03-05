## Drive

```bash
# List files (default: all accessible files including shared drives)
gog drive ls --max 20
gog drive ls --parent <folderId> --max 20
gog drive ls --no-all-drives

# Search files
gog drive search "invoice" --max 20
gog drive search "mimeType = 'application/pdf'" --raw-query

# Get file metadata
gog drive get <fileId>
gog drive url <fileId>

# Download file
gog drive download <fileId> --out ./downloaded.bin

# Export Google Workspace files
gog drive download <fileId> --format pdf --out ./exported.pdf
gog drive download <fileId> --format docx --out ./doc.docx

# Upload file
gog drive upload ./path/to/file --parent <folderId>
gog drive upload ./file.docx --convert
gog drive upload ./file --replace <fileId>

# Copy file
gog drive copy <fileId> "Copy Name"

# Organize
gog drive mkdir "New Folder"
gog drive mkdir "New Folder" --parent <parentFolderId>
gog drive rename <fileId> "New Name"
gog drive move <fileId> --parent <destinationFolderId>
gog drive delete <fileId>
gog drive delete <fileId> --permanent

# Permissions
gog drive permissions <fileId>
gog drive share <fileId> --to user --email user@example.com --role reader
gog drive share <fileId> --to user --email user@example.com --role writer
gog drive unshare <fileId> --permission-id <permissionId>

# Shared drives
gog drive drives --max 100
```
