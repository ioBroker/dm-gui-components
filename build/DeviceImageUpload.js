import React, { useState } from 'react';
import { Tooltip } from '@mui/material';
import { IconUpload } from '@iobroker/gui-components';
import { getTranslation } from './Utils';
/** Reads the file and makes it at most 100 x 100 pixels big */
function resizeImage(file) {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onerror = () => resolve(null);
        reader.onload = (e) => {
            if (!e.target?.result) {
                resolve(null);
                return;
            }
            const img = new Image();
            img.onerror = () => resolve(null);
            img.onload = () => {
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
                if (!ctx) {
                    resolve(null);
                    return;
                }
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/webp'));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}
/**
 * Lies over the device symbol: on hover it shows the upload symbol, a click opens the file selection,
 * and while the image is stored, the arrow moves up again and again.
 */
function DeviceImageUpload(params) {
    const { socket, manufacturer, model, deviceId, onImageSelect, uploadImagesToInstance } = params;
    const [uploading, setUploading] = useState(false);
    const handleImageUpload = async (event) => {
        const file = event.target.files?.[0];
        // The same file can be selected again
        event.target.value = '';
        if (!file) {
            return;
        }
        setUploading(true);
        try {
            const resizedImage = await resizeImage(file);
            if (!resizedImage) {
                return;
            }
            // Build the file name from a manufacturer and model, if not available, use device id
            const fileName = `${manufacturer ? `${manufacturer}_` : ''}${model || JSON.stringify(deviceId)}.webp`;
            const base64Data = resizedImage.replace(/^data:image\/webp;base64,/, '');
            const response = await socket.writeFile64(uploadImagesToInstance, fileName, base64Data);
            console.log(`saveImage response: ${JSON.stringify(response)}`);
            onImageSelect?.(resizedImage);
        }
        catch (error) {
            console.error(`Cannot save the image: ${error}`);
        }
        finally {
            setUploading(false);
        }
    };
    return (React.createElement(Tooltip, { title: getTranslation('uploadImageTooltip'), slotProps: { popper: { sx: { pointerEvents: 'none' } } } },
        React.createElement("label", { className: `dm-upload${uploading ? ' dm-upload-busy' : ''}` },
            React.createElement(IconUpload, { uploading: uploading }),
            React.createElement("input", { type: "file", accept: "image/*", disabled: uploading, "aria-label": getTranslation('uploadImageTooltip'), onChange: e => void handleImageUpload(e) }))));
}
export default DeviceImageUpload;
//# sourceMappingURL=DeviceImageUpload.js.map