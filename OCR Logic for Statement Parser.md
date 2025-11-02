# Financial Statement OCR Parsing Logic - Industry Standards

## 1. Bank Statement Parsing

### Standard Fields to Extract
```javascript
const bankStatementSchema = {
  // Header Information
  accountHolderName: String,
  accountNumber: String,      // Usually masked: XXXX-XXXX-1234
  bankName: String,
  bankAddress: String,
  statementPeriod: {
    startDate: Date,
    endDate: Date
  },
  
  // Summary Information
  openingBalance: Number,
  closingBalance: Number,
  totalCredits: Number,
  totalDebits: Number,
  
  // Transactions
  transactions: [{
    date: Date,              // Format: DD/MM/YYYY or MM/DD/YYYY
    description: String,     // Transaction description
    referenceNumber: String, // Check #, Ref #, Transaction ID
    debit: Number,          // Amount withdrawn
    credit: Number,         // Amount deposited
    balance: Number,        // Running balance
    category: String        // Optional: auto-categorized
  }]
};
```

### Recognition Patterns
```javascript
const bankPatterns = {
  // Account number patterns
  accountNumber: [
    /Account\s*(?:Number|No\.?)[\s:]*(\d{4}[-\s]?\d{4}[-\s]?\d{4})/i,
    /A\/C\s*(?:No\.?)[\s:]*(\d+)/i,
    /Account[\s:]+([X\*]{4,}[-\s]?\d{4})/i
  ],
  
  // Date patterns
  statementDate: [
    /Statement\s*(?:Date|Period)[\s:]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\s*(?:to|-)?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})?/i,
    /From[\s:]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\s*To[\s:]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i
  ],
  
  // Balance patterns
  openingBalance: /Opening\s*Balance[\s:]*[$₹€£]?\s*([\d,]+\.?\d{0,2})/i,
  closingBalance: /Closing\s*Balance[\s:]*[$₹€£]?\s*([\d,]+\.?\d{0,2})/i,
  
  // Transaction table headers (for column detection)
  transactionHeaders: [
    /Date.*Description.*Debit.*Credit.*Balance/i,
    /Date.*Particulars.*Withdrawal.*Deposit.*Balance/i,
    /Trans\.?\s*Date.*Details.*Dr\.?.*Cr\.?.*Balance/i
  ]
};
```

### Transaction Categorization Logic
```javascript
const transactionCategories = {
  'ATM Withdrawal': /ATM\s*WD|CASH\s*WITHDRAWAL|ATM\s*DEBIT/i,
  'Salary': /SALARY|PAYROLL|WAGE|INCOME/i,
  'Transfer': /TRANSFER|NEFT|IMPS|RTGS|UPI/i,
  'Bill Payment': /BILL\s*PAY|ELECTRICITY|WATER|GAS|UTILITY/i,
  'Shopping': /AMAZON|FLIPKART|WALMART|SHOPPING|RETAIL/i,
  'Dining': /RESTAURANT|CAFE|FOOD|ZOMATO|SWIGGY|UBER\s*EATS/i,
  'Fuel': /FUEL|PETROL|DIESEL|GAS\s*STATION/i,
  'Investment': /MUTUAL\s*FUND|SIP|STOCK|INVESTMENT/i,
  'Loan': /LOAN\s*EMI|MORTGAGE|CREDIT\s*CARD/i,
  'Interest': /INT\s*CREDIT|INTEREST\s*EARNED/i,
  'Fees': /FEE|CHARGE|SERVICE\s*CHARGE/i
};
```

---

## 2. Credit Card Statement Parsing

