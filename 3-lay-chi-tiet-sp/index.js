const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

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
const productLinks = [
    "https://www.fahasa.com/so-dan-sticker-baby-three-l494-nhieu-mau.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/baby-three-the-gioi-dieu-ky.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/ngoi-la-ng-ha-nh-phu-c-cu-a-baby-three.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/tui-thom-baby-three-mau-san-pham-ngau-nhien.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/to-ma-u-thi-tra-n-baby-three.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/be-to-mau-baby-three-de-thuong.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/mini-fashion-baby-three.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/thu-bong-baby-three-romantic-ocean-a7-san-pham-ben-trong-la-ngau-nhien.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/be-to-mau-baby-three-dang-yeu.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/baby-three-nu-than-dai-duong.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/baby-three-giac-mo-co-tich.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/baby-three-va-cau-vong-cam-xuc.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/baby-three-12-cung-hoang-dao.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/thu-bong-baby-three-midoo-first-generation-500-sweetheart-explosion.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/baby-three-thi-tran-tho-lily.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/thu-bong-baby-three-meo-trieu-phu-mau-san-pham-ben-trong-la-ngau-nhien.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/thu-bong-lila-second-generation-baby-three-san-pham-ben-trong-la-ngau-nhien.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/thu-bong-baby-three-tay-du-ky-15-cm-san-pham-ben-trong-la-ngau-nhien.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/thu-bong-baby-three-plush-3-years-old-a11-mau-san-pham-ben-trong-la-ngau-nhien.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/do-choi-mo-hinh-moc-khoa-gau-bong-bua-tiec-dong-vat-baby-three-mau-san-pham-ben-trong-la-ngau-nhien.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/baby-three-something-make-me-happy.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/thu-bong-xira-baby-three-szb24-03-san-pham-ben-trong-la-ngau-nhien.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/liila-lucky-cat-v3-box-8.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/thu-bong-baby-three-dudu-zoo-plush-pendant-series-a29-mau-san-pham-ben-trong-la-ngau-nhien.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/thu-bong-baby-three-migo-funny-plush-pendant-mau-san-pham-ben-trong-la-ngau-nhien.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/thu-bong-baby-three-munmun-childlike-dream-a30-mau-san-pham-ben-trong-la-ngau-nhien.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/thu-bong-baby-three-dumia-ula-meow-treasure-series-plush-mau-san-pham-ben-trong-la-ngau-nhien.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/hop-sticker-baby-three-702-nhieu-mau.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/thu-bong-duck-colorful-fresh-fruit-baby-three-san-pham-ben-trong-la-ngau-nhien.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/thu-bong-baby-three-crying-baby-san-pham-ben-trong-la-ngau-nhien.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/thu-bong-baby-three-yaya-fun-fruit-a50-mau.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/baby-three-the-story-of-a-romantic-ocean.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/thu-bong-baby-three-kimmon-you-are-the-protagonist-san-pham-ben-trong-la-ngau-nhien.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/thu-bong-baby-three-dudu-animal-ice-cream-mini-mau-san-pham-ben-trong-la-ngau-nhien.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/do-choi-mo-hinh-moc-khoa-gau-bong-truong-mau-giao-co-tich-baby-three-0019a4-mau-san-pham-ben-trong-la-ngau-nhien-603052.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/thu-bong-migo-forest-park-15-cm-baby-three-san-pham-ben-trong-la-ngau-nhien.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/thu-bong-baby-three-migo-circus-plush-v3-a14.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/do-choi-mo-hinh-baby-three-the-greedy-cat-series-v3-san-pham-ben-trong-la-ngau-nhien.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/thu-bong-migo-first-generation-animal-party-baby-three-san-pham-ben-trong-la-ngau-nhien.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/thu-bong-billie-s-pajama-party-v2-baby-three-san-pham-ben-trong-la-ngau-nhien.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/thu-bong-dumia-morino-star-vinyl-baby-three-hx40600-san-pham-ben-trong-la-ngau-nhien.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/do-choi-mo-hinh-moc-khoa-gau-bong-truong-mau-giao-co-tich-baby-three-0019a4-mau-san-pham-ben-trong-la-ngau-nhien.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/thu-bong-baby-three-take-me-out-zipper-bag.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/thu-bong-kimmon-mimon-v6-baby-three-556005km-san-pham-ben-trong-la-ngau-nhien.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/thu-bong-merry-christmas-big-plush-animal-400-baby-three-san-pham-ben-trong-la-ngau-nhien.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/thu-bong-kimmon-it-s-you-baby-three-556101km-san-pham-ben-trong-la-ngau-nhien.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/thu-bong-baby-three-noci-s-wonderland-in-the-land-of-rabbits.html?fhs_campaign=SEARCH",
    "https://www.fahasa.com/thu-bong-baby-three-big-plush-animal-ver-2-400.html?fhs_campaign=SEARCH"
]
// Lấy thông tin tất cả sản phẩm
scrapeMultipleProducts(productLinks);
