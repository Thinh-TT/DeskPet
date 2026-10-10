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

### 3. Cơ chế Tiêu Điểm Bền Vững (Permanent Focusable Architecture)
- **Thực nghiệm & Phát hiện quan trọng trên Windows 11 DWM**:
  - Khi gọi `win.setFocusable(false)` hoặc `win.setFocusable(true)` động trong runtime, Electron kích hoạt Win32 API `SetWindowLongPtr` gửi cờ `SWP_FRAMECHANGED` tới Desktop Window Manager.
  - Windows DWM khi nhận `SWP_FRAMECHANGED` sẽ tự động tính toán lại non-client area và vẽ lại thanh tiêu đề (caption trắng chứa chữ "DeskPet") ở góc trên màn hình.
  - Ngoài ra, các cờ `type: 'toolbar'` (`WS_EX_TOOLWINDOW`) hoặc `titleBarStyle: 'hidden'` trên Windows cũng là nguồn gốc kích hoạt caption frame của hệ điều hành.
  - **Hiện tượng "Nét chữ điêu khắc" (Color Keying)**: Khi DWM vẽ text hệ thống màu đen `RGB(0,0,0)` (`0x00000000`) lên Layered Transparent Window, Windows hiểu mã màu này là Color Key trong suốt tuyệt đối nên các nét chữ bị "đục thủng" lộ rõ icon nền desktop. Dải màu xanh xám xung quanh chữ chính là `COLOR_INACTIVECAPTION` do DWM vẽ khi cửa sổ mất tiêu điểm (`blur`), không thể can thiệp bằng CSS hay web code.
- **Giải pháp dứt điểm**:
  - Cửa sổ `PetWindow` được cấu hình **cố định `focusable: true`** ngay từ khi khởi tạo, loại bỏ `type: 'toolbar'`, `titleBarStyle` và `titleBarOverlay`.
  - Tuyệt đối **không gọi `win.setFocusable(false)` động** trong toàn bộ vòng đời ứng dụng.
  - **Nâng cấp Electron lên v38+ (khắc phục GitHub Issue #46882)**: Nâng cấp `electron` từ `v35.7.5` lên `v38.8.6`. Ở phiên bản này, Electron và Chromium đã vá triệt để lỗi xử lý `WM_NCACTIVATE` / `WM_NCPAINT`, ngăn chặn hoàn toàn việc DWM vẽ lại Inactive Caption bar khi cửa sổ frameless transparent bị mất tiêu điểm trên Windows 11.
  - Trạng thái không cướp tiêu điểm của ứng dụng nền được đảm bảo 100% nhờ cơ chế **Click-Through (`setIgnoreMouseEvents(true, { forward: true })`)**: Khi chuột nằm ở vùng trong suốt, mọi cú click rơi trực tiếp xuống ứng dụng bên dưới (Chrome, IDE, Desktop), `PetWindow` hoàn toàn không nhận active click.
  - Khi người dùng click vào Chat Panel, cửa sổ lập tức nhận tiêu điểm bàn phím, con trỏ nhấp nháy trong ô input và bộ gõ tiếng Việt (IME) hoạt động chuẩn xác mà không có bất kỳ hiện tượng tái tạo title bar nào từ DWM.

### 4. Định vị Chat Panel bằng CSS Tương Đối
- Vị trí của Chat Panel được neo trực tiếp theo toạ độ logic `(x, y)` của sprite nhân vật ngay trong cùng một trang web thông qua CSS `transform: translate(x, y)` hoặc Absolute positioning.
- Loại bỏ hoàn toàn các hàm IPC tính toán toạ độ màn hình giữa 2 BrowserWindow và bài toán clamp đa cửa sổ.

## Hệ quả & Đánh đổi

### Tích cực
- **Triệt tiêu nguyên nhân gốc rễ lỗi UI**: Loại bỏ hoàn toàn mâu thuẫn giữa 2 HWND độc lập trên Windows 11 DWM và giải quyết dứt điểm regression titlebar khi blur.
- **Trải nghiệm mượt mà**: Bong bóng chat di chuyển đồng bộ 100% với từng bước đi của nhân vật (60 FPS), không có độ trễ IPC giữa 2 cửa sổ.
- **Đơn giản hóa mã nguồn**: Không cần quản lý vòng đời, hiển thị, ẩn hiện, hủy cửa sổ phụ (`ChatWindowManager`).
- **Gõ tiếng Việt ổn định**: Ô input nhận bàn phím ngay lập tức, tương thích đầy đủ với các bộ gõ Unikey/EVKey.

### Đánh đổi & Giải pháp kiểm soát
- **Renderer hợp nhất**: Renderer của Pet Window tải cả PixiJS và React UI. Cần tổ chức code tách bạch giữa component chat và canvas PixiJS.
- **Giữ vững các cờ chống DWM frame**: Cửa sổ duy trì `thickFrame: false`, `frame: false`, `transparent: true`, `backgroundColor: '#00000000'`, và thụt lề 2px (`y: y + 2, height: height - 2`) để DWM không hiểu lầm là maximized window.
- **Yêu cầu phiên bản runtime**: Đòi hỏi Electron ≥ v38 để duy trì tính ổn định của DWM non-client rendering trên Windows 11.
