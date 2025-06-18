# Bytsea Statement Parser

![Bytsea Statement Parser](https://raw.githubusercontent.com/excelblazer/Bytsea-BankParser/main/app-preview.png)

## Description
An advanced application to parse bank and card statement details from PDF, Word, or Image files into CSV/Excel format using AI. Extracts transaction data, metadata, currency, and other details for efficient financial data processing.

Powered by Google Gemini with planned OpenAI and Anthropic integrations, this application allows users to parse bank and card statement details from PDF, DOCX, TXT, and image files. It intelligently extracts key metadata (bank name, client name, statement period, currency) and transaction details (dates, descriptions, reference numbers, and amounts with proper debit/credit designation), then presents the data in a clean, modern interface and allows export to CSV or Excel formats.

This application was produced by [github.com/excelblazer](https://github.com/excelblazer).

## Features

### Current Features

*   **AI-Powered Extraction**: 
    *   Utilizes Google Gemini for intelligent data parsing
    *   Modern API key management interface
    *   Secure client-side API integration
    *   Planned integration with OpenAI and Anthropic (coming soon)

*   **Multiple File Formats Supported**:
    *   PDF (`.pdf`)
    *   Word Documents (`.docx`)
    *   Text Files (`.txt`)
    *   Images (`.jpeg`, `.jpg`, `.png`, `.webp`)

*   **Comprehensive Data Extraction**:
    *   Metadata extraction:
        *   Bank Name
        *   Client Name
        *   Statement Period
        *   Currency Detection (USD, EUR, GBP, etc.)
    *   Transaction details:
        *   Transaction Date (YYYY-MM-DD)
        *   Transaction Description
        *   Reference Number / Remarks
        *   Amount (Debits as negative, Credits as positive)

*   **Smart Export Options**: 
    *   Download extracted data as `.csv` or `.xlsx` (Excel) files
    *   Intelligent filename generation using detected metadata (ClientName-BankName-Period)
    *   Excel exports include a dedicated metadata sheet with statement information

*   **Modern User Interface**:
    *   Sophisticated animated background design
    *   Gradient title highlighting
    *   Drag-and-drop file upload
    *   Clear transaction table display with sorting
    *   Loading indicators and contextual error messages
    *   Responsive header and footer with branding elements
    *   Modal confirmation dialogs for important actions

*   **Security and Privacy**:
    *   Browser-local data processing (no server uploads)
    *   Secure API key storage in localStorage
    *   Clear privacy policy
    *   No data retention

*   **Responsive Design**: 
    *   Adapts fluidly to various screen sizes from mobile to desktop
    *   Optimized components for different viewport sizes

*   **Accessibility**: 
    *   Semantic HTML structure
    *   ARIA attributes for improved screen reader compatibility
    *   Keyboard navigation support
    *   High contrast text and UI elements

## Tech Stack

*   **Frontend**: 
    *   React (v19) with TypeScript
    *   Modern React Hooks for state management
    *   100% client-side processing for security and privacy

*   **Styling**: 
    *   Tailwind CSS with custom utilities
    *   Responsive design principles
    *   CSS animations and transitions for enhanced UX
    *   Custom background gradient effects

*   **AI Integration**:
    *   Primary: Google Gemini (`gemini-2.5-flash-preview-04-17`) via `@google/genai` SDK
    *   Coming Soon: OpenAI and Anthropic Claude integrations

*   **Document Processing**:
    *   PDF parsing via Gemini's multimodal capabilities
    *   DOCX processing using `mammoth.js`
    *   Image analysis (JPG, PNG, WEBP) via Gemini Vision
    *   Plain text parsing with intelligent formatting detection

*   **Data Export**:
    *   CSV generation with proper encoding
    *   Excel export via `xlsx.js` with multi-sheet support
    *   Metadata-based intelligent file naming

*   **Module Loading**: 
    *   ES Modules with `importmap` for efficient dependency management
    *   CDN-based dependencies for fast loading and reduced build complexity

## Prerequisites & Configuration

### API Key Requirements

This application requires an AI Model provider API key to function. Currently, the application supports:

#### Google Gemini API Key (Current)

For security and flexibility, users provide their own API key through the application's user interface. This approach:
* Eliminates the need for backend services or environment variables
* Keeps user data and API usage private to each user
* Allows for customized usage within each user's API quota

**Important Details**: 
* The application requires users to provide a Google Gemini API key through the intuitive API key input interface
* The key is securely stored only in the user's browser local storage
* No API keys or user data are ever sent to any external servers (except to the AI provider's API)
* Users can obtain a Google Gemini API key from https://ai.google.dev/tutorials/setup
* The application includes warning dialogs when changing API providers to prevent accidental data loss

#### Coming Soon: OpenAI and Anthropic API Support

The application UI already showcases the upcoming integration with additional AI providers:
* OpenAI GPT models for enhanced statement parsing
* Anthropic Claude for complex financial document extraction

These integrations will follow the same secure client-side approach, with no server storage of API keys.

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

### Quick Start Guide

1.  **Initial Setup**:
    *   When first loading the application, you'll be prompted to enter your Google Gemini API key
    *   The intuitive interface guides you through the API key setup process
    *   You can obtain a Gemini API key from https://ai.google.dev/tutorials/setup

2.  **API Key Management**:
    *   Enter your Google Gemini API key in the secure input field
    *   Click "Save API Key" to store it locally in your browser
    *   A confirmation will appear when your API connection is successful
    *   You can change your API key at any time using the "Change API" button
    *   A warning dialog will appear when changing APIs to prevent accidental data loss

3.  **Document Upload**:
    *   Once your API key is configured, you'll see the file upload interface
    *   Drag and drop your statement file (PDF, DOCX, TXT, JPG, PNG, WEBP) onto the designated area
    *   Alternatively, click the upload area to open a file dialog and select your statement file
    *   The application displays the selected filename once uploaded

4.  **Processing**:
    *   Click the prominent "Extract Transactions" button to begin processing
    *   An animated spinner with status message indicates processing is underway
    *   The AI analyzes your document to extract both metadata and transactions
    *   Processing time varies based on document complexity and file size

5.  **View Results**:
    *   Statement metadata (bank name, client name, period, currency) appears at the top of results
    *   Extracted transactions display in a sortable table below
    *   Transaction dates, descriptions, references and amounts are clearly formatted
    *   Debits appear as negative values and credits as positive values
    *   Clear status messages appear if no transactions are found

6.  **Export Options**:
    *   Use "Download CSV" to export a simple comma-separated values file
    *   Use "Download Excel" for a more comprehensive export with formatting
    *   Excel exports include a dedicated metadata sheet with statement information
    *   Filenames are intelligently generated based on detected metadata
    *   Format: ClientName-BankName-Period.csv/xlsx

7.  **Additional Features**:
    *   Use the coming soon indicators to see what new AI providers will be available
    *   Privacy policy details are available via the footer link
    *   The application maintains no server-side storage of your data

## Error Handling and User Experience

The application provides comprehensive feedback for various scenarios:

### Contextual Error Messages

*   **API Configuration**:
    *   Missing API key: Clear prompts to enter a Gemini API key
    *   API validation errors: Specific feedback on key format or validation issues
    *   API change warnings: Modal confirmation before removing existing API settings

*   **File Handling**:
    *   Unsupported file types: Detailed error with list of accepted formats
    *   File size limitations: Warnings for excessively large files
    *   File reading errors: Technical details when available

*   **AI Processing**:
    *   AI provider errors: Formatted error messages from the AI provider
    *   Parsing difficulties: Context-specific messages when AI cannot extract data
    *   Empty results: Clear indication when no transactions are found in valid documents

### User Experience Enhancements

*   **Visual Feedback**:
    *   Loading indicators with descriptive messages
    *   Success confirmations for key actions
    *   Animated interface elements for improved engagement
    *   Modal dialogs for destructive actions

*   **Accessibility**:
    *   Screen reader compatible error messages
    *   ARIA live regions for dynamic content
    *   Keyboard navigation throughout the interface

## Offline Capabilities

The application is designed as a client-side application with some offline capabilities:

*   **Interface Availability**: The core interface loads and functions even offline
*   **API Dependencies**: Statement parsing requires an internet connection to access AI providers
*   **Local Storage**: API keys and preferences are retained between sessions
*   **No Server Requirements**: The application operates entirely in the browser with no backend

## Current Development Status

The Bytsea Statement Parser is actively maintained and regularly updated. Current status:

*   **Version**: 2.0.0 (June 2025)
*   **Active Features**: All listed features are fully implemented and functional
*   **Recent Updates**: 
    *   Enhanced UI with animated background and improved title styling
    *   Added currency detection
    *   Implemented metadata-based file naming
    *   Added API change confirmation dialogs
    *   Prepared UI for future API provider integrations

## Roadmap (Planned Enhancements)

### Immediate Priorities (Q3 2025)

*   **Additional AI Providers**:
    *   OpenAI integration for GPT-based statement parsing
    *   Anthropic Claude integration for complex document parsing
    *   Model selection options for each provider

*   **Enhanced Data Processing**:
    *   Statement categorization and tagging
    *   Transaction classification using AI
    *   Advanced data validation and correction

### Medium-term Plans (Q4 2025)

*   **User Experience**:
    *   Theme customization options (light/dark mode)
    *   Tutorial overlays for new users
    *   Batch processing for multiple files

*   **Data Visualization**:
    *   Interactive charts and graphs
    *   Spending analysis dashboards
    *   Visual breakdown of income vs. expenses

### Long-term Vision (2026+)

*   **Account Integration**:
    *   Optional user accounts for cross-device settings
    *   Secure statement history storage (with user consent)
    *   Custom extraction templates for recurring statements

*   **Advanced Features**:
    *   AI-assisted reconciliation tools
    *   Multi-currency conversion and normalization
    *   Statement comparison and trend analysis
    *   Budgeting tools based on historical data

---

This README provides a comprehensive guide to the Bytsea Statement Parser application as of June 2025.

## Contributors

*   [github.com/excelblazer](https://github.com/excelblazer) - Lead Developer
*   The open source community through libraries and tools

## License

MIT License - See LICENSE file for details.
