const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

// Hàm thu thập link ảnh sản phẩm
const scrapeProductImages = async (productUrl, productFolder) => {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        console.log(`🔍 Đang truy cập: ${productUrl}`);
        await page.goto(productUrl, { waitUntil: "networkidle2" });

        // Tìm ảnh chính và ảnh phụ
        const imageUrls = await page.evaluate(() => {
            let images = [];

            // Ảnh chính
            const mainImage = document.querySelector(".product-view-image-product .fhs_img_frame_container img");
            if (mainImage) images.push(mainImage.src);

            // Ảnh phụ (gallery, thumbnails)
            const extraImages = Array.from(document.querySelectorAll(".lightgallery img, .include-in-gallery img"))
                .map(img => img.src);
            images = images.concat(extraImages);

            return images.filter(url => url); // Loại bỏ ảnh null
        });

        console.log(`📸 Tìm thấy ${imageUrls.length} ảnh`);

        if (imageUrls.length === 0) {
            throw new Error("Không tìm thấy ảnh sản phẩm.");
        }

        // Thu thập thêm thông tin sản phẩm
        const productInfo = await page.evaluate(() => {
            const title = document.querySelector(".fhs_name_product_desktop")?.innerText.trim();
            const price = document.querySelector(".price-box .special-price .price")?.innerText.trim();
            const oldPrice = document.querySelector(".price-box .old-price .price")?.innerText.trim();
            const discount = document.querySelector(".price-box .old-price .discount-percent")?.innerText.trim();
            const quantity = document.querySelector(".btn-subtract-qty")?.innerText.trim();
            const productDetails = document.querySelector(".block-content-product-detail.block-info-detail-mobile")?.innerText.trim();
            const description = document.querySelector(".block-content-product-detail.block-info-detail-2-mobile")?.innerText.trim();
            const sku = document.querySelector(".data_0 div.attribute_link_container")?.innerText.trim(); // Lấy mã hàng SKU

            return {
                title,
                price,
                oldPrice,
                discount,
                quantity,
                productDetails,
                description,
                sku // Thêm mã hàng vào kết quả
            };
        });

        // Lưu thông tin sản phẩm vào file JSON
        const jsonFilePath = path.join(productFolder, "product.json");
        fs.writeFileSync(jsonFilePath, JSON.stringify({ ...productInfo, images: imageUrls }, null, 2), "utf-8");
        console.log(`✅ Đã lưu thông tin sản phẩm vào file ${jsonFilePath}`);

        return { ...productInfo, images: imageUrls }; // Trả về thông tin sản phẩm cùng danh sách ảnh

    } catch (error) {
        console.error("❌ Lỗi xảy ra:", error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

// Hàm quét thông tin sản phẩm từ nhiều liên kết
const scrapeMultipleProducts = async (productUrls) => {
    for (const [index, url] of productUrls.entries()) {
        const productFolder = path.join(__dirname, `sanpham${index + 1}`);
        if (!fs.existsSync(productFolder)) {
            fs.mkdirSync(productFolder, { recursive: true });
        }

        // Thu thập thông tin sản phẩm và link ảnh
        await scrapeProductImages(url, productFolder);
    }

    console.log("🎉 Hoàn tất quá trình thu thập thông tin tất cả sản phẩm!");
};

// 🟢 Thay danh sách các liên kết sản phẩm cần quét
const productLinks = [
    "https://www.fahasa.com/baby-three-the-gioi-dieu-ky.html?fhs_campaign=SEARCH",
];

// Lấy thông tin và link ảnh cho tất cả sản phẩm
scrapeMultipleProducts(productLinks);
