const {
default: makeWASocket, 
Browsers,
useMultiFileAuthState,
DisconnectReason, 
MessageRetryMap,
WAMessageStubType,
makeCacheableSignalKeyStore,
fetchLatestBaileysVersion, 
generateForwardMessageContent, 
prepareWAMessageMedia, 
areJidsSameUser,
generateWAMessageFromContent, 
generateMessageID, 
downloadContentFromMessage,
makeInMemoryStore, 
jidDecode, 
getAggregateVotesInPollMessage, 
proto 
} = require("baileys")
const pino = require('pino')
const chalk = require('chalk')
const path = require('path')
const readline = require("readline");
const axios = require('axios')
const FileType = require('file-type')
const figlet = require("figlet")
const yargs = require('yargs/yargs')
const NodeCache = require('node-cache')
const { handler } = require('./clone.js')
const _ = require('lodash')
const { Boom } = require('@hapi/boom')
const { exec, spawn } = require('child_process');
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./exif.js')
const { isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, sleep, pickRandom } = require('./myfunc.js')
const { Socket, smsg } = require("./simple.js")
const syntaxerror = require('syntax-error')
let qrcode = require('qrcode')
const fs = require('fs')

listjadibot = [];

const jadibot = async (reply, client, id) => {
const { state, saveCreds } = await useMultiFileAuthState('./clone/' + id);
const { version, isLatest } = await fetchLatestBaileysVersion();
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });
const auth = { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino().child({ level: 'silent', stream: 'store' })) };
const msgRetryCounterCache = new NodeCache();

const getMessage = async (key) => {
if (store) {
const msg = await store.loadMessage(key.remoteJid, key.id, undefined);
return msg?.message || undefined;
}
return { conversation: "halo, sayang!" };
};

const connectionOptions = {
version,
logger: pino({ level: "silent" }),
auth,
browser: Browsers.windows('Chrome'),
getMessage,
msgRetryCounterCache,
syncFullHistory: true,
};

const SatzzDev = makeWASocket(connectionOptions);

if (!SatzzDev.authState.creds.registered) {
const requestPairingCode = () => {
return new Promise(async (resolve, reject) => {
try {
setTimeout(async () => {
let code = await SatzzDev.requestPairingCode(id.split('@')[0]);
resolve(code);
}, 5000);
} catch (requestPairingCodeError) {
const errorMessage = 'Error requesting pairing code from WhatsApp';
console.error(errorMessage, requestPairingCodeError);
reject(new Error(errorMessage)); 
}
});
};
requestPairingCode()
.then((code) => client.sendButtons(id, "WHATSAPP - CLONE",`Your Pairing Code: *${code}*`, global.author, [{type:'copy', text:'Salin Kode', id: code}]))
.catch((err) => console.error('Failed to retrieve pairing code:', err));
}
store?.bind(SatzzDev.ev)  
SatzzDev.ev.process(async(events) => {
// connection UPDATE
if (events['connection.update']) {
const update = events['connection.update']
const { receivedPendingNotifications, connection, lastDisconnect, isOnline, isNewLogin } = update
if (connection === 'open') {
reply(`*Successfully connected with WhatsApp* - mu.\n\n*Device*:\n\n ${JSON.stringify(SatzzDev.user, null, 2)}`);
listjadibot.push(SatzzDev.user);
} 
if (connection == 'close') console.log(chalk.red('connection lost, trying to reconnect...'))
if (lastDisconnect && lastDisconnect.error && lastDisconnect.error.output && lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut) {
jadibot(reply, client, id)
}
}

if (events['creds.update']) { 
await saveCreds()
}   

// Receive new messages
if (events['messages.upsert']) {
const chatUpdate = events['messages.upsert'];
let mek = chatUpdate.messages[0] || chatUpdate.messages[chatUpdate.messages.length - 1];
if (!mek.message) return;
if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return;
if (mek.key.remoteJid.endsWith("@status@broadcast")) {
SatzzDev.readMessages([mek.key]);
}
let m = await smsg(SatzzDev, mek, store);
handler(SatzzDev, m, chatUpdate, store);
}

if (events.call) {
const celled = events.call
let botNumber = await SatzzDev.decodeJid(SatzzDev.user.id);
for (let kopel of celled) if (!kopel.isGroup) {
console.log(kopel)
await SatzzDev.query({ tag: 'call', attrs: { from: botNumber, to: kopel.from }, content: [{ tag: 'reject', attrs: { 'call-id': kopel.id, 'call-creator': kopel.from, count: '0' }, content: undefined }] });
if (kopel.status === "offer") {
let keyF = {key:{fromMe: false,participant:`0@s.whatsapp.net`,remoteJid:`status@broadcast`},
message:{
locationMessage: {
degreesLatitude: -6.17511,
degreesLongitude: 106.865039,
name: "Jakarta, Indonesia",
address: "Monas"
}
}}
await SatzzDev.sendButtons(kopel.from, '*`AUTO REJECT`*', 'me is currently busy. Please avoid calling and wait for a response. Thank you.', global.footer, [{type:'btn', text:'Okay.', id:'s'}],keyF)
function getRandomNumber(min, max) {
return Math.floor(Math.random() * (max - min + 1)) + min;
}
await SatzzDev.sendMessage(
kopel.from,
{
audio: await getBuffer(`https://github.com/anonphoenix007/phonk-api/raw/refs/heads/main/all/sound${getRandomNumber(1,95)}.mp3`),
ptt: true,
mimetype: 'audio/mpeg',
waveform: new Uint8Array(64)
},{ quoted: keyF });
}
}
}
});
//LOAD MESSAGES
SatzzDev.loadMessage = (messageID) => {
return Object.entries(SatzzDev.chats)
.filter(([_, { messages }]) => typeof messages === "object")
.find(([_, { messages }]) =>
Object.entries(messages).find(
([k, v]) => k === messageID || v.key?.id === messageID,
),
)?.[1].messages?.[messageID];
};

