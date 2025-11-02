/**
 * DIRECT PARSER TESTER
 * Use this to test the parser with sample bank statement text
 * Copy the parser function here or paste sample text to test extraction
 */

// Sample bank statement texts to test
const SAMPLE_STATEMENTS = {
  format1: `
    ACCOUNT STATEMENT - February 2009
    Account Holder: John Doe
    Account Number: ****1234
    
    Transaction Details
    Date          Description              Amount
    2/4/2009      MWAVE ELECTRONICS        $12.00
    2/5/2009      CHECK DEPOSIT            $100.00
    2/6/2009      ATM WITHDRAWAL           -$50.00
    2/10/2009     GROCERY STORE            -$45.50
  `,
  
  format2: `
    2009-02-04 | MWAVE ELECTRONICS | 12.00
    2009-02-05 | CHECK DEPOSIT | 100.00
    2009-02-06 | ATM WITHDRAWAL | -50.00
  `,
  
  format3: `
    Transaction Date: 2/4/2009
    Description: MWAVE ELECTRONICS
    Amount: $12.00
    
    Transaction Date: 2/5/2009
    Description: CHECK DEPOSIT
    Amount: $100.00
  `,
  
  dummyPDF: `
    STATEMENT FOR JOHN DOE - Period Ending February 6, 2009
    Account Number XXXX1234
    
    TRANSACTION SUMMARY
    
    Beginning Balance                                         $2,500.00
    
    DEPOSITS AND OTHER ADDITIONS
    Deposit                  2/4/2009                         $100.00
    
    WITHDRAWALS AND OTHER DEDUCTIONS
    Check Number 1001        2/4/2009                         ($50.00)
    Debit Card Purchase
    MWAVE ELECTRONICS        2/4/2009    ATM               ($12.00)
    
    Ending Balance                                           $2,538.00
  `
};

/**
 * Test extraction patterns directly
 */
function testExtraction(textInput) {
  console.log('\n🧪 PATTERN EXTRACTION TEST\n');
  console.log('Input text length:', textInput.length);
  console.log('Input lines:', textInput.trim().split('\n').length);
  
  const lines = textInput.trim().split('\n');
  
  // Test patterns
  const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
  const amountRegex = /([\-\$]?\d{1,3}(?:,\d{3})*\.\d{2})/;
  
  console.log('\n--- Lines with dates and amounts ---');
  lines.forEach((line, idx) => {
    const dateMatch = dateRegex.exec(line);
    const amountMatch = amountRegex.exec(line);
    
    if (dateMatch || amountMatch) {
      console.log(`Line ${idx}:`, line.substring(0, 80));
      if (dateMatch) console.log(`  Date: ${dateMatch[0]}`);
      if (amountMatch) console.log(`  Amount: ${amountMatch[0]}`);
    }
  });
  
  // Try extraction
  console.log('\n--- Attempted Extraction ---');
  const extracted = [];
  
  for (let i = 0; i < lines.length - 1; i++) {
    const current = lines[i].trim();
    const next = lines[i + 1].trim();
    
    const dateMatch = dateRegex.exec(current);
    const amountMatch = amountRegex.exec(current);
    
    if (dateMatch && amountMatch) {
      const description = current
        .replace(dateRegex, '')
        .replace(amountRegex, '')
        .trim();
      
      extracted.push({
        date: dateMatch[0],
        description,
        amount: amountMatch[0]
      });
    }
  }
  
  if (extracted.length > 0) {
    console.log(`✓ Found ${extracted.length} transactions:`);
    extracted.forEach((txn, i) => {
      console.log(`[${i}] ${txn.date} | ${txn.description} | ${txn.amount}`);
    });
  } else {
    console.log('✗ No transactions found');
  }
  
  return extracted;
}

/**
 * Simulate the actual template parser
 */
async function testTemplateParser(textInput) {
  console.log('\n🔬 TEMPLATE PARSER SIMULATION\n');
  
  // Import the actual parser (if available)
  try {
    // This would need the actual parseWithTemplateDetection function
    console.log('Note: This requires the actual parser to be imported');
    console.log('For now, use the web app to test actual parsing');
    return;
  } catch (err) {
    console.error('Parser not available:', err.message);
  }
}

/**
 * Quick test runner
 */
function quickTest(format = 'format1') {
  console.log(`\n✨ QUICK TEST: ${format}\n`);
  const text = SAMPLE_STATEMENTS[format];
  if (!text) {
    console.error('Unknown format. Available:', Object.keys(SAMPLE_STATEMENTS));
    return;
  }
  return testExtraction(text);
}

/**
 * Test all sample formats
 */
function testAll() {
  console.log('\n🚀 TESTING ALL SAMPLE FORMATS\n');
  Object.keys(SAMPLE_STATEMENTS).forEach(format => {
    quickTest(format);
    console.log('\n' + '='.repeat(60) + '\n');
  });
}

// Export for use
console.log(`
✅ Parser Test Utility Loaded!

Usage:
  quickTest('format1')  - Test specific format
  quickTest('format2')
  quickTest('format3')
  quickTest('dummyPDF')
  
  testAll()             - Test all formats
  testExtraction(text)  - Test custom text
  
Available formats: ${Object.keys(SAMPLE_STATEMENTS).join(', ')}

Example:
  const text = \`2/4/2009 MWAVE 12.00\`;
  testExtraction(text);
`);
