const puppeteer = require("puppeteer");
const fs = require("fs");

const scrapeProductLinks = async (categoryUrl, maxPages = 5) => {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        let productLinks = [];
        let currentPage = 1;

        while (currentPage <= maxPages) {
            console.log(`🔍 Đang quét trang ${currentPage}: ${categoryUrl}`);

            await page.goto(categoryUrl, { waitUntil: "networkidle2" });

            // Lấy tất cả link có class 'product-image'
            const links = await page.evaluate(() => {
                return Array.from(document.querySelectorAll("a.product-image"))
                    .map(a => a.href) // Lấy thuộc tính href
                    .filter(href => href.startsWith("http")); // Lọc link hợp lệ
            });

            console.log(`✅ Tìm thấy ${links.length} link sản phẩm`);
            productLinks = productLinks.concat(links);

            // Tạo URL cho các trang tiếp theo (tăng từ currentPage)
            const nextPageUrl = `${categoryUrl}?p=${currentPage + 1}`;

            // Chuyển đến trang tiếp theo
            categoryUrl = nextPageUrl;  // Cập nhật URL để chuyển sang trang tiếp theo

            currentPage++;
        }

        // Lưu vào file JSON
        fs.writeFileSync("product_links.json", JSON.stringify(productLinks, null, 2));
        console.log("📂 Đã lưu danh sách link sản phẩm vào product_links.json");

        return productLinks;

    } catch (error) {
        console.error("❌ Lỗi khi lấy link sản phẩm:", error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

// 🟢 Thay link trang danh mục sản phẩm cần quét
const categoryPage = "https://www.fahasa.com/sach-trong-nuoc.html";

scrapeProductLinks(categoryPage, 10);
