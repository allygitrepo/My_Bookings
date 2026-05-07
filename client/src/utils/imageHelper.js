/**
 * Utility to compress images on the client side before uploading to server.
 * Helps in staying within database/transfer limits for base64 strings.
 */

export const compressImage = (file, maxKB = 499) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Max dimension 800px to keep aspect ratio but reduce size
                const maxDim = 800;
                if (width > height && width > maxDim) {
                    height *= maxDim / width;
                    width = maxDim;
                } else if (height > maxDim) {
                    width *= maxDim / height;
                    height = maxDim;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                let quality = 0.9;
                let base64 = canvas.toDataURL('image/jpeg', quality);
                
                // Iteratively reduce quality if still over limit
                // base64 size is ~4/3 of actual byte size
                while (base64.length * 0.75 > maxKB * 1024 && quality > 0.1) {
                    quality -= 0.1;
                    base64 = canvas.toDataURL('image/jpeg', quality);
                }
                resolve(base64);
            };
            img.onerror = (err) => reject(new Error("Failed to load image for compression"));
        };
        reader.onerror = (err) => reject(new Error("Failed to read file"));
    });
};
