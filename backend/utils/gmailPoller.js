require("dotenv").config()
const { google } = require("googleapis")
const { userModel } = require("../models/userdb")
const { alertmodel } = require("../models/alertsdb")
const { sendWhatsapp } = require("./sendWhatsapp")
const { parseAlert } = require("./parseAlert")

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
)

// 🔒 LOCK to prevent overlap
let isRunning = false;

const checkEmails = async () => {
    if (isRunning) {
        console.log("⏳ Skipping: previous run still in progress");
        return;
    }

    isRunning = true;

    try {
        const users = await userModel.find({ isGoogleConnected: true })

        for (const user of users) {
            try {
                oauth2Client.setCredentials({
                    access_token: user.accessToken,
                    refresh_token: user.refreshToken
                })

                const gmail = google.gmail({ version: "v1", auth: oauth2Client })

                const response = await gmail.users.messages.list({
                    userId: "me",
                    q: "from:noreply@tradingview.com",
                    maxResults: 1
                })

                const messages = response.data.messages
                if (!messages || messages.length === 0) continue

                const latestEmailId = messages[0].id

                // ✅ skip already processed
                if (user.lastEmailId === latestEmailId) continue

                // ✅ mark as processed FIRST (critical)
                await userModel.findByIdAndUpdate(user._id, { lastEmailId: latestEmailId })

                const email = await gmail.users.messages.get({
                    userId: "me",
                    id: latestEmailId
                })

                const headers = email.data.payload.headers
                const subject = headers.find(h => h.name === "Subject")?.value || ""
                const bodyData = email.data.payload.body?.data
                const body = bodyData
                    ? Buffer.from(bodyData, "base64").toString("utf-8")
                    : email.data.snippet || ""

                const { symbol, price, signal } = parseAlert(subject, body)

                // ✅ send whatsapp
                const result = await sendWhatsapp(user.whatsappNumber, symbol, signal)

                // ✅ save ONLY once
                if (result?.sid) {
                    const exists = await alertmodel.findOne({ messageSid: result.sid })

                    if (!exists) {
                        await alertmodel.create({
                            symbol,
                            price,
                            signal,
                            user_id: user._id,
                            messageSid: result.sid,
                            whatsappSent: false
                        })
                    }
                }

                if (result?.success) {
                    console.log(`📨 Message queued for ${user.whatsappNumber} (SID: ${result.sid})`)
                } else {
                    console.log(`❌ Failed to send to ${user.whatsappNumber}: ${result?.error}`)
                }

            } catch (userError) {
                console.log(`❌ Error for user ${user.email}:`, userError.message)
            }
        }

    } catch (error) {
        console.log("Poller error:", error.message)
    }

    isRunning = false; // 🔓 release lock
}

const startPoller = () => {
    setInterval(checkEmails, 30000) // ✅ 30 sec
    console.log("📧 Gmail poller started — checking every 30 seconds...")
}

module.exports = { startPoller }