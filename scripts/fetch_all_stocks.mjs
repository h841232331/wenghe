import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL = 'http://push2.eastmoney.com/api/qt/clist/get';
const PAGE_SIZE = 100;
const FIELDS = 'f12,f14';
const FS = 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23';
const PARAMS = `ut=bd1d9ddb04089700cf9c27f6f7426281&fltt=2&invt=2&fid=f3&fs=${encodeURIComponent(FS)}&fields=${FIELDS}`;

async function fetchPage(page, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const url = `${BASE_URL}?pn=${page}&pz=${PAGE_SIZE}&po=1&np=1&${PARAMS}`;
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!resp.ok) {
        console.error(`  Page ${page}: HTTP ${resp.status}, retry ${attempt + 1}/${retries}`);
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      const json = await resp.json();
      if (!json?.data?.diff) {
        console.error(`  Page ${page}: No data, retry ${attempt + 1}/${retries}`);
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      return json.data.diff.map(d => ({ code: d.f12, name: d.f14, industry: '' }));
    } catch (e) {
      console.error(`  Page ${page}: ${e.message}, retry ${attempt + 1}/${retries}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  return null;
}

async function main() {
  // First get total count
  const firstUrl = `${BASE_URL}?pn=1&pz=1&po=1&np=1&${PARAMS}`;
  console.log('Fetching total count...');
  let total = 5539; // fallback
  try {
    const firstResp = await fetch(firstUrl, { signal: AbortSignal.timeout(15000) });
    const firstJson = await firstResp.json();
    total = firstJson.data.total;
  } catch (e) {
    console.log(`Could not get total, using fallback: ${total}`);
  }
  console.log(`Total A-share stocks: ${total}`);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  console.log(`Total pages: ${totalPages}`);

  const allStocks = [];
  const seen = new Set();

  for (let page = 1; page <= totalPages; page++) {
    console.log(`Fetching page ${page}/${totalPages}...`);
    const stocks = await fetchPage(page);
    if (stocks) {
      for (const s of stocks) {
        if (!seen.has(s.code)) {
          seen.add(s.code);
          allStocks.push(s);
        }
      }
      console.log(`  Got ${stocks.length}, unique total: ${allStocks.length}`);
    } else {
      console.log(`  FAILED page ${page}, skipping`);
    }
    // Delay between pages
    const delay = page % 10 === 0 ? 2000 : 500;
    if (page < totalPages) {
      await new Promise(r => setTimeout(r, delay));
    }
  }

  // Sort by code
  allStocks.sort((a, b) => a.code.localeCompare(b.code));

  const outputPath = path.join(__dirname, '..', 'server', 'data', 'stocks.json');
  fs.writeFileSync(outputPath, JSON.stringify(allStocks));
  console.log(`\nDone! Written ${allStocks.length} stocks to ${outputPath}`);

  const prefixes = {};
  allStocks.forEach(s => {
    const p = s.code.substring(0, 3);
    prefixes[p] = (prefixes[p] || 0) + 1;
  });
  console.log('By prefix:', JSON.stringify(prefixes));
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});