process.on('uncaughtException',console.error)
require('./config')
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
const fs = require('fs')
const pino = require('pino')
const chalk = require('chalk')
const path = require('path')
const readline = require("readline");
const axios = require('axios')
const FileType = require('file-type')
const figlet = require("figlet")
const yargs = require('yargs/yargs')
const NodeCache = require('node-cache')
let { handler } = require('./handler.js')
const _ = require('lodash')
const { Boom } = require('@hapi/boom')
const { exec, spawn } = require('child_process');
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, sleep, pickRandom } = require('./lib/myfunc')
const { Socket, smsg } = require("./lib/simple")
const syntaxerror = require('syntax-error')



var low = require('./lib/lowdb')
const { Low, JSONFile } = low
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.db = new Low(new JSONFile(`./src/database.json`))
global.DATABASE = global.db // Backwards Compatibility
global.loadDatabase = async function loadDatabase() {
if (global.db.READ) return new Promise((resolve) => setInterval(function () { (!global.db.READ ? (clearInterval(this), resolve(global.db.data == null ? global.loadDatabase() : global.db.data)) : null) }, 1 * 1000))
if (global.db.data !== null) return
global.db.READ = true
await global.db.read()
global.db.READ = false
global.db.data = {
users: {},
chats: {},
database: {},
settings: {},
others: {},
restart: {},
...(global.db.data || {})}
global.db.chain = _.chain(global.db.data)}
loadDatabase()
if (global.db)
// WRITE DATABASE EVERY 100 MILISECONDS
setInterval(async () => { if (global.db.data) await global.db.write() }, 1 * 100);



setInterval(() => {
const directoryPath = path.join(__dirname, ".");
fs.readdir(directoryPath, (err, files) => {
if (err) {
console.error(chalk.red(`[ERROR] Reading directory failed: ${err.message}`));
return;
}
const trashFiles = files.filter((file) => ["jpeg", "gif", "png", "mp3", "mp4", "jpg", "webp", "webm", "zip"].some((ext) => file.endsWith(ext)));
if (trashFiles.length > 0) {
console.log(chalk.green("[CLEANUP]"),chalk.cyanBright(`${trashFiles.length} trash files.`));
trashFiles.forEach((file) => {
const filePath = path.join(directoryPath, file);
fs.unlink(filePath, (err) => {
if (err) {
console.log(chalk.green("[CLEANUP]"),chalk.cyanBright(`Error Deleting file ${filePath} failed: ${err.message}`));
} else {
console.log(chalk.green("[CLEANUP]"),chalk.cyanBright(`Deleted file: ${filePath}`));
}
});
});
} else {
console.log(chalk.green("[CLEANUP]"),chalk.cyanBright("No trash files detected."));
}
});
}, 30_000);





const connectToWhatsApp = async () => {
const { state, saveCreds } = await useMultiFileAuthState(global.sessionName)
const { version, isLatest } = await fetchLatestBaileysVersion()
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
const auth = { creds: state.creds,keys: makeCacheableSignalKeyStore(state.keys, pino().child({ level: 'silent', stream: 'store' })) }
const msgRetryCounterCache = new NodeCache()
const getMessage = async (key) => {
if (store) {
const msg = await store.loadMessage(key.remoteJid, key.id, undefined);
return msg?.message || undefined;
}
return {conversation: "halo, sayang!"};
};
const connectionOptions = {
version: [ 2, 3000, 1015901307 ],
logger: pino({ level: "silent" }),
printQRInTerminal: false,
mobile: false,
auth,
browser: Browsers.windows('Chrome'), // Else Put This  ["SatzzDev.", "Chrome", "20.0.04"] browser: ["Ubuntu", "Chrome", "20.0.04"], Don't Remove this commented,
getMessage,
MessageRetryMap,
msgRetryCounterCache,
keepAliveIntervalMs: 20000,
syncFullHistory: true,
defaultQueryTimeoutMs: undefined, // for this issues https://github.com/WhiskeySockets/Baileys/issues/276
keepAliveIntervalMs: 20000,
defaultQueryTimeoutMs: 20000,
connectTimeoutMs: 30000,
fireInitQueries: true,
emitOwnEvents: false,
generateHighQualityLinkPreview: true,
markOnlineOnConnect: true,
}

const SatzzDev = Socket(connectionOptions)
  

if (!SatzzDev.authState.creds.registered) {
const requestPairingCode = () => {
return new Promise(async (resolve, reject) => {
try {
setTimeout(async () => {
let code = await SatzzDev.requestPairingCode('6282170988479');
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
.then((code) => console.log(`Pairing Code Retrieved: ${code}`))
.catch((err) => console.error('Failed to retrieve pairing code:', err));
}
    
store?.bind(SatzzDev.ev)  
SatzzDev.ev.process(async(events) => {


// connection UPDATE
if (events['connection.update']) {
const update = events['connection.update']
const { receivedPendingNotifications, connection, lastDisconnect, isOnline, isNewLogin } = update
if (isNewLogin) SatzzDev.isInit = true
if (connection == 'connecting') console.log(chalk.green("[ SYSTEM ]"),chalk.yellowBright('Connecting...'))
if (connection == 'open') {
console.log(chalk.green("[ SYSTEM ]"),chalk.cyanBright('Connected!'))
try {
const bot = db.data.others['restarts'];
if (bot) {
const { key, from } = bot;
await SatzzDev.sendMessage(from, { text: 'bot has been restarted ✅', edit: key });
delete db.data.others['restarts'];
loadDatabase()
}
} catch (error) {
console.error('Failed to handle post-restart operations:', error);
}
}
if (isOnline == false) console.log(chalk.red('Offline'))
if (connection == 'close') console.log(chalk.green("[ SYSTEM ]"),chalk.red('connection lost, trying to reconnect...'))
if (lastDisconnect && lastDisconnect.error && lastDisconnect.error.output && lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut) {
connectToWhatsApp()
} 
if (db.data == null) await loadDatabase()
}
// CREDS UPDATE
if (events['creds.update']) { 
await saveCreds()
}   
// RECEIVE NEW MESSAGE
if (events['messages.upsert']) {
const chatUpdate = events['messages.upsert']
if (global.db.data) await global.db.write() 
let m = chatUpdate.messages[0] || chatUpdate.messages[chatUpdate.messages.length - 1]
if (!m.message) return
if (m.key.id.startsWith('BAE5') && m.key.id.length === 16) return
if (m.key.remoteJid.endsWith("@status@broadcast")) {
SatzzDev.readMessages([m.key])
}
m = await smsg(SatzzDev, m, store)
handler(SatzzDev, m, chatUpdate, store)
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
await SatzzDev.sendButtons(kopel.from, '*`AUTO REJECT`*', 'Satzz is currently busy. Please avoid calling and wait for a response. Thank you.', global.footer, [{type:'btn', text:'Okay.', id:'s'}],keyF)
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
})   
return SatzzDev
}


connectToWhatsApp()
