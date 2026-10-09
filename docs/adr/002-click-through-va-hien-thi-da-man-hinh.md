# 002. Cơ chế Click-Through Theo Pixel và Hiển Thị Đa Màn Hình trên Windows

- **Trạng thái**: Đã chấp thuận (Accepted)
- **Ngày**: 2026-10-09

## Bối cảnh
DeskPet là nhân vật desktop sống động trên Windows. Yêu cầu F1.1 và F1.2 đặt ra:
1. Cửa sổ không viền, trong suốt, always-on-top, không chiếm thanh taskbar.
2. **Click-through theo pixel**: người dùng phải click, chọn văn bản, hoặc thao tác ứng dụng bình thường qua các vùng trong suốt xung quanh nhân vật. Chỉ khi con trỏ chuột trỏ trực tiếp lên thân hình nhân vật (pixel không trong suốt) thì mới bắt sự kiện (click, kéo thả, chuột phải).
3. Hỗ trợ hệ thống đa màn hình và các mức DPI scaling khác nhau (100%, 125%, 150%, 200%).

## Lựa chọn kỹ thuật
1. **Mô hình Cửa sổ Transparent Phủ WorkArea**:
   - *Lựa chọn*: Tạo một `BrowserWindow` trong suốt phủ toàn bộ không gian làm việc (`display.workArea`) của màn hình hiện tại. Vị trí nhân vật được tính toán và di chuyển mượt mà bên trong canvas WebGL của PixiJS.
   - *Lý do*: Phương án di chuyển cửa sổ nhỏ bao quanh nhân vật bằng `win.setBounds` liên tục ở tần số 60 FPS trên Windows sẽ gây hiện tượng xé hình (tearing) và giật khung hình do cơ chế tương tác với Desktop Window Manager (DWM). Vẽ trực tiếp trên canvas WebGL cho độ mượt tối đa và tiết kiệm CPU.

2. **Cơ chế Click-Through theo Pixel (`setIgnoreMouseEvents`)**:
   - Main process khởi tạo cửa sổ với `win.setIgnoreMouseEvents(true, { forward: true })`.
   - Thuộc tính `{ forward: true }` trên Windows cho phép hệ điều hành chuyển tiếp sự kiện chuột xuyên qua cửa sổ tới ứng dụng bên dưới, đồng thời Renderer vẫn tiếp tục nhận được sự kiện `mousemove`.
   - Trong Renderer, PixiJS hoặc Canvas 2D thực hiện hit-test kiểm tra độ trong suốt (alpha > 0.1) của sprite tại vị trí con trỏ chuột:
     - Khi con trỏ tiến vào vùng cơ thể nhân vật: Gửi IPC `pet:set-ignore-mouse-events(false)` để cửa sổ bắt mọi sự kiện nhấn chuột, kéo thả, chuột phải.
     - Khi con trỏ rời khỏi vùng nhân vật: Gửi IPC `pet:set-ignore-mouse-events(true, { forward: true })` để chuột lại xuyên thấu.

3. **Xử lý Đa Màn Hình & DPI**:
   - Sử dụng Electron API `screen.getAllDisplays()` và `screen.getPrimaryDisplay()`.
   - Vị trí của nhân vật luôn được giới hạn và kẹp (clamp) bên trong `display.workArea` (trừ đi chiều cao Taskbar Windows).
   - Tọa độ gửi giữa Main và Renderer được chuẩn hóa theo tọa độ logic (CSS pixel), tự động nhân theo `devicePixelRatio` trên renderer.

## Hệ quả
- **Tích cực**:
  - Trải nghiệm tự nhiên: nhân vật đi lại khắp màn hình nhưng không gây cản trở công việc thường ngày của người dùng.
  - Hoạt họa mượt mà 60 FPS, không phụ thuộc vào tốc độ cập nhật cửa sổ hệ điều hành.
  - Phản ứng tức thì khi kéo thả nhân vật.
- **Thách thức**:
  - Cần throttle và kiểm soát độ trễ của IPC `set-ignore-mouse-events` để tránh hiện tượng flicker sự kiện chuột khi di chuyển chuột nhanh qua biên cơ thể nhân vật.
