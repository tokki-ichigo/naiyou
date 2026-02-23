// ocr.js - 日本全家/7-11/罗森小票专项优化版
async function performOCR(base64Image) {
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
            alert("Google API 报错: " + data.error.message);
            return null;
        }
        
        if (!data.responses || !data.responses[0].fullTextAnnotation) return null;
        
        const fullText = data.responses[0].fullTextAnnotation.text;
        const descInput = document.getElementById('img-desc');
        if (descInput) descInput.value = fullText.substring(0, 80).replace(/\n/g, ' ') + "...";

        // --- 核心优化：日语金额提取逻辑 ---
        const lines = fullText.split('\n');
        // 增加日本小票常见的各种“总计”写法
        const jpKeywords = ['合計', '合計金額', '合計金額', 'お支払い', '支払額', '税込計', '小計'];
        const numberRegex = /([\d,]+)/; // 匹配数字，包含逗号

        let maxNum = 0;

        for (let line of lines) {
            // 1. 先尝试找“合计”关键字所在的行
            for (let kw of jpKeywords) {
                if (line.includes(kw)) {
                    const match = line.match(numberRegex);
                    if (match) {
                        let val = parseFloat(match[0].replace(/,/g, ''));
                        if (val > 0 && val < 100000) return val; // 找到即返回，排除掉年份
                    }
                }
            }

            // 2. 如果行里有“円”字，提取它前面的数字
            if (line.includes('円')) {
                const match = line.match(numberRegex);
                if (match) {
                    let val = parseFloat(match[0].replace(/,/g, ''));
                    if (val > maxNum && val < 100000) maxNum = val;
                }
            }
        }

        // 3. 如果没找到关键字，返回识别到的带“円”的最大数字
        return maxNum > 0 ? maxNum : null;
    } catch (error) {
        console.error("OCR 识别出错:", error);
        return null;
    }
}
