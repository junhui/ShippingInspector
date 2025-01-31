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


Layout:
make the page to 3 column
1. left include header, and options to select (camera/video/image)
2. middle is camera/image/video frame
3. right side is information panel