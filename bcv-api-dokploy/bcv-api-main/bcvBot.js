// bcvBot.js — Scraping BCV con Playwright
// Usa el Chromium instalado en el sistema (vía Docker)

const { chromium } = require('playwright-core');
const { guardarValor } = require('./db');

const CHROME_PATH = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  || '/usr/bin/chromium'
  || '/usr/bin/chromium-browser';

async function actualizarValorBCV() {
  console.log('🟡 Iniciando scraping BCV...');
  console.log('🔍 Usando Chrome en:', CHROME_PATH);

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--ignore-certificate-errors',
      '--ignore-ssl-errors',
    ],
  });

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114.0.0.0 Safari/537.36',
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();

    console.log('🌐 Navegando a BCV...');
    await page.goto('https://www.bcv.org.ve/', {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    console.log('✅ Página cargada');

    const selectorUSD = '#dolar .field-content';
    const selectorEUR = '#euro .field-content';

    await page.waitForSelector(selectorUSD, { timeout: 8000 });
    await page.waitForSelector(selectorEUR, { timeout: 8000 });

    let valorUSD = 'N/A';
    let valorEUR = 'N/A';

    try {
      valorUSD = await page.$eval(selectorUSD, el =>
        el.textContent.replace(/[^\d.,]/g, '').trim()
      );
      console.log('💵 USD:', valorUSD);
    } catch (err) {
      console.error('❌ No se pudo extraer USD:', err.message);
    }

    try {
      valorEUR = await page.$eval(selectorEUR, el =>
        el.textContent.replace(/[^\d.,]/g, '').trim()
      );
      console.log('💶 EUR:', valorEUR);
    } catch (err) {
      console.error('❌ No se pudo extraer EUR:', err.message);
    }

    const usdValido = valorUSD !== 'N/A' && !isNaN(parseFloat(valorUSD.replace(',', '.')));
    const eurValido = valorEUR !== 'N/A' && !isNaN(parseFloat(valorEUR.replace(',', '.')));

    if (usdValido && eurValido) {
      guardarValor(valorUSD, valorEUR);
      console.log('✅ Valores guardados:', valorUSD, valorEUR);
    } else {
      console.warn('⚠️ Valores inválidos, no se guardarán');
    }

    return { usd: valorUSD, eur: valorEUR };

  } finally {
    await browser.close();
  }
}

module.exports = actualizarValorBCV;

if (require.main === module) {
  actualizarValorBCV()
    .then(v => console.log('Resultado:', v))
    .catch(e => console.error('Error:', e.message));
}
