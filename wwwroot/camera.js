window.drawRawRGB = function (canvasId, base64Data, width, height) {
    console.log(`[drawRawRGB] Başladı | CanvasId: ${canvasId}, Base64 Length: ${base64Data?.length}, Width: ${width}, Height: ${height}`);

    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`[drawRawRGB] ❌ Canvas bulunamadı: '${canvasId}'`);
        return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error(`[drawRawRGB] ❌ Canvas context alınamadı`);
        return;
    }

    let binary;
    try {
        binary = atob(base64Data);
    } catch (e) {
        console.error(`[drawRawRGB] ❌ Base64 çözümleme hatası:`, e);
        return;
    }

    const buffer = new Uint8ClampedArray(binary.length);
    for (let i = 0; i < binary.length; i++) {
        buffer[i] = binary.charCodeAt(i);
    }

    const expectedLength = width * height * 3;
    if (buffer.length !== expectedLength) {
        console.warn(`[drawRawRGB] ⚠️ RGB veri boyutu beklenenden farklı. Actual: ${buffer.length}, Expected: ${expectedLength}`);
    }

    const rgbaData = new Uint8ClampedArray(width * height * 4);
    for (let i = 0, j = 0; i < buffer.length && j < rgbaData.length; i += 3, j += 4) {
        rgbaData[j] = buffer[i];         // R
        rgbaData[j + 1] = buffer[i + 1]; // G
        rgbaData[j + 2] = buffer[i + 2]; // B
        rgbaData[j + 3] = 255;           // A
    }

    try {
        const imageData = new ImageData(rgbaData, width, height);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(imageData, 0, 0);
        console.log(`[drawRawRGB] ✅ Görüntü başarıyla çizildi.`);
    } catch (e) {
        console.error(`[drawRawRGB] ❌ ImageData oluşturulamadı:`, e);
    }
};