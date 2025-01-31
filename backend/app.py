from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import time
from paddleocr import PaddleOCR
import os
import uuid

app = Flask(__name__)
CORS(app)

# Initialize OCR within function to prevent memory issues
@app.route('/ocr', methods=['POST'])
def ocr_api():
    ocr = PaddleOCR(use_angle_cls=True, lang='en', use_gpu=False, use_mp=False)  # Ensure GPU is off if needed

    data = request.json
    if not data or 'image' not in data:
        return jsonify({'error': 'No image data provided'}), 400

    base64_image = data['image']
    temp_image_path = ''
    try:
        image_data = base64.b64decode(base64_image)
        temp_image_path = f"temp_image_{uuid.uuid4().hex}.jpg"

        with open(temp_image_path, 'wb') as f:
            f.write(image_data)

        start_time = time.time()
        result = ocr.ocr(temp_image_path, cls=True)
        end_time = time.time()

        detected_text = []
        for idx, res in enumerate(result):
            for line in res or []:
                if len(line[1][0]) > 2:
                    detected_text.append(line[1][0])

        os.remove(temp_image_path)

        return jsonify({
            'text': detected_text,
            'time_taken': f"{end_time - start_time:.2f} seconds"
        })

    except Exception as e:
        if os.path.exists(temp_image_path):
            os.remove(temp_image_path)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
