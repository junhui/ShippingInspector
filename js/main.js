let cameraHandler;
let detectionHandler;
let isProcessing = false;
let isVideoUpload = false;

async function initialize() {
    console.log("initialize");
    cameraHandler = new CameraHandler();
    detectionHandler = new DetectionHandler();

    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-indicator';
    loadingDiv.innerHTML = 'Loading model...';
    loadingDiv.style.cssText = 'font-size: 3em; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); color: white; padding: 40px; border-radius: 8px; z-index: 1000;';
    document.body.appendChild(loadingDiv);

    // Initialize detection handler
    await detectionHandler.initialize();
    
    // Remove loading indicator once model is ready
    loadingDiv.remove();

    // Set up file input listeners
    console.log("initialize event listeners");
    document.getElementById('videoInput').addEventListener('change', handleVideoUpload);
    document.getElementById('imageInput').addEventListener('change', handleImageUpload);
}

async function startCamera(ele) {
    isVideoUpload = false;
    if(detectionHandler.isProcessing){
        detectionHandler.isProcessing = false;
        ele.innerText = 'Start Camera';
        // Clear existing canvas content
        cameraHandler.stopCamera();
        detectionHandler.ctx.clearRect(0, 0, detectionHandler.canvas.width, detectionHandler.canvas.height);
    }
    else if (await cameraHandler.startCamera()) {
        ele.innerText = 'Stop Camera';
        startCameraDetection();
    }
}

async function startCameraDetection() {
    if (detectionHandler.isProcessing) return;
    detectionHandler.isProcessing = true;

    const video = cameraHandler.getVideoElement();
    
    // Ensure canvas is initialized and sized correctly
    video.addEventListener('loadedmetadata', () => {
        detectionHandler.resizeCanvas(video);
    });
    
    let currentFrameIndex = 0;
    async function detectFrame() {
        // Check for either camera stream or video file
        if (!video.srcObject && !video.src) return;
        
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            await detectionHandler.detectObjects(video, currentFrameIndex);
        }
        
        if (detectionHandler.isProcessing) {
            requestAnimationFrame(detectFrame);
        }
        if(isVideoUpload){
            detectionHandler.isProcessing = !video.paused && !video.ended && video.readyState;
        }
        currentFrameIndex++;
    }

    detectFrame();
}

async function handleVideoUpload(event) {
    isVideoUpload = true;
    const file = event.target.files[0];
    if (!file) return;
        
    // Clear existing canvas content
    detectionHandler.ctx.clearRect(0, 0, detectionHandler.canvas.width, detectionHandler.canvas.height);
    const video = cameraHandler.getVideoElement();
    video.src = URL.createObjectURL(file);
    video.classList.remove('hidden');
    document.getElementById('placeholder').classList.add('hidden');

    video.onloadeddata = () => {
        detectionHandler.resizeCanvas(video);
        startCameraDetection();
    };
}

async function handleImageUpload(event) {
    isVideoUpload = false;
    const file = event.target.files[0];
    if (!file) return;

    // Stop any ongoing detection process
    detectionHandler.isProcessing = false;
    
    // Reset video element
    const video = cameraHandler.getVideoElement();
    video.classList.add('hidden');  // Hide video element
    video.src = '';  // Clear video source
    video.srcObject = null;  // Clear any camera stream
    
    // Clear existing canvas content
    detectionHandler.ctx.clearRect(0, 0, detectionHandler.canvas.width, detectionHandler.canvas.height);

    const img = new Image();
    img.onload = async () => {
        detectionHandler.resizeCanvas(img);
        document.getElementById('placeholder').classList.add('hidden');
        
        // Draw the image on the canvas first
        detectionHandler.ctx.drawImage(img, 0, 0, img.width, img.height);
        
        await detectionHandler.detectObjects(img);
    };
    img.src = URL.createObjectURL(file);
}

// Add debug logging and error handling
document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOMContentLoaded event fired');
    try {
        initialize();
    } catch (error) {
        console.error('Error during initialization:', error);
    }
    // Function to open the popup
    function openPopup(img) {
        const popup = document.getElementById("popup");
        const popupImage = document.getElementById("popupImage");
        const popupDescription = document.getElementById("popupDescription");

        const boxItem = img.closest('.box-item').querySelector('.box-description');
        popupDescription.innerHTML = boxItem.innerHTML;

        // Get original width and height
        const originalWidth = img.naturalWidth || img.width;
        const originalHeight = img.naturalHeight || img.height;

        // Set image to 2x larger
        let newWidth = originalWidth * 2;
        let maxWidth = window.innerWidth * 0.5; // 60% of window width
        popupImage.style.width = `${Math.min(newWidth, maxWidth)}px`;
        popupImage.style.height = "auto";
        popupImage.src = img.src;

        popup.classList.remove("hidden");
    }

    // Function to close the popup
    function closePopup() {
        document.getElementById("popup").classList.add("hidden");
    }

    // Attach event listeners to images using event delegation
    document.getElementById("results-content").addEventListener("click", function (event) {
        if (event.target.tagName=='IMG') {
            openPopup(event.target);
        }
    });

    // Close popup when clicking outside the image
    document.getElementById("popupClose").addEventListener("click", function (event) {
        if (event.target === this) closePopup();
    });

    // Close popup on ESC key
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closePopup();
        }
    });
    document.getElementById("popupImage").addEventListener("click", function() {
        let image = this;
        let currentRotation = image.style.transform.match(/rotate\((\d+)deg\)/);
        let newRotation = currentRotation ? (parseInt(currentRotation[1]) + 90) % 360 : 90;
        image.style.transform = `rotate(${newRotation}deg)`;
    });
});

// Fallback initialization in case script loads late
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('Document already loaded, initializing immediately');
    initialize();
} 
