# Bytsea Statement Parser

## Description
An application to parse bank and card statement details from PDF, Word, or Image files into CSV/Excel format using AI. Extracts transaction date, description, reference, and amount (debit/credit).

Powered by Google Gemini, this application allows users to parse bank and card statement details from PDF, DOCX, TXT, and image files. It extracts key information like transaction dates, descriptions, reference numbers, and amounts (distinguishing debits/credits), then presents the data in a clear table and allows export to CSV or Excel formats.

This application was produced by [github.com/excelblazer](https://github.com/excelblazer).

## Features

*   **AI-Powered Extraction**: Utilizes Google Gemini for intelligent data parsing.
*   **Multiple File Formats Supported**:
    *   PDF (`.pdf`)
    *   Word Documents (`.docx`)
    *   Text Files (`.txt`)
    *   Images (`.jpeg`, `.jpg`, `.png`, `.webp`)
*   **Comprehensive Data Extraction**:
    *   Bank Name
    *   Client Name
    *   Transaction Date (YYYY-MM-DD)
    *   Transaction Description
    *   Reference Number / Remarks
    *   Amount (Debits as negative, Credits as positive)
*   **Export Options**: Download extracted data as `.csv` or `.xlsx` (Excel) files.
*   **User-Friendly Interface**:
    *   Drag-and-drop file upload.
    *   Clear display of extracted transactions.
    *   Loading indicators and error messages.
*   **Responsive Design**: Adapts to various screen sizes.
*   **Accessibility**: Includes ARIA attributes for improved accessibility.

## Tech Stack

*   **Frontend**: React (v19) with TypeScript
*   **Styling**: Tailwind CSS
*   **AI Model**: Google Gemini (`gemini-2.5-flash-preview-04-17`) via `@google/genai` SDK
*   **DOCX Processing**: `mammoth.js`
*   **Excel Export**: `xlsx.js`
*   **Module Loading**: ES Modules with `importmap` (CDN-based dependencies)

## Prerequisites & Configuration

### Google Gemini API Key

This application **requires** a Google Gemini API Key to function. For security reasons, users are now prompted to enter their own API key, which is stored securely in their browser's local storage.

**Important**: 
* The application now asks users to provide their own API key through a user-friendly interface
* The API key is stored only in the user's browser local storage and never sent to any server
* Users can obtain a Google Gemini API key from https://ai.google.dev/tutorials/setup
* The key is used directly from the client-side to communicate with Google's API

## Running the Application

### Local Development

1. **Install Dependencies**:
   ```
   npm install
   ```

2. **Run the Development Server**:
   ```
   npm run dev
   ```

3. **Access the App**: Open the application in your web browser at the URL displayed in the terminal (typically `http://localhost:5173`).

### GitHub Pages Deployment

The application is set up for easy deployment to GitHub Pages using GitHub Actions:

1. **Fork or Clone the Repository**: Get your own copy of the code.

2. **Enable GitHub Pages**: Go to your repository settings, find the Pages section, and set the source to "GitHub Actions".

3. **Push to Main Branch**: Whenever you push changes to the main branch, GitHub Actions will automatically build and deploy the application.

4. **Access the Deployed Application**: Your application will be available at `https://[your-username].github.io/[repository-name]/`.

## How to Use

1.  Once the application is loaded, you'll be prompted to enter your Google Gemini API key.
2.  **Set Up API Key**:
    *   Enter your Google Gemini API key in the provided field
    *   Click "Save API Key" to store it securely in your browser's local storage
    *   You can get a Gemini API key from https://ai.google.dev/tutorials/setup
3.  **Upload a File**:
    *   Drag and drop your statement file (PDF, DOCX, TXT, JPG, PNG, WEBP) onto the designated area.
    *   Or, click the upload area to open a file dialog and select your statement file.
4.  **Extract Transactions**: After selecting a file, click the "Extract Transactions" button.
5.  **Processing**: A loading indicator will appear while the AI processes your document. This may take a few moments depending on the file size and complexity.
6.  **View Results**:
    *   If successful, the extracted transactions will be displayed in a table.
    *   If an error occurs (e.g., unparsable file, AI error), an error message will be shown.
    *   If no transactions are found in a successfully processed file, a message indicating this will be displayed.
7.  **Download Data**: Use the "Download CSV" or "Download Excel" buttons to save the extracted data.

## Error Handling

The application provides feedback for various scenarios:
*   **API Key Not Configured**: An error message is shown if `process.env.API_KEY` is not detected.
*   **Invalid File Type**: An alert is shown if an unsupported file type is uploaded.
*   **Processing Errors**: If the AI fails to parse the document or an API error occurs, a descriptive error message is displayed.
*   **No Transactions Found**: If the document is processed successfully but contains no recognizable transactions, this is indicated.

## Offline Functionality

The core functionality of parsing statements relies on the Google Gemini API and therefore requires an active internet connection. The application interface may load if cached by the browser, but statement processing will not work offline.

## Development Notes (Potential Future Enhancements)

*   **Server-Side API Integration**: For production environments, a more robust approach would be to create a backend service that securely stores API keys and proxies requests to Gemini.
*   **Streaming for Large Files**: For very large documents, streaming responses from Gemini could improve perceived performance.
*   **Advanced PDF/Image OCR**: While Gemini handles OCR, for particularly challenging scanned documents, dedicated client-side or server-side OCR pre-processing could be an option.
*   **More Granular Error Details**: Exposing more specific error codes or details from the API (while being careful not to expose sensitive info) could help in troubleshooting.
*   **Rate Limiting Features**: Add functionality to handle API rate limits gracefully, especially when processing multiple documents in succession.

---

This README aims to provide a comprehensive guide to the Bytsea Statement Parser application.
