import pytest
import pandas as pd

# Add ocr_parser to sys.path
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from parser import ( # noqa: E402
    parse_ledger_text,
    extract_header_footer_info,
    extract_main_content_text,
    parse_ledger_data_from_dataframe,
    EXPECTED_COLUMNS
)

@pytest.fixture
def sample_ocr_text_simple():
    return """
Trans #    Type            Date        Num    Name                Memo                Account             Debit       Credit
123        Check           01/05/2022  101    Bensway Cleaning    Cleaning Services   Custodian Services  150.00
    """

@pytest.fixture
def sample_ocr_text_multiline_memo():
    return """
Trans #    Type            Date        Num    Name                Memo                Account             Debit       Credit
456        Journal         02/10/2023  J02    Some Vendor Inc.    Service for project X   Operating Expenses  75.50
                                            And also materials
    """

@pytest.fixture
def sample_ocr_text_header_footer():
    return """
THE BEST CHURCH ACCOUNTING
FINANCIAL LEDGER STATEMENT
Period from 01/01/2024 to January 31, 2024

Trans #    Type            Date        Num    Name             Memo          Account        Debit    Credit
001        Deposit         01/15/2024         Income Received  Contributions General Income          300.00

Some random text before footer
Page 1 of 10
CONFIDENTIAL DOCUMENT
    """

def test_extract_header_footer_info_period(sample_ocr_text_header_footer):
    info = extract_header_footer_info(sample_ocr_text_header_footer)
    assert info["period_from"] == "01/01/2024"
    assert info["period_to"] == "January 31, 2024"

def test_extract_header_footer_info_page_number(sample_ocr_text_header_footer):
    info = extract_header_footer_info(sample_ocr_text_header_footer)
    assert info["page_number"] == "1"
    assert info["total_pages"] == "10"

def test_extract_header_footer_info_org_doc_type(sample_ocr_text_header_footer):
    # This relies on the current heuristic (all caps or keywords)
    info = extract_header_footer_info(sample_ocr_text_header_footer)
    assert info["organization_name"] == "THE BEST CHURCH ACCOUNTING" # Based on being first all-caps line
    assert info["document_type"] == "FINANCIAL LEDGER STATEMENT"   # Based on being second all-caps line

def test_extract_header_footer_info_no_info():
    text = "Just a regular line of text\nAnd another one"
    info = extract_header_footer_info(text)
    assert info["period_from"] is None
    assert info["page_number"] is None
    assert info["organization_name"] is None
    assert info["document_type"] is None


def test_extract_main_content_text(sample_ocr_text_header_footer):
    # Default is 5 lines for header and 5 for footer
    # Header: ORG, TITLE, PERIOD, BLANK_LINE, COL_HEADERS
    # Footer: BLANK_LINE, RANDOM_TEXT, PAGE_NUM, CONFIDENTIAL, BLANK_LINE_AT_END_OF_STRING
    # Number of lines in sample_ocr_text_header_footer:
    # "" (start), ORG, TITLE, PERIOD, "", COL_HEADERS, "", DATA_LINE, "", "", RANDOM, PAGE, CONFIDENTIAL, "" (end) = 13 lines
    # If we strip 5 from top and 5 from bottom:
    # Top 5: "", ORG, TITLE, PERIOD, ""
    # Bottom 5: "", RANDOM, PAGE, CONFIDENTIAL, ""
    # Remaining: COL_HEADERS, "", DATA_LINE -> 3 lines.
    # The current implementation of extract_main_content_text joins with "\n".
    # Expected: "Trans # ... Credit\n\n001 ... 300.00"

    # Let's adjust the header_footer_lines for this specific text
    # Header lines to remove: ORG, TITLE, PERIOD, BLANK -> 4 lines
    # Footer lines to remove: RANDOM_TEXT, PAGE_NUM, CONFIDENTIAL -> 3 lines
    # We'll test with the default 5, then with a more tailored value.

    main_content_default_strip = extract_main_content_text(sample_ocr_text_header_footer) # default 5 lines
    lines = sample_ocr_text_header_footer.strip().split('\n')
    expected_default_strip = "\n".join(lines[5:-5])
    assert main_content_default_strip == expected_default_strip

    # Test with a more specific strip amount
    main_content_custom_strip = extract_main_content_text(sample_ocr_text_header_footer, header_footer_lines=3)
    expected_custom_strip = "\n".join(lines[3:-3]) #  COL_HEADERS, "", DATA_LINE, "", "", RANDOM_TEXT
    assert main_content_custom_strip == expected_custom_strip