SatzzDev.decodeJid = (jid) => {
if (!jid) return jid;
if (/:\d+@/gi.test(jid)) {
let decode = jidDecode(jid) || {};
return (
(decode.user && decode.server && decode.user + "@" + decode.server) ||
jid
);
} else return jid;
};

if (SatzzDev.user && SatzzDev.user.id) SatzzDev.user.jid = SatzzDev.decodeJid(SatzzDev.user.id);
SatzzDev.chats = {};
SatzzDev.contacts = {};

SatzzDev.saveName = async (id, name = "") => {
if (!id) return;
id = SatzzDev.decodeJid(id);
let isGroup = id.endsWith("@g.us");
if (
id in SatzzDev.contacts &&
SatzzDev.contacts[id][isGroup ? "subject" : "name"] &&
id in SatzzDev.chats
)
return;
let metadata = {};
if (isGroup) metadata = await SatzzDev.groupMetadata(id);
let chat = {
...(SatzzDev.contacts[id] || {}),
id,
...(isGroup
? { subject: metadata.subject, desc: metadata.desc }
: { name }),
};
SatzzDev.contacts[id] = chat;
SatzzDev.chats[id] = chat;
};

SatzzDev.getName = (jid = "", withoutContact = false) => {
let myUser = Object.keys(db.data.users);
let nana = myUser.includes(jid)
? "User terdeteksi"
: "User tidak terdeteksi";
let jod = jid;
jid = SatzzDev.decodeJid(jid);
withoutContact = SatzzDev.withoutContact || withoutContact;
let v;
if (jid.endsWith("@g.us")) {
return SatzzDev.groupMetadata(jid).then((v) => {
return (
v.name ||
v.subject ||
PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber(
"international",
)
);
});
} else {
v =
jid === "0@s.whatsapp.net"
? { jid, vname: "WhatsApp" }
: areJidsSameUser(jid, SatzzDev.user.id)
? SatzzDev.user
: SatzzDev.chats[jid] || {};
return Promise.resolve(
(withoutContact ? "" : v.name) ||
v.subject ||
v.vname ||
v.notify ||
v.verifiedName ||
(myUser.includes(jod)
? db.data.users[jod].name
: PhoneNumber("+" + jid.replace("@s.whatsapp.net", ""))
.getNumber("international")
.replace(new RegExp("[()+-/ +/]", "gi"), "")),
);
}
};

SatzzDev.serializeM = (m) => smsg(SatzzDev, m, store);
// Fungsi untuk memproses tipe pesan stub
SatzzDev.processMessageStubType = async (m) => {
if (!m.messageStubType) return;

const chat = SatzzDev.decodeJid(
m.key.remoteJid || m.message?.senderKeyDistributionMessage?.groupId || "",
);
if (!chat || chat === "status@broadcast") return;

const emitGroupUpdate = (update) => {
ev.emit("groups.update", [{ id: chat, ...update }]);
};

console.log({
messageStubType: m.messageStubType,
messageStubParameters: m.messageStubParameters,
type: WAMessageStubType[m.messageStubType],
});

const isGroup = chat.endsWith("@g.us");
if (!isGroup) return;

let chats = SatzzDev.chats[chat];
if (!chats) chats = SatzzDev.chats[chat] = { id: chat };
chats.isChats = true;

const metadata = await SatzzDev.groupMetadata(chat).catch((_) => null);
if (!metadata) return;

chats.subject = metadata.subject;
chats.metadata = metadata;
};

// Fungsi untuk memasukkan semua grup
SatzzDev.insertAllGroup = async () => {
const groups =
(await SatzzDev.groupFetchAllParticipating().catch((_) => null)) || {};
for (const group in groups) {
SatzzDev.chats[group] = {
...(SatzzDev.chats[group] || {}),
id: group,
subject: groups[group].subject,
isChats: true,
metadata: groups[group],
};
}
return SatzzDev.chats;
};

