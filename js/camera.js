class CameraHandler {
    constructor() {
        this.videoElement = document.getElementById('camera-feed');
        this.stream = null;
    }

    async startCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 3840 },
                    height: { ideal: 2160 },
                    frameRate: 30 
                }
            });
            this.videoElement.srcObject = this.stream;
            this.videoElement.classList.remove('hidden');
            document.getElementById('placeholder').classList.add('hidden');
            return true;
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Unable to access camera. Please ensure you have granted camera permissions.');
            return false;
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.videoElement.srcObject = null;
            this.videoElement.classList.add('hidden');
            document.getElementById('placeholder').classList.remove('hidden');
        }
    }

    getVideoElement() {
        return this.videoElement;
    }
} 