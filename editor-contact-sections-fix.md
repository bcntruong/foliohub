# Sửa trình chỉnh sửa portfolio

## Mục tiêu
Làm rõ trạng thái tải ảnh, giữ dữ liệu liên hệ khi mở lại và dùng nhãn phù hợp cho từng loại nội dung.

## Công việc
- [x] Tái hiện luồng lưu liên hệ trên local → Verify: dữ liệu còn đủ sau khi quay lại dashboard và mở lại portfolio.
- [x] Chờ yêu cầu lưu hoàn tất trước khi rời trang → Verify: không thể mở lại portfolio trước khi dữ liệu được ghi xong.
- [x] Lưu khi bấm “Portfolio của tôi” → Verify: chỉ quay về danh sách sau khi lưu thành công.
- [x] Thay trạng thái file gốc bằng thông báo tải ảnh rõ ràng → Verify: giao diện không còn hiển thị “chưa có tệp nào được chọn” sau khi tải.
- [x] Đổi nhãn Kinh nghiệm, Học vấn và Dự án theo ngữ cảnh → Verify: mỗi block hiển thị đúng tên trường.
- [x] Bỏ cách đặt tên block bằng số thứ tự → Verify: tiêu đề dùng nội dung người dùng nhập hoặc trạng thái “mới”.
- [x] Giữ Dự án độc lập và thêm trường “Loại / Công ty” → Verify: có thể ghi dự án cá nhân hoặc tên công ty.
- [x] Chạy lint, typecheck, test và build → Verify: tất cả lệnh hoàn tất không lỗi.

## Hoàn thành khi
- [x] Các thay đổi giao diện hoạt động trên local và dữ liệu liên hệ vẫn tồn tại sau khi mở lại.