// Fungsi untuk memproses dan memasukkan pesan ke dalam chat
SatzzDev.pushMessage = async (m) => {
if (!m) return;
if (!Array.isArray(m)) m = [m];

for (const message of m) {
try {
if (!message) continue;

if (
message.messageStubType &&
message.messageStubType != WAMessageStubType.CIPHERTEXT
) {
SatzzDev.processMessageStubType(message).catch(console.error);
}

const _mtype = Object.keys(message.message || {});
const mtype =
(!["senderKeyDistributionMessage", "messageContextInfo"].includes(
_mtype[0],
) &&
_mtype[0]) ||
(_mtype.length >= 3 &&
_mtype[1] !== "messageContextInfo" &&
_mtype[1]) ||
_mtype[_mtype.length - 1];

const chat = SatzzDev.decodeJid(
message.key.remoteJid ||
message.message?.senderKeyDistributionMessage?.groupId ||
"",
);

if (message.message?.[mtype]?.contextInfo?.quotedMessage) {
let context = message.message[mtype].contextInfo;
let participant = SatzzDev.decodeJid(context.participant);
const remoteJid = SatzzDev.decodeJid(context.remoteJid || participant);
let quoted = message.message[mtype].contextInfo.quotedMessage;

if (remoteJid && remoteJid !== "status@broadcast" && quoted) {
let qMtype = Object.keys(quoted)[0];
if (qMtype == "conversation") {
quoted.extendedTextMessage = { text: quoted[qMtype] };
delete quoted.conversation;
qMtype = "extendedTextMessage";
}
if (!quoted[qMtype].contextInfo) quoted[qMtype].contextInfo = {};
quoted[qMtype].contextInfo.mentionedJid =
context.mentionedJid ||
quoted[qMtype].contextInfo.mentionedJid ||
[];
const isGroup = remoteJid.endsWith("g.us");
if (isGroup && !participant) participant = remoteJid;
const qM = {
key: {
remoteJid,
fromMe: areJidsSameUser(SatzzDev.user.jid, remoteJid),
id: context.stanzaId,
participant,
},
message: JSON.parse(JSON.stringify(quoted)),
...(isGroup ? { participant } : {}),
};

let qChats = SatzzDev.chats[participant];
if (!qChats)
qChats = SatzzDev.chats[participant] = {
id: participant,
isChats: !isGroup,
};
if (!qChats.messages) qChats.messages = {};
if (!qChats.messages[context.stanzaId] && !qM.key.fromMe)
qChats.messages[context.stanzaId] = qM;

let qChatsMessages;
if (
(qChatsMessages = Object.entries(qChats.messages)).length > 40
) {
qChats.messages = Object.fromEntries(
qChatsMessages.slice(30, qChatsMessages.length),
);
}
}
}

if (!chat || chat === "status@broadcast") continue;
const isGroup = chat.endsWith("@g.us");
let chats = SatzzDev.chats[chat];
if (!chats) {
if (isGroup) await SatzzDev.insertAllGroup().catch(console.error);
chats = SatzzDev.chats[chat] = {
id: chat,
isChats: true,
...(SatzzDev.chats[chat] || {}),
};
}

let metadata, sender;
if (isGroup) {
if (!chats.subject || !chats.metadata) {
metadata =
(await SatzzDev.groupMetadata(chat).catch((_) => ({}))) || {};
if (!chats.subject) chats.subject = metadata.subject || "";
if (!chats.metadata) chats.metadata = metadata;
}
sender = SatzzDev.decodeJid(
(message.key?.fromMe && SatzzDev.user.id) ||
message.participant ||
message.key?.participant ||
chat ||
"",
);
if (sender !== chat) {
let senderChats = SatzzDev.chats[sender];
if (!senderChats) senderChats = SatzzDev.chats[sender] = { id: sender };
if (!senderChats.name)
senderChats.name = message.pushName || senderChats.name || "";
}
} else if (!chats.name) {
chats.name = message.pushName || chats.name || "";
}

if (
["senderKeyDistributionMessage", "messageContextInfo"].includes(mtype)
)
continue;
chats.isChats = true;
if (!chats.messages) chats.messages = {};

const fromMe =
message.key.fromMe || areJidsSameUser(sender || chat, SatzzDev.user.id);
if (
!["protocolMessage"].includes(mtype) &&
!fromMe &&
message.messageStubType != WAMessageStubType.CIPHERTEXT &&
message.message
) {
delete message.message.messageContextInfo;
delete message.message.senderKeyDistributionMessage;
chats.messages[message.key.id] = JSON.parse(
JSON.stringify(message, null, 2),
);

let chatsMessages;
if ((chatsMessages = Object.entries(chats.messages)).length > 40) {
chats.messages = Object.fromEntries(
chatsMessages.slice(30, chatsMessages.length),
);
}
}
} catch (e) {
console.error(e);
}
}
};

SatzzDev.sendContact = async (jid, kon, nama, quoted = "", opts = {}) => {
let list = [
{
displayName: nama,
vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${nama}\nFN:${nama}\nitem1.TEL;waid=${kon}:${PhoneNumber("+" + kon).getNumber("international")}\nitem1.X-ABLabel:Ponsel\nitem2.EMAIL;type=INTERNET:satganzdevs@gmail.com\nitem2.X-ABLabel:Email\nitem3.URL:https://chat.whatsapp.com/HbCl8qf3KQK1MEp3ZBBpSf\nitem3.X-ABLabel:Instagram\nitem4.ADR:;;Indonesia;;;;\nitem4.X-ABLabel:Region\nEND:VCARD`,
},
];
SatzzDev.sendMessage(
jid,
{
contacts: { displayName: `${list.length} Kontak`, contacts: list },
...opts,
},
{ quoted },
);
};

SatzzDev.sendPoll = (jid, name = "", values = [], selectableCount = 1) => {
return SatzzDev.sendMessage(jid, { poll: { name, values, selectableCount } });
};
SatzzDev.public = true;
const {
proto,
generateWAMessageFromContent,
prepareWAMessageMedia,
generateWAMessageContent,
} = require("@whiskeysockets/baileys");

