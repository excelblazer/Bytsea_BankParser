# Template Parser Implementation Reference

## Architecture

```
OCR Text Input
    ↓
parseWithTemplateDetection()
    ├─→ extractMetadata()
    │   ├─ Bank name detection
    │   ├─ Account holder extraction
    │   └─ Statement period parsing
    │
    ├─→ normalizeText()
    │   ├─ Whitespace normalization
    │   ├─ OCR error correction
    │   └─ Character cleanup
    │
    └─→ detectAndExtractTransactions()
        ├─ findTransactionHeader()
        ├─ findSectionEnd()
        ├─ looksLikeTransaction()
        └─ parseTransactionLine()
            ├─ Date extraction & normalization
            ├─ Amount parsing
            ├─ Description extraction
            └─ Debit/credit detection
```

## Core Patterns

### Date Patterns
```typescript
// Supported formats:
/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/
// Matches: 02/15/2009, 15-02-09, 15/2/9

|\b(\d{1,2})\s+([A-Z][a-z]{2})\s+(\d{4})\b/
// Matches: 15 Feb 2009, 1 Mar 2008
```

### Amount Patterns
```typescript
// Captures amounts with optional currency and separators:
/([+-]?\$?)(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/
// Matches: 1234.56, $1,234.56, 1234, 12.5
```

### Transaction Header Patterns
```typescript
const headerPatterns = [
  /date|transaction|amount/i,
  /posted|description|debit|credit/i,
  /^\s*(\d{1,2}\/\d{1,2}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i
];
```

### Section End Patterns
```typescript
const endPatterns = [
  /^total|^balance|^summary|^ending|^fees|^interest|^average|^thank you/i,
  /^[A-Z][A-Za-z]+\s+[A-Z]/  // New section header
];
```

## Key Functions

### parseWithTemplateDetection(text: string)
**Purpose**: Main entry point for parsing  
**Returns**: ParsedTransaction[]  
**Logic**:
1. Extract metadata from text
2. Normalize text for patterns
3. Detect and extract transactions
4. Return structured array

### extractMetadata(text: string)
**Purpose**: Extract account and statement information  
**Returns**: Metadata object with:
- `bankName`: Detected bank
- `accountHolder`: Customer name
- `accountNumber`: Account identifier
- `statementPeriod`: Date range
- `currency`: Currency code

**Patterns Used**:
```typescript
// Account holder
/(?:Account.*?Holder|Customer Name|Name)[\s:]*([A-Z][A-Za-z\s]+)/i

// Account number  
/Account Number[:\s]+([0-9\-]+)/i
/Account\s*#?\s*([0-9\-]{10,})/i

// Statement period
/(?:Statement Period|Period|For the period|Statement Date)[\s:]*(...)/i
```

### normalizeText(text: string)
**Purpose**: Clean OCR text for better pattern matching  
**Transformations**:
- `\r\n` → `\n` (normalize line breaks)
- Multiple spaces → Single space
- `l` or `I` → `1` (common OCR error)
- `O` → `0` (common OCR error)
- `S` → `5` (common OCR error)

### detectAndExtractTransactions(text, metadata)
**Purpose**: Main transaction extraction logic  
**Steps**:
1. Split text into lines
2. Find transaction section header
3. Determine section boundaries
4. Parse each line as potential transaction
5. Return validated transactions

### findTransactionHeader(lines[])
**Purpose**: Locate where transactions start  
**Algorithm**:
1. Look in first 20 lines for header keywords
2. Count pattern matches per line
3. Return index of line with 2+ matches
4. Fallback: Find first date pattern

**Returns**: Line index or -1

### findSectionEnd(lines[], startIndex)
**Purpose**: Find where transactions end  
**Algorithm**:
1. Look for section end keywords (Total, Balance, etc.)
2. Check for new section headers
3. Monitor for 100+ lines without dates
4. Return first match

### looksLikeTransaction(line)
**Purpose**: Validate if line contains transaction  
**Checks**:
- Has a date (MM/DD/YYYY or DD MMM format)
- Has an amount (number with decimals or $)
- Has description text (2+ uppercase letters)
- **Returns**: true only if all checks pass

### parseTransactionLine(line, metadata)
**Purpose**: Extract data from single transaction line  
**Process**:
1. Extract date using regex match
2. Convert date to ISO format (YYYY-MM-DD)
3. Extract amount (rightmost numeric value)
4. Extract description (text between date and amount)
5. Build and return ParsedTransaction

**Error Handling**:
- Returns `null` if any field extraction fails
- Logged to console for debugging
- Line skipped gracefully

### getMonthNumber(monthStr: string)
**Purpose**: Convert month abbreviation to number  
**Map**:
```typescript
{
  'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
  'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
  'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
}
```

