// ocr.js - 商品明细+金额增强识别版
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

        // --- 商品名与金额识别逻辑 ---
        let items = [];
        let totalAmount = null;
        const jpTotalKeywords = ['合計', '合計金額', 'お支払い', '税込'];
        const amountRegex = /([\d,]+)円?$/; // 匹配行尾的数字（可能带“円”）

        lines.forEach(line => {
            // 1. 寻找总额 (排除掉包含年份 2026 的行)
            if (!line.includes('202') && !line.includes('年')) {
                jpTotalKeywords.forEach(kw => {
                    if (line.includes(kw)) {
                        const match = line.match(/([\d,]+)/);
                        if (match) totalAmount = parseFloat(match[0].replace(/,/g, ''));
                    }
                });
            }

            // 2. 识别商品明细 (通常包含数字且不含“合计”等字样)
            const amountMatch = line.match(/[\d,]+$/);
            if (amountMatch && !jpTotalKeywords.some(kw => line.includes(kw)) && !line.includes('年') && line.length > 5) {
                // 剔除掉只有数字的干扰行
                items.push(line.trim());
            }
        });

        // 3. 自动填写描述框 (ID: img-desc)
        const descInput = document.getElementById('img-desc');
        if (descInput) {
            // 将识别到的前几项商品组合在一起
            const itemListStr = items.slice(0, 3).join(' | '); 
            descInput.value = itemListStr ? `🛒 ${itemListStr}` : "记录生活点滴... 🐾";
        }

        return totalAmount;
    } catch (error) {
        console.error("OCR 识别出错:", error);
        return null;
    }
}