// Fungsi untuk mengirim pesan interaktif tanpa gambar
SatzzDev.sendButton = async (id, title, text, footer, buttons, quoted) => {
let message = generateWAMessageFromContent(
id,
proto.Message.fromObject({
viewOnceMessage: {
message: {
messageContextInfo: {
deviceListMetadata: {},
deviceListMetadataVersion: 2,
},
interactiveMessage: proto.Message.InteractiveMessage.create({
header: proto.Message.InteractiveMessage.Header.create({
title,
subtitle: "",
hasMediaAttachment: false,
}),
body: proto.Message.InteractiveMessage.Body.create({ text }),
footer: proto.Message.InteractiveMessage.Footer.create({
text: footer,
}),
nativeFlowMessage:
proto.Message.InteractiveMessage.NativeFlowMessage.create({
buttons,
}),
contextInfo: {
isForwarded: true,
forwardingScore: 1000,
forwardedNewsletterMessageInfo: {
newsletterJid: global.newsletterJid,
serverMessageId: 100,
newsletterName: global.newsletterName,
},
mentionedJid:
[
...text.matchAll(/@([0-9]{5,16}|0)/g),
...title.matchAll(/@([0-9]{5,16}|0)/g),
].map((v) => v[1] + "@s.whatsapp.net") || "",
},
}),
},
},
}),
{ quoted, userJid: id },
);

return SatzzDev.relayMessage(id, message.message, {
quoted,
messageId: message.key.id,
});
};

// Fungsi untuk mengirim pesan interaktif dengan gambar
SatzzDev.sendButtonV2 = async (
id,
image,
title,
text,
footer,
buttons,
quoted,
) => {
let { imageMessage } = await generateWAMessageContent(
{ image },
{ upload: SatzzDev.waUploadToServer },
);
let message = generateWAMessageFromContent(
id,
proto.Message.fromObject({
viewOnceMessage: {
message: {
messageContextInfo: {
deviceListMetadata: {},
deviceListMetadataVersion: 2,
},
interactiveMessage: proto.Message.InteractiveMessage.create({
header: proto.Message.InteractiveMessage.Header.create({
title,
subtitle: "",
imageMessage,
hasMediaAttachment: true,
}),
body: proto.Message.InteractiveMessage.Body.create({ text }),
footer: proto.Message.InteractiveMessage.Footer.create({
text: footer,
}),
nativeFlowMessage:
proto.Message.InteractiveMessage.NativeFlowMessage.create({
buttons,
}),
contextInfo: {
isForwarded: true,
forwardingScore: 1000,
forwardedNewsletterMessageInfo: {
newsletterJid: global.newsletterJid,
serverMessageId: 100,
newsletterName: global.newsletterName,
},
mentionedJid:
[
...text.matchAll(/@([0-9]{5,16}|0)/g),
...title.matchAll(/@([0-9]{5,16}|0)/g),
].map((v) => v[1] + "@s.whatsapp.net") || "",
},
}),
},
},
}),
{ quoted, userJid: id },
);

return SatzzDev.relayMessage(id, message.message, {
quoted,
messageId: message.key.id,
});
};

SatzzDev.sendListMsg = async (
id,
title,
text,
footer,
buText,
secTitle,
label,
rows,
quoted,
) => {
let but = [];
rows.map((button) => {
but.push({ title: button[0], id: button[1] });
});
const rowr = [
{
name: "single_select",
buttonParamsJson: JSON.stringify({
title: buText,
sections: [
{
title: secTitle,
highlight_label: label,
rows: but, // Menggunakan array yang sudah diformat
},
],
}),
},
];
return SatzzDev.sendButton(id, title, text, footer, rowr, quoted);
};
SatzzDev.sendList = async (id, title, text, footer, buText, sections, quoted) => {
const rowr = [
{
name: "single_select",
buttonParamsJson: JSON.stringify({
title: buText,
sections: sections.map(([secTitle, buttons]) => ({
title: secTitle,
rows: buttons.map((button) => ({
title: button.title,
id: button.id,
})),
})),
}),
},
];
return SatzzDev.sendButton(id, title, text, footer, rowr, quoted);
};
SatzzDev.sendListMsgV3 = async (
id,
title,
text,
footer,
buText,
sections,
quoted,
) => {
const rowr = [
{
name: "single_select",
buttonParamsJson: JSON.stringify({
title: buText,
sections,
}),
},
];
return SatzzDev.sendButton(id, title, text, footer, rowr, quoted);
};
SatzzDev.sendListMsgV2 = async (
id,
img,
title,
text,
footer,
buText,
secTitle,
label,
rows,
quoted,
) => {
let {
proto,
generateWAMessageFromContent,
prepareWAMessageMedia,
} = require("baileys");
let image = await prepareWAMessageMedia(
{ image: { url: img } },
{ upload: SatzzDev.waUploadToServer },
);
let but = [];
rows.map((button) => {
but.push({ title: button[0], description: button[1], id: button[2] });
});
const rowr = [
{
name: "single_select",
buttonParamsJson: JSON.stringify({
title: buText,
sections: [
{
title: secTitle,
highlight_label: label,
rows: but, // Menggunakan array yang sudah diformat
},
],
}),
},
];
let msg = generateWAMessageFromContent(
id,
proto.Message.fromObject({
viewOnceMessage: {
message: {
messageContextInfo: {
deviceListMetadata: {},
deviceListMetadataVersion: 2,
},
interactiveMessage: proto.Message.InteractiveMessage.create({
header: proto.Message.InteractiveMessage.Header.create({
title,
subtitle: "",
imageMessage: image.imageMessage,
hasMediaAttachment: true,
}),
body: proto.Message.InteractiveMessage.Body.create({
text: text,
}),
footer: proto.Message.InteractiveMessage.Footer.create({
text: footer,
}),
nativeFlowMessage:
proto.Message.InteractiveMessage.NativeFlowMessage.create({
buttons: rowr,
}),
contextInfo: {
isForwarded: true,
forwardingScore: 1000,
forwardedNewsletterMessageInfo: {
newsletterJid: global.newsletterJid,
serverMessageId: 100,
newsletterName: global.newsletterName,
},
mentionedJid:
[
...text.matchAll(/@([0-9]{5,16}|0)/g),
...title.matchAll(/@([0-9]{5,16}|0)/g),
...footer.matchAll(/@([0-9]{5,16}|0)/g),
].map((v) => v[1] + "@s.whatsapp.net") || "",
},
}),
},
},
}),
{ quoted, userJid: id },
);
return SatzzDev.relayMessage(id, msg.message, {
quoted,
messageId: msg.key.id,
});
//return SatzzDev.sendButton(id, title, text, footer, rowr, quoted);
};

