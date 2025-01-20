"use strict";
const cluster = require('cluster')
const {say} = require('cfonts')
const { join, dirname } = require('path')
const fs = require('fs')
const Readline = require('readline')
const yargs = require('yargs/yargs')
const rl = Readline.createInterface(process.stdin, process.stdout)
const { name, author } = JSON.parse(fs.readFileSync('./package.json'))
const { fileURLToPath } = require('url')




say('SatzzDev', {
font: 'block', 
align: 'center', 
gradient: ['red', 'magenta'],
});


var isRunning = false
function start(file) {
if (isRunning) return
isRunning = true
let args = [join(__dirname, file), ...process.argv.slice(2)]
cluster.setupMaster({
exec: join(__dirname, file),
args: args.slice(1),
})
let p = cluster.fork()
p.on('message', data => {
switch (data) {
case 'reset':
p.process.kill()
isRunning = false
start.apply(this, arguments)
break
case 'null':
p.process.kill()
isRunning = false
start.apply(this, arguments)
break
case 'SIGKILL':
p.process.kill()
isRunning = false
start.apply(this, arguments)
break
case 'uptime':
p.send(process.uptime())
break
}
})
p.on('exit', (_, code) => {
if(code == null) process.exit()
isRunning = false
console.error('Exited with code:', code)
if (code === 0) return
fs.watchFile(args[0], () => {
fs.unwatchFile(args[0])
start(file)
})
})
let opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
if (!opts['test'])
if (!rl.listenerCount()) rl.on('line', line => {
p.emit('message', line.trim())
})
}
start('main.js')