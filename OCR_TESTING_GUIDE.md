# OCR Parser Testing Guide

## Current Status

The OCR parsing system has been enhanced with **4 extraction strategies** that try increasingly flexible approaches:

1. **Strategy 1**: Strict format - Date at start, description, amount at end
2. **Strategy 2**: Flexible date/amount - Date and amount can be anywhere in line
3. **Strategy 3**: Multi-line - Date on one line, amount on next
4. **Strategy 4**: Non-adjacent - Any date matched with nearby amount (fallback)

## How to Test

### 1. Start Development Server
```bash
npm run dev
```
Open http://localhost:5173 in browser

### 2. Upload Dummy PDF
- Click "Choose File" and select `Dummy Statement Feb 6 2009.pdf`
- Select "OCR + Parse" option
- Click "Process"

### 3. Check Console Output

Open **DevTools Console** (F12) and look for these sections:

#### Debug Section (App.tsx logging)
```
=== OCR EXTRACTION DEBUG ===
Total extracted characters: 3207
Total extracted lines: 45
First 2000 chars: [PDF text here]
```

This shows what text was extracted from the PDF.

#### Parsing Section (templateParser.ts logging)
```
=== TEMPLATE-BASED PARSING START ===
Text length: 3207
Metadata detected: {...}
Strategy 1: Date at start, amount at end...
Strategy 2: Date + amount with flexible patterns...
...
```

This shows which extraction strategy succeeded.

### 4. View Extracted Transactions

```
=== PARSING RESULT ===
Transactions parsed: N
First transaction: {...}
```

If `N > 0`, the parser is working!

## Detailed PDF Analysis (Advanced)

### Option A: Analyze PDF Text Format
In browser console, run:
```javascript
await testDummyPDF()
```

This will show:
- Raw PDF text items with positions
- Continuous text extraction
- Line-based extraction (grouped by Y coordinate)
- Pattern matching results

### Option B: Manual Pattern Testing
Create a test file with sample text from the PDF and test patterns:

```javascript
const sampleLine = "2/4/2009 MWAVE ELECTRONICS 12.00";
const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
const amountRegex = /([\-\$]?\d{1,3}(?:,\d{3})*\.\d{2})/;

console.log("Date match:", dateRegex.exec(sampleLine));
console.log("Amount match:", amountRegex.exec(sampleLine));
```

## Expected Format (Dummy PDF)

Based on typical bank statements, the dummy PDF likely contains transactions like:
```
Date         | Description      | Amount
2/4/2009     | MWAVE ELECT      | 12.00
2/4/2009     | CHECK DEPOSIT    | 100.00
```

## Troubleshooting

### No transactions found
1. Check console for which strategy got furthest
2. Run `await testDummyPDF()` to see actual PDF text structure
3. Compare patterns with actual text format
4. If needed, add new extraction strategy

### Wrong amount signs
- Check if line contains "debit", "withdrawal", "charge", "payment out"
- Look for leading `-` or `$` signs
- Amount convention: negative = debit, positive = credit

### Date format issues
- Pattern supports: `MM/DD/YYYY`, `MM-DD-YYYY`, `MM/DD/YY`
- Converts YY to 20YY automatically
- If dates not found, might be in different format (e.g., "Feb 4, 2009")

## Files Modified

- `services/templateParser.ts` - Enhanced extraction strategies
- `services/ocrService.ts` - Improved PDF text extraction
- `App.tsx` - Added detailed debugging logs
- Created test utilities: `test-dummy-pdf.js`, `test-patterns.js`

## Next Steps

1. Upload dummy PDF and check console output
2. If no transactions found, run PDF analysis tool
3. Report the actual text format from `await testDummyPDF()`
4. Adjust patterns accordingly or add new extraction strategy
