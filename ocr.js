const axios = require("axios");

async function ocr(server, base64Image) {
    const res = await axios.post(`${server}/api/ocr`, JSON.stringify({ base64: base64Image }), {
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const { code, data } = (res || {}).data || {};
    if (code !== 100) {
        throw new Error('接口请求失败');
    }
    return data;
}

module.exports = { ocr };