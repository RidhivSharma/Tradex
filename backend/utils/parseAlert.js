const parseAlert = (subject, body) => {
    // use subject since it has clean format: "Alert: BTCUSD Crossing 71,143"
    const text = subject.replace("Alert:", "").trim()
    // text is now: "BTCUSD Crossing 71,143"

    // extract signal first — order matters, check "Crossing Up" and "Crossing Down" before "Crossing"
    const signal = text.includes("Crossing Up") ? "CROSSING UP" :
                   text.includes("Crossing Down") ? "CROSSING DOWN" :
                   text.includes("Crossing") ? "CROSSING" : "UNKNOWN"

    // extract symbol — first word before "Crossing"
    const symbol = text.split("Crossing")[0].trim()  // "BTCUSD"

    // extract price — number after Crossing (remove commas like 71,143 → 71143)
    const priceMatch = text.match(/[\d,]+(\.\d+)?$/)
    const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, "")) : 0

    return { symbol, price, signal }
}

module.exports = { parseAlert }