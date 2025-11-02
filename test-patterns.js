#!/usr/bin/env node

/**
 * Test script: Read dummy PDF and see what text format it produces
 * This mimics what PDF.js extracts
 */

const fs = require('fs');
const path = require('path');

// Try to read the dummy PDF file
const pdfPath = path.join(__dirname, 'Dummy Statement Feb 6 2009.pdf');

if (!fs.existsSync(pdfPath)) {
  console.log('❌ PDF file not found:', pdfPath);
  console.log('\nTo test the parser, upload the dummy PDF through the web UI and check browser console for:');
  console.log('1. "=== OCR EXTRACTION DEBUG ===" - shows raw extracted text');
  console.log('2. "=== PARSING RESULT ===" - shows what transactions were found');
  console.log('\nThen run in browser console:');
  console.log('  await testDummyPDF()');
  process.exit(1);
}

console.log('📄 Dummy PDF found, but PDF parsing requires browser environment');
console.log('\n--- TESTING REGEX PATTERNS ---\n');

// Test the patterns with sample transaction text
const sampleTexts = [
  '2/4/2009 MWAVE ELECTRONICS $12.00',
  '2 / 4 / 2009 MWAVE ELECTRONICS $12.00',
  '02/04/2009 MWAVE ELECTRONICS 12.00',
  '2/4/2009 MWAVE ELECTRONICS - $12.00',
  'Transaction: 2/4/2009 MWAVE ELECTRONICS Amount: $12.00',
  '2/4/2009\nMWAVE ELECTRONICS\n$12.00',
];

const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
const amountRegex = /(-?\$?\d{1,3}(?:,\d{3})*\.?\d{0,2}|\$?\d+)/;

console.log('Testing sample transaction texts:\n');

sampleTexts.forEach((text, idx) => {
  console.log(`Sample ${idx + 1}: "${text}"`);
  
  const dateMatch = dateRegex.exec(text);
  const amountMatch = amountRegex.exec(text);
  
  if (dateMatch) {
    console.log(`  ✓ Date found: ${dateMatch[0]}`);
  } else {
    console.log(`  ✗ No date found`);
  }
  
  if (amountMatch) {
    console.log(`  ✓ Amount found: ${amountMatch[0]}`);
  } else {
    console.log(`  ✗ No amount found`);
  }
  console.log();
});

console.log('\n--- NEXT STEPS ---');
console.log('1. Start dev server: npm run dev');
console.log('2. Open http://localhost:5173 in browser');
console.log('3. Upload Dummy Statement Feb 6 2009.pdf');
console.log('4. Select "OCR + Parse" option');
console.log('5. Check browser console for extraction debug info');
console.log('6. Run: await testDummyPDF() in console to see PDF structure');
