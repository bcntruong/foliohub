# Contact validation and block reordering

## Goal
Hiển thị website đúng như đã nhập, kiểm tra email/website rõ ràng và cho phép sắp xếp các block nội dung.

## Tasks
- [x] Thêm quy tắc email/website dùng chung ở contracts → Verify: API từ chối dữ liệu sai.
- [x] Hiện lỗi ngay dưới input và chặn cả hai luồng lưu → Verify: Save và Back không rời trang khi sai.
- [x] Hiển thị nguyên URL website với liên kết an toàn → Verify: URL thiếu giao thức vẫn mở bằng HTTPS.
- [x] Thêm kéo-thả và nút lên/xuống cho các block → Verify: thứ tự thay đổi và được lưu.
- [x] Chạy lint, typecheck, test và build → Verify: tất cả lệnh thành công.

## Done When
- [x] Dữ liệu liên hệ sai không được lưu và người dùng nhìn thấy nguyên nhân.
- [x] Thứ tự Kinh nghiệm, Dự án và Học vấn có thể thay đổi.
