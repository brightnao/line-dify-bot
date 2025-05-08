
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const LINE_TOKEN = process.env.LINE_TOKEN;
const DIFY_API_KEY = process.env.DIFY_API_KEY;
const DIFY_APP_ID = process.env.DIFY_APP_ID;

app.post('/webhook', async (req, res) => {
  const events = req.body.events;

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userMessage = event.message.text;

      try {
        // Difyに問い合わせ
        const difyRes = await axios.post(
          `https://api.dify.ai/v1/chat-messages`,
          {
            query: userMessage,
            inputs: {},
            response_mode: 'blocking',
            conversation_id: null
          },
          {
            headers: {
              Authorization: `Bearer ${DIFY_API_KEY}`,
              'Content-Type': 'application/json',
              'X-API-Key': DIFY_API_KEY,
              'X-App-Id': DIFY_APP_ID
            }
          }
        );

        const replyText = difyRes.data.answer || '申し訳ありません。回答を取得できませんでした。';

        // LINEへ返信
        await axios.post(
          'https://api.line.me/v2/bot/message/reply',
          {
            replyToken: event.replyToken,
            messages: [{ type: 'text', text: replyText }]
          },
          {
            headers: {
              Authorization: `Bearer ${LINE_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } catch (error) {
        console.error('エラー:', error.message);
      }
    }
  }

  res.sendStatus(200);
});

app.listen(3000, () => {
  console.log('Webhookサーバーがポート3000で起動しました');
});
