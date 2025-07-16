import pytesseract
from PIL import Image
import logging

# Setup logger for this module
logger = logging.getLogger(__name__)
# logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


def extract_text_from_image(image: Image.Image, lang: str = 'eng', psm: int = 6) -> str:
    """
    Extracts text from a given PIL Image object using Tesseract OCR.

    This function interfaces with `pytesseract` to perform OCR. It allows
    specification of the language and Tesseract's Page Segmentation Mode (PSM).
    Error handling is included for common Tesseract issues.

    Args:
        image (Image.Image): The preprocessed PIL Image object from which to extract text.
            It's recommended to pass a binarized (black and white) image for best results.
        lang (str, optional): The language code for Tesseract OCR (e.g., 'eng' for English,
            'deu' for German). Defaults to 'eng'. Multiple languages can be specified
            by joining with '+' (e.g., 'eng+fra').
        psm (int, optional): Tesseract Page Segmentation Mode. This setting can
            significantly impact OCR quality depending on the document layout.
            Common values include:
            - 3: Fully automatic page segmentation, but no OSD (Orientation and
                 Script Detection). (Tesseract's default)
            - 6: Assume a single uniform block of text. Often good for pages
                 that are primarily a single table or block of text.
            - 11: Sparse text. Find as much text as possible in no particular order.
            - 12: Sparse text with OSD.
            Run `tesseract --help-psm` in the command line for a full list.
            Defaults to 6, which is often a good starting point for ledger-like documents.

    Returns:
        str: The extracted text as a single string. Returns an empty string if
        OCR fails, Tesseract is not found, or the input image is None.
    """
    if image is None:
        logger.warning("extract_text_from_image received None image, returning empty string.")
        return ""

    custom_config = f'--psm {psm}'
    try:
        logger.debug(f"Attempting OCR with lang='{lang}', psm={psm}")
        text = pytesseract.image_to_string(image, lang=lang, config=custom_config)
        logger.info(f"OCR successful. Extracted {len(text)} characters.")
        return text
    except pytesseract.TesseractNotFoundError:
        logger.error("Tesseract is not installed or not in your PATH. Please install Tesseract OCR.")
        # Re-raise or handle as per application's error strategy. For now, returning empty.
        return ""
    except pytesseract.TesseractError as te:
        logger.error(f"Tesseract runtime error: {te}", exc_info=True)
        return ""
    except Exception as e:
        logger.error(f"Unexpected error during OCR processing: {e}", exc_info=True)
        return ""

