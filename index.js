const mineflayer = require('mineflayer');
const express = require('express');

const app = express();

// Web server simples pra Railway ver que tá “vivo”
app.get('/', (req, res) => res.send('Bot online ✅'));
const WEB_PORT = process.env.PORT || 3000;
app.listen(WEB_PORT, () => console.log('Web running on port', WEB_PORT));

// Config do seu servidor
const config = {
  host: process.env.MC_HOST || 'SquadCriativo1.aternos.me',
  port: Number(process.env.MC_PORT || 30864),
  username: process.env.MC_USER || 'Bot24horas',
  // IMPORTANTE: coloque a versão exata do seu servidor (ex: "1.21.1")
  version: process.env.MC_VERSION || '1.21.1',
  auth: 'offline' // Aternos geralmente é offline-mode (sem Microsoft). Se o seu for online-mode, isso não funciona.
};

let bot = null;
let antiAfkInterval = null;
let reconnectTimeout = null;

function startAntiAfk() {
  if (antiAfkInterval) clearInterval(antiAfkInterval);

  antiAfkInterval = setInterval(() => {
    if (!bot) return;
    try {
      // ações leves pra não cair por AFK
      bot.setControlState('jump', true);
      setTimeout(() => bot && bot.setControlState('jump', false), 250);

      // mexe a câmera
      bot.look(bot.entity.yaw + 0.3, bot.entity.pitch, true);
    } catch {}
  }, 25_000);
}

function scheduleReconnect(reason = 'unknown') {
  console.log('Reconnecting because:', reason);

  if (antiAfkInterval) clearInterval(antiAfkInterval);
  antiAfkInterval = null;

  if (reconnectTimeout) clearTimeout(reconnectTimeout);

  // tenta de novo em ~15s
  reconnectTimeout = setTimeout(() => {
    startBot();
  }, 15_000);
}

function startBot() {
  if (bot) {
    try { bot.end(); } catch {}
    bot = null;
  }

  console.log('Starting bot with:', {
    host: config.host,
    port: config.port,
    username: config.username,
    version: config.version
  });

  bot = mineflayer.createBot(config);

  bot.on('login', () => {
    console.log('✅ Logged in!');
    startAntiAfk();
  });

  bot.on('spawn', () => {
    console.log('✅ Spawned in world!');
  });

  bot.on('messagestr', (msg) => {
    // útil pra ver fila do Aternos e mensagens no log do Railway
    console.log('[CHAT]', msg);
  });

  bot.on('kicked', (reason) => {
    console.log('❌ Kicked:', reason);
    scheduleReconnect('kicked');
  });

  bot.on('end', () => {
    console.log('❌ Connection ended');
    scheduleReconnect('end');
  });

  bot.on('error', (err) => {
    console.log('❌ Error:', err?.message || err);
    scheduleReconnect('error');
  });
}

startBot();
