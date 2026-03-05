## Sheets

```bash
# Spreadsheet metadata (sheets list, properties)
gog sheets metadata <spreadsheetId>

# Read cell range
gog sheets get <spreadsheetId> 'Sheet1!A1:B10'

# Write cells (pipe-delimited rows, comma-separated columns)
gog sheets update <spreadsheetId> 'A1' 'val1|val2,val3|val4'
gog sheets update <spreadsheetId> 'A1' --values-json '[["a","b"],["c","d"]]'

# Append rows
gog sheets append <spreadsheetId> 'Sheet1!A:C' 'new|row|data'

# Clear range
gog sheets clear <spreadsheetId> 'Sheet1!A1:B10'

# Create spreadsheet
gog sheets create "My Spreadsheet" --sheets "Sheet1,Sheet2"

# Copy spreadsheet
gog sheets copy <spreadsheetId> "Copy Name"

# Export
gog sheets export <spreadsheetId> --format pdf --out ./sheet.pdf
gog sheets export <spreadsheetId> --format xlsx --out ./sheet.xlsx

# Format cells
gog sheets format <spreadsheetId> 'Sheet1!A1:B2' --format-json '{"textFormat":{"bold":true}}' --format-fields 'userEnteredFormat.textFormat.bold'

# Insert rows/columns
gog sheets insert <spreadsheetId> "Sheet1" rows 2 --count 3
gog sheets insert <spreadsheetId> "Sheet1" cols 3 --after

# Cell notes and hyperlinks
gog sheets notes <spreadsheetId> 'Sheet1!A1:B10'
gog sheets links <spreadsheetId> 'Sheet1!A1:B10'
```

Write format: rows separated by `,` and columns by `|`. Use `--values-json` for complex data.
`--copy-validation-from` copies data validation from a reference range when updating/appending.
