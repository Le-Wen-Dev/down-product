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
const scrapeProductImages = async (productUrl) => {
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

        // Lấy tên sản phẩm để đặt tên thư mục
        const productName = await page.evaluate(() => document.title.trim().replace(/[/\\?%*:|"<>]/g, ""));
        const folderPath = path.join(__dirname, "images", productName);

        // Tải ảnh về
        for (let i = 0; i < imageUrls.length; i++) {
            const ext = path.extname(new URL(imageUrls[i]).pathname).split("?")[0] || ".jpg";
            await downloadImage(imageUrls[i], folderPath, `image_${i + 1}${ext}`);
        }

        console.log(`🎉 Hoàn tất! Ảnh được lưu tại: ${folderPath}`);

    } catch (error) {
        console.error("❌ Lỗi xảy ra:", error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

// 🟢 Thay link sản phẩm cần tải hình ảnh
scrapeProductImages("https://www.fahasa.com/25-do-am.html?fhs_campaign=CATEGORY");
