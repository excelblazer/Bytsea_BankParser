// Script to analyze the dummy PDF structure
// This will help us understand the layout for better parsing

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

async function analyzeDummyPDF() {
  try {
    console.log('Analyzing dummy PDF structure...');

    // Load the PDF
    const response = await fetch('./Dummy Statement Feb 6 2009.pdf');
    const arrayBuffer = await response.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log(`PDF loaded: ${pdf.numPages} pages`);

    // Extract text from all pages
    let fullText = '';
    const pageTexts = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Get text items with position information
      const items = textContent.items.map((item: any) => ({
        text: item.str,
        x: Math.round(item.transform[4]),
        y: Math.round(item.transform[5]),
        width: Math.round(item.width),
        height: Math.round(item.height)
      }));

      // Group items by similar Y positions (rows)
      const rows = groupByYPosition(items);
      const pageText = formatPageText(rows);

      pageTexts.push(pageText);
      fullText += pageText + '\n\n';
    }

    console.log('=== PDF TEXT STRUCTURE ===');
    console.log(fullText);

    console.log('=== POSITIONAL ANALYSIS ===');
    analyzeTextPositions(fullText);

    return fullText;

  } catch (error) {
    console.error('PDF analysis failed:', error);
  }
}

function groupByYPosition(items: any[]): any[][] {
  const tolerance = 5; // pixels
  const rows: any[][] = [];

  // Sort items by Y position (top to bottom)
  items.sort((a, b) => b.y - a.y);

  for (const item of items) {
    let foundRow = false;

    for (const row of rows) {
      if (Math.abs(row[0].y - item.y) <= tolerance) {
        row.push(item);
        foundRow = true;
        break;
      }
    }

    if (!foundRow) {
      rows.push([item]);
    }
  }

  // Sort each row by X position (left to right)
  rows.forEach(row => row.sort((a, b) => a.x - b.x));

  return rows;
}

function formatPageText(rows: any[][]): string {
  return rows.map(row => {
    return row.map(item => item.text).join(' ').trim();
  }).join('\n');
}

function analyzeTextPositions(text: string) {
  const lines = text.split('\n').filter(line => line.trim());

  console.log('Line count:', lines.length);
  console.log('Sample lines:');

  // Show first 20 lines
  lines.slice(0, 20).forEach((line, i) => {
    console.log(`${i + 1}: "${line}"`);
  });

  // Look for patterns that might indicate tabular data
  const datePattern = /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g;
  const amountPattern = /[\$]?\d+\.\d{2}/g;

  const dates = text.match(datePattern) || [];
  const amounts = text.match(amountPattern) || [];

  console.log(`Found ${dates.length} date-like patterns:`, dates.slice(0, 5));
  console.log(`Found ${amounts.length} amount-like patterns:`, amounts.slice(0, 5));
}

// Run the analysis
analyzeDummyPDF();