### Standard Fields to Extract
```javascript
const creditCardSchema = {
  // Header Information
  cardHolderName: String,
  cardNumber: String,          // Masked: XXXX-XXXX-XXXX-1234
  cardType: String,            // Visa, Mastercard, Amex, etc.
  issuingBank: String,
  statementDate: Date,
  
  // Account Summary
  previousBalance: Number,
  paymentsReceived: Number,
  newCharges: Number,
  feesCharged: Number,
  interestCharged: Number,
  currentBalance: Number,
  minimumPaymentDue: Number,
  paymentDueDate: Date,
  creditLimit: Number,
  availableCredit: Number,
  
  // Transactions
  transactions: [{
    transactionDate: Date,     // When purchase was made
    postingDate: Date,         // When it posted to account
    description: String,
    merchant: String,
    category: String,          // Shopping, Dining, Travel, etc.
    amount: Number,
    foreignAmount: Number,     // If international transaction
    currency: String,
    isRefund: Boolean
  }],
  
  // Rewards/Points
  rewardsSummary: {
    previousBalance: Number,
    pointsEarned: Number,
    pointsRedeemed: Number,
    currentBalance: Number
  }
};
```

### Recognition Patterns
```javascript
const creditCardPatterns = {
  // Card identification
  cardNumber: [
    /Card\s*(?:Number|No\.?)[\s:]*([X\*]{4}[-\s]?[X\*]{4}[-\s]?[X\*]{4}[-\s]?\d{4})/i,
    /(?:XXXX|****)\s*(\d{4})/i
  ],
  
  // Important dates
  statementDate: /Statement\s*(?:Date|Closing)[\s:]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
  dueDate: /Payment\s*Due\s*(?:Date|By)[\s:]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
  
  // Financial summary
  currentBalance: /(?:Current|Total|New)\s*Balance[\s:]*[$₹€£]?\s*([\d,]+\.?\d{0,2})/i,
  minimumDue: /Minimum\s*(?:Payment\s*)?Due[\s:]*[$₹€£]?\s*([\d,]+\.?\d{0,2})/i,
  creditLimit: /Credit\s*Limit[\s:]*[$₹€£]?\s*([\d,]+\.?\d{0,2})/i,
  
  // Transaction patterns
  transactionHeaders: [
    /Trans\.?\s*Date.*Post\.?\s*Date.*Description.*Amount/i,
    /Date.*Merchant.*Category.*Amount/i,
    /Transaction\s*Details.*Amount/i
  ],
  
  // Merchant category codes (MCC)
  merchantCategories: {
    'Airlines': /AIRLINE|AIRWAYS|FLIGHT/i,
    'Hotels': /HOTEL|RESORT|ACCOMMODATION/i,
    'Restaurants': /RESTAURANT|CAFE|BAR|FOOD/i,
    'Gas Stations': /FUEL|GAS|PETROL|SHELL|BP|EXXON/i,
    'Grocery': /GROCERY|SUPERMARKET|WALMART|TARGET|COSTCO/i,
    'Online Shopping': /AMAZON|EBAY|ALIBABA|ETSY/i,
    'Entertainment': /NETFLIX|SPOTIFY|CINEMA|THEATRE|GAMING/i,
    'Healthcare': /PHARMACY|HOSPITAL|MEDICAL|DOCTOR|CVS|WALGREENS/i,
    'Utilities': /ELECTRIC|WATER|GAS\s*COMPANY|INTERNET|PHONE/i,
    'Insurance': /INSURANCE|GEICO|STATE\s*FARM/i
  }
};
```

### Credit Card Specific Logic
```javascript
// Detect refunds/credits
function isRefund(transaction) {
  return transaction.amount < 0 || 
         /REFUND|CREDIT|RETURN|REVERSAL/i.test(transaction.description);
}

// Calculate interest charges
function identifyInterestCharges(transactions) {
  return transactions.filter(t => 
    /INTEREST|FINANCE\s*CHARGE|ANNUAL\s*FEE/i.test(t.description)
  );
}

// Foreign transaction detection
function isForeignTransaction(transaction) {
  return /FOREIGN|INTERNATIONAL|CONVERSION/i.test(transaction.description) ||
         transaction.currency !== 'USD'; // or base currency
}
```

---

## 3. Accounting Ledger Parsing

