import React from 'react';
function DeviceImageUpload(params) {
    const { socket, manufacturer, model, deviceId, onImageSelect, uploadImagesToInstance } = params;
    const handleImageUpload = (event) => {
        const target = event.target;
        const files = target.files;
        if (!files || files.length === 0) {
            return;
        }
        const file = files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (!e.target || !e.target.result) {
                    return;
                }
                const img = new Image();
                img.src = e.target.result;
                img.onload = async () => {
                    const maxWidth = 100;
                    const maxHeight = 100;
                    let width = img.width;
                    let height = img.height;
                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    }
                    else if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);
                        const resizedImage = canvas.toDataURL('image/webp');
                        // Build the file name from a manufacturer and model, if not available, use device id
                        const fileName = `${manufacturer ? `${manufacturer}_` : ''}${model || JSON.stringify(deviceId)}.webp`;
                        const base64Data = resizedImage.replace(/^data:image\/webp;base64,/, '');
                        const response = await socket.writeFile64(uploadImagesToInstance, fileName, base64Data);
                        console.log(`saveImage response: ${JSON.stringify(response)}`);
                        if (onImageSelect) {
                            onImageSelect(resizedImage);
                        }
                    }
                };
            };
            reader.readAsDataURL(file);
        }
    };
    const imageUploadButtonStyle = {
        // make the button invisible but still clickable
        opacity: 0,
        position: 'absolute',
        width: 45,
        height: 45,
        zIndex: 3,
    };
    const imageUploadDiv = {
        position: 'relative',
        top: -22,
    };
    return (React.createElement("div", { style: imageUploadDiv },
        React.createElement("input", { style: imageUploadButtonStyle, type: "file", accept: "image/*", onChange: handleImageUpload })));
}
export default DeviceImageUpload;
//# sourceMappingURL=DeviceImageUpload.js.map