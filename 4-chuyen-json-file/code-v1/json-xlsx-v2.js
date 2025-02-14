const fs = require('fs');
const json2xls = require('json2xls');

// Hàm định dạng lại giá tiền
function formatPrice(price) {
    let formattedPrice = (price || '').replace(/đ/g, '').trim();
    formattedPrice = formattedPrice.replace(/\./g, ''); // Loại bỏ dấu chấm
    return parseFloat(formattedPrice); // Chuyển thành số
}

// Hàm định dạng lại mô tả thành danh sách có cấu trúc
function formatDescription(description) {
    // Tách nội dung theo dấu chấm hoặc dấu xuống dòng
    let lines = description.split(/[.\n]/).map(line => line.trim()).filter(line => line);

    // Chuyển mỗi dòng thành một mục danh sách
    return lines.map(line => `- ${line}`).join("\n");
}

// Hàm thay thế từ "Fahasa" bằng "Fabico"
function replaceFahasaWithFabico(text) {
    return text.replace(/Fahasa/g, 'Fabico');
}

// Đọc dữ liệu từ file JSON
fs.readFile('data.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Lỗi khi đọc file JSON:', err);
        return;
    }

    // Chuyển đổi dữ liệu JSON thành đối tượng
    const jsonData = JSON.parse(data);

    // Cấu trúc dữ liệu theo định dạng mong muốn
    const transformedData = [];
    let processedCount = 0; // Biến đếm số sản phẩm đã chuyển

    jsonData.forEach(item => {
        // Thay thế từ "Fahasa" bằng "Fabico" trong các trường cần thiết
        item.title = replaceFahasaWithFabico(item.title);
        item.productDetails = replaceFahasaWithFabico(item.productDetails);
        item.description = replaceFahasaWithFabico(item.description);
        const oldPrice = item.oldPrice ? formatPrice(item.oldPrice) : 0;
        // Dòng đầu tiên giữ nguyên URL và thông tin chính
        const firstRow = {
            Url: item.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
            Tên: item.title,
            'Mô tả': formatDescription(`${item.productDetails}\n${item.description}`),
            'Trích dẫn': "",
            Hãng: "Phú Vinh Phát",
            'Loại sản phẩm': "",
            Tag: item.title,
            'Hiển thị': "Yes",
            'Thuộc tính 1': "Ngôn ngữ",
            'Giá trị thuộc tính 1': "Tiếng Việt",
            'Thuộc tính 2': "Xuất xứ",
            'Giá trị thuộc tính 2': "Việt Nam",
            'Thuộc tính 3': "Tác giả",
            'Giá trị thuộc tính 3': "Tác giả",
            'Mã phiên bản sản phẩm': "",
            'Khối lượng': parseInt(item.weight || "100", 10),
            'Quản lý tồn kho': "Haravan",
            'Số lượng tồn kho': parseInt(item.stock || "10", 10),
            'Đặt hàng khi hết hàng': "continue",
            Giá: formatPrice(item.price),
            'Giá so sánh': oldPrice,  // Gán giá trị oldPrice đã xử lý
            'Có giao hàng không?': "Yes",
            'Variant Taxable': "",
            Barcode: item.sku,
            'Link hình': item.images[0],
            'Mô tả hình': "",
            'SEO Title': item.title,
            'SEO Description': item.title,
            Danh_mục: "",
            Danh_mục_EN: "",
            'Ảnh biến thể': item.images[1] || "",
            'Không áp dụng khuyến mãi': "no"
        };

        // Thêm dòng đầu tiên vào transformedData
        transformedData.push(firstRow);
        processedCount++; // Tăng số sản phẩm đã xử lý

        // Lặp qua các ảnh tiếp theo và thêm các dòng dữ liệu
        item.images.slice(1).forEach(image => {
            transformedData.push({
                Url: firstRow.Url,
                Tên: item.title, // Giữ nguyên tên sản phẩm
                'Mô tả': "",
                'Trích dẫn': "",
                Hãng: "",
                'Loại sản phẩm': "",
                Tag: "",
                'Hiển thị': "",
                'Thuộc tính 1': "",
                'Giá trị thuộc tính 1': "",
                'Thuộc tính 2': "",
                'Giá trị thuộc tính 2': "",
                'Thuộc tính 3': "",
                'Giá trị thuộc tính 3': "",
                'Mã phiên bản sản phẩm': "",
                'Khối lượng': "",
                'Quản lý tồn kho': "",
                'Số lượng tồn kho': "",
                'Đặt hàng khi hết hàng': "",
                Giá: "",
                'Giá so sánh': "",
                'Có giao hàng không?': "",
                'Variant Taxable': "",
                Barcode: "",
                'Link hình': image,
                'Mô tả hình': "",
                'SEO Title': "",
                'SEO Description': "",
                Danh_mục: "",
                Danh_mục_EN: "",
                'Ảnh biến thể': "",
                'Không áp dụng khuyến mãi': ""
            });
            processedCount++; // Tăng số sản phẩm đã xử lý
        });
    });

    // Chuyển đổi dữ liệu thành định dạng XLSX
    const xls = json2xls(transformedData);

    // Ghi dữ liệu vào file XLSX
    fs.writeFile('output.xlsx', xls, 'binary', (err) => {
        if (err) {
            console.error('Lỗi khi ghi file XLSX:', err);
        } else {
            console.log(`Dữ liệu đã được ghi vào file output.xlsx. Đã chuyển ${processedCount} sản phẩm.`);
        }
    });
});