if __name__ == '__main__':
    # Setup basic logging for script execution
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

    # This is an example of how to use the ocr module.
    # It requires the preprocessing module and sample images.
    import os
    # Ensure correct import path for preprocessing when running this script directly
    try:
        from preprocessing import pdf_to_images, preprocess_image
    except ImportError:
        logger.error("Could not import preprocessing module. Make sure ocr_parser is in PYTHONPATH or run from project root.")
        sys.exit(1)


    logger.info("OCR Module Example Usage:")

    # Define paths (adjust if your structure is different)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sample_data_dir = os.path.join(current_dir, "sample_data")
    sample_pdf_path = os.path.join(sample_data_dir, "sample_ledger.pdf")
    sample_image_path = os.path.join(sample_data_dir, "sample_ledger_page.png")

    # Test with a PDF (relies on preprocessing creating sample_ledger.pdf if it doesn't exist)
    if os.path.exists(sample_pdf_path):
        logger.info(f"\nProcessing PDF: {sample_pdf_path}")
        pil_images = pdf_to_images(sample_pdf_path) # This function now uses logging
        if pil_images:
            logger.info(f"PDF converted to {len(pil_images)} image(s). Processing the first page.")
            first_page_image = pil_images[0]

            preprocessed_image = preprocess_image(first_page_image)

            preprocessed_image_fn = "temp_preprocessed_for_ocr_pdf.png"
            preprocessed_image_path = os.path.join(sample_data_dir, preprocessed_image_fn)
            try:
                preprocessed_image.save(preprocessed_image_path)
                logger.info(f"Preprocessed image saved to: {preprocessed_image_path}")
            except Exception as e:
                logger.error(f"Could not save preprocessed image '{preprocessed_image_fn}': {e}")

            extracted_text = extract_text_from_image(preprocessed_image, psm=6)
            if extracted_text.strip():
                logger.info("\n--- Extracted Text (from PDF first page) ---")
                logger.info(extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text)
                logger.info("--- End of Extracted Text ---")
            else:
                logger.warning("No text extracted from the PDF page or an error occurred.")
        else:
            logger.warning(f"Could not convert PDF {sample_pdf_path} to images or PDF was empty.")
    else:
        logger.warning(f"\nSample PDF not found at {sample_pdf_path}. Skipping PDF test.")

    # Test with a single image (relies on preprocessing creating sample_ledger_page.png)
    if os.path.exists(sample_image_path):
        logger.info(f"\nProcessing Image: {sample_image_path}")
        try:
            image_to_test = Image.open(sample_image_path)

            preprocessed_image_single = preprocess_image(image_to_test)
            preprocessed_single_fn = "temp_preprocessed_for_ocr_image.png"
            preprocessed_single_path = os.path.join(sample_data_dir, preprocessed_single_fn)
            try:
                preprocessed_image_single.save(preprocessed_single_path)
                logger.info(f"Preprocessed image saved to: {preprocessed_single_path}")
            except Exception as e:
                logger.error(f"Could not save preprocessed image '{preprocessed_single_fn}': {e}")

            extracted_text_img = extract_text_from_image(preprocessed_image_single, psm=6)
            if extracted_text_img.strip():
                logger.info("\n--- Extracted Text (from image) ---")
                logger.info(extracted_text_img[:500] + "..." if len(extracted_text_img) > 500 else extracted_text_img)
                logger.info("--- End of Extracted Text ---")
            else:
                logger.warning("No text extracted from the image or an error occurred.")
        except FileNotFoundError:
             logger.error(f"Sample image file not found at {sample_image_path} during open attempt.")
        except Exception as e:
            logger.error(f"Error processing image {sample_image_path}: {e}", exc_info=True)

    else:
        logger.warning(f"\nSample image not found at {sample_image_path}. Skipping image test.")

    if not os.path.exists(sample_pdf_path) and not os.path.exists(sample_image_path):
        logger.info("\nPlease add 'sample_ledger.pdf' or 'sample_ledger_page.png' to the 'ocr_parser/sample_data' directory to test the OCR module, or ensure preprocessing.py can create them.")

    # Example of getting detailed OCR data (bounding boxes, confidence, etc.)
    logger.info("\n--- Example: Getting Detailed OCR Data (image_to_data) ---")
    try:
        if os.path.exists(sample_image_path): # Use the same sample image if available
            img_for_data = Image.open(sample_image_path)
            preprocessed_img_for_data = preprocess_image(img_for_data) # Preprocess it

            logger.info("Calling pytesseract.image_to_data...")
            # Make sure to handle potential errors from image_to_data as well
            ocr_data_df = pytesseract.image_to_data(preprocessed_img_for_data, output_type=pytesseract.Output.DATAFRAME, lang='eng', config='--psm 6')

            # Filter out low confidence entries (often -1 for non-text blocks or problematic OCR)
            ocr_data_df = ocr_data_df[ocr_data_df.conf > 0] # Keep only positive confidence scores

            if not ocr_data_df.empty:
                logger.info("\n--- OCR Data (DataFrame, first 5 rows with conf > 0) ---")
                # Pandas to_string can be verbose, head() is usually enough for a log
                # For cleaner log output, select specific columns or print df.head().to_string()
                logger.info(f"\n{ocr_data_df.head().to_string()}")
                logger.info("--- End of OCR Data ---")

                # Example of iterating through detected words:
                # logger.info("Detected words and their bounding boxes:")
                # for index, row in ocr_data_df.iterrows():
                #     if str(row['text']).strip(): # Check if text is not just whitespace
                #         logger.info(f"Text: '{row['text']}', Box: ({row['left']},{row['top']},{row['width']},{row['height']}), Conf: {row['conf']}")
            else:
                logger.info("No data with positive confidence returned by image_to_data.")
        else:
            logger.warning(f"Sample image {sample_image_path} not found, skipping image_to_data example.")

    except pytesseract.TesseractNotFoundError:
        logger.error("Tesseract not found for image_to_data example.")
    except Exception as e:
        logger.error(f"Error getting detailed OCR data with image_to_data: {e}", exc_info=True)

    logger.info("\nOCR module example execution finished.")
