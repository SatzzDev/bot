require("./config.js");
const { S_WHATSAPP_NET, 
proto, 
generateWAMessageFromContent, 
prepareWAMessageMedia } = require("baileys");
const fs = require("fs")
const util = require("util");
const chalk = require("chalk");
const { exec } = require("child_process");
const { CS, jsonformat,reSize, ucapanWaktu, formatp, clockString, getBuffer, getCases, generateProfilePicture, sleep, fetchJson, runtime, pickRandom, getGroupAdmins, getRandom } = require("./lib/myfunc.js")
const { jadibot, stopjadibot, listjadibot } = require('./lib/jadibot')




//━━━━━━━━━━━━━━━[ START OF EXPORT ]━━━━━━━━━━━━━━━━━//
module.exports = {
async handler(Satzz, m, chatUpdate, store) {
try {
const { reply } = m
const prefix = '/'
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
const botNumber = await Satzz.decodeJid(Satzz.user.id);
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
const groupMetadata = m.isGroup ? await Satzz.groupMetadata(m.chat) : ""
const groupName =  m.isGroup ? await groupMetadata.subject : ""
const participants = m.isGroup ? await groupMetadata.participants : "";
const groupAdmins = m.isGroup ? await getGroupAdmins(participants) : "";
const isBotAdmins = groupAdmins.includes(botNumber)
const isAdmins = groupAdmins.includes(m.sender)
const isStatus = m.chat === "status@broadcast" ? true : false





if (m.isGroup) {
let chats = db.data.chats[m.chat];
if (typeof chats !== "object") db.data.chats[m.chat] = {};
if (chats) {
if (!("mute" in chats)) chats.mute = false;
} else
global.db.data.chats[m.chat] = {
mute: false,
};
}




const fakeQuotes = [
{
key: { fromMe: false, participant: `0@s.whatsapp.net`, remoteJid: `status@broadcast` },
message: { conversation: "@krniwnstria" }
},
{
key: { fromMe: false, participant: `0@s.whatsapp.net`, remoteJid: `status@broadcast` },
message: {
locationMessage: {
degreesLatitude: -6.17511,
degreesLongitude: 106.865039,
name: "@krniwnstria",
address: "Monas"
}
}
}
];
global.fake = pickRandom(fakeQuotes)

const react = async (emoti) => { return Satzz.sendMessage(m.chat, {react: {text: emoti, key: {remoteJid: m.chat, fromMe: false, 
key: m.key, id: m.key.id, participant: m.sender}}})}



const color = (text, color) => {
return !color ? chalk.green(text) : chalk.keyword(color)(text);
};

if (isStatus) {
if (m.mtype !== "protocolMessage") {
await Satzz.readMessages([m.key])
await Satzz.copyNForward("6282170988479@s.whatsapp.net", m, true, {quoted:m})
}
if (m.mtype !== "protocolMessage") {
console.log(chalk.black(chalk.bgWhite("[  STATUS DELETE ]")),chalk.magenta("From"), chalk.green(pushname));
}
}

if (!global.db.data.chats[m.chat].mute) {
if (m.mtype == 'protocolMessage' && !m.key.remoteJid.includes('status@broadcast')) {
let mess = chatUpdate.messages[0].message.protocolMessage
let chats = Object.entries(await Satzz.chats).find(([user, data]) => data.messages && data.messages[mess.key.id])
if (chats[1]) {
let msg = JSON.parse(JSON.stringify(chats[1].messages[mess.key.id]))
if (msg.message.extendedTextMessage && msg.message.extentedTextMessage.text.startsWith(".")) return
await Satzz.copyNForward(mess.key.remoteJid, msg).catch(e => console.log(e, msg))
Satzz.sendButtons(m.chat, '*`[ A N T I - D E L E T E ]`*', `_Tipe Pesan:_ \n${Object.keys(msg.message)[0]}\n\n_Pengirim:_ \n@${mess.key.participant.split('@')[0]}`, global.footer, [{type:'btn', text:'🗿', id:''}], msg)
}
} 

if (m.mtype == 'editedMessage') {
let mess = chatUpdate.messages[0].message.editedMessage.message.protocolMessage;
let chats = Object.entries(await Satzz.chats).find(([user, data]) => data.messages && data.messages[mess.key.id]);
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
Satzz.sendButtons(m.chat, '*`[ A N T I - E D I T ]`*', `_SETELAH DI EDIT:_ \n${editedText}\n\n_SEBELUM DI EDIT:_ \n${pesan}`, global.footer, [{type:'btn', text:'🗿', id:''}], m)
if (originalMessage.extendedTextMessage) {
originalMessage.extendedTextMessage.text = editedText;
} else if (originalMessage.conversation) {
originalMessage.conversation = editedText;
}
} else {
}
}
}

//━━━━━━━━━━━━━━━[ START COMMAND ]━━━━━━━━━━━━━━━━━//
if (isCmd) {
switch (command) { 
case 'mute':{
if (!itsMe) return
if (db.data.chats[m.chat].mute) return reply('udah di mute jir')
db.data.chats[m.chat].mute = true
reply('done.')
}
break
case 'unmute':{
if (!itsMe) return
if (!db.data.chats[m.chat].mute) return reply('udah di unmute jir')
db.data.chats[m.chat].mute = false
reply('done.')
}
break
case 'restart':{
if (!itsMe) return
try {
if (!db.data.others['restarts']) {
db.data.others['restarts'] = {};
}
let { key } = await Satzz.sendMessage(m.chat, { text: `_Restarting..._` }, { quoted: m });
db.data.others['restarts'].key = key;
db.data.others['restarts'].from = m.chat;
await db.write();
await sleep(1000);
process.send('reset');
} catch (error) {
console.error('Failed to restart the bot:', error);
await Satzz.sendMessage(m.chat, { text: 'Failed to restart the bot. Please try again later.' }, { quoted: m });
}
}
break
case 'setpp':{
if (!itsMe) return
if (!/image/.test(mime)) return 
let medis = await Satzz.downloadMediaMessage(qmsg)
var { img } = await generateProfilePicture(medis);
await Satzz.query({
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
Satzz.sendMessage(m.chat, {text: 'done'},{quoted:m})
}
break
case 'jadibot':
if (!itsMe) return
await jadibot(reply,Satzz,m.chat)
break
case 'stopjadibot':
stopjadibot(reply)
break
case 'listbot':
case 'listjadibot':
text = '*「 LIST JADIBOT 」*\n\n'
for(let i of listjadibot) {
text += `*Number* : ${i.jid.split('@')[0]}
*Name* : ${i.name}\n\n`
}
reply(text)
break
case 'upsw':{
if (!itsMe) return
if (!text) return reply('mana linknya bruh❔, cth: /upsw https:///|.')
try {
let [url, caption] = text.split('|')
if (!url.startsWith('https://')) return reply('itu bukan link!')
await reply('tunggu bentar') 
let done = await Satzz.sendMessage("status@broadcast", {video: 
{url},  
caption}, 
{backgroundColor : '#315575', 
font : 3, 
statusJidList:[
"6282170988479@s.whatsapp.net",
"6281268951081@s.whatsapp.net",
"6285245801320@s.whatsapp.net",
"6282288465804@s.whatsapp.net",
"6282285378387@s.whatsapp.net",
"6282268319907@s.whatsapp.net",
"6282284413380@s.whatsapp.net",
"62895412093236@s.whatsapp.net",
"6282282886826@s.whatsapp.net",
"6287897351911@s.whatsapp.net",
"6281363434137@s.whatsapp.net",
"6285375085691@s.whatsapp.net",
"6285712130865@s.whatsapp.net",
"6281371740758@s.whatsapp.net",
"6281369266141@s.whatsapp.net",
"6282180730582@s.whatsapp.net",
"6285184383068@s.whatsapp.net",
"6285340006576@s.whatsapp.net",
"6285715318411@s.whatsapp.net",
"62895412092123@s.whatsapp.net",
"62895618712695@s.whatsapp.net",
"6282260442238@s.whatsapp.net",
"6282383618420@s.whatsapp.net",
"6281267187205@s.whatsapp.net",
"6282170891248@s.whatsapp.net",
"6282232780320@s.whatsapp.net",
"6285279045552@s.whatsapp.net",
"6282182518286@s.whatsapp.net",
"62895421544806@s.whatsapp.net",
"62895329829299@s.whatsapp.net",
"6283831735541@s.whatsapp.net",
"6282385881680@s.whatsapp.net",
"6285740584230@s.whatsapp.net",
"6282289329130@s.whatsapp.net",
"6287835476099@s.whatsapp.net",
"6282398383300@s.whatsapp.net",
"6282214927561@s.whatsapp.net",
"6282396021791@s.whatsapp.net",
"6281360981286@s.whatsapp.net",
"6281996897908@s.whatsapp.net",
"6282233951421@s.whatsapp.net",
"6281262030322@s.whatsapp.net",
"6281268248904@s.whatsapp.net",
"6283180679371@s.whatsapp.net",
"62895415497664@s.whatsapp.net",
"62895415895948@s.whatsapp.net",
"6282289737751@s.whatsapp.net",
],
broadcast : true}) 
await Satzz.sendMessage(m.chat, {text: 'done.'},{quoted:done})
} catch (e) {
reply(util.format(e)) 
}
}
break
case 'extract':
let data = JSON.parse(JSON.stringify(m.quoted)); 
const extractedNumbers = [];
if (!data.contacts || !Array.isArray(data.contacts)) {
return reply("No contacts found in the quoted message.");
}
data.contacts.forEach(contact => {
const vcard = contact.vcard;
const telMatch = vcard.match(/waid=(\d+)/);
if (telMatch) {
extractedNumbers.push(`${telMatch[1]}@s.whatsapp.net`);
}
});
if (extractedNumbers.length === 0) {
reply("No WhatsApp numbers found in the contacts.");
} else {
reply(extractedNumbers.join("\n"));
}
break;
default: 
}
}

if (m.text.startsWith("x")) {
if (!itsMe) return 
const evalAsync = () => { 
return new Promise(async (resolve, reject) => {
try {
let evaled = await eval(m.text.slice(2));
if (typeof evaled !== "string")
evaled = util.inspect(evaled);
resolve(evaled) } catch (err) { reject(err) }})};
evalAsync().then((result) => m.reply(result)).catch((err) => m.reply(String(err)));    

} else if (m.text.startsWith("$x")) {
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
return Satzz.sendButtons(global.dev, '', text, global.author, [{type:'btn',text:'INSTALL',id:`$ npm install ${module} --force`}], m)
}
console.log(chalk.bgRedBright(chalk.black("[ ERROR ]")),chalk.yellow(util.format(err)))
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