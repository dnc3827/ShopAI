// test-race-condition.js
const axios = require('axios');

async function runTranhMuaTest() {
    const URL = 'http://localhost:5000/api/orders/create'; // Sửa lại đúng port API tạo đơn hàng của bạn

    // Giả lập dữ liệu mua hàng
    const payload = {
        variantId: "ab6c7cec-8267-4f43-88ba-cc9a225bc714",
        productId: "a16b0628-ab93-4fd4-879a-2eb5069e3a33"
    };

    console.log('🚀 Đang chuẩn bị 5 "User ảo" nhấn nút Mua Hàng cùng 1 giây...');

    // Tạo ra 5 request chạy song song hoàn toàn
    const tasks = Array.from({ length: 5 }).map((_, index) => {
        return axios.post(URL, payload, {
            headers: {
                // Nếu API tạo đơn của bạn bắt đăng nhập, hãy copy cái Token Bearer từ Postman dán vào đây:
                'Authorization': 'Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6ImEzZWI4ZDg3LTI3ZjgtNDFjNy04NmI0LWQxMDIzYWVhYjU2MSIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2tydW1zYnZoemZ5bHh3dXlhZmdjLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIwZDZiMzQ1NS02OTljLTRkZmYtOTZkMS1lYTIzYWEzMGRlNjIiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzg3MjM3MjMwLCJpYXQiOjE3ODcyMzM2MzAsImVtYWlsIjoibmd1eWVudmFuYkBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoibmd1eWVudmFuYkBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoibmd1eWVudmFuYiIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiMGQ2YjM0NTUtNjk5Yy00ZGZmLTk2ZDEtZWEyM2FhMzBkZTYyIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3ODcyMzM2MzB9XSwic2Vzc2lvbl9pZCI6Ijk1ZmU1MWM4LWU4OTAtNDMzYS1hNWVmLTNkNzJhMGU4ZDhmNiIsImlzX2Fub255bW91cyI6ZmFsc2V9.VKGzQ17PKS1XkWocITX6770MNwvxxxGz4iHnkssGPrVD8I9WVnUx1G7Lncn3FqzpqXrV7zGWCDkSLLx--tz9uQ'
            }
        })
            .then(res => `👤 User ${index + 1}: THÀNH CÔNG (200) -> Mã đơn: ${res.data.orderCode || 'Ok'}`)
            .catch(err => `👤 User ${index + 1}: BỊ CHẶN (${err.response?.status}) -> Lý do: ${err.response?.data?.error || err.message}`);
    });

    // KÍCH HOẠT ĐỒNG THỜI!
    const results = await Promise.all(tasks);

    console.log('\n📊 KẾT QUẢ CUỘC ĐUA TRANH MUA:');
    results.forEach(line => console.log(line));
}

runTranhMuaTest();