SatzzDev.sendButtonText = async (id, title, text, footer, button, quoted) => {
return SatzzDev.sendButton(
id,
title,
text,
footer,
[{ name: "quick_reply", buttonParamsJson: JSON.stringify(button) }],
quoted,
);
};

SatzzDev.sendMediaButtons = async (
id,
title,
text,
footer,
buttons = [],
quoted = "",
options = {},
) => {
const formattedButtons = [];
for (const button of buttons) {
let buttonParamsJson;
if (button.type === "copy") {
buttonParamsJson = JSON.stringify({
display_text: button.text,
id: "12345",
copy_code: button.id,
});
} else if (button.type === "url") {
buttonParamsJson = JSON.stringify({
display_text: button.text,
url: button.id,
merchant_url: button.id,
});
} else if (button.type === "btn") {
buttonParamsJson = JSON.stringify({
display_text: button.text,
id: button.id,
});
}
formattedButtons.push({
name:
button.type === "copy"
? "cta_copy"
: button.type === "url"
? "cta_url"
: "quick_reply",
buttonParamsJson: buttonParamsJson,
});
}

let hasMediaAttachment = true;
let media = null;
if (options.img) {
media = await prepareWAMessageMedia(
{ image: { url: options.img } },
{ upload: SatzzDev.waUploadToServer },
);
} else if (options.video) {
media = await prepareWAMessageMedia(
{ video: { url: options.video } },
{ upload: SatzzDev.waUploadToServer },
);
} else {
hasMediaAttachment = false;
}

const msg = generateWAMessageFromContent(
id,
proto.Message.fromObject({
viewOnceMessage: {
message: {
interactiveMessage: proto.Message.InteractiveMessage.create({
header: proto.Message.InteractiveMessage.Header.create({
title,
subtitle: "",
imageMessage: media.imageMessage ? media.imageMessage : null,
videoMessage: media.videoMessage ? media.videoMessage : null,
hasMediaAttachment: hasMediaAttachment,
}),
body: proto.Message.InteractiveMessage.Body.create({ text }),
footer: proto.Message.InteractiveMessage.Footer.create({
text: footer,
}),
nativeFlowMessage:
proto.Message.InteractiveMessage.NativeFlowMessage.create({
buttons: formattedButtons,
}),
contextInfo: {
isForwarded: true,
forwardingScore: 1000,
forwardedNewsletterMessageInfo: {
newsletterJid: global.newsletterJid,
serverMessageId: 100,
newsletterName: global.newsletterName,
},
mentionedJid:
[
...text.matchAll(/@([0-9]{5,16}|0)/g),
...title.matchAll(/@([0-9]{5,16}|0)/g),
...footer.matchAll(/@([0-9]{5,16}|0)/g),
].map((v) => v[1] + "@s.whatsapp.net") || "",
},
}),
},
},
}),
{ quoted, userJid: id },
);

return SatzzDev.relayMessage(id, msg.message, {
quoted,
messageId: msg.key.id,
});
};
SatzzDev.sendbutGif = async (
id,
title,
text,
footer,
buttons = [],
quoted = "",
options = {},
) => {
const formattedButtons = [];
for (const button of buttons) {
let buttonParamsJson;
if (button.type === "copy") {
buttonParamsJson = JSON.stringify({
display_text: button.text,
id: "12345",
copy_code: button.id,
});
} else if (button.type === "url") {
buttonParamsJson = JSON.stringify({
display_text: button.text,
url: button.id,
merchant_url: button.id,
});
} else if (button.type === "btn") {
buttonParamsJson = JSON.stringify({
display_text: button.text,
id: button.id,
});
}
formattedButtons.push({
name:
button.type === "copy"
? "cta_copy"
: button.type === "url"
? "cta_url"
: "quick_reply",
buttonParamsJson: buttonParamsJson,
});
}
let hasMediaAttachment = true;
let media = await prepareWAMessageMedia(
{ video: { url: options.video, gifPlayback: true }, gifPlayback: true },
{ gifPlayback: true, upload: SatzzDev.waUploadToServer },
);
const msg = generateWAMessageFromContent(
id,
proto.Message.fromObject({
viewOnceMessage: {
message: {
interactiveMessage: proto.Message.InteractiveMessage.create({
header: proto.Message.InteractiveMessage.Header.create({
title,
subtitle: "",
videoMessage: media.videoMessage,
hasMediaAttachment: true,
}),
body: proto.Message.InteractiveMessage.Body.create({ text }),
footer: proto.Message.InteractiveMessage.Footer.create({
text: footer,
}),
nativeFlowMessage:
proto.Message.InteractiveMessage.NativeFlowMessage.create({
buttons: formattedButtons,
}),
contextInfo: {
isForwarded: true,
forwardingScore: 1000,
forwardedNewsletterMessageInfo: {
newsletterJid: global.newsletterJid,
serverMessageId: 100,
newsletterName: global.newsletterName,
},
mentionedJid:
[
...text.matchAll(/@([0-9]{5,16}|0)/g),
...title.matchAll(/@([0-9]{5,16}|0)/g),
...footer.matchAll(/@([0-9]{5,16}|0)/g),
].map((v) => v[1] + "@s.whatsapp.net") || "",
},
}),
},
},
}),
{ quoted, userJid: id },
);
return SatzzDev.relayMessage(id, msg.message, {
quoted,
messageId: msg.key.id,
});
};

