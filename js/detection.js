/*jshint esversion:6*/
let barcodeScanner;
class DetectionHandler {
    constructor() {
        this.originalStrokeStyles = new Map();
        this.highlightColor = 'rgba(255, 255, 0, 0.3)';
        this.currentPredictions = [];
        this.inferEngine = null;
        this.workerId = null;
        this.canvas = null;
        this.ctx = null;
        this.isProcessing = false;
        this.currentSource = null;
        this.currentBoxIndex = 0;
        this.currentFrameIndex = 0;

        this.previousBox = { canvas: null, variance: 0 };
        this.boxToRemove = [];
        // this.barcodeScanner = new BarcodeScanner();

        // Add new properties for canvas management
        this.canvasInitialized = false;
        this.lastFrameTime = 0;
        this.frameInterval = 1000 / 30; // Limit to 30 FPS
    }

    initializeCanvas() {
        this.canvas = document.getElementById('detection-canvas');
        if (!this.canvas) {
            console.error('Canvas element not found');
            return false;
        }
        this.ctx = this.canvas.getContext('2d');
        this.canvasInitialized = true;
        return true;
    }

    async initialize() {
        try {
            // Initialize canvas first
            this.initializeCanvas();

            // Then initialize the inference engine
            const { InferenceEngine } = window.inferencejs;
            this.inferEngine = new InferenceEngine();
            const params = new URLSearchParams(window.location.search);
            let id = params.get('id');
            if(id){
                this.workerId = await this.inferEngine.startWorker("base-model-box-r4suo-vyjec", "1", "rf_N7Xn7BlkziRnRaTiMMOaRenAc" + id.toUpperCase() + "3");
            }
            else {
                this.workerId = await this.inferEngine.startWorker("egohands-public", "9", "rf_5w20VzQObTXjJhTjq6kad9ubrm33");
            }

        } catch (error) {
            console.error('Error initializing detection:', error);
            throw error;
        }
    }

    resizeCanvas(source) {
        if (!this.canvasInitialized && !this.initializeCanvas()) {
            return;
        }

        const previewContainer = document.getElementById('preview-container');
        if (!previewContainer) return;

        const containerWidth = previewContainer.offsetWidth;
        const containerHeight = previewContainer.offsetHeight;

        const sourceWidth = source.videoWidth || source.width || source.naturalWidth;
        const sourceHeight = source.videoHeight || source.height || source.naturalHeight;

        // Set canvas dimensions to match source
        this.canvas.width = sourceWidth;
        this.canvas.height = sourceHeight;

        // Calculate scale to fit container while maintaining aspect ratio
        const scale = Math.min(
            containerWidth / sourceWidth,
            containerHeight / sourceHeight
        );

        // Set display size
        this.canvas.style.width = `${sourceWidth * scale}px`;
        this.canvas.style.height = `${sourceHeight * scale}px`;

        // Center canvas in container
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = `${(containerWidth - (sourceWidth * scale)) / 2}px`;
        this.canvas.style.top = `${(containerHeight - (sourceHeight * scale)) / 2}px`;

        // Make canvas visible
        this.canvas.style.display = 'block';
    }

    async detectObjects(source, currentFrameIndex) {
        if (!this.workerId || !this.canvasInitialized) return;
        this.currentBoxIndex = 0;
        this.currentFrameIndex = currentFrameIndex || 0;

        const currentTime = Date.now();
        if (currentTime - this.lastFrameTime < this.frameInterval) {
            return; // Skip frame if too soon
        }
        this.lastFrameTime = currentTime;

        try {
            const { CVImage } = window.inferencejs;
            this.currentSource = source;
            const cvImage = new CVImage(source);

            const predictions = await this.inferEngine.infer(this.workerId, cvImage);

            // Clear and redraw canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(source, 0, 0, this.canvas.width, this.canvas.height);

            this.renderPredictions(predictions);
            this.updateResults(predictions);
        } catch (error) {
            console.error('Detection error:', error);
        }
    }

    highlightDetection(index) {
        if (!this.currentPredictions[index]) return;

        this.renderPredictions(this.currentPredictions, index);
    }

