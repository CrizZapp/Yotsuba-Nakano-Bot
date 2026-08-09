import os from 'os';
import config from '../../config.js';

const ping = async (m, { conn, from }) => {

    // ==========================================
    // ⏱️ MEDIR RESPUESTA
    // ==========================================

    const inicio = Date.now();

    const mensaje = await m.reply(
        '⭐️ *Calculando latencia...* ⏳'
    );

    const latencia = Date.now() - inicio;

    // ==========================================
    // 🧠 TIEMPO DE PROCESAMIENTO
    // ==========================================

    const inicioProceso = process.hrtime.bigint();

    // Operación mínima para medir el proceso del Node
    let calculo = 0;

    for (let i = 0; i < 10000; i++) {
        calculo += i;
    }

    const finProceso = process.hrtime.bigint();

    const procesamiento =
        Number(finProceso - inicioProceso) / 1000000;

    // ==========================================
    // 📶 ESTADO
    // ==========================================

    let estado;

    if (latencia < 100) {
        estado = '🚀 Excelente';
    } else if (latencia < 300) {
        estado = '⚡ Veloz';
    } else if (latencia < 600) {
        estado = '🟡 Normal';
    } else if (latencia < 1000) {
        estado = '🟠 Lento';
    } else {
        estado = '🔴 Muy lento';
    }

    // ==========================================
    // 💾 RAM
    // ==========================================

    const memoriaTotal = os.totalmem();
    const memoriaLibre = os.freemem();
    const memoriaUsada = memoriaTotal - memoriaLibre;

    const ramUsada =
        (memoriaUsada / 1024 / 1024 / 1024).toFixed(2);

    const ramTotal =
        (memoriaTotal / 1024 / 1024 / 1024).toFixed(2);

    const ramPorcentaje =
        ((memoriaUsada / memoriaTotal) * 100).toFixed(1);

    // ==========================================
    // ⏱️ UPTIME
    // ==========================================

    const uptime = process.uptime();

    const horas = Math.floor(uptime / 3600);
    const minutos = Math.floor((uptime % 3600) / 60);
    const segundos = Math.floor(uptime % 60);

    // ==========================================
    // 📝 RESULTADO
    // ==========================================

    const texto =
        `⭐️ *Pong!* 🏓\n\n` +
        `> ⚡ *Respuesta:* ${latencia} ms\n` +
        `> 🧠 *Procesamiento:* ${procesamiento.toFixed(2)} ms\n` +
        `> 📶 *Estado:* ${estado}\n` +
        `> 💾 *RAM:* ${ramUsada} GB / ${ramTotal} GB (${ramPorcentaje}%)\n` +
        `> ⏱️ *Uptime:* ${horas}h ${minutos}m ${segundos}s\n` +
        `> 🖥️ *Node:* ${process.version}\n\n` +
        `${config.botName}`;

    // ==========================================
    // ✏️ EDITAR MENSAJE
    // ==========================================

    if (mensaje && mensaje.key) {

        try {

            await conn.sendMessage(
                from,
                {
                    text: texto,
                    edit: mensaje.key
                }
            );

        } catch {

            await m.reply(texto);
        }

    } else {

        await m.reply(texto);
    }
};

ping.command = ['ping'];

ping.description =
    'Muestra la latencia, rendimiento y estado del bot.';

export default ping;