SatzzDev.sendEditMsg = async (jid, strings = [], quoted, timer = 1000) => {
let { key } = await SatzzDev.sendMessage(jid, { text: strings[0] }, { quoted });
await sleep(timer);
const sendWithDelay = async (index) => {
if (index < strings.length) {
await SatzzDev.sendMessage(jid, { text: strings[index], edit: key });
setTimeout(() => sendWithDelay(index + 1), timer);
}
};
return sendWithDelay(1);
};

SatzzDev.sendButtons = async (
id,
title,
text,
footer,
buttons = [],
quoted = "",
options = {},
) => {
const formattedButtons = buttons.map((button) => {
let buttonParamsJson;
if (button.type === "copy") {
buttonParamsJson = JSON.stringify({
display_text: button.text,
id: "12345",
copy_code: button.id,
});
} else if (button.type === "url") {
// Menggunakan 'url' sebagai representasi untuk tombol tipe cta_url
buttonParamsJson = JSON.stringify({
display_text: button.text,
url: button.id,
merchant_url: button.id,
});
} else if (button.type === "btn") {
// Menggunakan 'btn' sebagai representasi untuk tombol tipe quick_reply
buttonParamsJson = JSON.stringify({
display_text: button.text,
id: button.id,
});
}
return {
name:
button.type === "copy"
? "cta_copy"
: button.type === "url"
? "cta_url"
: "quick_reply", // Mengubah tipe sesuai representasi yang baru
buttonParamsJson: buttonParamsJson,
};
});

let hasMediaAttachment = true;
let image = null;
if (options.img) {
let buffer = Buffer.isBuffer(options.img)
? options.img
: /^data:.*?\/.*?;base64,/i.test(options.img)
? Buffer.from(options.img.split`,`[1], "base64")
: /^https?:\/\//.test(options.img)
? await await getBuffer(options.img)
: fs.existsSync(options.img)
? fs.readFileSync(options.img)
: Buffer.alloc(0);
image = await prepareWAMessageMedia(
{ image: buffer },
{ upload: SatzzDev.waUploadToServer },
);
} else {
hasMediaAttachment = false;
}

const msg = generateWAMessageFromContent(
id,
proto.Message.fromObject({
viewOnceMessage: {
message: {
interactiveMessage: proto.Message.InteractiveMessage.create({
header: proto.Message.InteractiveMessage.Header.create({
title,
subtitle: "",
imageMessage: image ? image.imageMessage : null,
hasMediaAttachment: hasMediaAttachment,
}),
body: proto.Message.InteractiveMessage.Body.create({ text }),
footer: proto.Message.InteractiveMessage.Footer.create({
text: footer,
}),
nativeFlowMessage:
proto.Message.InteractiveMessage.NativeFlowMessage.create({
buttons: formattedButtons,
}),
contextInfo: {
isForwarded: true,
forwardingScore: 1000,
forwardedNewsletterMessageInfo: {
newsletterJid: global.newsletterJid,
serverMessageId: 100,
newsletterName: global.newsletterName,
},
mentionedJid:
[
...text.matchAll(/@([0-9]{5,16}|0)/g),
...title.matchAll(/@([0-9]{5,16}|0)/g),
...footer.matchAll(/@([0-9]{5,16}|0)/g),
].map((v) => v[1] + "@s.whatsapp.net") || "",
},
}),
},
},
}),
{ quoted, userJid: id },
);

return SatzzDev.relayMessage(id, msg.message, {
quoted,
messageId: msg.key.id,
});
};