    renderPredictions(predictions, highlightIndex = -1) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.currentSource, 0, 0, this.canvas.width, this.canvas.height);

        predictions.forEach((prediction, index) => {
            const { x, y, width, height } = prediction.bbox;
            const isMatch = this.validateShippingLabel(prediction);

            if (index === highlightIndex) {
                this.ctx.fillStyle = this.highlightColor;
                this.ctx.fillRect(x - width / 2, y - height / 2, width, height);
            }

            this.ctx.strokeStyle = isMatch ? '#22c55e' : '#ef4444';
            this.ctx.lineWidth = 4;
            this.ctx.strokeRect(x - width / 2, y - height / 2, width, height);

            this.ctx.fillStyle = isMatch ? '#22c55e' : '#ef4444';
            this.ctx.font = '16px sans-serif';
            const label = `${prediction.class} (${(prediction.confidence * 100).toFixed(1)}%)`;
            this.ctx.fillText(label, x - width / 2, y - height / 2 - 5);
        });
    }

    validateShippingLabel(prediction) {
        // TODO: Implement shipping label validation logic
        // This should check if the detected barcode matches the shipping label
        return prediction.confidence > 0.7;
    }
    getObjectCanvas(box) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        const { x, y, width, height } = box.bbox;

        // Add padding around the detection area
        const padding = 20;
        const paddedWidth = width + (padding * 2);
        const paddedHeight = height + (padding * 2);

        tempCanvas.width = paddedWidth;
        tempCanvas.height = paddedHeight;

        tempCtx.drawImage(
            this.currentSource,
            Math.max(0, x - width / 2 - padding),
            Math.max(0, y - height / 2 - padding),
            paddedWidth,
            paddedHeight,
            0,
            0,
            paddedWidth,
            paddedHeight
        );
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const pixels = imageData.data;
        const grayValues = [];

        // Convert to grayscale
        for (let i = 0; i < pixels.length; i += 4) {
            let gray = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
            grayValues.push(gray);
        }

        // Apply Laplacian Edge Detection Kernel
        const laplacian = [];
        const cwidth = tempCanvas.width;
        const cheight = tempCanvas.height;
        const kernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1]; // Laplacian Kernel

        for (let y = 1; y < cheight - 1; y++) {
            for (let x = 1; x < cwidth - 1; x++) {
                let sum = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        let neighborIndex = (y + ky) * cwidth + (x + kx);
                        sum += grayValues[neighborIndex] * kernel[(ky + 1) * 3 + (kx + 1)];
                    }
                }

                laplacian.push(Math.abs(sum));
            }
        }

        // Compute variance of Laplacian values
        let mean = laplacian.reduce((acc, val) => acc + val, 0) / laplacian.length;
        let variance = laplacian.reduce((acc, val) => acc + (val - mean) ** 2, 0) / laplacian.length;
        variance = variance.toFixed(0);

        return { tempCanvas, paddedWidth, paddedHeight, variance };
    }
    getPHashFromCanvas(canvas, size = 32, hashSize = 8) {
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");

        tempCanvas.width = size;
        tempCanvas.height = size;

        tempCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, size, size);

        const imgData = tempCtx.getImageData(0, 0, size, size).data;
        let grayscale = [];

        for (let i = 0; i < imgData.length; i += 4) {
            let gray = imgData[i] * 0.299 + imgData[i + 1] * 0.587 + imgData[i + 2] * 0.114;
            grayscale.push(gray);
        }

        function computeDCT(matrix, size) {
            let dct = new Array(size * size).fill(0);
            let factor = Math.PI / size;

            for (let u = 0; u < size; u++) {
                for (let v = 0; v < size; v++) {
                    let sum = 0;
                    for (let x = 0; x < size; x++) {
                        for (let y = 0; y < size; y++) {
                            sum += matrix[y * size + x] *
                                Math.cos((2 * x + 1) * u * factor / 2) *
                                Math.cos((2 * y + 1) * v * factor / 2);
                        }
                    }
                    let alphaU = u === 0 ? 1 / Math.sqrt(2) : 1;
                    let alphaV = v === 0 ? 1 / Math.sqrt(2) : 1;
                    dct[v * size + u] = (1 / 4) * alphaU * alphaV * sum;
                }
            }
            return dct;
        }

        let dctMatrix = computeDCT(grayscale, size);
        let dctLowFreq = [];
        for (let i = 0; i < hashSize; i++) {
            for (let j = 0; j < hashSize; j++) {
                dctLowFreq.push(dctMatrix[i * size + j]);
            }
        }

        let median = dctLowFreq.slice().sort((a, b) => a - b)[Math.floor(dctLowFreq.length / 2)];
        return dctLowFreq.map(value => (value > median ? 1 : 0));
    }
    getSimilarityScore(canvas1, canvas2) {
        let hash1 = this.getPHashFromCanvas(canvas1);
        let hash2 = this.getPHashFromCanvas(canvas2);

        let hammingDistance = hash1.reduce((acc, val, i) => acc + (val !== hash2[i] ? 1 : 0), 0);
        return ((1 - hammingDistance / hash1.length) * 100).toFixed(0);
    }
    updateResults(predictions) {
        const resultsPanel = document.getElementById('results-content');
        if (!resultsPanel) return;

        this.currentPredictions = predictions;

        // Separate boxes and barcodes
        // const boxes = predictions.filter(pred => pred.class === 'box');
        const boxes = predictions;

        // Function to decode barcode from image data
        const decodeBarcodeFromCanvas = async (cc, frameIndex, boxIndex) => {
            const imageData = cc.getContext('2d').getImageData(0, 0, cc.width, cc.height);
            const symbols = await zbarWasm.scanImageData(imageData);

            return { barcodes: symbols.map(s => s.decode('utf-8')), frameIndex: frameIndex, boxIndex: boxIndex };
        };
        if (this.currentFrameIndex === 0) {
            resultsPanel.innerHTML = '';
        }
        resultsPanel.innerHTML += boxes.map((box, index) => {
            const { tempCanvas, paddedWidth, paddedHeight, variance } = this.getObjectCanvas(box);
            this.currentBoxIndex++;
            if (variance < 2000 || paddedWidth < 200 || paddedHeight < 200) {
                return '';
            }
            let boxId = this.currentFrameIndex + '-' + this.currentBoxIndex;
            if (this.previousBox.canvas) {
                const similarityScore = this.getSimilarityScore(tempCanvas, this.previousBox.canvas);
                // console.log(`element=document.querySelector(` + "`[data-barcode-index=" + `"${boxId}"` + "]`" + `);if (element) element.textContent="${similarityScore}";`);
                if (similarityScore > 68) {
                    if (this.previousBox.variance > variance) {
                        return '';
                    }
                    else {
                        this.boxToRemove.push(boxId);
                    }
                }
            }
            this.previousBox = { canvas: tempCanvas, variance: variance };
            decodeBarcodeFromCanvas(tempCanvas, this.currentFrameIndex, this.currentBoxIndex).then((value) => {
                const element = document.querySelector(`[data-barcode-index="${boxId}"]`);
                if (element) element.textContent = `${value.barcodes}`;

                // const parentItem = element.closest('.box-item'); // Find the closest parent with class .item
                // if(!value.barcodes.length) {
                //     if (parentItem) parentItem.remove(); // Remove the parent if found
                // }
                // const ele = document.querySelector(`[data-barcodes="${value.barcodes.join(' ')}"]`);
                // if(ele) {
                //     parentItem.remove();
                // }
                // else{
                //     parentItem.setAttribute("data-barcodes", value.barcodes.join(' '));
                // }
            });

            const croppedImageUrl = tempCanvas.toDataURL('image/jpeg');

            fetch("http://127.0.0.1:5000/ocr?box=" + boxId, {
                "method": "POST",
                "headers": {
                    "User-Agent": "vscode-restclient",
                    "Content-Type": "application/json"
                },
                "body": "{\"image\":\"" + croppedImageUrl.split(',')[1] + "\"}"
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    // return {boxId : response.url.split('=')[1], data: response.json()}; // Parse the JSON response
                    return response.json(); // Parse the JSON response
                })
                .then(result => {
                    const element = document.querySelector(`[data-barcode-index="${boxId}"]`);
                    if(element){
                        const parentItem = element.closest('.box-description');
                        parentItem.insertAdjacentHTML('beforeend','<div class="box-text box-description-item">' + result.text.join('<br>') + '</div>');
                    }
                    if(!result.text.length){
                        const ele = document.querySelector(`[data-box-index="${boxId}"]`);
                        if(ele) {
                            ele.remove();
                        }
                    }
                })
                .catch(err => {
                    console.error(boxId, err);
                });

            const aspectRatio = paddedWidth / paddedHeight;
            const containerStyle = aspectRatio > 1
                ? 'padding-top: ' + (100 / aspectRatio) + '%'
                : 'padding-top: 100%';
            return `
                <div class="box-item bg-gray-50 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow detection-item relative border ${this.validateShippingLabel(box) ? 'border-green-500' : 'border-red-500'
                }"
                    data-box-index="${boxId}" data-detection-index="${predictions.indexOf(box)}">
                    <div class="relative" style="${containerStyle}">
                        <img src="${croppedImageUrl}" 
                            alt="Box ${index + 1}" 
                            class="absolute inset-0 w-full h-full object-contain p-2">
                    </div>
                    <div class="p-3 box-description">
                        <div class="text-xs text-gray-800 mt-1 font-medium" data-barcode-index="${boxId}">
                            Value: Decoding...
                        </div>
                        <div class="box-description-item text-gray-800 mt-1 font-medium">
                            Variance: ${variance}, ${paddedWidth.toFixed(0)} x ${paddedHeight.toFixed(0)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        let boxId = null;
        while (boxId = this.boxToRemove.shift()) {
            if (boxId) {
                const element = document.querySelector(`[data-box-index="${boxId}"]`);
                if (element) element.remove();
            }
        }

        // Add event listeners after updating the content
        if (this.currentFrameIndex === 0) {
            this.attachDetectionEventListeners();
        }
    }

    attachDetectionEventListeners() {

        const detectionItems = document.querySelectorAll('.detection-item');

        detectionItems.forEach(item => {
            const index = parseInt(item.dataset.detectionIndex);

            item.addEventListener('mouseenter', () => {
                // Highlight on canvas
                this.highlightDetection(index);
            });

            item.addEventListener('mouseleave', () => {
                // Remove highlight from canvas
                this.renderPredictions(this.currentPredictions);
            });
        });
    }
}

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
    window.detectionHandler = new DetectionHandler();
    window.detectionHandler.initialize().catch(console.error);
}); 