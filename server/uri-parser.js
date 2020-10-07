module.exports = uri => {
    if (!uri) return {};
    const pairs = uri.split(/; */);
    const obj = {};
    pairs.forEach(pair => {
        const [atr, val] = pair.split('=');
        obj[decodeURIComponent(atr)] = decodeURIComponent(val);
    });
    return obj;
};