// ocr.js - 商品明细提取优化版
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
        if (!data.responses || !data.responses[0].fullTextAnnotation) return null;
        
        const fullText = data.responses[0].fullTextAnnotation.text;
        const lines = fullText.split('\n');

        let detectedAmount = null;
        let foundItems = [];

        // 1. 核心关键词定义
        const totalKeywords = ['合計', '合計金額', 'お支払い', '税込'];
        const ignoreKeywords = ['電話', '番号', '住所', 'レジ', '担当', '店', 'NO', '2026', '年', '月', '日'];

        lines.forEach(line => {
            const cleanLine = line.trim();
            if (!cleanLine) return;

            // 2. 寻找总金额 (带有合计关键字的行)
            if (totalKeywords.some(kw => cleanLine.includes(kw))) {
                const amountMatch = cleanLine.match(/([\d,]+)/);
                if (amountMatch) {
                    detectedAmount = parseFloat(amountMatch[0].replace(/g, ''));
                }
            }

            // 3. 寻找潜在的商品行 (长度适中，且不包含干扰词)
            // FamilyMart 的商品通常长这样： "健康ミネラルむぎ茶 170"
            if (cleanLine.length > 4 && 
                !ignoreKeywords.some(kw => cleanLine.includes(kw)) && 
                !totalKeywords.some(kw => cleanLine.includes(kw))) {
                
                // 如果行末尾有数字，这通常就是一件商品
                if (/\d+$/.test(cleanLine)) {
                    foundItems.push(cleanLine);
                }
            }
        });

        // 4. 自动填充心情描述框 (ID: img-desc)
        const descInput = document.getElementById('img-desc');
        if (descInput) {
            // 只取识别到的第一件最清晰的商品，加上可爱的图标
            if (foundItems.length > 0) {
                descInput.value = "🛒 " + foundItems[0];
            } else {
                descInput.value = "记录生活点滴... 🐾";
            }
        }

        return detectedAmount;
    } catch (error) {
        console.error("OCR 识别出错:", error);
        return null;
    }
}