SatzzDev.downloadMediaMessage = async (message) => {
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

SatzzDev.sendImage = async (jid, path, caption = "", quoted = "", options) => {
let buffer = Buffer.isBuffer(path)
? path
: /^data:.*?\/.*?;base64,/i.test(path)
? Buffer.from(path.split`,`[1], "base64")
: /^https?:\/\//.test(path)
? await await getBuffer(path)
: fs.existsSync(path)
? fs.readFileSync(path)
: Buffer.alloc(0);
return await SatzzDev.sendMessage(
jid,
{ image: buffer, caption: caption, ...options },
{ quoted },
);
};

//Funtion o geing file
SatzzDev.getFile = async (PATH, returnAsFilename) => {
let res, filename;
let data = Buffer.isBuffer(PATH)
? PATH
: /^data:.*?\/.*?;base64,/i.test(PATH)
? Buffer.from(PATH.split`,`[1], "base64")
: /^https?:\/\//.test(PATH)
? await (res = await fetch(PATH)).buffer()
: fs.existsSync(PATH)
? ((filename = PATH), fs.readFileSync(PATH))
: typeof PATH === "string"
? PATH
: Buffer.alloc(0);
if (!Buffer.isBuffer(data)) throw new TypeError("Result is not a buffer");
let type = (await FileType.fromBuffer(data)) || {
mime: "application/octet-stream",
ext: ".bin",
};
if (data && returnAsFilename && !filename)
(filename = path.join("../" + new Date() * 1 + "." + type.ext)),
await fs.promises.writeFile(filename, data);
return {
res,
filename,
...type,
data,
};
};

SatzzDev.sendText = (jid, text, quoted = "", options) =>
SatzzDev.sendMessage(jid, { text: text, ...options }, { quoted });

SatzzDev.adReply = (
jid,
text,
title = "",
body = "",
buffer,
sourceUrl = "",
quoted,
options,
) => {
return SatzzDev.sendMessage(
jid,
{
text,
contextInfo: {
mentionedJid: [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(
(v) => v[1] + "@s.whatsapp.net",
),
externalAdReply: {
showAdAttribution: true,
mediaType: 1,
title,
body,
thumbnail: buffer,
renderLargerThumbnail: true,
sourceUrl,
},
},
},
{ quoted: quoted, ...options },
);
};

SatzzDev.sendTextWithMentions = async (jid, text, quoted, options = {}) =>
SatzzDev.sendMessage(
jid,
{
text: text,
contextInfo: {
mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(
(v) => v[1] + "@s.whatsapp.net",
),
},
...options,
},
{ quoted },
);

SatzzDev.sendGroupV4Invite = async (
jid,
participant,
inviteCode,
inviteExpiration,
groupName = "unknown subject",
caption = "Invitation to join my WhatsApp group",
options = {},
) => {
let msg = proto.Message.fromObject({
groupInviteMessage: proto.Message.GroupInviteMessage.fromObject({
inviteCode,
inviteExpiration:
parseInt(inviteExpiration) || +new Date(new Date() + 3 * 86400000),
groupJid: jid,
groupName: groupName ? groupName : await SatzzDev.getName(jid),
caption,
}),
});
let message = generateWAMessageFromContent(participant, msg, {
userJid: SatzzDev.decodeJid(SatzzDev.user.id),
ephemeralExpiration: 3 * 24 * 60 * 60,
...options,
});
await SatzzDev.relayMessage(participant, message.message, {
messageId: message.key.id,
});
return message;
};

SatzzDev.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
let mime = "";
try {
// Fetch first few bytes to determine MIME type
let res = await axios.get(url, {
headers: {
Range: "bytes=0-512", // Fetch only first 512 bytes
},
});

mime = res.headers["content-type"];

if (mime.split("/")[1] === "gif") {
return SatzzDev.sendMessage(
jid,
{
video: await getBuffer(url),
caption: caption,
gifPlayback: true,
...options,
},
{ quoted },
);
}

let type = mime.split("/")[0] + "Message";

if (mime === "application/pdf") {
return SatzzDev.sendMessage(
jid,
{
document: await getBuffer(url),
mimetype: "application/pdf",
caption: caption,
...options,
},
{ quoted },
);
}

if (mime.split("/")[0] === "image") {
return SatzzDev.sendMessage(
jid,
{ image: await getBuffer(url), caption: caption, ...options },
{ quoted },
);
}

if (
mime.split("/")[0] === "video" ||
mime.split("/")[1] === "octet-stream"
) {
return SatzzDev.sendMessage(
jid,
{
video: await getBuffer(url),
caption: caption,
mimetype: "video/mp4",
...options,
},
{ quoted },
);
}

if (mime.split("/")[0] === "audio") {
return SatzzDev.sendMessage(
jid,
{
audio: await getBuffer(url),
caption: caption,
mimetype: "audio/mpeg",
...options,
},
{ quoted },
);
}

console.error("Unsupported MIME type: ", mime);
} catch (err) {
console.error("Failed to fetch file or determine MIME type: ", err);
}
};

SatzzDev.sendContactArray = async (jid, data, quoted, options) => {
let contacts = [];

for (let [number, name, org, note] of data) {
number = number.replace(/[^0-9]/g, ""); // Remove non-numeric characters from number

let contextInfo = {
externalAdReply: {
showAdAttribution: true,
mediaType: 1,
title: "SatzzDev.",
sourceUrl: global.link,
renderLargerThumbnail: true,
thumbnailUrl:
"https://i.pinimg.com/originals/6b/45/3a/6b453a1ed9673d56e34673b281ede225.jpg",
},
};

// Customize your vCard with organization and note fields
let vcard = `
BEGIN:VCARD
VERSION:3.0
FN:${name.replace(/\n/g, "\\n")}
ORG:${org || ""}
item1.TEL;waid=${number}:${PhoneNumber("+" + number).getNumber("international")}
item1.X-ABLabel:${note ? note.replace(/\n/g, "\\n") : ""}
END:VCARD`.trim();

contacts.push({ contextInfo, vcard, displayName: name });
}

let displayName =
(contacts.length > 1 ? `2013 kontak` : contacts[0].displayName) || null;

return await SatzzDev.sendMessage(
jid,
{
contacts: {
displayName,
contacts,
},
},
{
quoted,
...options,
},
);
};

SatzzDev.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path)
? path
: /^data:.*?\/.*?;base64,/i.test(path)
? Buffer.from(path.split`,`[1], "base64")
: /^https?:\/\//.test(path)
? await await getBuffer(path)
: fs.existsSync(path)
? fs.readFileSync(path)
: Buffer.alloc(0);
let buffer;
if (options && (options.packname || options.author)) {
buffer = await writeExifImg(buff, options);
} else {
buffer = await imageToWebp(buff);
}
await SatzzDev.sendMessage(
jid,
{ sticker: { url: buffer }, ...options },
{ quoted },
);
return buffer;
};

SatzzDev.sendSticker = (teks) => {
SatzzDev.sendMessage(m.chat, { sticker: { url: teks } }, { quoted: m });
};

