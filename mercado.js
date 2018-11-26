const puppeteer = require('puppeteer');

module.exports = function run (searchTerm) {
  return new Promise(async (resolve, reject) => {
    try {
      
      const browser = await puppeteer.launch(
        {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            //'--single-process'
          ],
        }
      );
      const page = await browser.newPage();

      page.setDefaultNavigationTimeout(0);

      await page.goto('https://www.mercadolibre.com.ar/', { waitUntil:'load' })

      // Type into search box.
      await page.type('input.nav-search-input', searchTerm.searchQuery);

      await Promise.all([
        await page.click('.nav-search-btn'),
        await page.waitForNavigation()
      ]);

      await page.waitForSelector('#results-section');
      
      const products = await page.$$('.item-link.item__js-link')
      console.log(products.length);
      const iterate = parseInt(searchTerm.iterate);
      const totalProducts = iterate === -1 ? products.length : iterate;
      console.log(totalProducts);
      
      const img = 'n/a';
      
      const results = [];
      for (let i = 0; i < totalProducts; i++) { 

        await page.goto('https://www.mercadolibre.com.ar/', { waitUntil:'load' })

        // Type into search box.
        await page.type('input.nav-search-input', searchTerm.searchQuery);

        await Promise.all([
          await page.click('.nav-search-btn'),
          await page.waitForNavigation()
        ]);
        
        const products = await page.$$('.item-link.item__js-link')      
        const product = products[i];

        await Promise.all([
          await product.click(),
          await page.waitForNavigation()
        ]);

        const data = await page.evaluate(() => {
    
          let title = document.querySelector('.item-title__primary').innerText; 
          let price = document.querySelector('.price-tag > .price-tag-symbol').getAttribute('content'); 
          let sku = 'N/A';
          let description =  document.querySelector('.item-description__text').innerText;
          let aImages = [];
          let imgUrls = aImages;
          document.querySelectorAll('.gallery__thumbnail > img').forEach(function(img){ aImages.push(img.getAttribute('src'));});
          let category = document.querySelectorAll('.vip-navigation-breadcrumb-list > li')[0].innerText
          return {
            title,
            price,
            sku,
            description,
            imgUrls,
            category
          };
        });
            
        const result = {};
        result.searchTerm = searchTerm.searchQuery;
        result.product_name = data.title;
        result.price = data.price;
        result.sku = data.sku;
        result.description = data.description;
        result.price_with_discount = 0.0;
        result.imagesUrl = data.imgUrls;
        result.category = data.category;

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