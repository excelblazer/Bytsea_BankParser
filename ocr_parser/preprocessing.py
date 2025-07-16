import fitz  # PyMuPDF
from PIL import Image, ImageOps
import io
import logging
import os # For file existence check

# Setup logger for this module
logger = logging.getLogger(__name__)
# Basic configuration for logging (can be more sophisticated in a central app setup)
# logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


def pdf_to_images(pdf_path: str, dpi: int = 300) -> list[Image.Image]:
    """
    Converts each page of a PDF file into a list of PIL Image objects.

    This function handles basic file checks (existence, readability) and
    common PDF issues like password protection (logs a warning and returns empty).
    It uses PyMuPDF (fitz) for PDF processing.

    Args:
        pdf_path (str): The file path to the PDF document.
        dpi (int, optional): Dots Per Inch. This determines the resolution of
            the output images. Higher DPI values (e.g., 300-600) generally
            result in better OCR quality but also larger image files and
            slower processing. Defaults to 300.

    Returns:
        list[Image.Image]: A list of PIL Image objects, where each image
        corresponds to a page in the PDF. Returns an empty list if the PDF
        cannot be processed (e.g., file not found, encrypted, corrupted).
    """
    images: list[Image.Image] = []
    if not os.path.exists(pdf_path):
        logger.error(f"PDF file not found: {pdf_path}")
        return images
    if not os.access(pdf_path, os.R_OK):
        logger.error(f"PDF file not readable (permission issue): {pdf_path}")
        return images

    try:
        doc = fitz.open(pdf_path)
        if doc.needs_pass:
            logger.warning(f"PDF file {pdf_path} is encrypted and requires a password. Cannot process.")
            doc.close()
            return images

        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            # Consider adding a try-except around get_pixmap if some pages can be problematic
            pix = page.get_pixmap(dpi=dpi)
            img_bytes = pix.tobytes("ppm") # Using PPM for direct PIL compatibility
            image = Image.open(io.BytesIO(img_bytes))
            images.append(image)
        doc.close()
        logger.info(f"Successfully converted PDF '{pdf_path}' to {len(images)} image(s).")
    except fitz.EmptyFileError:
        logger.error(f"File {pdf_path} is empty or not a valid PDF.")
        return []
    except fitz.FileNotFoundError: # Should be caught by os.path.exists, but good to have.
        logger.error(f"Fitz: PDF file not found: {pdf_path}")
        return []
    except Exception as e:
        logger.error(f"Error processing PDF {pdf_path}: {e}", exc_info=True)
        return []
    return images

def preprocess_image(image: Image.Image) -> Image.Image:
    """
    Applies basic preprocessing steps to a PIL Image object to enhance OCR accuracy.

    The current preprocessing involves:
    1. Conversion to grayscale: Simplifies the image by removing color information.
    2. Binarization (Thresholding): Converts the grayscale image to a binary
       (black and white) image using a fixed threshold. This helps Tesseract
       distinguish text from the background.

    Future enhancements could include:
    - Adaptive thresholding (e.g., Otsu's method) for more robust binarization
      across images with varying lighting conditions.
    - Noise reduction techniques (e.g., median filter).
    - Deskewing to correct rotated images.
    - Heuristics for detecting and handling inverted images (light text on dark background).

    Args:
        image (Image.Image): The input PIL Image object. Can be color or grayscale.

    Returns:
        Image.Image: A preprocessed PIL Image object, binarized (mode '1').
    """
    if image is None:
        logger.warning("preprocess_image received None, returning None.")
        return None

    # Convert to grayscale
    try:
        processed_image = image.convert("L")
    except Exception as e:
        logger.error(f"Error during image conversion to grayscale: {e}", exc_info=True)
        return image # Return original image if conversion fails

    # Apply thresholding (binarization)
    # This converts the image to black and white.
    # The threshold value might need adjustment based on image characteristics.
    # Otsu's method could be an alternative for automatic thresholding.
    # For more advanced thresholding, consider:
    # from skimage.filters import threshold_otsu
    # import numpy as np
    # gray_np = np.array(processed_image)
    # thresh_value = threshold_otsu(gray_np)
    # processed_image = processed_image.point(lambda x: 0 if x < thresh_value else 255, '1')
    threshold = 128  # Example fixed threshold value
    processed_image = processed_image.point(lambda x: 0 if x < threshold else 255, '1')

    # Optional: Invert colors if text is light on dark background.
    # This decision often requires heuristics (e.g., checking average pixel intensity).
    # For example, if most of the image is dark after binarization, it might be inverted.
    # if np.mean(np.array(processed_image)) < 100: # Heuristic: if mostly black
    #    logger.info("Potential light text on dark background, consider inversion if OCR is poor.")
    #    # processed_image = ImageOps.invert(processed_image.convert('RGB')).convert('L') # Re-convert carefully
    #    # processed_image = processed_image.point(lambda x: 0 if x < threshold else 255, '1')

    logger.debug("Image preprocessed: converted to grayscale and binarized.")
    return processed_image

