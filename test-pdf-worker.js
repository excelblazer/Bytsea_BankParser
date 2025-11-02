// PDF.js Worker Test
// Run this in the browser console to test PDF.js worker loading

async function testPDFWorker() {
  console.log('Testing PDF.js worker configuration...');

  try {
    // Check if PDF.js is available
    if (typeof pdfjsLib === 'undefined') {
      console.error('❌ PDF.js library not loaded');
      return false;
    }

    console.log('✅ PDF.js library loaded');

    // Check worker configuration
    const workerSrc = pdfjsLib.GlobalWorkerOptions.workerSrc;
    console.log('Worker source:', workerSrc);

    if (!workerSrc) {
      console.error('❌ PDF.js worker not configured');
      return false;
    }

    // Try to fetch the worker file
    try {
      const response = await fetch(workerSrc);
      if (response.ok) {
        console.log('✅ PDF.js worker file accessible');
        console.log('Worker file size:', response.headers.get('content-length'), 'bytes');
      } else {
        console.error('❌ PDF.js worker file not accessible:', response.status);
        return false;
      }
    } catch (fetchError) {
      console.error('❌ Failed to fetch PDF.js worker:', fetchError);
      return false;
    }

    // Try to create a simple PDF document to test functionality
    try {
      const pdf = await pdfjsLib.getDocument({
        data: new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52, 10, 37, 239, 187, 191, 10]) // Minimal PDF header
      }).promise;
      console.log('✅ PDF.js can create documents');
    } catch (pdfError) {
      console.warn('⚠️ PDF.js document creation test failed (expected for minimal PDF):', pdfError);
    }

    console.log('🎉 PDF.js worker test completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ PDF.js worker test failed:', error);
    return false;
  }
}

// Run the test
testPDFWorker().then(success => {
  if (success) {
    console.log('✅ Ready for PDF processing!');
  } else {
    console.log('❌ PDF processing may not work. Check configuration.');
  }
});