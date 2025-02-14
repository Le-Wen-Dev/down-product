const puppeteer = require("puppeteer");
const fs = require("fs");

const scrapeProductLinks = async (categoryUrls, startPage = 1, maxPage = 1852) => {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        let productLinks = [];

        for (const categoryUrl of categoryUrls) {
            let currentPage = startPage;

            while (currentPage <= maxPage) {
                // Cập nhật URL với trang hiện tại
                const currentUrl = `${categoryUrl}?order=num_orders&limit=24&p=${currentPage}`;
                console.log(`🔍 Đang quét trang ${currentPage} của danh mục ${categoryUrl}: ${currentUrl}`);

                await page.goto(currentUrl, { waitUntil: "networkidle2" });

                // Lấy tất cả link có class 'product-image'
                const links = await page.evaluate(() => {
                    return Array.from(document.querySelectorAll("a.product-image"))
                        .map(a => a.href) // Lấy thuộc tính href
                        .filter(href => href.startsWith("http")); // Lọc link hợp lệ
                });

                console.log(`✅ Tìm thấy ${links.length} link sản phẩm`);

                // Thêm các link sản phẩm vào danh sách
                productLinks = productLinks.concat(links);

                // In ra số trang đã quét
                console.log(`Trang ${currentPage} của danh mục ${categoryUrl} đã quét xong`);

                // Tăng số trang
                currentPage++;
            }
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
const categoryUrls = [
    "https://www.fahasa.com/sach-trong-nuoc.html",
    "https://www.fahasa.com/foreigncategory.html",
    "https://www.fahasa.com/van-phong-pham.html",
    "https://www.fahasa.com/do-choi-luu-niem.html",
    "https://www.fahasa.com/bach-hoa-tong-hop.html",
    "https://www.fahasa.com/luu-niem.html",
    "https://www.fahasa.com/lam-dep-suc-khoe.html",
    "https://www.fahasa.com/sach-trong-nuoc/thieu-nhi.html",
    "https://www.fahasa.com/sach-trong-nuoc/giao-khoa-tham-khao.html",
    "https://www.fahasa.com/sach-trong-nuoc/van-hoc-trong-nuoc.html",
    "https://www.fahasa.com/sach-trong-nuoc/manga-comic.html",
    "https://www.fahasa.com/sach-trong-nuoc/tam-ly-ky-nang-song.html",
    "https://www.fahasa.com/sach-trong-nuoc/sach-hoc-ngoai-ngu.html",
    "https://www.fahasa.com/sach-trong-nuoc/kinh-te-chinh-tri-phap-ly.html",
    "https://www.fahasa.com/sach-trong-nuoc/lich-su-dia-ly-ton-giao.html",
    "https://www.fahasa.com/sach-trong-nuoc/khoa-hoc-ky-thuat.html",
    "https://www.fahasa.com/sach-trong-nuoc/nuoi-day-con.html",
    "https://www.fahasa.com/sach-trong-nuoc/chinh-tri-phap-ly-triet-hoc.html",
    "https://www.fahasa.com/sach-trong-nuoc/tieu-su-hoi-ky.html",
    "https://www.fahasa.com/sach-trong-nuoc/dam-my.html",
    "https://www.fahasa.com/sach-trong-nuoc/nu-cong-gia-chanh.html",
    "https://www.fahasa.com/sach-trong-nuoc/van-hoa-nghe-thuat-du-lich.html",
    "https://www.fahasa.com/sach-trong-nuoc/phong-thuy-kinh-dich.html",
    "https://www.fahasa.com/sach-trong-nuoc/tu-dien.html",
    "https://www.fahasa.com/sach-trong-nuoc/am-nhac-my-thuat-thoi-trang.html",
    "https://www.fahasa.com/sach-trong-nuoc/the-duc-the-thao-giai-tri.html",
    "https://www.fahasa.com/sach-trong-nuoc/bao-tap-chi.html",
    "https://www.fahasa.com/sach-trong-nuoc/giao-trinh.html",
    "https://www.fahasa.com/sach-trong-nuoc/lam-vuon-thu-nuoi.html",
    "https://www.fahasa.com/sach-trong-nuoc/mystery-box.html",
    "https://www.fahasa.com/foreigncategory/children-s-books.html",
    "https://www.fahasa.com/foreigncategory/other-languages.html",
    "https://www.fahasa.com/foreigncategory/dictionaries-languages.html",
    "https://www.fahasa.com/foreigncategory/fiction.html",
    "https://www.fahasa.com/foreigncategory/business-finance-law.html",
    "https://www.fahasa.com/foreigncategory/personal-development.html",
    "https://www.fahasa.com/foreigncategory/biography.html",
    "https://www.fahasa.com/foreigncategory/society-social-sciences.html",
    "https://www.fahasa.com/foreigncategory/education-reference.html",
    "https://www.fahasa.com/foreigncategory/graphic-novels-anime-manga.html",
    "https://www.fahasa.com/foreigncategory/crafts-and-hobbies.html",
    "https://www.fahasa.com/foreigncategory/mind-body-spirit.html",
    "https://www.fahasa.com/foreigncategory/health.html",
    "https://www.fahasa.com/foreigncategory/science-geography.html",
    "https://www.fahasa.com/foreigncategory/computing.html",
    "https://www.fahasa.com/foreigncategory/art-photography.html",
    "https://www.fahasa.com/foreigncategory/romance.html",
    "https://www.fahasa.com/foreigncategory/religion.html",
    "https://www.fahasa.com/foreigncategory/poetry-drama.html",
    "https://www.fahasa.com/foreigncategory/technology-engineering.html",
    "https://www.fahasa.com/foreigncategory/food-drink.html",
    "https://www.fahasa.com/foreigncategory/history-archaeology.html",
    "https://www.fahasa.com/foreigncategory/science-fiction-fantasy-horror.html",
    "https://www.fahasa.com/foreigncategory/home-garden.html",
    "https://www.fahasa.com/foreigncategory/natural-history.html",
    "https://www.fahasa.com/foreigncategory/reference.html",
    "https://www.fahasa.com/foreigncategory/medical.html",
    "https://www.fahasa.com/foreigncategory/stationery.html",
    "https://www.fahasa.com/foreigncategory/entertainment.html",
    "https://www.fahasa.com/foreigncategory/crime-thriller.html",
    "https://www.fahasa.com/foreigncategory/sport.html",
    "https://www.fahasa.com/foreigncategory/travel-holiday-guides.html",
    "https://www.fahasa.com/foreigncategory/humour.html",
    "https://www.fahasa.com/van-phong-pham/but-viet.html",
    "https://www.fahasa.com/van-phong-pham/san-pham-ve-giay.html",
    "https://www.fahasa.com/van-phong-pham/dung-cu-hoc-sinh.html",
    "https://www.fahasa.com/van-phong-pham/dung-cu-ve.html",
    "https://www.fahasa.com/van-phong-pham/san-pham-vpp-khac.html",
    "https://www.fahasa.com/van-phong-pham/dung-cu-van-phong.html",
    "https://www.fahasa.com/van-phong-pham/thiep.html",
    "https://www.fahasa.com/van-phong-pham/san-pham-dien-tu.html",
    "https://www.fahasa.com/van-phong-pham/lich-agenda.html",
    "https://www.fahasa.com/van-phong-pham/bang-dia.html",
    "https://www.fahasa.com/do-choi-luu-niem/do-choi-giao-duc.html",
    "https://www.fahasa.com/do-choi-luu-niem/mo-hinh-cac-loai.html",
    "https://www.fahasa.com/do-choi-luu-niem/phuong-tien-cac-loai.html",
    "https://www.fahasa.com/do-choi-luu-niem/board-game.html",
    "https://www.fahasa.com/do-choi-luu-niem/bup-be-thu-bong.html",
    "https://www.fahasa.com/do-choi-luu-niem/do-choi-van-dong.html",
    "https://www.fahasa.com/do-choi-luu-niem/do-choi-dieu-khien.html",
    "https://www.fahasa.com/do-choi-luu-niem/do-choi-theo-mua.html",
    "https://www.fahasa.com/do-choi-luu-niem/robot.html",
    "https://www.fahasa.com/do-choi-luu-niem/hoa-trang.html",
    "https://www.fahasa.com/do-choi-luu-niem/do-choi-tre-so-sinh.html",
    "https://www.fahasa.com/do-choi-luu-niem/do-choi-theo-phim.html",
    "https://www.fahasa.com/do-choi-luu-niem/the-suu-tap-collectible-card.html",
    "https://www.fahasa.com/do-choi-luu-niem/do-choi-ao-thuat.html",
    "https://www.fahasa.com/do-choi-luu-niem/do-choi-nha-tam.html",
    "https://www.fahasa.com/bach-hoa-tong-hop/nha-cua-doi-song.html",
    "https://www.fahasa.com/bach-hoa-tong-hop/do-dung-ca-nhan.html",
    "https://www.fahasa.com/bach-hoa-tong-hop/do-dien-gia-dung.html",
    "https://www.fahasa.com/bach-hoa-tong-hop/thiet-bi-so-phu-kien-so.html",
    "https://www.fahasa.com/bach-hoa-tong-hop/thuc-pham.html",
    "https://www.fahasa.com/luu-niem/moc-khoa.html",
    "https://www.fahasa.com/luu-niem/phu-kien-vat-lieu-trang-tri.html",
    "https://www.fahasa.com/luu-niem/hop-qua-tui-qua.html",
    "https://www.fahasa.com/luu-niem/guong-luoc.html",
    "https://www.fahasa.com/luu-niem/qua-tang-trang-tri-khac.html",
    "https://www.fahasa.com/luu-niem/kep-anh-go.html",
    "https://www.fahasa.com/luu-niem/dan-tu-lanh.html",
    "https://www.fahasa.com/luu-niem/khung-hinh.html",
    "https://www.fahasa.com/lam-dep-suc-khoe/cham-soc-ca-nhan.html"
]
scrapeProductLinks(categoryUrls, 1, 10); // Ví dụ, quét từ trang 1 đến trang 3


// code nay lay san pham tu cac phan trang dau vao la link danh muc phan trang san pham
// noi chuoi vao tung link danh muc + ?order=num_orders&limit=24&p=1
// trong do so p = x tang dan 