### Standard Fields to Extract
```javascript
const ledgerSchema = {
  // Ledger Information
  companyName: String,
  accountName: String,         // e.g., "Cash Account", "Accounts Payable"
  accountCode: String,         // e.g., "1000", "2100"
  fiscalPeriod: {
    startDate: Date,
    endDate: Date
  },
  
  // Balances
  openingBalance: {
    debit: Number,
    credit: Number
  },
  closingBalance: {
    debit: Number,
    credit: Number
  },
  
  // Entries
  entries: [{
    date: Date,
    voucherNumber: String,     // Journal entry reference
    particulars: String,       // Description
    debit: Number,
    credit: Number,
    balance: Number,
    contraAccount: String,     // The other account in double-entry
    narration: String,         // Detailed explanation
    entryType: String          // Payment, Receipt, Journal, etc.
  }]
};
```

### Recognition Patterns
```javascript
const ledgerPatterns = {
  // Account identification
  accountName: /(?:Account|Ledger)\s*Name[\s:]*(.+?)(?:\n|$)/i,
  accountCode: /(?:Account|Code|GL)\s*(?:Code|Number|No\.)[\s:]*([\d-]+)/i,
  
  // Period patterns
  fiscalPeriod: /Period[\s:]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\s*to\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
  
  // Balance patterns
  openingBalance: /Opening\s*Balance[\s:]*(?:Dr\.?|Debit)?\s*([\d,]+\.?\d{0,2})\s*(?:Cr\.?|Credit)?\s*([\d,]+\.?\d{0,2})?/i,
  closingBalance: /Closing\s*Balance[\s:]*(?:Dr\.?|Debit)?\s*([\d,]+\.?\d{0,2})\s*(?:Cr\.?|Credit)?\s*([\d,]+\.?\d{0,2})?/i,
  
  // Entry type detection
  entryTypes: {
    'Payment': /PAYMENT|PAID|DISBURSEMENT/i,
    'Receipt': /RECEIPT|RECEIVED|COLLECTION/i,
    'Journal': /JOURNAL|JV|ADJUSTMENT/i,
    'Purchase': /PURCHASE|BOUGHT|VENDOR/i,
    'Sales': /SALES|REVENUE|INVOICE/i,
    'Expense': /EXPENSE|COST|EXPENDITURE/i
  },
  
  // Voucher patterns
  voucherNumber: /(?:Voucher|V\.?No\.?|Ref\.?)[\s:]*([A-Z]*[\d-]+)/i,
  
  // Table headers
  ledgerHeaders: [
    /Date.*Particulars.*Voucher.*Debit.*Credit.*Balance/i,
    /Date.*Description.*Ref.*Dr\.?.*Cr\.?.*Balance/i,
    /Date.*Narration.*Debit.*Credit/i
  ]
};
```

### Ledger Validation Logic
```javascript
// Validate double-entry accounting
function validateLedgerBalance(entries) {
  const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0);
  const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0);
  
  return {
    isBalanced: Math.abs(totalDebit - totalCredit) < 0.01, // Account for rounding
    difference: totalDebit - totalCredit,
    totalDebit,
    totalCredit
  };
}

// Identify contra accounts
function identifyContraAccount(entry, allEntries) {
  // Find corresponding entry with same voucher number
  const relatedEntry = allEntries.find(e => 
    e.voucherNumber === entry.voucherNumber && 
    e.date === entry.date &&
    e !== entry
  );
  
  return relatedEntry ? relatedEntry.accountName : 'Multiple';
}
```

---

## 4. Invoice Statement Parsing

### Standard Fields to Extract
```javascript
const invoiceSchema = {
  // Invoice Header
  invoiceNumber: String,
  invoiceDate: Date,
  dueDate: Date,
  purchaseOrderNumber: String,
  
  // Vendor/Seller Information
  vendor: {
    name: String,
    address: String,
    taxId: String,            // VAT, GST, EIN, etc.
    phone: String,
    email: String
  },
  
  // Buyer Information
  buyer: {
    name: String,
    address: String,
    taxId: String,
    phone: String,
    email: String
  },
  
  // Line Items
  lineItems: [{
    itemNumber: String,
    description: String,
    quantity: Number,
    unit: String,             // pcs, kg, hours, etc.
    unitPrice: Number,
    discount: Number,
    taxRate: Number,
    taxAmount: Number,
    lineTotal: Number
  }],
  
  // Totals
  subtotal: Number,
  totalDiscount: Number,
  totalTax: Number,
  shippingCost: Number,
  totalAmount: Number,
  amountPaid: Number,
  balanceDue: Number,
  
  // Additional Info
  currency: String,
  paymentTerms: String,       // Net 30, Due on Receipt, etc.
  notes: String,
  bankDetails: {
    bankName: String,
    accountNumber: String,
    routingNumber: String,
    swiftCode: String
  }
};
```

