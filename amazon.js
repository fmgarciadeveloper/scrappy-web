const puppeteer = require('puppeteer');

module.exports = function run (searchTerm) {
  return new Promise(async (resolve, reject) => {
    try {
      
      const browser = await puppeteer.launch(
        {
          headless: false,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--single-process'
          ],
        }
      );
      const page = await browser.newPage();

      page.setDefaultNavigationTimeout(0);

      await page.goto('https://www.amazon.com', { waitUntil:'load' });
      await page.type('#twotabsearchtextbox', searchTerm.searchQuery);
      
      await Promise.all([
        await page.click('input.nav-input'),
        await page.waitForNavigation()
      ]);
      
      await page.waitForSelector('#resultsCol')

      // se obtiene el numero de productos para iterarlos y obtener sus datos
      const products = await page.$$('a.a-link-normal.a-text-normal');
      const totalProducts = 2;//products.length;

      const img = 'n/a';
      
      const results = [];
      for (let i = 0; i < totalProducts; i++) { 

        await page.goto('https://www.amazon.com', { waitUntil:'load' });
        await page.type('#twotabsearchtextbox', searchTerm.searchQuery);
        
        await Promise.all([
          await page.click('input.nav-input'),
          await page.waitForSelector('#resultsCol')
        ]);
        
        // se obtiene el numero de productos para iterarlos y obtener sus datos
        const products = await page.$$('a.a-link-normal.a-text-normal');
        
        const product = products[i];

        await Promise.all([
          await product.click(),
          await page.waitForNavigation()
        ]);
        
        /* await page.waitForSelector('.navigator');
        const category = await page.$$eval('#breadcrumb > a',
          a => a[1].innerText
        ); */

        const result = {};
        result.searchTerm = searchTerm.searchQuery;
                
        const data = await page.evaluate(() => {
    
          let title = document.querySelector('#productTitle').innerText; 
          let price = document.querySelector('#priceblock_ourprice').innerText; 
          let sku = document.querySelector('#detailBullets_feature_div > ul > li:nth-child(3) > span > span:nth-child(2)').innerText;
          let description = document.querySelectorAll('#productDescription > p')[0].innerText;
          let imgUrls = [];
          document.querySelectorAll('#altImages .a-button-inner > .a-button-text > img').forEach(function(img){ imgUrls.push(img.getAttribute('src'));});
          
          return {
            title,
            price,
            sku,
            description,
            imgUrls
          };
        });

        result.searchTerm = searchTerm.searchQuery;
        result.product_name = data.title;
        result.price = data.price;
        result.sku = data.sku;
        result.description = data.description;
        result.price_with_discount = 0.0;        
        result.imagesUrl = data.imgUrls; 
        result.category = searchTerm.searchQuery;

        results.push(result);   
        
      }
        
      browser.close();
      console.log('TOTAL FILES '+ results.length);
      return resolve(results);
    } catch (e) {
        console.log('MERCADO_LIBRE :'+e);
        return reject(e);
    }
  })
}