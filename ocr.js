// ocr.js - 全文字识别优化版
async function performOCR(base64Image) {
    const API_KEY = 'AIzaSyDsF1ZgQgXcT79j0ppVHtIuPO7r3BkE_Xs'; 
    const url = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;

    const requestBody = {
        requests: [{
            image: { content: base64Image },
            features: [{ type: 'TEXT_DETECTION' }],
            imageContext: { languageHints: ['ja', 'zh'] } 
        }]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        
        if (!data.responses || !data.responses[0].fullTextAnnotation) return null;
        
        // 1. 获取小票上的所有文字内容
        const fullText = data.responses[0].fullTextAnnotation.text;
        
        // 自动把全文本填入描述框（方便你以后搜索买过什么）
        const descInput = document.getElementById('img-desc');
        if (descInput) descInput.value = fullText.substring(0, 100) + "..."; // 取前100字作为简述

        // 2. 提取金额逻辑
        const lines = fullText.split('\n');
        const jpKeywords = ['合計', '小計', '税込', '支払', 'お預り'];
        const numberRegex = /([\d,]+)/g;

        for (let line of lines) {
            for (let kw of jpKeywords) {
                if (line.includes(kw)) {
                    const matches = line.match(numberRegex);
                    if (matches) {
                        let num = parseFloat(matches[matches.length - 1].replace(/,/g, ''));
                        if (num > 0) return num; 
                    }
                }
            }
        }
        return null;
    } catch (error) {
        console.error("OCR 识别失败，请检查 Google Cloud 结算设置:", error);
        return null;
    }
}
