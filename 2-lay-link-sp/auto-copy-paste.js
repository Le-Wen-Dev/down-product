const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Đọc danh sách link từ file JSON
    const links = JSON.parse(fs.readFileSync('product_links.json', 'utf-8'));

    for (const link of links) {
        if (!link) continue;

        console.log(`📌 Đang xử lý: ${link}`);

        // 1️⃣ Tìm kiếm sản phẩm trên Google
        await page.goto('https://www.google.com/');
        await page.type('input[name="q"]', link);
        await page.keyboard.press('Enter');
        await page.waitForNavigation();

        // 2️⃣ Lấy thông tin sản phẩm từ kết quả đầu tiên
        const productInfo = await page.evaluate(() => {
            const title = document.querySelector('h3')?.innerText || 'Không tìm thấy';
            const price = document.querySelector('.e10twf')?.innerText || 'Chưa có giá';
            return { title, price };
        });

        console.log(`🔍 Tìm thấy sản phẩm: ${productInfo.title} - Giá: ${productInfo.price}`);

        // 3️⃣ Mở trang Haravan để up sản phẩm
        await page.goto('https://fabico-3.myharavan.com/admin/products_new');
        await page.waitForSelector('input[name="title"]');

        // 4️⃣ Nhập thông tin sản phẩm vào Haravan
        await page.type('input[name="title"]', productInfo.title);
        await page.type('input[name="price"]', productInfo.price);
        console.log('✅ Đã nhập thông tin vào Haravan.');

        await page.waitForTimeout(2000); // Chờ trước khi xử lý sản phẩm tiếp theo
    }

    console.log('🎉 Hoàn thành!');
    await browser.close();
})();
