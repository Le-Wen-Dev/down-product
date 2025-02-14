const puppeteer = require("puppeteer");
const fs = require("fs");

const scrapeProductLinks = async (categoryUrl, maxPages = 5) => {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        let productLinks = [];
        let currentPage = 1;
        let fileIndex = 1; // Khởi tạo chỉ số file

        while (currentPage <= maxPages) {
            console.log(`🔍 Đang quét trang ${currentPage}: ${categoryUrl}`);

            // Đi đến trang kết quả tìm kiếm
            await page.goto(categoryUrl, { waitUntil: "domcontentloaded" });

            // Đợi các phần tử 'a.product-image' có mặt trên trang
            await page.waitForSelector(".product.images-container a", { visible: true });

            // Lấy tất cả link có class 'product-image' từ thẻ <a>
            const links = await page.evaluate(() => {
                return Array.from(document.querySelectorAll(".product.images-container a"))
                    .map(a => {
                        const relativeUrl = a.getAttribute('href'); // Lấy URL tương đối
                        // Chuyển đổi thành URL tuyệt đối
                        return new URL(relativeUrl, window.location.origin).href;
                    })
                    .filter(href => href.startsWith("http")); // Đảm bảo chỉ lấy các link hợp lệ
            });

            console.log(`✅ Tìm thấy ${links.length} link sản phẩm`);

            // Gộp các link tìm được vào danh sách hiện tại mà không ghi đè
            productLinks = [...productLinks, ...links]; // Hoặc productLinks = productLinks.concat(links);

            // Tạo URL cho các trang tiếp theo (tăng từ currentPage)
            const nextPageUrl = `${categoryUrl}?p=${currentPage + 1}`;

            // Cập nhật URL để quét trang tiếp theo
            categoryUrl = nextPageUrl;  // Cập nhật URL để chuyển sang trang tiếp theo

            currentPage++;
        }

        // Kiểm tra xem file có tồn tại không, nếu có thì tăng chỉ số lên
        let fileName = `product-link${fileIndex}.json`;

        while (fs.existsSync(fileName)) {
            fileIndex++;
            fileName = `product-link${fileIndex}.json`;
        }

        // Lưu vào file mới với tên đã tạo
        fs.writeFileSync(fileName, JSON.stringify(productLinks, null, 2));
        console.log(`📂 Đã lưu danh sách link sản phẩm vào ${fileName}`);

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
const categoryPage = "https://www.fahasa.com/searchengine?q=babythree&size=n_48_n";

scrapeProductLinks(categoryPage, 1);
