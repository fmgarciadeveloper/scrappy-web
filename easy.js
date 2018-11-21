const puppeteer = require('puppeteer');

module.exports = function run (searchTerm) {
  return new Promise(async (resolve, reject) => {
    try {
      
      const browser = await puppeteer.launch(
        {
          headless: true,
        }
      );
      const page = await browser.newPage();

      page.setDefaultNavigationTimeout(0);

      await page.goto('https://www.easy.com.ar/webapp/wcs/stores/servlet/es/easyar', { waitUntil:'load' });
      
      // Type into search box.
      await page.type('#header-search input', searchTerm.searchQuery);

      await Promise.all([
        await page.click('.header-userbar-icons2'),
        await page.waitForNavigation()
      ]);
      
      // Wait for the results page to load and display the results.;
      await page.waitForSelector('.itemhover');

      // se obtiene el numero de productos para iterarlos y obtener sus datos
      const products = await page.$$('.itemhover');
      const totalProducts = products.length;

      /* const img = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('.itemhover > img'));
        return imgs[0].src; 
      }); */

      const img = 'n/a';
      
      const results = [];
      for (let i = 0; i < totalProducts; i++) { 

        await page.goto('https://www.easy.com.ar/webapp/wcs/stores/servlet/es/easyar', { waitUntil:'load' });
      
        // Type into search box.
        await page.type('#header-search input', searchTerm.searchQuery);

        await Promise.all([
          await page.click('.header-userbar-icons2'),
          await page.waitForNavigation()
        ]);
        
        // Wait for the results page to load and display the results.;
        await page.waitForSelector('.itemhover');

        // se obtiene el numero de productos para iterarlos y obtener sus datos
        const products = await page.$$('.itemhover');
        
        const product = products[i];

        await Promise.all([
          await product.click(),
          await page.waitForNavigation()
        ]);
        
        await page.waitForSelector('.navigator');
        const category = await page.$$eval('#breadcrumb > a',
          a => a[1].innerText
        );

        const result = {};
    
        await page.waitForSelector('.product-all');

        result.searchTerm = searchTerm.searchQuery;
        result.product_name = await page.$eval('.prod-title', div => div.innerText);
        result.price = await page.$eval('.price-e', span => span.innerText.trim());
        result.sku = await page.$$eval('.product-description > span.size-10', spans => spans[1].innerHTML);
        result.description = await page.$$eval('.tabs-bottomline2 > div.tabs-inner > ul.tabs-list > li:nth-child(2) > ul > li', 
          lists => {
            let description = lists.length+'###';
            for(let li of lists){
              description += li.innerHTML+',';
            }
            
            return description;
          }
        );
        
        try {
          result.price_with_discount = await page.$eval('#precio-tarj-mas > span#tarj-mas-edit', 
            (span) =>  span.innerText.trim()
          );
        }catch(e) {
          result.price_with_discount = 0.0;
        }
        
        result.imagesUrl = img; 

        result.category = category;

        results.push(result);   
        
      }
        
      browser.close();

      return resolve(results);
    } catch (e) {
      
        return reject(e);
    }
  })
}