### Recognition Patterns
```javascript
const invoicePatterns = {
  // Invoice identification
  invoiceNumber: [
    /Invoice\s*(?:Number|No\.?|#)[\s:]*([A-Z0-9-]+)/i,
    /Bill\s*(?:Number|No\.?)[\s:]*([A-Z0-9-]+)/i,
    /INV[\s-]?([0-9]+)/i
  ],
  
  // Dates
  invoiceDate: /Invoice\s*Date[\s:]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
  dueDate: /Due\s*Date[\s:]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
  
  // Tax identification
  taxId: [
    /(?:VAT|Tax|GST)\s*(?:ID|No\.?|Registration)[\s:]*([A-Z0-9-]+)/i,
    /(?:EIN|FEIN)[\s:]*(\d{2}-\d{7})/i,
    /GSTIN[\s:]*([\dA-Z]{15})/i  // Indian GST
  ],
  
  // Financial amounts
  subtotal: /Sub[\s-]?total[\s:]*[$₹€£]?\s*([\d,]+\.?\d{0,2})/i,
  tax: /(?:Tax|VAT|GST)[\s:]*[$₹€£]?\s*([\d,]+\.?\d{0,2})/i,
  total: /Total[\s:]*[$₹€£]?\s*([\d,]+\.?\d{0,2})/i,
  
  // Line item table headers
  lineItemHeaders: [
    /(?:Item|Description).*Qty.*(?:Rate|Price).*Amount/i,
    /Description.*Quantity.*Unit\s*Price.*Total/i,
    /#.*Product.*Qty.*Price.*Tax.*Total/i
  ],
  
  // Payment terms
  paymentTerms: [
    /Payment\s*Terms[\s:]*(.+?)(?:\n|$)/i,
    /(Net\s*\d+|Due\s*on\s*Receipt|COD|Advance)/i
  ]
};
```

### Invoice Validation Logic
```javascript
// Validate invoice calculations
function validateInvoice(invoice) {
  // Check line item totals
  const calculatedSubtotal = invoice.lineItems.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unitPrice - (item.discount || 0);
    return sum + lineTotal;
  }, 0);
  
  // Check tax calculation
  const calculatedTax = invoice.lineItems.reduce((sum, item) => {
    return sum + (item.taxAmount || 0);
  }, 0);
  
  // Check final total
  const calculatedTotal = calculatedSubtotal + calculatedTax + (invoice.shippingCost || 0);
  
  return {
    isValid: Math.abs(calculatedTotal - invoice.totalAmount) < 0.01,
    subtotalMatch: Math.abs(calculatedSubtotal - invoice.subtotal) < 0.01,
    taxMatch: Math.abs(calculatedTax - invoice.totalTax) < 0.01,
    differences: {
      subtotal: invoice.subtotal - calculatedSubtotal,
      tax: invoice.totalTax - calculatedTax,
      total: invoice.totalAmount - calculatedTotal
    }
  };
}

// Extract line items from table
function parseLineItemTable(text, headers) {
  // This would use table detection logic
  // Split by rows, identify columns, extract values
  // Return array of line items
}
```

---

## 5. Universal OCR Processing Pipeline

