class BarcodeScanner {
    constructor() {
        // Supported barcode formats
        this.readers = [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader",
            "code_39_reader",
            "code_39_vin_reader",
            "codabar_reader",
            "upc_reader",
            "upc_e_reader",
            "i2of5_reader",
            "2of5_reader",
            "code_93_reader"
        ];
    }

    /**
     * Scan canvas data for barcode
     * @param {string} canvasData - Base64 encoded canvas data URL
     * @returns {Promise<string>} - Returns barcode string if found, empty string if not
     */
    async scan(canvasData) {
        return new Promise((resolve, reject) => {
            Quagga.decodeSingle({
                decoder: {
                    readers: this.readers
                },
                locate: true,
                src: canvasData.toDataURL('image/jpeg'),
                numOfWorkers: 0,
                inputStream: {
                    size: 800
                }
            }, function(result) {
                if (result && result.codeResult) {
                    resolve(result.codeResult.code);
                } else {
                    resolve('');
                }
            });
        });
    }
} 