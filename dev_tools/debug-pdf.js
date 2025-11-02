/**
 * Debug utility to analyze PDF text extraction
 * Run this in browser console to see what text is extracted from the PDF
 */

// Store globally for inspection
window.__pdfDebugInfo = {};

/**
 * Analyze the structure of extracted text
 */
function analyzePDFText(text) {
  const lines = text.split('\n').filter(line => line.trim());
  
  console.log('=== PDF TEXT ANALYSIS ===');
  console.log('Total characters:', text.length);
  console.log('Total lines:', lines.length);
  console.log('');
  
  console.log('=== FIRST 50 LINES ===');
  lines.slice(0, 50).forEach((line, i) => {
    const preview = line.substring(0, 80).replace(/\n/g, '↵');
    console.log(`${String(i).padStart(3)}: ${preview}`);
  });
  
  // Look for date patterns
  console.log('\n=== DATE PATTERNS FOUND ===');
  const datePattern = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/g;
  const dates = text.match(datePattern) || [];
  console.log(`Found ${dates.length} dates:`, [...new Set(dates)].slice(0, 10));
  
  // Look for amount patterns
  console.log('\n=== AMOUNT PATTERNS FOUND ===');
  const amountPattern = /[\$]?(\d{1,3}(?:,\d{3})*\.\d{2}|\d+\.\d{2})/g;
  const amounts = text.match(amountPattern) || [];
  console.log(`Found ${amounts.length} amounts:`, [...new Set(amounts)].slice(0, 10));
  
  // Look for transaction-like lines
  console.log('\n=== POTENTIAL TRANSACTION LINES ===');
  const transactionLikeLines = lines.filter(line => {
    const hasDate = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(line);
    const hasAmount = /\d+\.\d{2}/.test(line);
    return hasDate && hasAmount;
  });
  
  console.log(`Found ${transactionLikeLines.length} transaction-like lines:`);
  transactionLikeLines.slice(0, 15).forEach((line, i) => {
    console.log(`  ${i + 1}: ${line.substring(0, 100)}`);
  });
  
  // Store for later inspection
  window.__pdfDebugInfo = {
    totalCharacters: text.length,
    totalLines: lines.length,
    allLines: lines,
    datesFound: dates,
    amountsFound: amounts,
    transactionLines: transactionLikeLines
  };
  
  console.log('\n✓ Analysis complete. Data stored in window.__pdfDebugInfo');
  
  return window.__pdfDebugInfo;
}

/**
 * Export transaction lines as text for inspection
 */
function showTransactionLines() {
  if (!window.__pdfDebugInfo || window.__pdfDebugInfo.transactionLines.length === 0) {
    console.log('No transaction lines found. Run analyzePDFText() first.');
    return;
  }
  
  console.log('=== ALL TRANSACTION LINES ===');
  window.__pdfDebugInfo.transactionLines.forEach((line, i) => {
    console.log(`${i + 1}: ${line}`);
  });
}

/**
 * Test the template parser directly
 */
function testTemplateParser(text) {
  console.log('Testing template parser with extracted text...');
  
  // This would require importing parseWithTemplateDetection
  // For now, just show what the parser will see
  analyzePDFText(text);
}

// Export for global access
window.analyzePDFText = analyzePDFText;
window.showTransactionLines = showTransactionLines;
window.testTemplateParser = testTemplateParser;

console.log('PDF Debug utilities loaded. Available functions:');
console.log('  - analyzePDFText(text)     : Analyze extracted PDF text');
console.log('  - showTransactionLines()   : Display all transaction-like lines');
console.log('  - window.__pdfDebugInfo    : Access debug data');
