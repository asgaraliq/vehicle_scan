from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io
import numpy as np
from ultralytics import YOLO

app = Flask(__name__)
CORS(app)

# Load YOLO model (YOLOv8n by default, can use yolov5s.pt if available)
model = YOLO('yolov8n.pt')  # You can change to 'yolov5s.pt' if you have it

@app.route('/')
def home():
    return "Vehicle Damage Detection API is running."

@app.route('/detect', methods=['POST'])
def detect_damage():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400
    file = request.files['image']
    img_bytes = file.read()
    img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
    img_np = np.array(img)

    # Run YOLO inference
    results = model(img_np)
    boxes = []
    damage_found = False
    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            label = model.model.names[cls_id]
            # For demo, treat 'car', 'truck', 'bus', 'motorcycle' as 'damage' (adjust as needed)
            if label in ['car', 'truck', 'bus', 'motorcycle']:
                damage_found = True
                xyxy = box.xyxy[0].cpu().numpy()  # [x1, y1, x2, y2]
                conf = float(box.conf[0])
                boxes.append({
                    'x': int(xyxy[0]),
                    'y': int(xyxy[1]),
                    'w': int(xyxy[2] - xyxy[0]),
                    'h': int(xyxy[3] - xyxy[1]),
                    'label': label,
                    'confidence': conf
                })

    return jsonify({
        'damage': damage_found,
        'boxes': boxes
    })

if __name__ == '__main__':
    app.run(debug=True) 