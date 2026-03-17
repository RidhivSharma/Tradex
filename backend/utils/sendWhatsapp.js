require("dotenv").config();
const twilio = require("twilio");

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const sendWhatsapp = async (to, symbol, signal) => {
    try {
        const message = await client.messages.create({
            from: "whatsapp:+14155238886",
            contentSid: process.env.TWILIO_CONTENT_SID,
            contentVariables: JSON.stringify({
                "1": symbol,
                "2": signal
            }),
            to: `whatsapp:+91${to}`,
            statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL
        });

        console.log("📨 Message SID:", message.sid);
        console.log("📊 Initial Status:", message.status);

        return {
            success: true,
            sid: message.sid,
            status: message.status
        };

    } catch (error) {
        console.error("❌ Twilio Error:", error.message);

        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = { sendWhatsapp };