SatzzDev.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path)
? path
: /^data:.*?\/.*?;base64,/i.test(path)
? Buffer.from(path.split`,`[1], "base64")
: /^https?:\/\//.test(path)
? await await getBuffer(path)
: fs.existsSync(path)
? fs.readFileSync(path)
: Buffer.alloc(0);
let buffer;
if (options && (options.packname || options.author)) {
buffer = await writeExifVid(buff, options);
} else {
buffer = await videoToWebp(buff);
}
await SatzzDev.sendMessage(
jid,
{ sticker: { url: buffer }, ...options },
{ quoted },
);
return buffer;
};

SatzzDev.downloadAndSaveMediaMessage = async (
message,
filename,
attachExtension = true,
) => {
let quoted = message.msg ? message.msg : message;
let mime = (message.msg || message).mimetype || "";
let messageType = message.mtype
? message.mtype.replace(/Message/gi, "")
: mime.split("/")[0];
const stream = await downloadContentFromMessage(quoted, messageType);
let buffer = Buffer.from([]);
for await (const chunk of stream) {
buffer = Buffer.concat([buffer, chunk]);
}
let type = await FileType.fromBuffer(buffer);
trueFileName = attachExtension ? filename + "." + type.ext : filename;
await fs.writeFileSync(trueFileName, buffer);
return trueFileName;
};

SatzzDev.cMod = (jid, copy, text = "", sender = SatzzDev.user.id, options = {}) => {
let mtype = Object.keys(copy.message)[0];
let isEphemeral = mtype === "ephemeralMessage";
if (isEphemeral) {
mtype = Object.keys(copy.message.ephemeralMessage.message)[0];
}
let msg = isEphemeral
? copy.message.ephemeralMessage.message
: copy.message;
let content = msg[mtype];
if (typeof content === "string") msg[mtype] = text || content;
else if (content.caption) content.caption = text || content.caption;
else if (content.text) content.text = text || content.text;
if (typeof content !== "string")
msg[mtype] = {
...content,
...options,
};
if (copy.key.participant)
sender = copy.key.participant = sender || copy.key.participant;
else if (copy.key.participant)
sender = copy.key.participant = sender || copy.key.participant;
if (copy.key.remoteJid.includes("@s.whatsapp.net"))
sender = sender || copy.key.remoteJid;
else if (copy.key.remoteJid.includes("@broadcast"))
sender = sender || copy.key.remoteJid;
copy.key.remoteJid = jid;
copy.key.fromMe = sender === SatzzDev.user.id;
return proto.WebMessageInfo.fromObject(copy);
};

SatzzDev.sendFile = async (jid, PATH, fileName, quoted = {}, options = {}) => {
let types = await SatzzDev.getFile(PATH, true);
let { filename, size, ext, mime, data } = types;
let type = "",
mimetype = mime,
pathFile = filename;
if (options.asDocument) type = "document";
if (options.asSticker || /webp/.test(mime)) {
let media = { mimetype: mime, data };
pathFile = await writeExif(media, {
packname: global.packname,
author: global.packname2,
categories: options.categories ? options.categories : [],
});
await fs.promises.unlink(filename);
type = "sticker";
mimetype = "image/webp";
} else if (/image/.test(mime)) type = "image";
else if (/video/.test(mime)) type = "video";
else if (/audio/.test(mime)) type = "audio";
else type = "document";
await SatzzDev.sendMessage(
jid,
{ [type]: { url: pathFile }, mimetype, fileName, ...options },
{ quoted, ...options },
);
return fs.promises.unlink(pathFile);
};

SatzzDev.parseMention = async (text) => {
return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(
(v) => v[1] + "@s.whatsapp.net",
);
};

SatzzDev.copyNForward = async (
jid,
message,
forceForward = false,
options = {},
) => {
let vtype;
if (options.readViewOnce) {
message.message =
message.message &&
message.message.ephemeralMessage &&
message.message.ephemeralMessage.message
? message.message.ephemeralMessage.message
: message.message || undefined;
vtype = Object.keys(message.message.viewOnceMessage.message)[0];
delete (message.message && message.message.ignore
? message.message.ignore
: message.message || undefined);
delete message.message.viewOnceMessage.message[vtype].viewOnce;
message.message = {
...message.message.viewOnceMessage.message,
};
}
let mtype = Object.keys(message.message)[0];
let content = await generateForwardMessageContent(message, forceForward);
let ctype = Object.keys(content)[0];
let context = {};
if (mtype != "conversation") context = message.message[mtype].contextInfo;
content[ctype].contextInfo = {
...context,
...content[ctype].contextInfo,
};
const waMessage = await generateWAMessageFromContent(
jid,
content,
options
? {
...content[ctype],
...options,
...(options.contextInfo
? {
contextInfo: {
...content[ctype].contextInfo,
...options.contextInfo,
},
}
: {}),
}
: {},
);
await SatzzDev.relayMessage(jid, waMessage.message, {
messageId: waMessage.key.id,
});
return waMessage;
};

return SatzzDev
};

const stopjadibot = (reply, id) => {
const index = listjadibot.findIndex(bot => bot.jid === id);
if (index !== -1) {
try {
listjadibot[index].socket?.end(); // Hentikan koneksi menggunakan `end()`
listjadibot.splice(index, 1); // Hapus dari daftar bot aktif
reply(`*Clone untuk ID ${id} berhasil dihentikan.*`);
} catch (err) {
console.error('Error saat menghentikan jadibot:', err);
reply(`*Gagal menghentikan clone untuk ID ${id}.*`);
}
} else {
reply(`*Tidak ditemukan jadibot aktif dengan ID ${id}.*`);
}
};


module.exports = {
jadibot,
stopjadibot,
listjadibot
}