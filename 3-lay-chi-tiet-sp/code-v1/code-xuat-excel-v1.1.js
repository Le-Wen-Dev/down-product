const puppeteer = require("puppeteer");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");

const outputExcelPath = path.join(__dirname, "output.xlsx");

const scrapeProductData = async (productUrl) => {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(productUrl, { waitUntil: "networkidle2" });

        const productData = await page.evaluate(() => {
            return {
                "Tên sản phẩm": document.querySelector(".fhs_name_product_desktop")?.innerText.trim() || "",
                "Giá bán": document.querySelector(".price-box .special-price .price")?.innerText.trim() || "",
                "Giá gốc": document.querySelector(".price-box .old-price .price")?.innerText.trim() || "",
                "Giảm giá": document.querySelector(".price-box .old-price .discount-percent")?.innerText.trim() || "",
                "Số lượng": document.querySelector(".btn-subtract-qty")?.innerText.trim() || "",
                "Chi tiết sản phẩm": document.querySelector(".block-content-product-detail.block-info-detail-mobile")?.innerText.trim() || "",
                "Mô tả": document.querySelector(".block-content-product-detail.block-info-detail-2-mobile")?.innerText.trim() || "",
            };
        });

        console.log(`✅ Thu thập xong: ${productData["Tên sản phẩm"]}`);
        return productData;
    } catch (error) {
        console.error("❌ Lỗi thu thập dữ liệu:", error.message);
    } finally {
        if (browser) await browser.close();
    }
};

const exportToExcel = async (products) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sản phẩm");

    sheet.columns = [
        { header: "Tên sản phẩm", key: "Tên sản phẩm", width: 30 },
        { header: "Giá bán", key: "Giá bán", width: 15 },
        { header: "Giá gốc", key: "Giá gốc", width: 15 },
        { header: "Giảm giá", key: "Giảm giá", width: 10 },
        { header: "Số lượng", key: "Số lượng", width: 10 },
        { header: "Chi tiết sản phẩm", key: "Chi tiết sản phẩm", width: 50 },
        { header: "Mô tả", key: "Mô tả", width: 50 },
    ];

    products.forEach(product => sheet.addRow(product));
    await workbook.xlsx.writeFile(outputExcelPath);
    console.log(`✅ Xuất dữ liệu thành công ra file: ${outputExcelPath}`);
};

(async () => {
    const productLinks = [
        "https://www.fahasa.com/nguoi-dan-ong-mang-ten-ove-tai-ban.html?fhs_campaign=CATEGORY",
        "https://www.fahasa.com/goc-nho-co-nang.html?fhs_campaign=CATEGORY"
    ];

    const products = [];
    for (const url of productLinks) {
        const productData = await scrapeProductData(url);
        if (productData) products.push(productData);
    }
    await exportToExcel(products);
})();
