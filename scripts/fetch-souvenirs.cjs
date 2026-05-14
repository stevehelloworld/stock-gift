const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const URL = 'https://histock.tw/stock/gift.aspx';
const OUTPUT_PATH = path.join(__dirname, '../src/data/souvenirs.json');

async function fetchSouvenirs() {
  console.log('Fetching data from HiStock...');
  try {
    const { data } = await axios.get(URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const $ = cheerio.load(data);
    const souvenirs = [];

    // Target both tables: #CPHB1_gv (Not expired) and #CPHB1_gvOld (Expired)
    $('#CPHB1_gv tr, #CPHB1_gvOld tr').each((i, el) => {
      const cols = $(el).find('td');
      if (cols.length < 8) return; // Skip headers or rows with too few columns

      const stockCode = $(cols[0]).text().trim();
      const stockName = $(cols[1]).text().trim();
      
      // Column Indices (0-based):
      // 0: Code, 1: Name, 2: Price, 3: LastBuyDate, 4: MeetingDate, 5: Type, 6: Location, 7: Souvenir, 8: OddLot, 9: Agent, 10: Phone
      const lastBuyDate = $(cols[3]).text().trim();
      const meetingDate = $(cols[4]).text().trim();
      const type = $(cols[5]).text().trim();
      const location = $(cols[6]).text().trim();
      const souvenir = $(cols[7]).text().trim();
      const oddLot = $(cols[8]).text().trim();
      const agent = $(cols[9]).text().trim();
      const phone = $(cols[10]).text().trim();

      if (stockCode && stockCode !== '代號') {
        souvenirs.push({
          code: stockCode,
          name: stockName,
          lastBuyDate,
          meetingDate,
          type,
          location,
          souvenir,
          oddLot,
          agent,
          phone
        });
      }
    });

    console.log(`Successfully fetched ${souvenirs.length} souvenirs.`);
    
    // Deduplicate if necessary (unlikely given the IDs but good practice)
    const uniqueSouvenirs = Array.from(new Map(souvenirs.map(item => [item.code, item])).values());
    
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(uniqueSouvenirs, null, 2));
    console.log(`Data saved to ${OUTPUT_PATH}`);
  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
}

fetchSouvenirs();
