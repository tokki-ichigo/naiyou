// ocr.js - 针对日本小票深度优化的最终版
async function performOCR(base64Image) {
    // 🔑 你的 Google API Key
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

        // 诊断：如果 API Key 没权或欠费，会在这里提示
        if (data.error) {
            alert("Google API 报错: " + data.error.message);
            return null;
        }
        
        if (!data.responses || !data.responses[0].fullTextAnnotation) return null;
        
        const fullText = data.responses[0].fullTextAnnotation.text;
        
        // 1. 自动填写描述框 (ID: img-desc)
        const descInput = document.getElementById('img-desc');
        if (descInput) {
            // 提取前 50 个字，并去掉换行符，让描述看起来更整洁
            descInput.value = fullText.substring(0, 50).replace(/\n/g, ' ') + "...";
        }

        // 2. 提取金额逻辑 (针对日本小票格式)
        const lines = fullText.split('\n');
        // 日本小票常见的各种合计写法
        const jpKeywords = ['合計', '合計金額', 'お支払い', '税込', '小計', '支払額'];
        const numberRegex = /([\d,]+)/;

        let detectedAmount = null;

        for (let line of lines) {
            // 排除年份（如 2026年）
            if (line.includes('202') || line.includes('年')) continue;

            for (let kw of jpKeywords) {
                if (line.includes(kw)) {
                    const match = line.match(numberRegex);
                    if (match) {
                        // 去掉金额中的逗号并转换成数字
                        let val = parseFloat(match[0].replace(/,/g, ''));
                        if (val > 0) {
                            detectedAmount = val;
                            break; 
                        }
                    }
                }
            }
            if (detectedAmount) break;
        }
        
        return detectedAmount;
    } catch (error) {
        console.error("OCR 识别请求失败:", error);
        return null;
    }
}
