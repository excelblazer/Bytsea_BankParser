import re
import pandas as pd
from typing import List, Dict, Any
import logging

# Setup logger for this module
logger = logging.getLogger(__name__)
# logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


# Define the expected column headers. This helps in identifying potential table data.
# Order matters for some parsing strategies.
EXPECTED_COLUMNS = [
    "Trans #", "Type", "Date", "Num",
    "Name", "Memo", "Account", "Debit", "Credit"
]
# Alternative: Use a more structured definition if needed, e.g., with types or regex per column
# COLUMN_SPECS = {
# "Trans #": {"type": str, "regex": r"\d+"}, ... }

# Module-level constant for expected column names.
# This list defines the structure of the dictionaries returned for each transaction.
# The order can also be used by some parsing strategies if column order is consistent.
EXPECTED_COLUMNS = [
    "Trans #", "Type", "Date", "Num",
    "Name", "Memo", "Account", "Debit", "Credit"
]


def parse_ledger_text(ocr_text: str) -> List[Dict[str, Any]]:
    """
    Parses raw OCR text to extract ledger transaction data using text-based heuristics.

    This function attempts to identify transaction lines and their components from
    a block of text. It's a more basic approach compared to coordinate-based parsing
    from OCR DataFrames and is suitable as a fallback or for very simple layouts.

    The current implementation includes:
    - Basic header detection to identify column names (fragile).
    - Line splitting and part extraction based on multiple spaces (fragile).
    - Regex for dates and monetary values.
    - Heuristic assignment of parts to transaction fields (highly speculative).

    Args:
        ocr_text (str): A string containing the multi-line text extracted by OCR
            from a ledger page, ideally with header/footer text already removed.

    Returns:
        List[Dict[str, Any]]: A list of dictionaries, where each dictionary
        represents a parsed transaction. Each dictionary will attempt to conform
        to the `EXPECTED_COLUMNS`. Fields that cannot be parsed will be None.
        Returns an empty list if no transactions can be reliably parsed.

    Note:
        This function is highly sensitive to OCR quality and document layout.
        Its effectiveness is limited, and `parse_ledger_data_from_dataframe`
        is the preferred method if detailed OCR output (with coordinates) is available.
    """
    transactions: List[Dict[str, Any]] = []
    lines = ocr_text.strip().split('\n')

    # Very naive approach: try to identify lines that look like transaction data.
    # This will need to be much more robust.
    # For example, we might look for lines that have a date, and/or monetary values.

    # A more advanced approach would use pytesseract.image_to_data to get bounding boxes
    # and then try to reconstruct the table structure based on spatial relationships.
    # This current approach assumes a relatively clean, line-by-line OCR output
    # where each transaction or part of it is on its own line(s).

    current_transaction: Dict[str, Any] = {}
    # Regex to identify potential monetary values (Debit/Credit)
    # Allows for optional $ and commas, requires two decimal places if a decimal point is present.
    money_pattern = re.compile(r'^\$?((\d{1,3}(,\d{3})*|\d+)(\.\d{2})?|\.\d{2})$')
    # Regex for common date formats (YYYY-MM-DD, MM/DD/YYYY, MM-DD-YY, etc.)
    # Made more flexible, but still might need adjustment for other specific formats.
    date_pattern = re.compile(
        r'\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2}|'
        r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s\d{1,2},\s\d{4})\b',
        re.IGNORECASE
    )

    # Placeholder for column headers if found
    header_indices: Dict[str, int] = {} # Store column start index if we can identify them
    header_line_num = -1

    logger.info(f"Starting text parsing for {len(lines)} lines.")
    for line_num, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue

        # Attempt to identify a header row to understand column positions
        # This is a very simplistic header detection
        # Consider making keywords for header detection configurable or more robust
        if not header_indices and all(col.lower() in line.lower() for col in ["Date", "Debit", "Credit", "Name"]): # Key columns
            temp_indices = {}
            line_lower = line.lower()
            for col_name in EXPECTED_COLUMNS:
                try:
                    # Find start index of the column name (case-insensitive)
                    temp_indices[col_name] = line_lower.index(col_name.lower())
                except ValueError:
                    logger.debug(f"Column '{col_name}' not found in potential header line: '{line}'")

            # Require at least a few key columns to be found to consider it a header
            if len(temp_indices) >= 4 and "Date" in temp_indices and ("Debit" in temp_indices or "Credit" in temp_indices):
                header_indices = dict(sorted(temp_indices.items(), key=lambda item: item[1])) # Sort by index
                header_line_num = line_num
                logger.info(f"Detected potential header on line {line_num}: '{line}'. Column start indices: {header_indices}")
                continue # Skip header line from data processing

        if line_num == header_line_num: # Ensure we definitely skip the identified header line
            continue

        # Simplistic row parsing - this needs a lot of work. Emphasize this is a fallback or basic parser.
        # This section is highly dependent on the structure of the OCR'd text and
        # the reliability of column separation by spaces.
        # It's generally NOT ROBUST for complex tables or OCR with misaligned text.

        # If headers were found, one could try to slice the line based on header_indices.
        # This is still fragile if column values run into each other.
        # For now, the existing split by multiple spaces is kept as a basic attempt.
        parts = re.split(r'\s{2,}', line) # Split by 2 or more spaces

        # This heuristic (len(parts) >= 5) is arbitrary and likely insufficient.
        # A more robust approach involves `image_to_data` (see `parse_ledger_data_from_dataframe`).
        if len(parts) >= 3: # Reduced minimum parts, as some lines might be sparse (e.g. only memo and one amount)
            transaction: Dict[str, Any] = {col: None for col in EXPECTED_COLUMNS}

            # Naive assignment based on parts. This is extremely brittle.
            # Example: Try to find date and amounts, then fill others.
            date_match = date_pattern.search(line)
            if date_match:
                transaction["Date"] = date_match.group(0)

            # Try to identify debit/credit based on money pattern and position (e.g., last two parts if they look like money)
            potential_amounts = [p for p in parts if money_pattern.match(p)]
            if len(potential_amounts) == 1:
                # Ambiguous if it's debit or credit without column context.
                # This requires a rule, e.g. "if only one amount, assume it's in 'Debit' if positive, or based on keywords"
                # For now, let's put it in Debit if no other info.
                # This is highly speculative.
                transaction["Debit"] = potential_amounts[0].replace('$', '').replace(',', '')
            elif len(potential_amounts) >= 2:
                # Assume last two are credit then debit, or vice-versa. This also needs context.
                # A common layout is Debit then Credit.
                # This is also highly speculative.
                val1_str = potential_amounts[-2].replace('$', '').replace(',', '')
                val2_str = potential_amounts[-1].replace('$', '').replace(',', '')
                # Simple heuristic: if one is empty or zero-like, the other is the value.
                # Or, if column headers are known, align with them.
                # For now, assign to Debit and Credit somewhat arbitrarily if both look valid.
                transaction["Debit"] = val1_str if val1_str else None # Or some other logic
                transaction["Credit"] = val2_str if val2_str else None

            # This is a very weak condition to add a transaction.
            # It's more for showing the data structure.
            if transaction["Date"] or transaction["Debit"] or transaction["Credit"]:
                # Fill other fields heuristically (very unreliable)
                transaction["Type"] = parts[0] if len(parts) > 0 and not date_pattern.search(parts[0]) and not money_pattern.match(parts[0]) else None
                transaction["Name"] = parts[1] if len(parts) > 1 and transaction["Type"] else (parts[0] if len(parts) > 0 and not transaction["Type"] else None) # Highly guessed
                transaction["Memo"] = line # Default: put the whole line in memo if detailed parsing fails

                transactions.append(transaction)
                logger.debug(f"Potentially parsed (basic text-based): {transaction}")
            else:
                logger.debug(f"Skipping line, no clear transaction indicators: '{line}'")

    # Post-processing (conceptual)
    # - Merge multi-line transactions (e.g., paychecks split across lines). This needs more advanced logic.
    # - Clean up data (strip whitespace, convert monetary strings to float/Decimal).
    # - Validate data against expected types or rules.

    if not transactions and ocr_text.strip(): # Check if ocr_text had content
        logger.warning("No transactions were parsed from the provided text. The text might not be structured as expected, or the parsing logic needs significant improvement for this format.")
    elif transactions:
        logger.info(f"Basic text parsing yielded {len(transactions)} potential transaction entries. Further refinement and validation needed.")

    return transactions


