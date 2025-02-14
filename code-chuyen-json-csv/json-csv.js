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
        Url: item.Url,
        Tên: item.Tên,
        'Mô tả': item.Mô_tả,
        'Trích dẫn': item.Trích_dẫn,
        Hãng: item.Hãng,
        'Loại sản phẩm': item.Loại_sản_phẩm,
        Tag: item.Tag,
        'Hiển thị': item.Hiển_thị,
        'Thuộc tính 1': item.Thuộc_tính_1,
        'Giá trị thuộc tính 1': item.Giá_trị_Thuộc_tính_1,
        'Thuộc tính 2': item.Thuộc_tính_2,
        'Giá trị thuộc tính 2': item.Giá_trị_Thuộc_tính_2,
        'Thuộc tính 3': item.Thuộc_tính_3,
        'Giá trị thuộc tính 3': item.Giá_trị_Thuộc_tính_3,
        'Mã phiên bản sản phẩm': item.Mã_phiên_bản_sản_phẩm,
        Khối_lượng: item.Khối_lượng,
        'Quản lý tồn kho': item.Quản_lý_tồn_kho,
        'Số lượng tồn kho': item.Số_lượng_tồn_kho,
        'Đặt hàng khi hết hàng': item.Đặt_hàng_khi_hết_hàng,
        Giá: item.Giá,
        'Giá so sánh': item.Giá_so_sánh,
        'Có giao hàng không?': item.Có_giao_hàng_không,
        'Variant Taxable': item.Variant_Taxable,
        Barcode: item.Barcode,
        'Link hình': item.Link_hình,
        'Mô tả hình': item.Mô_tả_hình,
        'SEO Title': item.SEO_Title,
        'SEO Description': item.SEO_Description,
        'Danh mục': item.Danh_mục,
        'Danh mục EN': item.Danh_mục_EN,
        'Ảnh biến thể': item.Ảnh_biến_thể,
        'Không áp dụng khuyến mãi': item.Không_áp_dụng_khuyến_mãi
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