### Step-by-Step Processing Flow
```javascript
const ocrProcessingPipeline = {
  // Step 1: Document Type Detection
  detectDocumentType(ocrText) {
    const keywords = {
      bankStatement: ['account number', 'opening balance', 'closing balance', 'transaction'],
      creditCard: ['credit card', 'minimum payment due', 'credit limit', 'available credit'],
      ledger: ['ledger', 'voucher', 'contra', 'dr.', 'cr.', 'journal'],
      invoice: ['invoice', 'bill to', 'ship to', 'line item', 'due date']
    };
    
    // Score each type based on keyword presence
    // Return highest scoring type
  },
  
  // Step 2: Header/Footer Removal
  cleanDocument(text) {
    // Remove common headers/footers
    // Remove page numbers
    // Remove watermarks (if text)
    // Normalize whitespace
  },
  
  // Step 3: Table Detection
  detectTables(text) {
    // Look for aligned columns
    // Identify table boundaries
    // Extract table headers
    // Parse table rows
  },
  
  // Step 4: Entity Extraction
  extractEntities(text, documentType) {
    // Use regex patterns for document type
    // Extract dates, amounts, account numbers
    // Normalize formats
  },
  
  // Step 5: Validation
  validateExtraction(data, documentType) {
    // Check required fields present
    // Validate calculations
    // Check date ranges
    // Verify data consistency
  }
};
```

### Common Preprocessing Techniques
```javascript
// Currency normalization
function normalizeCurrency(amountString) {
  // Remove currency symbols
  const cleaned = amountString.replace(/[$₹€£,\s]/g, '');
  // Handle parentheses (negative numbers in accounting)
  if (/^\(.*\)$/.test(cleaned)) {
    return -parseFloat(cleaned.replace(/[()]/g, ''));
  }
  return parseFloat(cleaned);
}

// Date normalization
function normalizeDate(dateString) {
  // Handle multiple formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
  // Convert to ISO format
  // Validate date is reasonable
}

// Account number masking detection
function unmaskAccountNumber(maskedNumber, partialNumber) {
  // Combine masked portion with visible digits
  // Validate checksum if applicable
}
```

---

## 6. Quality Assurance & Confidence Scoring

### Confidence Scoring Logic
```javascript
function calculateExtractionConfidence(extractedData, ocrText) {
  let confidence = 100;
  
  // Deduct points for missing critical fields
  const criticalFields = ['date', 'amount', 'accountNumber'];
  criticalFields.forEach(field => {
    if (!extractedData[field]) confidence -= 20;
  });
  
  // Deduct for validation failures
  if (!validateDateRange(extractedData.dates)) confidence -= 15;
  if (!validateAmounts(extractedData.amounts)) confidence -= 15;
  
  // Deduct for OCR quality issues
  const ocrQuality = assessOCRQuality(ocrText);
  if (ocrQuality < 0.8) confidence -= 20;
  
  return Math.max(0, confidence);
}

function assessOCRQuality(text) {
  // Check for common OCR errors
  const errorPatterns = [
    /[Il1]{3,}/,  // Excessive I/l/1 confusion
    /[O0]{3,}/,   // Excessive O/0 confusion
    /[^\x00-\x7F]{10,}/  // Too many non-ASCII characters
  ];
  
  let quality = 1.0;
  errorPatterns.forEach(pattern => {
    if (pattern.test(text)) quality -= 0.1;
  });
  
  return Math.max(0, quality);
}
```

---

## 7. Implementation Recommendations

### Priority Order for Implementation
1. **Bank Statements** - Most common, standardized format
2. **Credit Card Statements** - Similar to bank, good ROI
3. **Invoices** - High value for businesses
4. **Ledgers** - More complex, implement last

### Error Handling Strategy
```javascript
const errorHandling = {
  lowConfidence: 'Flag for manual review (< 70%)',
  missingFields: 'Prompt user to verify specific fields',
  validationFailure: 'Show calculated vs. extracted differences',
  ocrFailure: 'Suggest image quality improvements',
  formatUnrecognized: 'Allow manual field mapping'
};
```

### User Feedback Loop
- Show confidence scores for each field
- Allow manual corrections
- Learn from corrections (store patterns)
- Export correction report
- Suggest better scan quality

This comprehensive logic covers industry-standard practices for parsing financial documents with OCR.