const fs = require('fs');
const json2xls = require('json2xls');

// Hàm định dạng lại giá tiền
function formatPrice(price) {
    // Nếu giá có ký tự "đ" thì loại bỏ
    let formattedPrice = price.replace(/đ/g, '').trim();

    // Loại bỏ dấu chấm và chuyển sang dạng số
    formattedPrice = formattedPrice.replace(/\./g, ''); // Loại bỏ dấu chấm

    // Chuyển giá trị thành số và trả về
    return parseFloat(formattedPrice); // Đảm bảo giá trị là một số
}

// Đọc dữ liệu từ file JSON
fs.readFile('data.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Lỗi khi đọc file JSON:', err);
        return;
    }

    // Chuyển đổi dữ liệu JSON thành đối tượng
    const jsonData = JSON.parse(data);

    // Cấu trúc dữ liệu theo định dạng bạn muốn, thêm các thuộc tính mới
    const transformedData = jsonData.map(item => ({
        Url: item.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
        Tên: item.title,
        'Mô tả': `${item.productDetails} ${item.description}`,
        'Trích dẫn': "",
        Hãng: "",
        'Loại sản phẩm': "",
        Tag: item.title,
        'Hiển thị': "Yes",
        'Thuộc tính 1': "Ngôn ngữ",
        'Giá trị thuộc tính 1': "Tiếng Việt",  // Giá trị ví dụ
        'Thuộc tính 2': "Xuất xứ",
        'Giá trị thuộc tính 2': "Việt Nam",  // Giá trị ví dụ
        'Thuộc tính 3': "Tác giả",
        'Giá trị thuộc tính 3': "Tác giả",  // Set tất cả giá trị Tác giả cho thuộc tính 3
        'Mã phiên bản sản phẩm': "",
        'Khối lượng': parseInt("100", 10),  // Chuyển khối lượng thành số nguyên
        'Quản lý tồn kho': "Haravan",
        'Số lượng tồn kho': parseInt("10", 10),
        'Đặt hàng khi hết hàng': "continue",
        Giá: formatPrice(item.price), // Áp dụng formatPrice cho giá
        'Giá so sánh': formatPrice(item.oldPrice), // Áp dụng formatPrice cho giá so sánh
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
    }));

    // Chuyển đổi dữ liệu thành định dạng XLSX
    const xls = json2xls(transformedData);

    // Ghi dữ liệu vào file XLSX
    fs.writeFile('output.xlsx', xls, 'binary', (err) => {
        if (err) {
            console.error('Lỗi khi ghi file XLSX:', err);
        } else {
            console.log('Dữ liệu đã được ghi vào file output.xlsx');
        }
    });
});
