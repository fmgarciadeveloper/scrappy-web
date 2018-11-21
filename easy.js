const puppeteer = require('puppeteer');
const rabbitmq = require('./rabbitmq');

module.exports = function run (searchTerm) {
  return new Promise(async (resolve, reject) => {
    try {

      const browser = await puppeteer.launch({headless: true});
      const page = await browser.newPage();

      page.setDefaultNavigationTimeout(0);

      await page.goto('https://www.easy.com.ar/webapp/wcs/stores/servlet/es/easyar', { waitUntil:'load' });

      // Type into search box.
      await page.type('#header-search input', searchTerm.searchQuery);

      await Promise.all([
        await page.click('.header-userbar-icons2'),
        await page.waitForNavigation()
      ]);

      await page.waitForSelector('#breadcrumb');
      const breadcrumb = await page.$$eval('#breadcrumb > .breadcrumb_links > a',
        a => a[1].innerText
      );

      // Wait for the results page to load and display the results.;
      //await page.waitForSelector('.itemhover');

      //const products = await page.$$('.itemhover');

      const img = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('.itemhover > img'));
        return imgs[0].src; 
      });
     
      for (let i = 0; i < 1; i++) { 

        // Wait for the results page to load and display the results.;
        //await page.waitForSelector('.itemhover');

        const products = await page.$$('.itemhover');
        
        const product = products[i];

        await Promise.all([
          await product.click(),
          await page.waitForNavigation()
        ]);
    
        await page.waitForSelector('.product-all');

        const result = {};
        result.searchTerm = searchTerm;
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

        result.price_with_discount = await page.$eval('#precio-tarj-mas > span#tarj-mas-edit', 
          (span) => {
            if(span){
              return span.innerText.trim();
            }else{
              return "0.0";
            }
          }
        );
        result.imagesUrl = img; 
        result.cateroy = breadcrumb;
                
        /* await page.goto('https://www.easy.com.ar/webapp/wcs/stores/servlet/es/easyar', { waitUntil:'load' });

        // Type into search box.
        await page.type('#header-search input', 'Lavarropas');
        await Promise.all([
          await page.click('.header-userbar-icons2'),
          await page.waitForNavigation()
        ]); 
        await page.waitForSelector('.itemhover'); */

      }
        
      browser.close();

      //rabbitmq.publishStatus(searchTerm, 'processed');

      return resolve(result);
    } catch (e) {
        return reject(e);
    }
  })
}