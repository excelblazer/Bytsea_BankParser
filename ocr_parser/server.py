from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from preprocessing import pdf_to_images, preprocess_image
from ocr import extract_text_from_image
from parser import parse_ledger_text, parse_statement_text
from PIL import Image
import tempfile

app = Flask(__name__)
CORS(app)

@app.route('/api/ocr/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

@app.route('/api/ocr/parse', methods=['POST'])
def ocr_parse():
    file = request.files.get('file')
    parser_type = request.form.get('parserType', 'statement')
    if not file:
        return jsonify({'error': 'No file uploaded'}), 400
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    with tempfile.TemporaryDirectory() as tmpdir:
        file_path = os.path.join(tmpdir, filename)
        file.save(file_path)
        images = []
        if ext == '.pdf':
            images = pdf_to_images(file_path)
        elif ext in ['.jpg', '.jpeg', '.png', '.webp']:
            image = Image.open(file_path)
            images = [image]
        else:
            return jsonify({'error': 'Unsupported file type'}), 400
        if not images:
            return jsonify({'error': 'No images extracted from file'}), 400
        texts = []
        for img in images:
            pre_img = preprocess_image(img)
            text = extract_text_from_image(pre_img)
            texts.append(text)
        full_text = '\n'.join(texts)
        if parser_type == 'ledger':
            result = parse_ledger_text(full_text)
        else:
            result = parse_statement_text(full_text)
        return jsonify({'result': result})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
