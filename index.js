const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 🔹 VERIFY WEBHOOK (Meta checks this once)
app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// 🔹 RECEIVE CUSTOMER MESSAGE
app.post("/webhook", async (req, res) => {
  console.log("META MESSAGE:", JSON.stringify(req.body, null, 2));

  const entry = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const message = value?.messages?.[0];

  if (!message) return res.sendStatus(200);

  const from = message.from;
  const text = message.text?.body?.toUpperCase();

  let reply = "";

  if (text === "PRICE") {
    reply = "🧵 Elampillai Sarees\nCotton: ₹850+\nSilk: ₹1800+";
  } else if (text?.startsWith("STOCK")) {
    reply = "✅ Stock available. Please share design number.";
  } else if (text === "ORDER") {
    reply = "🛒 Please send saree code & delivery address.";
  } else {
    reply = "Type:\nPRICE\nSTOCK 101\nORDER";
  }

  await sendMessage(from, reply);
  res.sendStatus(200);
});

// 🔹 SEND MESSAGE TO CUSTOMER
async function sendMessage(to, text) {
  await axios.post(
    `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      text: { body: text }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
