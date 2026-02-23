// ocr.js - Google Cloud Vision 智能识别版
async function performOCR(base64Image) {
    // 🔑 你的 Google API Key
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
        
        const fullText = data.responses[0].fullTextAnnotation.text;
        console.log("识别到的文本:", fullText);

        // --- 专门针对日语小票的金额提取逻辑 ---
        const lines = fullText.split('\n');
        // 增加日语常见的合计关键词
        const jpKeywords = ['合計', '小計', '税込', '支払', '合計金額', 'お支払い', 'ご請求額'];
        const numberRegex = /([\d,]+)/g;

        for (let line of lines) {
            // 排除掉日期的干扰
            if (line.includes('202') || line.includes('年')) continue;

            for (let kw of jpKeywords) {
                if (line.includes(kw)) {
                    const matches = line.match(numberRegex);
                    if (matches) {
                        // 提取数字并去掉日语金额中的逗号（如 1,500 变 1500）
                        let numStr = matches[matches.length - 1].replace(/,/g, '');
                        let num = parseFloat(numStr);
                        if (num > 0) return num; 
                    }
                }
            }
        }
        return null;
    } catch (error) {
        console.error("OCR 识别出错:", error);
        return null;
    }
}
