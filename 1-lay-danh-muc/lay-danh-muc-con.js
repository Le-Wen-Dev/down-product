const puppeteer = require("puppeteer");
const fs = require("fs");

const scrapeCategoryLinks = async (categoryUrl) => {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        // Mảng chứa tất cả các link danh mục
        let allCategoryLinks = [];

        // Truy cập vào trang danh mục cha
        await page.goto(categoryUrl, { waitUntil: "networkidle2" });

        // Lấy tất cả các link danh mục con từ class 'm-parent-category-list'
        const categoryLinks = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.m-child-category-list li a'))
                .map(a => a.href);  // Trích xuất các link danh mục con
        });

        console.log(`Tìm thấy ${categoryLinks.length} danh mục con`);

        allCategoryLinks = allCategoryLinks.concat(categoryLinks);

        // Lặp qua các danh mục con để kiểm tra nếu có thêm danh mục con cấp sâu hơn
        for (const categoryLink of categoryLinks) {
            console.log(`🔍 Đang quét danh mục con: ${categoryLink}`);
            await page.goto(categoryLink, { waitUntil: "networkidle2" });

            // Lấy các link danh mục con cấp sâu hơn
            const subCategoryLinks = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('.m-child-category-list li a'))
                    .map(a => a.href);  // Trích xuất các link danh mục con sâu hơn
            });

            console.log(`Tìm thấy ${subCategoryLinks.length} danh mục con cấp sâu`);
            allCategoryLinks = allCategoryLinks.concat(subCategoryLinks);
        }

        // Lưu danh sách link danh mục vào file JSON
        fs.writeFileSync("category_links.json", JSON.stringify(allCategoryLinks, null, 2));
        console.log("📂 Đã lưu danh sách link danh mục vào category_links.json");

        return allCategoryLinks;

    } catch (error) {
        console.error("❌ Lỗi khi lấy link danh mục:", error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

// 🟢 Thay thế URL danh mục cha ở đây
const categoryPage = "https://www.fahasa.com/all-category.html?order=num_orders&limit=24&p=1"; // Ví dụ URL của danh mục cha

scrapeCategoryLinks(categoryPage);

// code nay lay tat ca danh muc dau vao la danh muc cha dau ra la link danh muc con