if __name__ == '__main__':
    # Setup basic logging for script execution
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

    # Example usage (requires a sample PDF)
    # Create a dummy PDF for testing if you don't have one.
    # For now, this part will be commented out until we have sample files.

    # Determine the base directory assuming this script is in ocr_parser/
    base_dir = os.path.dirname(os.path.abspath(__file__))
    sample_data_dir = os.path.join(base_dir, "sample_data")
    if not os.path.exists(sample_data_dir):
        os.makedirs(sample_data_dir)
        logger.info(f"Created sample_data directory at: {sample_data_dir}")

    sample_pdf_path = os.path.join(sample_data_dir, "sample_ledger.pdf")

    # Create a dummy PDF for testing if it doesn't exist
    # Note: This requires reportlab. Add `pip install reportlab` if not present.
    if not os.path.exists(sample_pdf_path):
        try:
            from reportlab.pdfgen import canvas
            logger.info(f"Creating a dummy PDF for testing at {sample_pdf_path}...")
            c = canvas.Canvas(sample_pdf_path)
            c.drawString(72, 800, "Sample Ledger Document")
            c.drawString(72, 750, "Trans # | Type    | Date       | Amount")
            c.drawString(72, 730, "101     | Check   | 01/01/2023 | 100.00")
            c.save()
            logger.info(f"Dummy PDF created: {sample_pdf_path}")
        except ImportError:
            logger.warning("reportlab is not installed. Cannot create a dummy PDF. Skipping PDF processing example.")
        except Exception as e:
            logger.error(f"Could not create dummy PDF: {e}")


    if os.path.exists(sample_pdf_path):
        logger.info(f"Processing {sample_pdf_path}...")
        pil_images = pdf_to_images(sample_pdf_path)
        if pil_images:
            logger.info(f"Successfully converted PDF to {len(pil_images)} images.")
            # Preprocess the first image as an example
            first_page_image = pil_images[0]
            preprocessed_first_image = preprocess_image(first_page_image)

            preprocessed_image_path = os.path.join(sample_data_dir, "preprocessed_page_1.png")
            try:
                preprocessed_first_image.save(preprocessed_image_path)
                logger.info(f"Saved preprocessed version of the first page to {preprocessed_image_path}")
            except Exception as e:
                logger.error(f"Could not save preprocessed image: {e}")

            # Example of preprocessing a standalone image
            # Create a dummy image for testing
            sample_image_path = os.path.join(sample_data_dir, "sample_ledger_page.png")
            try:
                dummy_standalone_image = Image.new("RGB", (200,100), "white")
                # You could draw some text here if Pillow has font support available
                dummy_standalone_image.save(sample_image_path)
                logger.info(f"Created dummy standalone image: {sample_image_path}")

                img_to_process = Image.open(sample_image_path)
                preprocessed_img = preprocess_image(img_to_process)
                preprocessed_standalone_path = os.path.join(sample_data_dir, "preprocessed_standalone.png")
                preprocessed_img.save(preprocessed_standalone_path)
                logger.info(f"Saved preprocessed version of the standalone image to {preprocessed_standalone_path}")
            except Exception as e:
                logger.error(f"Error with standalone image processing example: {e}")

        else:
            logger.warning(f"Could not process PDF: {sample_pdf_path}. No images returned.")
    else:
        logger.warning(f"Sample PDF {sample_pdf_path} not found and could not be auto-created. Please add a sample PDF to test or install reportlab.")

    logger.info("Preprocessing module example execution finished.")
