# OCR Parser Module (`ocr_parser`)

This module is designed to parse ledger data from PDF and image files using Optical Character Recognition (OCR). It aims to extract structured transaction data along with relevant header and footer information from scanned or digital ledger documents.

## Components

The `ocr_parser` module consists of the following key Python scripts:

1.  **`preprocessing.py`**:
    *   Handles the initial conversion of input files (PDFs) into images suitable for OCR.
    *   Performs basic image preprocessing tasks like grayscale conversion and binarization to enhance OCR accuracy.
    *   Key functions:
        *   `pdf_to_images(pdf_path, dpi)`: Converts a PDF file to a list of PIL Image objects.
        *   `preprocess_image(image)`: Applies grayscale and binarization to a PIL Image.

2.  **`ocr.py`**:
    *   Interfaces with the Tesseract OCR engine (via `pytesseract`) to extract text from preprocessed images.
    *   Allows configuration of OCR language and Page Segmentation Mode (PSM) for optimized text extraction.
    *   Key functions:
        *   `extract_text_from_image(image, lang, psm)`: Performs OCR on a PIL Image and returns the raw extracted text.
        *   Also provides access to `pytesseract.image_to_data` for detailed OCR output including word coordinates, which is crucial for advanced parsing.

3.  **`parser.py`**:
    *   Contains the logic for parsing the OCR output (both raw text and detailed DataFrame) into structured data.
    *   Defines the expected transaction data structure (`EXPECTED_COLUMNS`).
    *   Key functions:
        *   `extract_header_footer_info(ocr_text)`: Attempts to find and extract common header/footer elements (period, page numbers, org name, doc type) from raw text using patterns.
        *   `extract_main_content_text(ocr_text, ...)`: Simple utility to strip a fixed number of lines from the top/bottom of OCR text.
        *   `parse_ledger_text(ocr_text)`: A basic text-based parser that uses heuristics and regex to find transactions. Limited robustness.
        *   `parse_ledger_data_from_dataframe(df)`: **(Conceptual / In Development)** The target function for robust, coordinate-based table parsing using detailed OCR output from `image_to_data`. This involves segmenting the page, reconstructing lines, and aligning text to columns based on spatial information. Currently, it includes initial data filtering and region segmentation logic, with a fallback to `parse_ledger_text`.
        *   `process_page_ocr_results(ocr_text, ocr_dataframe)`: An orchestrator function that provides a single entry point to parse a page's OCR results, deciding whether to use text-based or DataFrame-based parsing.

## High-Level Workflow Example

A typical usage flow for processing a PDF ledger page might be:

```python
from ocr_parser import preprocessing, ocr, parser
import pytesseract # For image_to_data for advanced parsing

pdf_file_path = "path/to/your/ledger.pdf"
output_data = []

# 1. Convert PDF to images
pil_images = preprocessing.pdf_to_images(pdf_file_path, dpi=300)

for i, page_image in enumerate(pil_images):
    # 2. Preprocess the image
    preprocessed_img = preprocessing.preprocess_image(page_image)

    # 3. Perform OCR - get both raw text and detailed data
    raw_text = ocr.extract_text_from_image(preprocessed_img, lang='eng', psm=6) # PSM 6 is often good for tables

    # For more advanced parsing, get the DataFrame output
    # ocr_df = pytesseract.image_to_data(preprocessed_img, lang='eng', output_type=pytesseract.Output.DATAFRAME, config='--psm 6')
    # For now, process_page_ocr_results will use its internal fallback if ocr_df is not fully utilized yet
    ocr_df = None # Set to actual DataFrame for future advanced parsing

    # 4. Parse the OCR results for this page
    page_metadata, page_transactions = parser.process_page_ocr_results(raw_text, ocr_dataframe=ocr_df)

    output_data.append({
        "page": i + 1,
        "metadata": page_metadata,
        "transactions": page_transactions
    })

# Now output_data contains structured information for each page.
# Further processing (e.g., saving to CSV/JSON, database insertion) can be done.
```

## Current Status & Limitations

*   **PDF and Image Input**: Basic PDF to image conversion and image preprocessing are implemented.
*   **OCR**: Text extraction via Tesseract is functional.
*   **Header/Footer Parsing**: Basic text-pattern-based extraction for common elements is available.
*   **Transaction Parsing**:
    *   A very basic text-based transaction parser (`parse_ledger_text`) exists but has significant limitations and is highly dependent on clean OCR and simple layouts.
    *   The more robust, coordinate-based table parsing (`parse_ledger_data_from_dataframe`) is **still in a conceptual/development stage**. While it includes initial steps like data filtering and region segmentation, the core logic for accurately reconstructing tables from word coordinates needs full implementation.
*   **Error Handling & Logging**: Basic error handling and logging are in place across modules.

## Dependencies

*   **Tesseract OCR Engine**: Must be installed on the system and accessible in the PATH.
*   **Python Libraries**:
    *   `pytesseract`
    *   `Pillow` (PIL)
    *   `PyMuPDF` (fitz)
    *   `pandas`
    *   (Optional, for `preprocessing.py` example: `reportlab`)

This module provides a foundational framework for OCR-based ledger parsing. Significant enhancements, particularly in the `parse_ledger_data_from_dataframe` function, are required for robust and accurate extraction from diverse ledger formats.
