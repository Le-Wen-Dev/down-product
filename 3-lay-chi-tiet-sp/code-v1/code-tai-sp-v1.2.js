const puppeteer = require("puppeteer");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Hàm tải ảnh về thư mục
const downloadImage = async (url, folder, filename) => {
    try {
        const response = await axios({
            url,
            responseType: "stream"
        });

        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }

        const filePath = path.join(folder, filename);
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on("finish", () => {
                console.log(`✅ Tải thành công: ${filename}`);
                resolve();
            });
            writer.on("error", reject);
        });
    } catch (error) {
        console.error(`❌ Lỗi tải ảnh ${filename}:`, error.message);
    }
};

// Hàm thu thập và tải ảnh sản phẩm
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

        // Tạo thư mục con image trong thư mục sản phẩm
        const imagesFolderPath = path.join(productFolder, "images");
        if (!fs.existsSync(imagesFolderPath)) {
            fs.mkdirSync(imagesFolderPath, { recursive: true });
        }

        // Tải ảnh về vào thư mục ảnh
        for (let i = 0; i < imageUrls.length; i++) {
            const ext = path.extname(new URL(imageUrls[i]).pathname).split("?")[0] || ".jpg";
            await downloadImage(imageUrls[i], imagesFolderPath, `image_${i + 1}${ext}`);
        }

        console.log(`🎉 Hoàn tất! Ảnh được lưu tại: ${imagesFolderPath}`);

        // Thu thập thêm thông tin sản phẩm
        const productInfo = await page.evaluate(() => {
            const title = document.querySelector(".fhs_name_product_desktop")?.innerText.trim();

            // Lấy giá sản phẩm hiện tại
            const price = document.querySelector(".price-box .special-price .price")?.innerText.trim();

            // Lấy giá cũ
            const oldPrice = document.querySelector(".price-box .old-price .price")?.innerText.trim();

            // Lấy phần trăm giảm giá
            const discount = document.querySelector(".price-box .old-price .discount-percent")?.innerText.trim();

            const quantity = document.querySelector(".btn-subtract-qty")?.innerText.trim();
            const productDetails = document.querySelector(".block-content-product-detail.block-info-detail-mobile")?.innerText.trim();
            const description = document.querySelector(".block-content-product-detail.block-info-detail-2-mobile")?.innerText.trim();

            return {
                title,
                price,
                oldPrice,
                discount,
                quantity,
                productDetails,
                description
            };
        });

        console.log(`📄 Thông tin sản phẩm: `);
        console.log(productInfo);

        // Lưu thông tin sản phẩm vào file JSON trong thư mục sản phẩm
        const jsonFilePath = path.join(productFolder, "product.json");
        fs.writeFileSync(jsonFilePath, JSON.stringify(productInfo, null, 2), "utf-8");
        console.log(`✅ Đã lưu thông tin sản phẩm vào file ${jsonFilePath}`);

        return productInfo; // Trả về thông tin sản phẩm

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

        // Thu thập và lưu ảnh, thông tin sản phẩm vào thư mục riêng
        await scrapeProductImages(url, productFolder);
    }

    console.log("🎉 Hoàn tất quá trình thu thập thông tin tất cả sản phẩm!");
};

// 🟢 Thay danh sách các liên kết sản phẩm cần quét
const productLinks = [
    "https://www.fahasa.com/nguoi-dan-ong-mang-ten-ove-tai-ban.html?fhs_campaign=CATEGORY",
    "https://www.fahasa.com/goc-nho-co-nang.html?fhs_campaign=CATEGORY"
    // Thêm các liên kết khác vào đây
];

// Lấy thông tin và tải ảnh cho tất cả sản phẩm
scrapeMultipleProducts(productLinks);