### extractTransactionsWithoutHeader(lines[], metadata)
**Purpose**: Fallback extraction if headers not found  
**Algorithm**:
1. Scan all lines
2. Check if each looks like transaction
3. Parse matching lines
4. Return collected transactions

## Data Flow Examples

### Example 1: Standard Bank Statement

**Input Text**:
```
STATEMENT OF ACCOUNT
Account Holder: John Doe
Account Number: ****5678
Statement Period: Feb 1, 2009 - Feb 28, 2009

Date Description Amount
02/01/2009 Opening Balance 1,000.00
02/03/2009 PURCHASE - AMAZON -25.50
02/05/2009 DIRECT DEPOSIT 2,000.00

Balance: 2,974.50
```

**Parsing Steps**:
1. Extract metadata:
   - accountHolder: "John Doe"
   - accountNumber: "****5678"
   - statementPeriod: "Feb 1, 2009 - Feb 28, 2009"

2. Find header: Line 7 ("Date Description Amount")

3. Extract transactions:
   - Line 8: "02/01/2009 Opening Balance 1,000.00" → ParsedTransaction
   - Line 9: "02/03/2009 PURCHASE - AMAZON -25.50" → ParsedTransaction
   - Line 10: "02/05/2009 DIRECT DEPOSIT 2,000.00" → ParsedTransaction

4. Stop at: Line 12 ("Balance: 2,974.50")

**Output**:
```json
[
  {
    "transactionDate": "2009-02-01",
    "description": "Opening Balance",
    "amount": 1000.00
  },
  {
    "transactionDate": "2009-02-03",
    "description": "PURCHASE - AMAZON",
    "amount": -25.50
  },
  {
    "transactionDate": "2009-02-05",
    "description": "DIRECT DEPOSIT",
    "amount": 2000.00
  }
]
```

### Example 2: OCR'd Statement

**Input Text** (with OCR errors):
```
Date Description Amou nt
O2/O1/2OO9 TESCO METRO -25.5O
O2/O3/2OO9 ATM WITHDRAWAL -1OO.OO
O2/O5/2OO9 SALARY DEPOSIT 2OOO.OO
```

**Normalization**:
1. `O` → `0`: "02/01/2009 TESCO METRO -25.50"
2. Clean: "02/03/2009 ATM WITHDRAWAL -100.00"
3. Fixes: "02/05/2009 SALARY DEPOSIT 2000.00"

**Output**: Correctly parsed despite OCR errors!

## Error Scenarios

### Scenario 1: No Header Found
**Detection**: `findTransactionHeader()` returns -1  
**Action**: Use `extractTransactionsWithoutHeader()`  
**Result**: Pattern-based extraction with fallback logic

### Scenario 2: Invalid Date
**Input**: "02/32/2009"  
**Action**: Parse fails, line rejected  
**Result**: Line skipped, logged to console

### Scenario 3: Missing Amount
**Input**: "02/01/2009 Transfer Pending"  
**Action**: `looksLikeTransaction()` returns false  
**Result**: Line skipped as not a transaction

### Scenario 4: Duplicate Transaction
**Input**: Same line repeated twice  
**Action**: Both parsed (could add deduplication)  
**Result**: Duplicates included (user can filter)

## Performance Considerations

### Time Complexity
- **Header Detection**: O(n) where n = lines searched (~20)
- **Section End**: O(n) where n = transaction lines
- **Line Parsing**: O(m) where m = chars per line
- **Total**: O(n) - Linear time complexity

### Space Complexity
- **Text Storage**: O(t) where t = text length
- **Transactions Array**: O(k) where k = transaction count
- **Metadata Object**: O(1) - constant size
- **Total**: O(t + k)

### Optimization Tips
1. Limit lines searched for header (~20 lines)
2. Exit early when section ends found
3. Cache compiled regex patterns
4. Use string.substring() for large texts

## Testing Checklist

- [ ] Header detection (with and without headers)
- [ ] Date format variations (MM/DD/YYYY, DD MMM YYYY)
- [ ] Amount extraction (with/without decimals, with currency)
- [ ] Multi-line descriptions
- [ ] Debit/credit detection
- [ ] OCR error handling
- [ ] Edge cases (empty lines, extra whitespace)
- [ ] Large statements (100+ transactions)
- [ ] Different bank formats
- [ ] Fallback extraction (no header)

## Future Enhancements

1. **Machine Learning**: Train model to detect various bank layouts
2. **Bank-Specific Rules**: Custom extractors for Chase, Wells Fargo, etc.
3. **Confidence Scoring**: Rate accuracy of each extraction
4. **Balance Reconciliation**: Validate sum of transactions
5. **Multi-Language**: Support non-English statements
6. **Duplicate Detection**: Flag similar consecutive transactions
7. **Categorization**: Automatically categorize transactions
8. **Trend Analysis**: Identify spending patterns
