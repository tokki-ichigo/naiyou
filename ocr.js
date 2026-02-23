// ocr.js 
async function performOCR(base64Image) {
    console.log("OCR 启动：正在发送图片到 Google...");
    const API_KEY = 'AIzaSyAOEcowPZGMeeq-ttQ2Iad5aWDoUqicEmk'; 
    const url = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;

    const requestBody = {
        requests: [{
            image: { content: base64Image },
            features: [{ type: 'TEXT_DETECTION' }],
            imageContext: { languageHints: ['ja'] } 
        }]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        if (data.error) {
            console.error("API 报错:", data.error.message);
            return null;
        }
        
        const fullText = data.responses[0].fullTextAnnotation.text;
        
        // 自动填写描述
        const descInput = document.getElementById('img-desc');
        if (descInput) {
            descInput.value = fullText.substring(0, 50).replace(/\n/g, ' ') + "...";
        }

        // 提取金额逻辑 (适配全家小票)
        const lines = fullText.split('\n');
        const jpKeywords = ['合計', '合計金額', 'お支払い', '税込', '小計'];
        const numberRegex = /([\d,]+)/;

        for (let line of lines) {
            if (line.includes('202') || line.includes('年')) continue;
            for (let kw of jpKeywords) {
                if (line.includes(kw)) {
                    const match = line.match(numberRegex);
                    if (match) {
                        return parseFloat(match[0].replace(/,/g, ''));
                    }
                }
            }
        }
        return null;
    } catch (error) {
        console.error("OCR 请求失败:", error);
        return null;
    }
}
