# Warehouse Shipping Inspection System

A computer vision-based system for validating shipping labels and product barcodes in a warehouse environment.

## Features

- Real-time camera-based inspection
- Video file processing
- Image file processing
- Automatic barcode and shipping label detection
- Match validation between product barcodes and shipping labels
- Real-time visual feedback with color-coded results

## Setup

1. Clone this repository
2. Replace `YOUR_ROBOFLOW_API_KEY` in `detection.js` with your actual Roboflow API key
3. Update the model name in `detection.js` with your trained model
4. Open `index.html` in a modern web browser

## Requirements

- Modern web browser with camera access
- Internet connection for API access
- Roboflow account and API key

## Usage

1. Choose one of three inspection methods:
   - Live Camera Scan
   - Upload Video
   - Upload Image
2. The system will automatically detect and validate shipping information
3. Results are displayed in real-time with color-coded indicators:
   - Green: Valid match
   - Red: Invalid match

## Technical Stack

- HTML5
- CSS3 with Tailwind CSS
- JavaScript (ES6+)
- Roboflow API for computer vision

Write me a project to user computer vision on warehouse Shipping inspection. 
once warehouse worker finish bulk item packing. the worker put a pallet which have lots of boxs on it. each box have product barcode on it. and also the shipping label on each box.  our system have the relationship between product barcode and shipping label.  for shipping inspection, it's use computer vision to check if the product barcode map to the shipping label.


type: website application, static website, moden ui, make ui looks very professional
technology used: html, css, javascript, tailwindcss

and will use the following library to do the computer vision.
- https://roboflow.com/
- https://github.com/Roboflow/roboflow
you can refer to index.html and main.js to understand how to use the library.


the home page should let user have options to choose how to do the shipping inspection.
1. use camera to scan the box. 
2. user select the video file.
3. user select the image file.

all above options will reer to main.js to do the computer vision.

flag the detected object with different color in the image/video/camera frame and the result information panel to show the result.