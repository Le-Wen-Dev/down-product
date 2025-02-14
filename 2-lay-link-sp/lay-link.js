const puppeteer = require("puppeteer");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

// Hàm lấy tất cả các liên kết sản phẩm từ một trang web
const getProductLinksFromPage = async (url) => {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        // Tìm tất cả các liên kết sản phẩm trong thẻ <h2 class="product-name-no-ellipsis p-name-list">
        const links = [];
        $("h2.product-name-no-ellipsis.p-name-list a").each((index, element) => {
            const link = $(element).attr("href");
            if (link) {
                links.push(link);
            }
        });

        return links;
    } catch (error) {
        console.error(`❌ Lỗi khi lấy các link từ trang ${url}:`, error.message);
        return [];
    }
};

// Hàm lấy link của trang tiếp theo
const getNextPageLink = ($) => {
    // Tìm link của trang tiếp theo
    const nextPage = $("a.next").attr("href"); // Hoặc class khác nếu có
    return nextPage ? nextPage : null;
};

// Hàm quét các sản phẩm từ tất cả các trang
const scrapeAllProductLinks = async (startUrl) => {
    let browser;
    let allProductLinks = [];
    try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        let currentPageUrl = startUrl;
        let hasNextPage = true;

        while (hasNextPage) {
            console.log(`🔗 Đang quét trang: ${currentPageUrl}`);
            await page.goto(currentPageUrl, { waitUntil: "networkidle2" });

            // Lấy các link sản phẩm từ trang hiện tại
            const productLinks = await getProductLinksFromPage(currentPageUrl);
            allProductLinks = allProductLinks.concat(productLinks);
            console.log(`Tìm thấy ${productLinks.length} liên kết sản phẩm trên trang ${currentPageUrl}`);

            // Tìm trang tiếp theo
            const nextPageUrl = await page.evaluate(() => {
                const nextPageLink = document.querySelector("a.next");
                return nextPageLink ? nextPageLink.href : null;
            });

            if (nextPageUrl) {
                currentPageUrl = nextPageUrl; // Chuyển sang trang tiếp theo
            } else {
                hasNextPage = false; // Không còn trang tiếp theo
            }
        }

        console.log(`✅ Đã quét tất cả sản phẩm. Tổng số liên kết sản phẩm: ${allProductLinks.length}`);

        // Lưu danh sách link vào file JSON
        const filePath = path.join(__dirname, "product_links.json");
        fs.writeFileSync(filePath, JSON.stringify(allProductLinks, null, 2), "utf-8");
        console.log(`✅ Đã lưu ${allProductLinks.length} liên kết sản phẩm vào file ${filePath}`);

        return allProductLinks;
    } catch (error) {
        console.error("❌ Lỗi quét các link:", error.message);
        return [];
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

// 🟢 Thay thế bằng URL của trang danh mục nơi chứa các liên kết sản phẩm
const startUrl = "https://www.fahasa.com/sach-trong-nuoc.html"; // Thay URL theo nhu cầu

scrapeAllProductLinks(startUrl);
