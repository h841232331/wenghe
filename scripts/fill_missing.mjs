import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL = 'http://push2.eastmoney.com/api/qt/clist/get';
const PAGE_SIZE = 100;
const FIELDS = 'f12,f14';
const FS = 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23';
const PARAMS = `ut=bd1d9ddb04089700cf9c27f6f7426281&fltt=2&invt=2&fid=f3&fs=${encodeURIComponent(FS)}&fields=${FIELDS}`;

async function fetchPage(page) {
  const url = `${BASE_URL}?pn=${page}&pz=${PAGE_SIZE}&po=1&np=1&${PARAMS}`;
  const resp = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const json = await resp.json();
  if (!json?.data?.diff) throw new Error('No data');
  return json.data.diff.map(d => ({ code: d.f12, name: d.f14, industry: '' }));
}

async function retryWithDelay(page, maxRetries = 8, delayMs = 3000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const stocks = await fetchPage(page);
      console.log(`  Page ${page}: SUCCESS (${stocks.length} stocks)`);
      return stocks;
    } catch (e) {
      console.log(`  Page ${page}: ${e.message}, attempt ${i + 1}/${maxRetries}`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  return null;
}

async function main() {
  const cachePath = path.join(__dirname, '..', 'server', 'data', 'stocks.json');
  const existing = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
  const seen = new Set(existing.map(s => s.code));
  const allStocks = [...existing];
  
  console.log(`Existing: ${allStocks.length} stocks`);
  console.log(`Target: 5539, missing: ${5539 - allStocks.length}`);

  const missingPages = [21, 36, 39, 53];

  for (const page of missingPages) {
    console.log(`\n--- Retrying page ${page} ---`);
    const stocks = await retryWithDelay(page);
    if (stocks) {
      let added = 0;
      for (const s of stocks) {
        if (!seen.has(s.code)) {
          seen.add(s.code);
          allStocks.push(s);
          added++;
        }
      }
      console.log(`  Added ${added} new stocks, total now: ${allStocks.length}`);
    }
  }

  allStocks.sort((a, b) => a.code.localeCompare(b.code));
  fs.writeFileSync(cachePath, JSON.stringify(allStocks));
  console.log(`\nFinal: ${allStocks.length} stocks`);
}

main().catch(e => { console.error(e.message); process.exit(1); });