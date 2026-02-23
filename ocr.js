// ocr.js - Google Cloud Vision 最终稳定版
async function performOCR(base64Image) {
    // 🔑 你的新 Google API Key
    const API_KEY = 'AIzaSyAOEcowPZGMeeq-ttQ2Iad5aWDoUqicEmk'; 
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

        // 诊断报错：如果结算账户没生效或Key不对，会在这里弹窗
        if (data.error) {
            alert("Google API 报错: " + data.error.message);
            return null;
        }
        
        if (!data.responses || !data.responses[0].fullTextAnnotation) return null;
        
        const fullText = data.responses[0].fullTextAnnotation.text;
        console.log("识别到的全文字:", fullText);

        // 1. 自动填写描述框（把小票上的文字直接变成日记内容）
        const descInput = document.getElementById('img-desc');
        if (descInput) {
            // 取前100个字，去掉换行符，让它看起来更整齐
            descInput.value = fullText.substring(0, 100).replace(/\n/g, ' ') + "...";
        }

        // 2. 提取日语金额逻辑
        const lines = fullText.split('\n');
        const jpKeywords = ['合计', '合计金额', '合计金额', '支付', '预り', '请求额', '合计'];
        const numberRegex = /([\d,]+)/g;

        for (let line of lines) {
            // 排除年份干扰
            if (line.includes('202') || line.includes('年')) continue;

            for (let kw of jpKeywords) {
                if (line.includes(kw)) {
                    const matches = line.match(numberRegex);
                    if (matches) {
                        // 提取数字并处理日语中的逗号
                        let num = parseFloat(matches[matches.length - 1].replace(/,/g, ''));
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
