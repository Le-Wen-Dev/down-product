const fs = require('fs');
const json2csv = require('json2csv').parse;

// Đọc dữ liệu từ file JSON
fs.readFile('data.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Lỗi khi đọc file JSON:', err);
        return;
    }

    // Chuyển đổi dữ liệu JSON thành đối tượng
    const jsonData = JSON.parse(data);

    // Cấu trúc dữ liệu theo định dạng bạn muốn
    const transformedData = jsonData.map(item => ({
        Url: item.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''), // URL (slug)
        Tên: item.title, // Tên
        'Mô tả': `${item.productDetails} ${item.description}`, // Mô tả
        'Trích dẫn': "", // Trích dẫn
        Hãng: "", // Hãng
        'Loại sản phẩm': "", // Loại sản phẩm
        Tag: item.title, // Tag
        'Hiển thị': "Yes", // Hiển thị
        'Thuộc tính 1': "", // Thuộc tính 1
        'Giá trị thuộc tính 1': "", // Giá trị thuộc tính 1
        'Thuộc tính 2': "", // Thuộc tính 2
        'Giá trị thuộc tính 2': "", // Giá trị thuộc tính 2
        'Thuộc tính 3': "", // Thuộc tính 3
        'Giá trị thuộc tính 3': "", // Giá trị thuộc tính 3
        'Mã phiên bản sản phẩm': "", // Mã phiên bản sản phẩm
        Khối_lượng: "100", // Khối lượng
        'Quản lý tồn kho': "Haravan", // Quản lý tồn kho
        'Số lượng tồn kho': "10", // Số lượng tồn kho
        'Đặt hàng khi hết hàng': "continue", // Đặt hàng khi hết hàng
        Giá: item.price, // Giá
        'Giá so sánh': item.oldPrice, // Giá so sánh
        'Có giao hàng không?': "Yes", // Có giao hàng không
        'Variant Taxable': "", // Variant Taxable
        Barcode: item.sku, // Barcode
        'Link hình': item.images[0], // Link hình
        'Mô tả hình': "", // Mô tả hình
        'SEO Title': item.title, // SEO Title
        'SEO Description': item.title, // SEO Description
        Danh_mục: "", // Danh mục
        Danh_mục_EN: "", // Danh mục EN
        'Ảnh biến thể': item.images[1] || "", // Ảnh biến thể
        'Không áp dụng khuyến mãi': "no" // Không áp dụng khuyến mãi
    }));

    // Chuyển đổi dữ liệu thành định dạng CSV
    const csv = json2csv(transformedData);

    // Ghi dữ liệu vào file CSV
    fs.writeFile('output.csv', csv, (err) => {
        if (err) {
            console.error('Lỗi khi ghi file CSV:', err);
        } else {
            console.log('Dữ liệu đã được ghi vào file output.csv');
        }
    });
});