def test_parse_ledger_text_simple_placeholder(sample_ocr_text_simple, capsys):
    # Current parse_ledger_text is very basic and prints warnings.
    # It tries to find a date and then uses the whole line as memo.
    transactions = parse_ledger_text(sample_ocr_text_simple)

    # Based on current naive logic:
    # It might find "Date" in header, then skip.
    # For the data line "123 Check...", it finds "01/05/2022".
    # It creates a transaction: {'Date': '01/05/2022', 'Memo': '123 Check...'}

    # Let's check if any transaction was made (even if poorly parsed)
    # The function prints "Parsed X potential transaction entries"
    # and also "Detected potential header"

    captured = capsys.readouterr() # Capture prints
    # print(f"Captured out: {captured.out}") # For debugging the test

    assert "Detected potential header" in captured.out
    if transactions: # If any transaction was parsed
        assert len(transactions) > 0
        assert transactions[0]['Date'] == '01/05/2022'
        # The exact content of 'Memo' and other fields depends on the very naive splitting.
        # For now, this test is more about it running without error and producing *some* output.
    else:
        # If it didn't parse any transaction (e.g. if header logic consumed the data line)
        assert "Warning: No transactions were parsed" in captured.out or len(transactions) == 0


def test_parse_ledger_text_no_data():
    text = "Just some random text\nNo parsable data here"
    transactions = parse_ledger_text(text)
    assert len(transactions) == 0

# --- Tests for parse_ledger_data_from_dataframe ---
# This function is largely a placeholder, so tests will be limited.
# They will primarily check that it runs and handles empty/basic DataFrames.

def test_parse_ledger_data_from_dataframe_empty_df():
    empty_df = pd.DataFrame(columns=['level', 'page_num', 'block_num', 'par_num', 'line_num', 'word_num', 'left', 'top', 'width', 'height', 'conf', 'text'])
    transactions = parse_ledger_data_from_dataframe(empty_df.copy())
    assert len(transactions) == 0

def test_parse_ledger_data_from_dataframe_df_with_low_conf_text():
    data = {'conf': [-1, 20], 'text': ['ignore', 'lowconf']} # conf -1 is ignored
    df = pd.DataFrame(data, columns=['conf', 'text', 'level', 'page_num', 'block_num', 'par_num', 'line_num', 'word_num', 'left', 'top', 'width', 'height'])
    # Fill NaN for other required columns to avoid errors, though the function might not use them yet.
    for col in df.columns:
        if col not in ['conf', 'text']:
            df[col] = 0

    transactions = parse_ledger_data_from_dataframe(df.copy())
    assert len(transactions) == 0 # No usable text

def test_parse_ledger_data_from_dataframe_conceptual_run(capsys):
    # Create a minimal DataFrame that might represent some words
    # This tests the conceptual y-coordinate splitting and line reconstruction part.
    dummy_data = {
        'level': [5, 5, 5, 5], 'page_num': [1, 1, 1, 1],
        'block_num': [1, 1, 1, 1], 'par_num': [1, 1, 1, 1],
        'line_num': [1, 1, 2, 2], # Two words on line 1, two on line 2
        'word_num': [1, 2, 1, 2],
        'left': [10, 60, 10, 70],
        'top': [100, 100, 120, 120], # y-coords for lines
        'width': [40, 50, 50, 60],
        'height': [15, 15, 15, 15],
        'conf': [90, 92, 88, 95],
        'text': ['Hello', 'World', 'Test', 'Data']
    }
    df = pd.DataFrame(dummy_data)

    # To make it pass the current df['top'].max() + df['height'].max() for page_height
    # and avoid division by zero or issues if all 'top' are same.
    # Ensure body_candidates is not empty.
    # Modify top so that they fall within the "body" (15% to 85% of page_height)
    # Max top + height = 120 + 15 = 135.
    # Top 15% = 0.15 * 135 = 20.25
    # Bottom 85% = 0.85 * 135 = 114.75
    # Our 'top' values (100, 120) need adjustment or page_height needs to be larger.
    # Let's make one 'top' very small for header, one very large for footer,
    # and keep data 'top' in the middle.

    extended_dummy_data = {
        'level':    [1, 5, 5, 5, 5, 2],
        'page_num': [1, 1, 1, 1, 1, 1],
        'block_num':[1, 1, 1, 1, 1, 1],
        'par_num':  [1, 1, 1, 1, 1, 1],
        'line_num': [0, 1, 1, 2, 2, 3],
        'word_num': [1, 1, 2, 1, 2, 1],
        'left':     [10, 10, 60, 10, 70, 10],
        'top':      [10, 100, 100, 120, 120, 200], # Header, Body, Body, Body, Body, Footer
        'width':    [40, 40, 50, 50, 60, 40],
        'height':   [15, 15, 15, 15, 15, 15],
        'conf':     [90, 90, 92, 88, 95, 90],
        'text':     ['HeaderTxt', 'Hello', 'World', 'Test', 'Data', 'FooterTxt']
    }
    df_for_body_extraction = pd.DataFrame(extended_dummy_data)

    transactions = parse_ledger_data_from_dataframe(df_for_body_extraction.copy())
    captured = capsys.readouterr()

    assert "Found 2 potential body lines from DataFrame (conceptual)." in captured.out
    # The detailed parsing is not implemented, so transactions should be empty
    assert len(transactions) == 0
    # assert "Detailed DataFrame table parsing logic is not yet implemented." in captured.out


if __name__ == "__main__":
    pytest.main()
