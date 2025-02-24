const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

// read list products on file data.json
const readProductLinks = () => {
    try {
        const data = fs.readFileSync("data.json", "utf-8");
        return JSON.parse(data);
    } catch (error) {
        console.error("❌ Lỗi khi đọc file JSON:", error.message);
        return [];
    }
}
// Hàm thu thập thông tin sản phẩm
const scrapeProductData = async (productUrl) => {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        console.log(`🔍 Đang truy cập: ${productUrl}`);
        await page.goto(productUrl, { waitUntil: "networkidle2" });

        // Tìm ảnh sản phẩm
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
        console.log(`✅ Đã lưu thông tin sản phẩm này vào json!`);
        if (imageUrls.length === 0) {
            throw new Error("Không tìm thấy ảnh sản phẩm.");
        }

        // Thu thập thông tin sản phẩm
        const productInfo = await page.evaluate(() => {
            const title = document.querySelector(".fhs_name_product_desktop")?.innerText.trim();
            const price = document.querySelector(".price-box .special-price .price")?.innerText.trim();
            const oldPrice = document.querySelector(".price-box .old-price .price")?.innerText.trim();
            const discount = document.querySelector(".price-box .old-price .discount-percent")?.innerText.trim();
            const quantity = document.querySelector(".btn-subtract-qty")?.innerText.trim();
            const productDetails = document.querySelector(".block-content-product-detail.block-info-detail-mobile")?.innerText.trim();
            const description = document.querySelector(".block-content-product-detail.block-info-detail-2-mobile")?.innerText.trim();

            // Tìm mã hàng trong bảng
            let sku = "Không tìm thấy mã hàng";
            const rows = document.querySelectorAll("tr");
            rows.forEach(row => {
                const label = row.querySelector(".table-label")?.innerText.trim();
                if (label === "Mã hàng") {
                    sku = row.querySelector(".data_0")?.innerText.trim() || "Không có dữ liệu";
                }
            });

            // Thu thập tên nhà cung cấp
            const supplier = document.querySelector(".data_1 .attribute_link_container")?.innerText.trim() || "";

            // Lấy thông tin danh mục có class=1
            const category = document.querySelector('li[class="1"] a')?.innerText.trim() || "";

            return {
                sku, // Mã hàng
                title,
                price,
                oldPrice,
                discount,
                quantity,
                productDetails,
                description,
                supplier, // Thêm thông tin nhà cung cấp vào dữ liệu
                category // Thêm thông tin danh mục vào dữ liệu
            };
        });

        return { ...productInfo, images: imageUrls };

    } catch (error) {
        console.error("❌ Lỗi xảy ra:", error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

// Hàm quét nhiều sản phẩm
const scrapeMultipleProducts = async (productUrls) => {
    const allProductInfo = [];

    for (const url of productUrls) {
        const productData = await scrapeProductData(url);
        if (productData) {
            allProductInfo.push(productData);
        }
    }

    // Tạo tên file JSON với timestamp
    const getNextFileName = () => {
        const files = fs.readdirSync(__dirname)
            .filter(file => file.startsWith("product_") && file.endsWith(".json"))
            .map(file => parseInt(file.match(/\d+/)?.[0] || "0", 10))
            .sort((a, b) => a - b);

        const nextNumber = (files.length > 0 ? files[files.length - 1] + 1 : 1);
        return `product_${nextNumber}.json`;
    };

    const jsonFileName = getNextFileName();
    const jsonFilePath = path.join(__dirname, jsonFileName);

    // Lưu dữ liệu vào file JSON mới
    fs.writeFileSync(jsonFilePath, JSON.stringify(allProductInfo, null, 2), "utf-8");
    console.log(`✅ Đã lưu tất cả thông tin sản phẩm vào file ${jsonFilePath}`);
};

// 🟢 Danh sách link sản phẩm cần quét
const productLinks = readProductLinks();
if(productLinks.length > 0){
    scrapeMultipleProducts(productLinks);
}else{
    console.error("❌ Không tìm thấy link sản phẩm trong data.json!")
}
