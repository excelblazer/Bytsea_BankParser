// Debug utility to analyze PDF text extraction without OCR
// Place this in browser console to run

async function analyzeRawPDF(file) {
  try {
    // Get PDF.js from window
    if (!window.pdfjsLib) {
      console.error('PDF.js not loaded');
      return;
    }

    const pdf = window.pdfjsLib;
    const fileBuffer = await file.arrayBuffer();
    const pdfdoc = await pdf.getDocument({ data: fileBuffer }).promise;

    console.log(`\n📄 PDF has ${pdfdoc.numPages} pages`);

    for (let pageNum = 1; pageNum <= pdfdoc.numPages; pageNum++) {
      const page = await pdfdoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const items = textContent.items;

      console.log(`\n--- PAGE ${pageNum} ---`);
      console.log(`Total text items: ${items.length}`);
      
      // Show first 20 items with their position and content
      console.log('\n--- FIRST 20 TEXT ITEMS (with positions) ---');
      for (let i = 0; i < Math.min(20, items.length); i++) {
        const item = items[i];
        console.log(`[${i}] x:${item.x.toFixed(1)} y:${item.y.toFixed(1)} text:"${item.str}"`);
      }

      // Extract as continuous text
      const text = textContent.items.map(item => item.str).join(' ');
      console.log(`\n--- FULL PAGE AS CONTINUOUS TEXT ---`);
      console.log(text);

      // Try extracting with line breaks
      console.log(`\n--- ATTEMPTING LINE-BASED EXTRACTION ---`);
      // Group items by Y position (approximate rows)
      const rows = {};
      items.forEach(item => {
        const yKey = Math.round(item.y);
        if (!rows[yKey]) rows[yKey] = [];
        rows[yKey].push(item);
      });

      const lines = Object.keys(rows)
        .sort((a, b) => b - a) // Sort top to bottom
        .map(yKey => 
          rows[yKey]
            .sort((a, b) => a.x - b.x) // Sort left to right
            .map(item => item.str)
            .join(' ')
        );

      lines.forEach((line, idx) => {
        if (line.trim()) console.log(`Line ${idx}: "${line}"`);
      });
    }
  } catch (err) {
    console.error('Error analyzing PDF:', err);
  }
}

// Helper to download a file from URL and analyze it
async function downloadAndAnalyze(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const file = new File([blob], 'test.pdf', { type: 'application/pdf' });
    await analyzeRawPDF(file);
  } catch (err) {
    console.error('Error downloading:', err);
  }
}

console.log('Ready! Use:');
console.log('1. Select a PDF file with: const file = document.querySelector("input[type=file]").files[0]');
console.log('2. Then run: await analyzeRawPDF(file)');
console.log('\nOr directly test with URL: await downloadAndAnalyze("http://localhost:5173/your-pdf-path")');
