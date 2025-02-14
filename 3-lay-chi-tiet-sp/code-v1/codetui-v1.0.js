const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        // Truy cập trang web và đợi trang load
        await page.goto("https://www.fahasa.com", { waitUntil: "networkidle2" });

        // Đợi selector xuất hiện để đảm bảo dữ liệu đã được tải
        await page.waitForSelector(".fhs_product_basic.swiper-slide.flashsale-item", { timeout: 30000 });

        // Lấy dữ liệu sản phẩm
        const products = await page.evaluate(() => {
            return Array.from(document.querySelectorAll(".fhs_product_basic.swiper-slide.flashsale-item")).map(product => ({
                title: product.querySelector(".product-name-no-ellipsis")?.innerText.trim() || "No title",
                price: product.querySelector(".special-price")?.innerText.trim() || "No price",
                link: product.querySelector("a")?.href || "#",
                img: product.querySelector("img")?.src || "No image"
            }));
        });

        // Kiểm tra nếu không có sản phẩm nào
        if (products.length === 0) {
            throw new Error("Không tìm thấy sản phẩm nào.");
        }

        // Lưu dữ liệu vào file JSON
        fs.writeFileSync("products.json", JSON.stringify(products, null, 2), "utf-8");
        console.log("✅ Dữ liệu đã được lưu vào 'products.json'");

    } catch (error) {
        console.error("❌ Lỗi xảy ra:", error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
})();
