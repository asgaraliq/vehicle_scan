// app.js

document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('image-upload');
    const previewSection = document.getElementById('preview-section');

    imageInput.addEventListener('change', handleFiles);

    function handleFiles(event) {
        const files = event.target.files;
        previewSection.innerHTML = '';
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            createPreviewCard(file);
        });
    }

    function createPreviewCard(file) {
        const card = document.createElement('div');
        card.className = 'preview-card';

        // Loading indicator
        const loading = document.createElement('div');
        loading.textContent = 'Scanning...';
        loading.style.color = '#2a3a5e';
        loading.style.fontWeight = 'bold';
        card.appendChild(loading);
        previewSection.appendChild(card);

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Set up canvas
                const maxW = 220, maxH = 180;
                let [w, h] = [img.width, img.height];
                let scale = Math.min(maxW / w, maxH / h, 1);
                w = Math.round(w * scale);
                h = Math.round(h * scale);
                const canvas = document.createElement('canvas');
                canvas.className = 'preview-canvas';
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);

                // Send to backend for detection
                const formData = new FormData();
                formData.append('image', file);
                fetch('http://127.0.0.1:5000/detect', {
                    method: 'POST',
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    loading.remove();
                    // Draw boxes if damage found
                    if (data.damage && data.boxes && data.boxes.length > 0) {
                        ctx.strokeStyle = '#e74c3c';
                        ctx.lineWidth = 3;
                        data.boxes.forEach(box => {
                            // Scale box coordinates to canvas size
                            const scaleX = w / img.width;
                            const scaleY = h / img.height;
                            ctx.strokeRect(
                                box.x * scaleX,
                                box.y * scaleY,
                                box.w * scaleX,
                                box.h * scaleY
                            );
                        });
                    }
                    // Add result label
                    const resultLabel = document.createElement('div');
                    resultLabel.className = 'result-label' + (data.damage ? '' : ' no-damage');
                    resultLabel.textContent = data.damage ? 'Damage Detected' : 'No Damage Found';
                    card.appendChild(canvas);
                    card.appendChild(resultLabel);
                })
                .catch(err => {
                    loading.textContent = 'Error scanning image.';
                    loading.style.color = '#e74c3c';
                });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}); 