## Docs

```bash
# Document info
gog docs info <docId>

# Read document text
gog docs cat <docId>
gog docs cat <docId> --max-bytes 10000
gog docs cat <docId> --tab "Notes"
gog docs cat <docId> --all-tabs

# List tabs
gog docs list-tabs <docId>

# Create document
gog docs create "My Doc"
gog docs create "My Doc" --file ./doc.md

# Copy document
gog docs copy <docId> "My Doc Copy"

# Export
gog docs export <docId> --format pdf --out ./doc.pdf
gog docs export <docId> --format docx --out ./doc.docx
gog docs export <docId> --format txt --out ./doc.txt

# Update document content (markdown)
gog docs update <docId> --format markdown --content-file ./doc.md
gog docs write <docId> --replace --markdown --file ./doc.md

# Find and replace
gog docs find-replace <docId> "old text" "new text"

# Sed-style editing (sedmat) with markdown formatting
gog docs sed <docId> 's/hello/**hello**/'          # bold
gog docs sed <docId> 's/hello/*hello*/'             # italic
gog docs sed <docId> 's/hello/`hello`/'             # monospace
gog docs sed <docId> 's/hello/__hello__/'           # underline
gog docs sed <docId> 's/Google/[Google](https://google.com)/'  # link
gog docs sed <docId> 's/{{LOGO}}/![](https://example.com/logo.png)/'  # image

# Tables via sedmat
gog docs sed <docId> 's/{{TABLE}}/|3x4|/'           # create 3-row, 4-col table
gog docs sed <docId> 's/|1|[A1]/**Name**/'          # set cell A1
```
