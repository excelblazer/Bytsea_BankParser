/**
 * Quick test: Extract text from the dummy PDF and analyze structure
 * Run this after importing PDF.js in browser console
 */
async function testDummyPDF() {
  try {
    // Fetch the dummy PDF
    const response = await fetch('Dummy Statement Feb 6 2009.pdf');
    const arrayBuffer = await response.arrayBuffer();
    
    // Use PDF.js from window
    const pdf = window.pdfjsLib;
    const pdfdoc = await pdf.getDocument({ data: arrayBuffer }).promise;
    
    console.log(`\n📄 Dummy PDF Analysis`);
    console.log(`Total pages: ${pdfdoc.numPages}`);
    
    for (let pageNum = 1; pageNum <= pdfdoc.numPages; pageNum++) {
      const page = await pdfdoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      console.log(`\n--- PAGE ${pageNum} TEXT ITEMS ---`);
      console.log(`Total items: ${textContent.items.length}`);
      
      // Show raw items
      console.log('\nRAW ITEMS:');
      textContent.items.forEach((item, idx) => {
        console.log(`${idx}: x=${item.x.toFixed(1)} y=${item.y.toFixed(1)} "${item.str}"`);
      });
      
      // Extract as continuous text
      const continuousText = textContent.items.map(i => i.str).join(' ');
      console.log(`\nCONTINUOUS TEXT (${continuousText.length} chars):`);
      console.log(continuousText);
      
      // Try line-based extraction (by y coordinate)
      const yGroups = {};
      textContent.items.forEach(item => {
        const y = Math.round(item.y);
        if (!yGroups[y]) yGroups[y] = [];
        yGroups[y].push(item);
      });
      
      console.log(`\nLINE-BASED EXTRACTION (${Object.keys(yGroups).length} lines):`);
      Object.keys(yGroups)
        .map(Number)
        .sort((a, b) => b - a)
        .forEach(y => {
          const line = yGroups[y]
            .sort((a, b) => a.x - b.x)
            .map(i => i.str)
            .join(' ');
          console.log(`y=${y}: "${line}"`);
        });
      
      // Test patterns
      console.log('\n--- PATTERN TESTING ---');
      const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g;
      const amountPattern = /(-?\d{1,3}(?:,\d{3})*\.\d{2}|-?\d+\.\d{2})/g;
      
      const dates = [...continuousText.matchAll(datePattern)];
      const amounts = [...continuousText.matchAll(amountPattern)];
      
      console.log(`Found ${dates.length} potential dates: ${dates.map(m => m[0]).join(', ')}`);
      console.log(`Found ${amounts.length} potential amounts: ${amounts.map(m => m[0]).join(', ')}`);
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

console.log('Dummy PDF test ready!');
console.log('Run: await testDummyPDF()');
