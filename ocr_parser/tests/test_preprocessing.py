import pytest
from PIL import Image, ImageChops
import os

# Add ocr_parser to sys.path if tests are run from the root directory
# This allows importing from ocr_parser.preprocessing
import sys
# Assuming the tests directory is ocr_parser/tests/
# Go up one level to ocr_parser, then one more to the project root if ocr_parser is not top-level.
# For simplicity here, we assume ocr_parser is discoverable or this test is run in a way that ocr_parser is in PYTHONPATH
# A better way for larger projects is to have a proper setup.py or pyproject.toml that handles paths.
# For now, let's try to adjust path relative to this file.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from preprocessing import preprocess_image, pdf_to_images # noqa: E402
# We will likely need to mock fitz for pdf_to_images if we don't have a real PDF
# or cannot easily create one in the test environment.

@pytest.fixture
def sample_image_rgb():
    """Creates a simple RGB PIL Image for testing."""
    img = Image.new("RGB", (60, 30), color="red")
    # Add some variation
    pixels = img.load()
    for i in range(img.width):
        for j in range(img.height):
            if (i + j) % 2 == 0:
                pixels[i, j] = (0, 0, 255) # Blue
            else:
                pixels[i,j] = (255,255,255) # White
    return img

@pytest.fixture
def sample_image_grayscale():
    """Creates a simple grayscale PIL Image for testing."""
    img = Image.new("L", (60, 30), color="gray")
    pixels = img.load()
    for i in range(img.width):
        for j in range(img.height):
            pixels[i,j] = (i + j * 2) % 256
    return img


def test_preprocess_image_converts_to_grayscale(sample_image_rgb):
    """Test that RGB image is converted to grayscale."""
    processed_image = preprocess_image(sample_image_rgb)
    assert processed_image.mode == "1", "Image should be binarized (mode '1')"

def test_preprocess_image_binarization(sample_image_grayscale):
    """Test that a grayscale image is binarized (black and white)."""
    # Create a grayscale image with known values
    img = Image.new("L", (2, 1), color="white")
    pixels = img.load()
    pixels[0, 0] = 50  # Below threshold (128) -> becomes 0 (black)
    pixels[1, 0] = 200 # Above threshold (128) -> becomes 255 (white)

    processed_image = preprocess_image(img)
    assert processed_image.mode == "1", "Image should be binarized (mode '1')"

    processed_pixels = processed_image.load()
    assert processed_pixels[0, 0] == 0, "Pixel below threshold should be black"
    # In '1' mode, white is 255.
    assert processed_pixels[1, 0] == 255, "Pixel above threshold should be white"

def test_preprocess_image_already_grayscale(sample_image_grayscale):
    """Test preprocessing an already grayscale image."""
    processed_image = preprocess_image(sample_image_grayscale)
    assert processed_image.mode == "1", "Image should be binarized (mode '1')"

def test_preprocess_image_already_binary(sample_image_grayscale):
    """Test preprocessing an image that's effectively binary after grayscale conversion."""
    # Create an image that will become binary with a simple threshold
    img = Image.new("L", (2,1))
    pix = img.load()
    pix[0,0] = 10 # dark
    pix[1,0] = 250 # light

    processed_img = preprocess_image(img)
    assert processed_img.mode == "1"
    processed_pix = processed_img.load()
    assert processed_pix[0,0] == 0 # black
    assert processed_pix[1,0] == 255 # white


# To test pdf_to_images, we would ideally mock the `fitz` library
# or have a very small, simple, valid PDF file in the test assets.
# Mocking `fitz` example:
# from unittest.mock import patch, MagicMock

# @patch('preprocessing.fitz.open')
# def test_pdf_to_images_mocked(mock_fitz_open):
#     # Setup mock document and page
#     mock_doc = MagicMock()
#     mock_page = MagicMock()
#     mock_pix = MagicMock()

#     # Configure mock_page.get_pixmap to return mock_pix
#     mock_page.get_pixmap.return_value = mock_pix
#     # Configure mock_pix.tobytes to return some minimal valid PPM image bytes
#     # A 1x1 white pixel PPM image

#     # P3 means color, 1 1 means 1x1, 255 is max color value
#     # then R G B value for the pixel
#     ppm_header = b"P6\n1 1\n255\n"
#     ppm_pixel_data = b"\xff\xff\xff" # White pixel
#     mock_pix.tobytes.return_value = ppm_header + ppm_pixel_data # Must be PPM for Image.open

#     mock_doc.load_page.return_value = mock_page
#     mock_doc.__len__.return_value = 1 # PDF has 1 page
#     mock_fitz_open.return_value = mock_doc

#     images = pdf_to_images("dummy.pdf")
#     assert len(images) == 1
#     assert isinstance(images[0], Image.Image)
#     mock_fitz_open.assert_called_with("dummy.pdf")
#     mock_doc.load_page.assert_called_with(0)
#     mock_page.get_pixmap.assert_called_with(dpi=300) # Default DPI
#     mock_pix.tobytes.assert_called_with("ppm")


# For now, the pdf_to_images test that uses fitz directly will be skipped
# if no PDF is available or if fitz itself has issues in a minimal test env.
@pytest.mark.skip(reason="Requires a sample PDF or more complex mocking of fitz for robust testing")
def test_pdf_to_images_with_actual_pdf():
    # This test would require a sample PDF file in the 'tests/sample_files' directory
    # e.g., create a dummy pdf, or add a small one to the repo for testing.
    # For now, this is just a placeholder.
    # sample_pdf_path = os.path.join(os.path.dirname(__file__), "sample_files", "dummy.pdf")
    # assert os.path.exists(sample_pdf_path), "Test PDF not found for test_pdf_to_images_with_actual_pdf"
    # images = pdf_to_images(sample_pdf_path)
    # assert len(images) > 0 # or specific number of pages
    pass

# A simple way to create a dummy PDF for basic testing if needed, though it adds complexity.
# from reportlab.pdfgen import canvas
# def create_dummy_pdf(path, text="Hello"):
#     c = canvas.Canvas(path)
#     c.drawString(100, 750, text)
#     c.save()

# @pytest.fixture(scope="module") # Create once per module
# def dummy_pdf_file():
#     pdf_path = "dummy_test.pdf"
#     create_dummy_pdf(pdf_path, "Test Page 1")
#     yield pdf_path
#     os.remove(pdf_path)

# def test_pdf_to_images_with_generated_pdf(dummy_pdf_file):
#     # This test requires reportlab to be installed.
#     try:
#         images = pdf_to_images(dummy_pdf_file)
#         assert len(images) == 1
#         assert images[0].size[0] > 0 # Check image has some width
#     except ImportError:
#         pytest.skip("reportlab not installed, skipping generated PDF test")
#     except Exception as e: # Catch fitz related errors if it fails on generated pdf
#         pytest.skip(f"Skipping due to fitz/pdf processing error: {e}")

if __name__ == "__main__":
    # This allows running pytest directly on this file:
    # python -m pytest ocr_parser/tests/test_preprocessing.py
    pytest.main()