def parse_ledger_data_from_dataframe(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Parses ledger transaction data from a pandas DataFrame containing detailed OCR results.

    This function is intended to be the primary method for robust table extraction,
    as it can leverage word coordinates, confidence scores, and document structure
    information (e.g., block, paragraph, line numbers) provided by Tesseract's
    `image_to_data` output.

    The current implementation includes:
    - Filtering of low-confidence OCR words.
    - Conceptual segmentation of the page into header, body, and footer zones
      based on y-coordinates.
    - Basic reconstruction of text lines from words within the identified body zone.
    - A fallback to `parse_ledger_text` using these reconstructed lines.

    **Important Note:** The core logic for advanced, coordinate-based table
    reconstruction (identifying column boundaries, assigning words to cells based
    on precise x/y positions, handling multi-line cells within the DataFrame context)
    is still largely conceptual and requires significant further development.
    The current version primarily demonstrates the initial steps of data filtering
    and region segmentation.

    Args:
        df (pd.DataFrame): A pandas DataFrame generated by
            `pytesseract.image_to_data(output_type=pytesseract.Output.DATAFRAME)`.
            Expected columns include 'conf', 'text', 'left', 'top', 'width',
            'height', 'block_num', 'par_num', 'line_num', 'word_num'.

    Returns:
        List[Dict[str, Any]]: A list of dictionaries, where each dictionary
        represents a transaction. Returns an empty list if parsing is unsuccessful
        or if the advanced parsing logic is not yet sufficiently implemented.
    """
    transactions: List[Dict[str, Any]] = []

    # Filter out entries with low confidence or no text.
    # A confidence of -1 is often used by Tesseract for blocks/lines it doesn't try to OCR.
    # We might want to be more nuanced, e.g. filter words with conf < X, but keep line structure.
    # For now, filter out non-text or very low confidence items.
    # Ensure 'conf' is float for comparison, as it can be object type if mixed.
    df_filtered = df[
        (df['conf'].astype(float) > 10) &  # Confidence threshold (e.g., >10%)
        (df['text'].notna()) &
        (df['text'].str.strip() != '')
    ].copy()
    # Ensure 'text' is string type after filtering NaNs and potential non-string types
    df_filtered.loc[:, 'text'] = df_filtered['text'].astype(str)


    if df_filtered.empty:
        logger.warning("No usable text data found in the OCR DataFrame after filtering low confidence entries.")
        return transactions

    logger.info(f"Processing OCR DataFrame with {len(df_filtered)} high-confidence text elements.")

    # Logic to group words into lines and then lines into table cells/rows
    # This is non-trivial and involves analyzing 'left', 'top', 'width', 'height'.
    # 1. Group words by their original line identification (block_num, par_num, line_num).
    # 2. Within each line, sort words by 'left' coordinate.
    # 3. Try to align text across lines to form columns by analyzing x-coordinates.
    #    - Headers are crucial: if "Date", "Debit", "Credit" headers are found,
    #      their x-coordinates can define column boundaries.

    # --- Conceptual structure for DataFrame-based parsing ---
    # This remains highly conceptual and needs significant work with real data.

    # 1. Identify potential header, body, and footer regions based on y-coordinates.
    #    Use a percentage of page height, or look for large vertical gaps.
    if not all(col in df_filtered.columns for col in ['top', 'height', 'left', 'block_num', 'par_num', 'line_num']):
        logger.error("DataFrame from OCR is missing required coordinate or structure columns ('top', 'height', 'left', etc.). Cannot perform layout analysis.")
        return transactions

    # Calculate approximate page height if possible, handle cases with few elements.
    min_top = df_filtered['top'].min()
    max_bottom = (df_filtered['top'] + df_filtered['height']).max()
    page_content_height = max_bottom - min_top # Height of the content area

    if page_content_height <= 0: # Avoid division by zero or negative height if data is unusual
        logger.warning("Could not determine valid page content height from OCR data. Proceeding with all data as body.")
        body_candidates = df_filtered.copy()
        header_candidates = pd.DataFrame(columns=df_filtered.columns) # Empty df
        footer_candidates = pd.DataFrame(columns=df_filtered.columns) # Empty df
    else:
        # Define header/footer zones (e.g., top/bottom 15% of content height)
        header_zone_end_y = min_top + page_content_height * 0.15
        footer_zone_start_y = min_top + page_content_height * 0.85

        header_candidates = df_filtered[df_filtered['top'] < header_zone_end_y]
        # Ensure 'top' + 'height' for footer candidates to avoid including elements that merely start low but extend high.
        footer_candidates = df_filtered[(df_filtered['top'] + df_filtered['height']) > footer_zone_start_y]
        body_candidates = df_filtered[(df_filtered['top'] >= header_zone_end_y) &
                                      ((df_filtered['top'] + df_filtered['height']) <= footer_zone_start_y)]

    logger.info(f"Segmented DataFrame: {len(header_candidates)} header elements, "
                f"{len(body_candidates)} body elements, {len(footer_candidates)} footer elements.")

    # TODO: Extract actual header/footer metadata using these candidate DataFrames
    # header_info = extract_header_info_from_df_coordinates(header_candidates) # Needs implementation
    # page_info = extract_footer_info_from_df_coordinates(footer_candidates)   # Needs implementation

    # 2. Reconstruct lines from words in the `body_candidates`.
    #    This involves grouping words that are on the same visual line.
    #    Tesseract's block_num, par_num, line_num can be a starting point, but visual alignment is more robust.
    if body_candidates.empty:
        logger.warning("No text elements found in the body region of the page after segmentation.")
        return transactions

    # Sort by Tesseract's structure first, then visual position, to process words in reading order.
    lines_df = body_candidates.sort_values(['page_num', 'block_num', 'par_num', 'line_num', 'left']).copy()

    reconstructed_lines_text = []
    if not lines_df.empty:
        # Group words into lines based on 'block_num', 'par_num', 'line_num' from Tesseract
        # This assumes Tesseract's line segmentation is reasonably good.
        # A more robust method would cluster words by 'top' coordinate proximity.
        try:
            grouped_lines = lines_df.groupby(['block_num', 'par_num', 'line_num'])
            for name, group in grouped_lines:
                # Ensure words within the line are sorted by their 'left' coordinate
                line_text = ' '.join(group.sort_values('left')['text'].tolist())
                reconstructed_lines_text.append(line_text)
                logger.debug(f"Reconstructed line from DF (group {name}): '{line_text}'")
        except KeyError as e:
            logger.error(f"Missing key for grouping lines from DataFrame: {e}. Tesseract output might be malformed.")
            # Fallback or alternative line reconstruction could be attempted here.
            # For now, we'll have no reconstructed lines if this fails.
            reconstructed_lines_text = []


    logger.info(f"Reconstructed {len(reconstructed_lines_text)} potential body lines from DataFrame.")

    # 3. Parse these `reconstructed_lines_text` using a table parsing logic.
    #    This is where the core challenge lies: identifying columns and cells.
    #    - One approach: Use the `parse_ledger_text` on this cleaner, body-only text.
    #      This is simpler but still relies on text patterns.
    #    - A more advanced approach: Use the x-coordinates of words in `body_candidates`
    #      to define column boundaries, especially if header text positions are known.

    if reconstructed_lines_text:
        # Option 1: Reuse the basic text parser (less accurate for complex tables)
        logger.info("Attempting to parse reconstructed lines using the basic text-based parser.")
        transactions = parse_ledger_text("\n".join(reconstructed_lines_text))

        # Option 2: Implement a dedicated parser that works with word coordinates from `body_candidates` (Preferred for accuracy)
        # This would involve:
        #  a. Identifying column headers in `body_candidates` (or `header_candidates`) using text and y-position.
        #  b. Determining x-coordinate ranges for each column based on these headers.
        #  c. Iterating through words in `body_candidates`, assigning them to columns based on their x-pos.
        #  d. Grouping words in cells, handling multi-line cells.
        #  e. Assembling rows into transactions.
        if not transactions: # If basic parser failed, it means more advanced logic is essential
             logger.warning("Basic text parser yielded no results on reconstructed lines from DataFrame. "
                           "Full coordinate-based table parsing is required for this document type but is not yet fully implemented.")
        # For now, this function will primarily rely on parse_ledger_text for transaction extraction
        # until the more advanced coordinate-based parsing is built.
    else:
        logger.info("No lines were reconstructed from the body of the DataFrame, so no transactions parsed.")


    # Placeholder: Actual transaction extraction from DataFrame is the most complex part.
    # This section needs a robust algorithm to map words (with coordinates) to table cells.
    # For example, using PDF processing libraries that specialize in table extraction,
    # or by implementing geometric analysis of word bounding boxes.

    # logger.info("Detailed DataFrame table parsing logic is not yet implemented.")

    # Example: Iterate through lines (a simplification)
    # lines_data = df_filtered.groupby(['page_num', 'block_num', 'par_num', 'line_num'])['text'].apply(lambda x: ' '.join(x)).reset_index()
    # for index, row in lines_data.iterrows():
    #     line_text = row['text']
    #     # Apply regex or other parsing to line_text
    #     # ... this is similar to parse_ledger_text but with potentially cleaner lines ...


    # Ultimately, this function would populate the `transactions` list.
    # Each transaction would be a dictionary like:
    # {
    #     "Trans #": "...", "Type": "...", "Date": "...", "Num": "...",
    #     "Name": "...", "Memo": "...", "Account": "...",
    #     "Debit": 0.0, "Credit": 0.0
    # }
    return transactions

# Regex for typical period formats - made more general for various separators and wordings
# It captures two main date parts. Further parsing of these parts might be needed.
period_pattern = re.compile(
    r"(?:Period|Dates|From|For the period|For period)\s*:?\s*([\w\s,.月日年/-]+?)\s*(?:to|-|–|through|until)\s*([\w\s,.月日年/-]+)",
    re.IGNORECASE
)
# Regex for page numbers, e.g., "Page X of Y", "Page X", "P. X/Y"
page_number_pattern = re.compile(r"(?:Page|P\.?)\s*(\d+)(?:\s*(?:of|/)\s*(\d+))?", re.IGNORECASE)


def extract_header_footer_info(ocr_text: str) -> Dict[str, Any]:
    """
    Extracts header and footer information from the raw OCR text using text patterns.

    This function scans the top and bottom lines of the provided OCR text to find
    common header/footer elements like organization name, document type, reporting period,
    and page numbers. It relies on regular expressions and simple heuristics.

    The reliability of this function is limited by the consistency of the document
    layout and the quality of the OCR text. For more robust extraction,
    using positional information from OCR DataFrames (if available) would be preferable.

    Args:
        ocr_text (str): The full, raw text extracted from a single page by OCR.

    Returns:
        Dict[str, Any]: A dictionary containing the extracted information.
        Keys include:
        - "organization_name" (str|None): Estimated organization name.
        - "document_type" (str|None): Estimated document type (e.g., "Ledger").
        - "period_from" (str|None): Start date of the reporting period.
        - "period_to" (str|None): End date of the reporting period.
        - "page_number" (str|None): Detected page number.
        - "total_pages" (str|None): Detected total number of pages (if available, e.g., "Page X of Y").
        Fields not found will have a value of None.
    """
    info: Dict[str, Any] = {
        "organization_name": None,
        "document_type": None,     # Placeholder
        "period_from": None,
        "period_to": None,
        "page_number": None,
        "total_pages": None,
    }
    lines = ocr_text.strip().split('\n')

    # Look for period and page numbers.
    # A more robust method would use positional data (y-coordinates) from image_to_data
    # to define header/footer regions and search only there.
    # For text-only, we scan a limited number of lines from top and bottom.

    num_boundary_lines = min(5, len(lines) // 2 if len(lines) > 1 else 1) # Scan fewer lines if doc is short

    # Scan top lines for header info (Org, Doc Type, Period Start/End)
    for i in range(min(num_boundary_lines * 2, len(lines))): # Scan a bit more for headers
        line = lines[i].strip()
        if not line:
            continue

        if not info["period_from"] and not info["period_to"]: # Only find first occurrence
            period_match = period_pattern.search(line)
            if period_match:
                info["period_from"] = period_match.group(1).strip()
                info["period_to"] = period_match.group(2).strip()
                logger.debug(f"Found period: {info['period_from']} to {info['period_to']} in line: '{line}'")

        # Simplistic Organization/Document Type (often at the very top)
        # Heuristic: All caps, or contains keywords. This is very fragile.
        line_lower = line.lower()
        if i < 3: # Prioritize first 3 lines for these
            if not info["organization_name"] and ("church" in line_lower or "organization" in line_lower or line.isupper()):
                # Avoid grabbing "PERIOD FROM..." as org name if it's all caps
                if not period_pattern.search(line):
                    info["organization_name"] = line
                    logger.debug(f"Potential organization name: '{line}'")
            elif not info["document_type"] and ("ledger" in line_lower or "journal" in line_lower or "statement" in line_lower or (line.isupper() and line != info["organization_name"])):
                 if not period_pattern.search(line):
                    info["document_type"] = line
                    logger.debug(f"Potential document type: '{line}'")

    # Scan bottom lines for page numbers
    for i in range(max(0, len(lines) - num_boundary_lines), len(lines)):
        line = lines[i].strip()
        if not line:
            continue
        if not info["page_number"]: # Only find first occurrence (usually at the very bottom)
            page_match = page_number_pattern.search(line)
            if page_match:
                info["page_number"] = page_match.group(1)
                if page_match.group(2): # Total pages
                    info["total_pages"] = page_match.group(2)
                logger.debug(f"Found page number: {info['page_number']}{' of ' + info['total_pages'] if info['total_pages'] else ''} in line: '{line}'")

    if any(info.values()): # Log if any piece of info was found
        logger.info(f"Extracted header/footer info: {info}")
    else:
        logger.info("No specific header/footer textual info (period, page numbers) found with current patterns.")
    return info


def extract_main_content_text(ocr_text: str, header_lines_to_skip: int = 5, footer_lines_to_skip: int = 5) -> str:
    """
    Removes a specified number of header and footer lines from the raw OCR text.

    This function provides a simple way to isolate the main content of a page
    by stripping lines from the beginning and end of the text block. It's a basic
    approach and is most effective when header/footer sizes are consistent or known.
    For more dynamic or precise segmentation, coordinate-based methods using
    OCR DataFrame output are recommended.

    Args:
        ocr_text (str): The full, raw OCR text from a page.
        header_lines_to_skip (int, optional): Number of lines to remove from the
            beginning of the text (considered as header). Defaults to 5.
        footer_lines_to_skip (int, optional): Number of lines to remove from the
            end of the text (considered as footer). Defaults to 5.

    Returns:
        str: The OCR text with header and footer lines removed. Returns an empty
        string if the input text is empty or if the lines to skip cover the
        entire text.
    """
    lines = ocr_text.strip().split('\n')

    if len(lines) == 0:
        logger.warning("extract_main_content_text: Received empty text.")
        return ""

    start_index = header_lines_to_skip
    # Ensure end_index is not negative if footer_lines_to_skip is large
    end_index = len(lines) - footer_lines_to_skip

    if start_index >= end_index:
        logger.warning(f"Not enough lines ({len(lines)}) to strip {header_lines_to_skip} header and {footer_lines_to_skip} footer lines. Returning original text or empty if strip covers all.")
        # Return empty if the strip would cover everything, or original if it's ambiguous.
        # For safety, perhaps return original or a portion if possible.
        if start_index >= len(lines): return "" # Stripping all header lines covers everything
        if end_index <= 0 : return "" # Stripping all footer lines covers everything.
        # If it's just overlap, it implies very few lines are considered "body".
        # Let's return what's left, which might be empty.
        return "\n".join(lines[start_index:end_index])


    main_content = "\n".join(lines[start_index:end_index])
    logger.info(f"Extracted main content: {len(main_content)} chars after stripping {header_lines_to_skip} header and {footer_lines_to_skip} footer lines.")
    return main_content


def process_page_ocr_results(ocr_text: str, ocr_dataframe: pd.DataFrame = None) -> (Dict[str, Any], List[Dict[str, Any]]):
    """
    Orchestrates the parsing of OCR results for a single page of a ledger document.

    This function serves as a primary entry point for processing the output of an OCR
    operation on a page. It first attempts to extract header and footer metadata
    (like organization name, period, page number) using text-based heuristics.
    Then, it proceeds to parse the main content for transaction data.

    If detailed OCR output (a DataFrame with word coordinates from `pytesseract.image_to_data`)
    is provided, this function will attempt to use `parse_ledger_data_from_dataframe`
    for more accurate, coordinate-aware parsing (though this part is currently conceptual
    and falls back to text-based methods).
    If only raw OCR text is available, it uses `extract_main_content_text` to
    heuristically remove headers/footers, followed by `parse_ledger_text` on the
    remaining text.

    Args:
        ocr_text (str): The raw text string extracted by OCR from the page.
        ocr_dataframe (pd.DataFrame, optional): A pandas DataFrame containing
            detailed OCR results (including word coordinates, confidence, etc.),
            typically from `pytesseract.image_to_data()`. If `None` or empty,
            parsing will rely solely on `ocr_text`. Defaults to `None`.

    Returns:
        tuple[Dict[str, Any], List[Dict[str, Any]]]: A tuple containing two elements:
            - The first element is a dictionary of extracted header/footer metadata.
            - The second element is a list of dictionaries, where each dictionary
              represents a parsed transaction, conforming to `EXPECTED_COLUMNS`.
    """
    logger.info("Starting OCR result processing for a page.")

    header_footer_data = extract_header_footer_info(ocr_text) # Basic text-based extraction for now

    # Future: if ocr_dataframe is available, use a coordinate-based header/footer extraction
    # header_footer_data_df = extract_header_footer_info_from_df(ocr_dataframe)
    # And merge/prioritize results.

    transactions = []
    if ocr_dataframe is not None and not ocr_dataframe.empty:
        logger.info("DataFrame provided, attempting to parse using coordinate-based logic (currently conceptual).")
        # This function is expected to handle header/footer removal internally using coordinates.
        transactions = parse_ledger_data_from_dataframe(ocr_dataframe)
    else:
        logger.info("No DataFrame provided or it's empty. Using text-based parsing for transactions.")
        # Use default skip lines, or make them configurable, or derive from header_footer_data analysis
        # For now, a simple default. This is a weak link.
        num_header_lines = 4 # Guess
        num_footer_lines = 2 # Guess
        # A more intelligent way would be to count how many lines contained the found header/footer info.

        main_text = extract_main_content_text(ocr_text,
                                              header_lines_to_skip=num_header_lines,
                                              footer_lines_to_skip=num_footer_lines)
        if main_text.strip():
            transactions = parse_ledger_text(main_text)
        else:
            logger.warning("Main content text is empty after attempting to strip header/footer. No transactions will be parsed.")

    logger.info(f"Page processing complete. Found {len(transactions)} transactions. Header/Footer: {header_footer_data}")
    return header_footer_data, transactions


if __name__ == '__main__':
    # Setup basic logging for script execution
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    logger.info("Parser Module Example Usage:")

    # Example 1: Header/Footer Extraction
    sample_ocr_header_footer = """
    MY CHURCH ORGANIZATION
    GENERAL LEDGER REPORT
    Period from 01/01/2022 to 01/31/2022

    Trans #    Type            Date        Num    Name                Memo                Account             Debit       Credit
    123        Check           01/05/2022  101    Bensway Cleaning    Cleaning Services   Custodian Services  150.00
    ... more transaction lines ...
    125        Gen Journal     01/15/2022  GJ1    Transfer            Monthly Transfer    Savings                         200.00

    Page 1 of 3
    Some other footer text
    """
    logger.info("\n--- Extracting Header/Footer Info ---")
    hf_info = extract_header_footer_info(sample_ocr_header_footer)
    logger.info(f"Extracted Info: {hf_info}")

    logger.info("\n--- Extracting Main Content (Text-based) ---")
    # Guessing 4 lines for header (ORG, TITLE, PERIOD, BLANK) and 3 for footer (RANDOM, PAGE, CONFIDENTIAL)
    main_content = extract_main_content_text(sample_ocr_header_footer,
                                             header_lines_to_skip=4,
                                             footer_lines_to_skip=3)
    logger.info("Main content after stripping (first 100 chars):")
    logger.info(main_content[:100] + "...")


    # Example 2: Using raw text for transaction parsing (via orchestrator)
    sample_ocr_output_transactions = """
    The Church -会计 Period from 01/01/2022 to 01/31/2022

    Trans #    Type            Date        Num    Name                Memo                Account             Debit       Credit
    123        Check           01/05/2022  101    Bensway Cleaning    Cleaning Services   Custodian Services  150.00
                                                                                        Cleaning Supplies   25.00
    124        Deposit         01/10/2022         Some Customer       Contribution        Income              500.00
    125        Gen Journal     01/15/2022  GJ1    Transfer            Monthly Transfer    Savings                         200.00
                                                                                        Checking                        200.00
    Page 2
    """
    logger.info("\n--- Parsing Sample Raw OCR Text via Orchestrator (No DataFrame) ---")
    # The orchestrator will call extract_header_footer and then parse_ledger_text on stripped content.
    # Default stripping in orchestrator is 4 header, 2 footer.
    header_data, parsed_transactions_text = process_page_ocr_results(sample_ocr_output_transactions)

    logger.info(f"Orchestrator - Header/Footer Data: {header_data}")
    if parsed_transactions_text:
        logger.info(f"Orchestrator - Parsed Transactions ({len(parsed_transactions_text)}):")
        for tx_num, tx in enumerate(parsed_transactions_text):
            logger.info(f"  TX {tx_num+1}: {tx}")
    else:
        logger.warning("Orchestrator - No transactions parsed from raw text example.")

    # Example 3: Placeholder for DataFrame parsing (via orchestrator)
    logger.info("\n--- Parsing from DataFrame via Orchestrator (Conceptual) ---")

    # Create a dummy DataFrame similar to what image_to_data might produce
    # This DataFrame should represent words from a typical ledger page structure
    dummy_ocr_words = [
        # Header Part
        {'level': 1, 'page_num': 1, 'block_num': 1, 'par_num': 1, 'line_num': 1, 'word_num': 1, 'left': 50, 'top': 30, 'width': 200, 'height': 20, 'conf': 95.0, 'text': 'My Org Name'},
        {'level': 1, 'page_num': 1, 'block_num': 1, 'par_num': 2, 'line_num': 1, 'word_num': 1, 'left': 50, 'top': 60, 'width': 300, 'height': 20, 'conf': 92.0, 'text': 'Ledger for Period: 01/01/2023 to 01/31/2023'},
        # Table Header
        {'level': 1, 'page_num': 1, 'block_num': 2, 'par_num': 1, 'line_num': 1, 'word_num': 1, 'left': 50, 'top': 100, 'width': 50, 'height': 15, 'conf': 90.0, 'text': 'Date'},
        {'level': 1, 'page_num': 1, 'block_num': 2, 'par_num': 1, 'line_num': 1, 'word_num': 2, 'left': 120, 'top': 100, 'width': 100, 'height': 15, 'conf': 88.0, 'text': 'Description'},
        {'level': 1, 'page_num': 1, 'block_num': 2, 'par_num': 1, 'line_num': 1, 'word_num': 3, 'left': 250, 'top': 100, 'width': 60, 'height': 15, 'conf': 93.0, 'text': 'Debit'},
        {'level': 1, 'page_num': 1, 'block_num': 2, 'par_num': 1, 'line_num': 1, 'word_num': 4, 'left': 320, 'top': 100, 'width': 60, 'height': 15, 'conf': 91.0, 'text': 'Credit'},
        # Data Row 1
        {'level': 1, 'page_num': 1, 'block_num': 3, 'par_num': 1, 'line_num': 1, 'word_num': 1, 'left': 50, 'top': 120, 'width': 50, 'height': 15, 'conf': 94.0, 'text': '01/05/23'},
        {'level': 1, 'page_num': 1, 'block_num': 3, 'par_num': 1, 'line_num': 1, 'word_num': 2, 'left': 120, 'top': 120, 'width': 100, 'height': 15, 'conf': 85.0, 'text': 'Office Supplies'},
        {'level': 1, 'page_num': 1, 'block_num': 3, 'par_num': 1, 'line_num': 1, 'word_num': 3, 'left': 250, 'top': 120, 'width': 60, 'height': 15, 'conf': 96.0, 'text': '50.00'},
        {'level': 1, 'page_num': 1, 'block_num': 3, 'par_num': 1, 'line_num': 1, 'word_num': 4, 'left': 320, 'top': 120, 'width': 60, 'height': 15, 'conf': 80.0, 'text': ''}, # Empty credit
        # Footer Part
        {'level': 1, 'page_num': 1, 'block_num': 4, 'par_num': 1, 'line_num': 1, 'word_num': 1, 'left': 300, 'top': 700, 'width': 80, 'height': 15, 'conf': 89.0, 'text': 'Page 1 / 1'},
    ]
    sample_df_for_orchestrator = pd.DataFrame(dummy_ocr_words)

    logger.info("Simulating parsing with a dummy DataFrame via orchestrator:")
    # The actual text for header/footer extraction by the orchestrator will be empty here,
    # as we are directly passing the DataFrame.
    # A more complete simulation would generate raw text from the DataFrame first.
    df_header_data, df_parsed_transactions = process_page_ocr_results("", ocr_dataframe=sample_df_for_orchestrator.copy())

    logger.info(f"Orchestrator (DF) - Header/Footer Data: {df_header_data}") # Will be from empty text
    if df_parsed_transactions: # parse_ledger_data_from_dataframe currently returns empty then calls parse_ledger_text
        logger.info(f"Orchestrator (DF) - Parsed Transactions ({len(df_parsed_transactions)}):")
        for tx_num, tx in enumerate(df_parsed_transactions):
            logger.info(f"  TX {tx_num+1}: {tx}")
    else:
        logger.warning("Orchestrator (DF) - No transactions parsed from DataFrame example (as expected from current placeholder logic).")

    logger.info("\nParser module example usage finished.")
