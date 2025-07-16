import pytest
from PIL import Image
from unittest.mock import patch, MagicMock

# Add ocr_parser to sys.path
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ocr import extract_text_from_image # noqa: E402
# Assuming pytesseract might not be fully set up or we want to avoid actual OCR for speed/reliability in unit tests.

@pytest.fixture
def simple_image():
    """Provides a simple PIL Image for testing."""
    # Create a 1x1 black image. Content doesn't matter much if we mock pytesseract.
    return Image.new("L", (10, 10), color="black")

@patch('ocr.pytesseract.image_to_string')
def test_extract_text_from_image_calls_pytesseract(mock_image_to_string, simple_image):
    """Test that extract_text_from_image calls pytesseract.image_to_string with correct args."""
    expected_text = "Hello OCR"
    mock_image_to_string.return_value = expected_text

    # Test with default language and psm
    text = extract_text_from_image(simple_image)
    assert text == expected_text
    mock_image_to_string.assert_called_once_with(simple_image, lang='eng', config='--psm 6')

    # Test with custom language and psm
    mock_image_to_string.reset_mock()
    custom_lang = 'deu'
    custom_psm = 3
    text = extract_text_from_image(simple_image, lang=custom_lang, psm=custom_psm)
    assert text == expected_text
    mock_image_to_string.assert_called_once_with(simple_image, lang=custom_lang, config=f'--psm {custom_psm}')

@patch('ocr.pytesseract.image_to_string')
def test_extract_text_from_image_handles_pytesseract_error(mock_image_to_string, simple_image, capsys):
    """Test error handling when pytesseract raises an exception."""
    mock_image_to_string.side_effect = Exception("OCR failed")

    text = extract_text_from_image(simple_image)
    assert text == ""
    captured = capsys.readouterr()
    assert "Error during OCR processing: OCR failed" in captured.out

@patch('ocr.pytesseract.image_to_string')
def test_extract_text_from_image_handles_tesseract_not_found(mock_image_to_string, simple_image, capsys):
    """Test error handling for TesseractNotFoundError."""
    # Import TesseractNotFoundError from pytesseract if available, otherwise use a generic Exception for the test
    try:
        from pytesseract import TesseractNotFoundError
    except ImportError:
        TesseractNotFoundError = Exception # Fallback for environments where pytesseract might not be fully installed
        # This test might not be as precise if TesseractNotFoundError cannot be imported.

    mock_image_to_string.side_effect = TesseractNotFoundError("Tesseract not found")

    text = extract_text_from_image(simple_image)
    assert text == ""
    captured = capsys.readouterr()
    # The exact error message for TesseractNotFoundError is printed by pytesseract itself,
    # then our function prints its own message.
    # We check for our function's message.
    assert "Tesseract is not installed or not in your PATH." in captured.out


# To run actual OCR (integration test style), you would not mock pytesseract.
# This would require Tesseract to be installed and configured.
@pytest.mark.integration
@pytest.mark.skipif(not os.environ.get("RUN_INTEGRATION_TESTS"), reason="Integration tests are skipped by default.")
def test_extract_text_from_image_integration(simple_image_with_text): # Needs a fixture that creates an image with actual text
    """
    Integration test for OCR. Requires Tesseract installed and a way to create an image with text.
    This is more complex to set up reliably in all environments.
    `simple_image_with_text` fixture would use Pillow to draw text onto an image.
    """
    # This is a conceptual test.
    # from PIL import ImageDraw
    # img = Image.new("L", (200, 50), color="white")
    # draw = ImageDraw.Draw(img)
    # try:
    #     # This might need a font file or a default font that's always available.
    #     draw.text((10, 10), "TESTING", fill="black")
    # except Exception as e:
    #     pytest.skip(f"Could not create image with text: {e}")

    # text = extract_text_from_image(img, psm=6) # Use a PSM suitable for single line text
    # assert "TESTING" in text.upper() # OCR might not be perfect, so check for containment and ignore case
    pass


if __name__ == "__main__":
    pytest.main()
