/**
 * COMPREHENSIVE OCR DEBUG UTILITY
 * Copy and paste this entire script into browser console to get detailed analysis
 * 
 * Functions:
 * - showExtractedText(): Display the OCR text that was extracted
 * - analyzePDFStructure(): Analyze how PDF.js is extracting text
 * - testPatterns(): Test regex patterns against the extracted text
 * - showTransactions(): Display any parsed transactions
 */

(function() {
  window.__ocrDebug = {
    
    showExtractedText: function() {
      const text = window.__lastExtractedText;
      if (!text) {
        console.log('❌ No extracted text found. Process a PDF first!');
        return;
      }
      console.log('\n📄 EXTRACTED TEXT (raw):\n');
      console.log('Length:', text.length);
      console.log('First 1000 chars:');
      console.log(text.substring(0, 1000));
      console.log('\n--- Full text ---');
      console.log(text);
      return text;
    },
    
    analyzeStructure: function() {
      const text = window.__lastExtractedText;
      if (!text) {
        console.log('❌ No extracted text found. Process a PDF first!');
        return;
      }
      
      console.log('\n📊 TEXT STRUCTURE ANALYSIS:\n');
      
      const lines = text.split('\n').filter(l => l.trim());
      console.log(`Total lines: ${lines.length}`);
      console.log(`Average line length: ${(text.length / lines.length).toFixed(1)}`);
      
      console.log('\n--- All lines (with index) ---');
      lines.forEach((line, idx) => {
        console.log(`[${idx}] (${line.length} chars) "${line.substring(0, 80)}..."`);
      });
      
      // Analyze content types
      const withDates = lines.filter(l => /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(l)).length;
      const withAmounts = lines.filter(l => /\d+\.\d{2}/.test(l)).length;
      const withDollarSigns = lines.filter(l => /\$/.test(l)).length;
      
      console.log(`\nContent detection:`);
      console.log(`  Lines with dates: ${withDates}`);
      console.log(`  Lines with amounts: ${withAmounts}`);
      console.log(`  Lines with $ signs: ${withDollarSigns}`);
    },
    
    testPatterns: function() {
      const text = window.__lastExtractedText;
      if (!text) {
        console.log('❌ No extracted text found. Process a PDF first!');
        return;
      }
      
      console.log('\n🔍 PATTERN MATCHING TEST:\n');
      
      const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g;
      const amountPattern = /([\-\$]?\d{1,3}(?:,\d{3})*\.\d{2})/g;
      const linePattern = /^[^\n]*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}[^\n]*$/gm;
      
      const dates = [...text.matchAll(datePattern)];
      const amounts = [...text.matchAll(amountPattern)];
      const transactionLines = [...text.matchAll(linePattern)];
      
      console.log(`Found ${dates.length} dates:`);
      dates.forEach((m, i) => console.log(`  [${i}] "${m[0]}"`));
      
      console.log(`\nFound ${amounts.length} amounts:`);
      amounts.forEach((m, i) => console.log(`  [${i}] "${m[0]}"`));
      
      console.log(`\nFound ${transactionLines.length} potential transaction lines:`);
      transactionLines.forEach((m, i) => {
        console.log(`  [${i}] "${m[0].substring(0, 80)}..."`);
      });
      
      return { dates: dates.length, amounts: amounts.length, lines: transactionLines.length };
    },
    
    showTransactions: function() {
      console.log('\n💰 PARSED TRANSACTIONS:\n');
      // This will be set when parseOCRText completes
      // For now just check localStorage or global state
      const stored = localStorage.getItem('lastTransactions');
      if (stored) {
        const txns = JSON.parse(stored);
        console.log(`Total: ${txns.length}`);
        txns.forEach((t, i) => {
          console.log(`[${i}]`, t);
        });
        return txns;
      } else {
        console.log('No transactions stored yet');
        return [];
      }
    },
    
    complete: function() {
      console.log('\n✅ COMPLETE OCR DEBUG ANALYSIS\n');
      console.log('1. Showing extracted text...');
      this.showExtractedText();
      console.log('\n2. Analyzing structure...');
      this.analyzeStructure();
      console.log('\n3. Testing patterns...');
      const results = this.testPatterns();
      console.log('\n4. Showing transactions...');
      this.showTransactions();
      
      console.log('\n📋 SUMMARY');
      console.log('Available functions:');
      console.log('  __ocrDebug.showExtractedText()');
      console.log('  __ocrDebug.analyzeStructure()');
      console.log('  __ocrDebug.testPatterns()');
      console.log('  __ocrDebug.showTransactions()');
      console.log('  __ocrDebug.complete()');
    }
  };
  
  console.log('\n✅ OCR Debug utility loaded!');
  console.log('\nQuick commands:');
  console.log('  __ocrDebug.complete()     - Run full analysis');
  console.log('  __ocrDebug.showExtractedText()');
  console.log('  __ocrDebug.analyzeStructure()');
  console.log('  __ocrDebug.testPatterns()');
  console.log('  __ocrDebug.showTransactions()');
  console.log('\nOr run: await testDummyPDF() for PDF.js analysis');
})();
