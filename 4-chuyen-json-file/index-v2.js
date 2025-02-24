const fs = require('fs');
const json2xls = require('json2xls');
const path = require('path');

// Thư mục chứa file
const folderPath = './';

// Hàm định dạng lại giá tiền
function formatPrice(price) {
    let formattedPrice = (price || '').replace(/đ/g, '').trim();
    formattedPrice = formattedPrice.replace(/\./g, ''); // Loại bỏ dấu chấm
    return parseFloat(formattedPrice) || 0; // Chuyển thành số, trả về 0 nếu không hợp lệ
}

// Hàm thay thế từ "Fahasa" bằng "Fabico" và "Fahasa.com" bằng "Fabico.vn"
function replaceFahasaWithFabico(text) {
    return text
        .replace(/Fahasa\.com/g, 'Fabico.vn')
        .replace(/Fahasa/g, 'Fabico');
}

// Hàm loại bỏ đoạn văn bản trùng lặp và định dạng mô tả
function formatDescription(productDetails, description) {
    // Thay "Fahasa" bằng "Fabico" trước khi xử lý
    productDetails = replaceFahasaWithFabico(productDetails || '');
    description = replaceFahasaWithFabico(description || '');

    // Đoạn văn bản cố định cần loại bỏ nếu trùng
    const disclaimerText = [
        "Giá sản phẩm trên Fabico.vn đã bao gồm thuế theo luật hiện hành",
        "Bên cạnh đó, tuỳ vào loại sản phẩm, hình thức và địa chỉ giao hàng mà có thể phát sinh thêm chi phí khác như Phụ phí đóng gói, phí vận chuyển, phụ phí hàng cồng kềnh",
        "Chính sách khuyến mãi trên Fabico.vn không áp dụng cho Hệ thống Nhà sách Fabico trên toàn quốc"
    ].join('.*');

    const disclaimerRegex = new RegExp(disclaimerText, 'gi');

    // Loại bỏ đoạn trùng lặp từ productDetails và description
    productDetails = productDetails.replace(disclaimerRegex, '').trim();
    description = description.replace(disclaimerRegex, '').trim();

    // Nối productDetails và description nếu cả hai không rỗng
    let combinedText = [productDetails, description].filter(Boolean).join('\n');

    // Tách nội dung theo dấu chấm hoặc xuống dòng và định dạng thành danh sách
    let lines = combinedText.split(/[.\n]/).map(line => line.trim()).filter(line => line);
    let uniqueLines = [...new Set(lines)]; // Loại bỏ các dòng trùng lặp

    // Thêm đoạn thông tin cố định một lần duy nhất
    uniqueLines.push(
        "Giá sản phẩm trên Fabico.vn đã bao gồm thuế theo luật hiện hành. Bên cạnh đó, tuỳ vào loại sản phẩm, hình thức và địa chỉ giao hàng mà có thể phát sinh thêm chi phí khác như Phụ phí đóng gói, phí vận chuyển, phụ phí hàng cồng kềnh,...",
        "Chính sách khuyến mãi trên Fabico.vn không áp dụng cho Hệ thống Nhà sách Fabico trên toàn quốc"
    );

    // Chuyển thành danh sách có dấu gạch đầu dòng
    return uniqueLines.map(line => `- ${line}`).join('\n');
}

// Hàm tìm số thứ tự lớn nhất hiện có và tạo số mới
function getNextFileNumber() {
    const files = fs.readdirSync(folderPath);
    const fileNumbers = files
        .map(file => {
            const match = file.match(/^output_(\d+)\.xlsx$/);
            return match ? parseInt(match[1], 10) : null;
        })
        .filter(num => num !== null)
        .sort((a, b) => a - b);

    return fileNumbers.length > 0 ? fileNumbers[fileNumbers.length - 1] + 1 : 1;
}

// Xác định số thứ tự file mới
const fileNumber = getNextFileNumber();
const filename = `output_${fileNumber}.xlsx`;

// Đọc dữ liệu từ file JSON
fs.readFile('data.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Lỗi khi đọc file JSON:', err);
        return;
    }

    const jsonData = JSON.parse(data);
    const transformedData = [];
    let processedCount = 0;

    jsonData.forEach(item => {
        const oldPrice = item.oldPrice ? formatPrice(item.oldPrice) : 0;

        // Dòng đầu tiên giữ nguyên URL và thông tin chính
        const firstRow = {
            Url: item.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
            Tên: item.title,
            'Mô tả': formatDescription(item.productDetails, item.description), // Gọi hàm mới
            'Trích dẫn': "",
            Hãng: item.supplier && item.supplier.length <= 3 ? "Việt Tinh Anh" : item.supplier || "",
            'Loại sản phẩm': "",
            Tag: item.title,
            'Hiển thị': "Yes",
            'Thuộc tính 1': "Ngôn ngữ",
            'Giá trị thuộc tính 1': "Tiếng Việt",
            'Thuộc tính 2': "Xuất xứ",
            'Giá trị thuộc tính 2': "Việt Nam",
            'Thuộc tính 3': "Tác giả",
            'Giá trị thuộc tính 3': "Tác Giả",
            'Mã phiên bản sản phẩm': "",
            'Khối lượng': parseInt(item.weight || "100", 10),
            'Quản lý tồn kho': "Haravan",
            'Số lượng tồn kho': parseInt(item.stock || "10", 10),
            'Đặt hàng khi hết hàng': "continue",
            Giá: formatPrice(item.price),
            'Giá so sánh': oldPrice,
            'Có giao hàng không?': "Yes",
            'Variant Taxable': "",
            Barcode: item.sku,
            'Link hình': item.images[0],
            'Mô tả hình': "",
            'SEO Title': item.title,
            'SEO Description': item.title,
            Danh_mục: item.category,
            Danh_mục_EN: "",
            'Ảnh biến thể': item.images[1] || "",
            'Không áp dụng khuyến mãi': "no"
        };

        transformedData.push(firstRow);
        processedCount++;

        item.images.slice(1).forEach(image => {
            transformedData.push({
                Url: firstRow.Url,
                Tên: item.title,
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
            processedCount++;
        });
    });

    const xls = json2xls(transformedData);
    fs.writeFile(filename, xls, 'binary', (err) => {
        if (err) {
            console.error('Lỗi khi ghi file XLSX:', err);
        } else {
            console.log(`✅ Dữ liệu đã được ghi vào file ${filename}. Đã chuyển ${processedCount} sản phẩm.`);
        }
    });
});