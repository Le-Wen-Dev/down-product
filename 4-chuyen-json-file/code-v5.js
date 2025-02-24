const fs = require('fs');
const json2xls = require('json2xls');
const path = require('path');

// Thư mục chứa file
const folderPath = './';

// Hàm định dạng lại giá tiền
function formatPrice(price) {
    let formattedPrice = (price || '').replace(/đ/g, '').trim();
    formattedPrice = formattedPrice.replace(/\./g, ''); // Loại bỏ dấu chấm
    return parseFloat(formattedPrice) || 0; // Chuyển thành số, tránh NaN
}

// Hàm thay thế từ "Fahasa" bằng "Fabico"
function replaceFahasaWithFabico(text) {
    return text.replace(/Fahasa/g, 'Fabico');
}

// Hàm chuyển đổi chuỗi thành slug
function toSlug(text) {
    return text
        .toLowerCase() // Chuyển thành chữ thường
        .normalize('NFD') // Chuẩn hóa Unicode để tách dấu
        .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
        .replace(/\s+/g, '-') // Thay khoảng trắng bằng dấu gạch ngang
        .replace(/[^\w-]+/g, '') // Loại bỏ ký tự đặc biệt
        .replace(/--+/g, '-') // Thay nhiều dấu gạch ngang liên tiếp bằng một dấu
        .trim(); // Loại bỏ khoảng trắng đầu/cuối
}

// Hàm chuyển đổi productDetails thành bảng HTML
// Hàm chuyển đổi productDetails thành bảng HTML
function formatProductDetails(details) {
    // Tách các dòng và làm sạch dữ liệu
    const lines = details.split("\n").map(line => line.trim()).filter(line => line && line !== "Thông tin chi tiết");
    
    // Khởi tạo chuỗi HTML cho bảng
    let htmlTable = '<table cellpadding="8" cellspacing="0" style="width: 100%; max-width: 600px; border-collapse: collapse;">';
    let key = "";
    let value = "";

    // Duyệt qua từng dòng để ghép key-value
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes("\t")) {
            // Nếu dòng chứa tab, tách ngay lập tức
            [key, value] = line.split("\t").map(s => s.trim());
            if (key && value) {
                htmlTable += `<tr><th style="text-align: left;">${key}</th><td style="text-align: left;">${value}</td></tr>`;
            }
        } else if (line && !lines[i + 1]?.startsWith("\t")) {
            // Nếu dòng không chứa tab và dòng kế tiếp không bắt đầu bằng tab, coi đây là key
            key = line;
            // Tìm value ở dòng tiếp theo
            if (i + 1 < lines.length) {
                value = lines[i + 1].trim();
                if (!value.startsWith("\t")) {
                    htmlTable += `<tr><th style="text-align: left;">${key}</th><td style="text-align: left;">${value}</td></tr>`;
                    i++; // Bỏ qua dòng value vừa xử lý
                }
            }
        }
    }

    // Thêm phần thông tin cố định cuối bảng
    htmlTable += `
        <tr>
            <td colspan="2" style="text-align: left;">
                Giá sản phẩm trên Fabico.com đã bao gồm thuế theo luật hiện hành. Bên cạnh đó, tuỳ vào loại sản phẩm, hình thức và địa chỉ giao hàng mà có thể phát sinh thêm chi phí khác như Phụ phí đóng gói, phí vận chuyển, phụ phí hàng cồng kềnh,...<br>
                Chính sách khuyến mãi trên Fabico.com không áp dụng cho Hệ thống Nhà sách Fabico trên toàn quốc.
            </td>
        </tr>
    `;

    // Đóng bảng
    htmlTable += '</table>';

    return htmlTable;
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
    let processedCount = 0; // Biến đếm số sản phẩm đã chuyển

    jsonData.forEach(item => {
        // Thay thế từ "Fahasa" bằng "Fabico"
        item.title = replaceFahasaWithFabico(item.title);
        item.productDetails = replaceFahasaWithFabico(item.productDetails);
        item.description = replaceFahasaWithFabico(item.description);
        const oldPrice = item.oldPrice ? formatPrice(item.oldPrice) : 0;

        // Định dạng mô tả sản phẩm chi tiết
        const formattedProductDetails = formatProductDetails(item.productDetails);
        const formattedDescription = `${formattedProductDetails}\n${item.description}`;

        // Dòng đầu tiên giữ nguyên URL và thông tin chính
        const firstRow = {
            Url: item.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
            Tên: item.title,
            'Mô tả': [
                formatProductDetails(item.productDetails || ""),
                item.description || ""
            ].filter(Boolean).join("\n"),
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
            Danh_mục_EN: toSlug(item.category || ""), // Chuyển Danh_mục thành slug cho Danh_mục_EN
            'Ảnh biến thể': item.images[1] || "",
            'Không áp dụng khuyến mãi': "no"
        };

        // Thêm dòng đầu tiên vào transformedData
        transformedData.push(firstRow);
        processedCount++;

        // Lặp qua các ảnh tiếp theo và thêm các dòng dữ liệu
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

    // Chuyển đổi dữ liệu thành định dạng XLSX
    const xls = json2xls(transformedData);

    // Ghi dữ liệu vào file XLSX
    fs.writeFile(filename, xls, 'binary', (err) => {
        if (err) {
            console.error('Lỗi khi ghi file XLSX:', err);
        } else {
            console.log(`✅ Dữ liệu đã được ghi vào file ${filename}. Đã chuyển ${processedCount} sản phẩm.`);
        }
    });
});