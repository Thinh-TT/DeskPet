# 004. Hợp Nhất Giao Diện Chat Vào Cửa Sổ Pet Duy Nhất (Single Transparent Window)

- **Trạng thái**: Đã chấp thuận (Accepted)
- **Ngày**: 2026-10-10
- **Thay thế**: Một phần của [ADR 003](file:///e:/DeskPet/docs/adr/003-kien-truc-chat-va-quan-ly-khoa-an-toan.md) (mục 1 về Cửa sổ Chat Độc lập)

## Bối cảnh
Ở Giai đoạn 2, DeskPet bổ sung tính năng trò chuyện text với nhân vật (F2.1). ADR 003 trước đó lựa chọn tách biệt hai `BrowserWindow` độc lập:
1. `PetWindow`: Cửa sổ trong suốt toàn màn hình (`workArea`), cấu hình `focusable: false` để không cướp tiêu điểm của người dùng khi nhân vật chạy nhảy.
2. `ChatWindow`: Cửa sổ nổi nhỏ gọn chứa giao diện chat React, cấu hình `focusable: true` để nhận input bàn phím.

### Vấn đề nảy sinh trên Windows 11 DWM (Desktop Window Manager)
- Khi một ứng dụng Electron sở hữu hai `HWND` độc lập với trạng thái focus trái ngược (`focusable: false` vs `focusable: true`), việc chuyển đổi tiêu điểm khi người dùng thao tác trên khung chat rồi click ra ngoài Desktop gây xung đột nghiêm trọng ở tầng Win32:
  - Windows DWM coi cú click ra Desktop (vốn nằm trong toạ độ bao phủ của `PetWindow`) là sự kiện chuyển giao kích hoạt nội bộ trong cùng một tiến trình.
  - Quá trình kích hoạt và deactivate chéo giữa 2 Top-Level Window khiến DWM tự động vẽ lại Non-client frame (thanh tiêu đề / caption màu trắng đục) lên cửa sổ trong suốt.
- Việc căn chỉnh toạ độ cửa sổ chat bám theo nhân vật bằng IPC (`showNearPet`) cũng đòi hỏi tính toán clamp phức tạp và có độ trễ nhất định.

## Lựa chọn kỹ thuật: Kiến trúc Cửa Sổ Hợp Nhất (Single Window)

### 1. Một Cửa Sổ Trong Suốt Duy Nhất (`PetWindow`)
- Loại bỏ hoàn toàn `ChatWindow` độc lập. Toàn bộ ứng dụng DeskPet chỉ duy trì **duy nhất 1 `BrowserWindow`** phủ toàn bộ `workArea`.
- Khung chat và giao diện cài đặt được nhúng trực tiếp dưới dạng DOM/React Component bên trong Renderer của Pet Window, hiển thị song song trên lớp WebGL Canvas của PixiJS.

### 2. Mở rộng Cơ chế Hit-Test & Click-Through
- Cơ chế click-through theo pixel ([ADR 002](file:///e:/DeskPet/docs/adr/002-click-through-va-hien-thi-da-man-hinh.md)) được mở rộng:
  - Vùng cơ thể nhân vật (Sprite Alpha > 0.1) **HOẶC** con trỏ chuột nằm trong phạm vi Chat Panel DOM: Renderer phát tín hiệu `setIgnoreMouse(false)` để bắt sự kiện chuột (click, kéo thả, chọn text, cuộn danh sách).
  - Toàn bộ vùng màn hình còn lại: Renderer phát tín hiệu `setIgnoreMouse(true, { forward: true })` để chuột xuyên thấu xuống Desktop và ứng dụng bên dưới.

### 3. Quản lý Focus Động (Dynamic Focusability)
- Cửa sổ duy nhất mặc định duy trì `focusable: false` (`WS_EX_NOACTIVATE`) để người dùng tương tác, kéo thả nhân vật hoặc rê chuột vào khung chat mà không làm mất focus của ứng dụng người dùng đang làm việc (Word, IDE, Browser...).
- Khi người dùng click vào ô nhập liệu (`input`/`textarea`) của Chat Panel:
  - Renderer gửi IPC yêu cầu Main gọi `win.setFocusable(true)` và `win.focus()`.
- Khi ô nhập liệu mất tiêu điểm (`blur`), người dùng click ra ngoài, hoặc khung chat đóng:
  - Main process gọi `win.setFocusable(false)` và nhả focus về cho hệ điều hành.
- **Kết quả**: Không còn tồn tại 2 HWND trong cùng tiến trình, loại bỏ hoàn toàn mầm mống chuyển đổi active window nội bộ gây lỗi vẽ thanh tiêu đề DWM.

### 4. Định vị Chat Panel bằng CSS Tương Đối
- Vị trí của Chat Panel được neo trực tiếp theo toạ độ logic `(x, y)` của sprite nhân vật ngay trong cùng một trang web thông qua CSS `transform: translate(x, y)` hoặc Absolute positioning.
- Loại bỏ hoàn toàn các hàm IPC tính toán toạ độ màn hình giữa 2 BrowserWindow và bài toán clamp đa cửa sổ.

## Hệ quả & Đánh đổi

### Tích cực
- **Triệt tiêu nguyên nhân gốc rễ lỗi UI**: Loại bỏ hoàn toàn mâu thuẫn giữa 2 HWND độc lập trên Windows 11 DWM.
- **Trải nghiệm mượt mà**: Bong bóng chat di chuyển đồng bộ 100% với từng bước đi của nhân vật (60 FPS), không có độ trễ IPC giữa 2 cửa sổ.
- **Đơn giản hóa mã nguồn**: Không cần quản lý vòng đời, hiển thị, ẩn hiện, hủy cửa sổ phụ (`ChatWindowManager`).

### Đánh đổi & Giải pháp kiểm soát
- **Renderer hợp nhất**: Renderer của Pet Window sẽ tải cả PixiJS và React UI. Cần tổ chức code tách bạch giữa component chat và canvas PixiJS.
- **Hỗ trợ Bộ gõ tiếng Việt (IME)**: Khi kích hoạt `setFocusable(true)` động, cần kiểm tra đảm bảo các bộ gõ tiếng Việt phổ biến (Unikey, EVKey, Windows Telex) nhận diện đúng trường nhập văn bản và gõ dấu bình thường.
- **Giữ vững các cờ chống DWM frame**: Cửa sổ vẫn cần giữ nguyên `thickFrame: false`, `frame: false`, `transparent: true`, `backgroundColor: '#00000000'` để đảm bảo an toàn tuyệt đối khi chuyển đổi trạng thái `focusable`.
