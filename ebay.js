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

      await page.goto('https://www.ebay.com', { waitUntil:'load' })

      // Type into search box.
      await page.type('#gh-ac', searchTerm.searchQuery);

      await Promise.all([
        await page.click('#gh-btn'),
        await page.waitForNavigation()
      ]);
      
      const products = await page.$$('a.s-item__link');
      const iterate = parseInt(searchTerm.iterate);
      const totalProducts = iterate === -1 ? products.length : iterate;
      console.log(totalProducts);
      
      const img = 'n/a';
      
      const results = [];
      for (let i = 0; i < totalProducts; i++) { 

        await page.goto('https://www.ebay.com', { waitUntil:'load' })

        // Type into search box.
        await page.type('#gh-ac', searchTerm.searchQuery);

        await Promise.all([
          await page.click('#gh-btn'),
          await page.waitForNavigation()
        ]);
        
        const products = await page.$$('a.s-item__link');        
        const product = products[i];

        await Promise.all([
          await product.click(),
          await page.waitForNavigation()
        ]);
        
        const data = await page.evaluate(() => {
    
          let title = document.querySelector('#itemTitle').innerText; 
          let price = document.querySelector('#prcIsum').getAttribute('content'); 
          let sku = 'N/A';//document.querySelector('#detailBullets_feature_div > ul > li:nth-child(3) > span > span:nth-child(2)').innerText;
          let description =  '';
          document.querySelectorAll('.itemAttr table > tbody > tr:first-child')
                                        .forEach(
                                          (item) => {
                                            let value = item.querySelectorAll('td')[1].innerText; 
                                            description = value;
                                          }
                                        );
          let aImages = [];
          let imgUrls = aImages;
          document.querySelectorAll('#vi_main_img_fs .tdThumb img').forEach(function(img){ aImages.push(img.getAttribute('src'));});
          let category = document.querySelectorAll('.bc-w')[2].innerText;
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