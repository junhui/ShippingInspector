class BarcodeScanner {
    constructor(canvas) {
        this.canvas = canvas;
    }

    async decode() {
        const symbols = await zbarWasm.scanImageData(imageData);

        return symbols.map(s => s.decode('utf-8'));
    }

    getBinaryData(imageData) {
        const binary = [];
        for (let i = 0; i < imageData.length; i += 4) {
            const brightness = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
            binary.push(brightness < 128 ? 1 : 0);
        }
        return binary;
    }

    normalizeBinary(binary) {
        const result = [];
        let last = binary[0];
        let count = 0;

        for (const bit of binary) {
            if (bit === last) {
                count++;
            } else {
                result.push(count);
                count = 1;
                last = bit;
            }
        }
        result.push(count);
        return result;
    }

    decodeCode128(normalized) {
        const barcodeParts = [];
        let sequence = "";

        for (let i = 0; i < normalized.length; i++) {
            sequence += normalized[i] > 2 ? "1" : "0";

            if (sequence.length === 11) {
                barcodeParts.push(sequence);
                sequence = "";
            }
        }

        let decodedString = "";
        for (const part of barcodeParts) {
            if (this.code128Patterns[part]) {
                decodedString += this.code128Patterns[part];
            }
        }

        return decodedString || "No barcode detected.";
    }
}
