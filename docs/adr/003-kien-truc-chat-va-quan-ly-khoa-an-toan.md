# 003. Kiến trúc Trò Chuyện Text, Cửa Sổ Chat UI và Quản Lý Khóa An Toàn

- **Trạng thái**: Đã thay thế một phần (Partially Superseded bởi [ADR 004](file:///e:/DeskPet/docs/adr/004-hop-nhat-chat-vao-pet-window-single-window.md))
- **Ngày**: 2026-10-10

## Bối cảnh
Giai đoạn 2 (GĐ2) của dự án DeskPet yêu cầu tính năng trò chuyện text với nhân vật anime (F2.1 – F2.5):
1. Khung chat nhỏ gọn (bong bóng thoại + ô nhập text) gắn cạnh nhân vật, hỗ trợ streaming token mượt mà.
2. Hỗ trợ đa nhà cung cấp LLM: Google Gemini và DeepSeek, có thể thay đổi provider và model lúc runtime mà không cần restart.
3. Lưu trữ API Key an toàn trên Windows, không lưu plaintext, không lộ key ra log hay renderer.
4. Nhân vật thay đổi biểu cảm và hoạt ảnh dựa trên thẻ cảm xúc `[emotion:<tên>]` được phân tích từ luồng streaming.
5. Không làm ảnh hưởng đến cơ chế click-through theo pixel của cửa sổ nhân vật (Pet window).

## Lựa chọn kỹ thuật

### 1. Phân tách Cửa sổ: Cửa sổ Chat Độc Lập (`ChatWindow`) *(Lưu ý: Đã được thay thế bởi [ADR 004](file:///e:/DeskPet/docs/adr/004-hop-nhat-chat-vao-pet-window-single-window.md) sang kiến trúc cửa sổ duy nhất để khắc phục lỗi focus trên Windows 11 DWM)*
- **Lựa chọn**: Tạo một `BrowserWindow` riêng biệt cho giao diện Chat và Cài đặt, thay vì vẽ trực tiếp vào Canvas hoặc nhúng DOM vào Pet window.
- **Lý do**:
  - Pet window hiện tại có cờ `focusable: false` và `type: 'toolbar'` để tránh cướp tiêu điểm (focus) của người dùng khi nhân vật di chuyển trên màn hình.
  - Ô nhập văn bản (input/textarea) của chat đòi hỏi cửa sổ phải có khả năng `focusable: true` để nhận sự kiện bàn phím.
  - Việc tách cửa sổ cho phép Chat UI có vòng đời độc lập (ẩn/hiện theo nhu cầu), phong cách bán trong suốt (glassmorphism), và tự động căn vị trí kế bên nhân vật.
- **Công nghệ UI**: React + Vanilla CSS (theo định hướng kiến trúc tại `docs/ARCHITECTURE.md`).

### 2. Quản lý Khóa Bí mật: Electron `safeStorage` (Windows DPAPI)
- **Lựa chọn**: Sử dụng API `safeStorage` có sẵn của Electron kết hợp lưu trữ file mã hóa `%APPDATA%/DeskPet/secrets.dat`.
- **Lý do**:
  - `safeStorage` sử dụng trực tiếp Windows Data Protection API (DPAPI - CryptProtectData / CryptUnprotectData), đảm bảo dữ liệu chỉ có thể được giải mã bởi tài khoản người dùng hiện tại trên máy tính hiện tại.
  - Không cần thêm các dependency native C++ phức tạp (như `keytar`), loại bỏ rủi ro lỗi build `node-gyp` trên Windows.
  - Preload và Renderer chỉ được nhận trạng thái (ví dụ: `hasKey: boolean`), không bao giờ nhận plain API key qua IPC.

### 3. Tầng Trừu Tượng `LLMProvider` & Native Streaming `fetch`
- **Lựa chọn**: Định nghĩa interface `LLMProvider` thuần TypeScript. Các adapter (Gemini, DeepSeek) triển khai bằng Node.js global `fetch` và bộ giải mã Server-Sent Events (SSE).
- **Lý do**:
  - Giảm thiểu kích thước gói và phụ thuộc bên ngoài.
  - Dễ dàng viết Unit test trong Vitest bằng cách mock `fetch` mà không cần giả lập SDK phức tạp.
  - Dễ mở rộng thêm các nhà cung cấp mới (OpenAI, Claude, Ollama) trong tương lai.

### 4. Bộ Phân Tích Thẻ Cảm Xúc (`EmotionTagParser`)
- **Lựa chọn**: Xây dựng lớp xử lý chuỗi luồng (stream parser) nhận token từng mẩu, phát hiện và bóc tách các thẻ `[emotion:<tên>]` (kể cả khi thẻ bị ngắt giữa hai chunk), bắn sự kiện đổi cảm xúc tới `PetCoordinator` và chuyển tiếp phần văn bản sạch tới UI.
- **Lý do**:
  - Trải nghiệm người dùng liền mạch: bong bóng chat không bị chớp giật hay hiển thị thẻ kỹ thuật thô.
  - Tách bạch logic xử lý văn bản khỏi logic kết xuất đồ họa.

## Hệ quả
- **Tích cực**:
  - Bảo mật cao, tuân thủ nghiêm ngặt nguyên tắc ranh giới tiến trình (Main process nắm quyền, Renderer chỉ hiển thị).
  - Khả năng kiểm thử đơn vị độc lập 100% đối với logic parser, provider, context manager và secret store.
  - Trải nghiệm trò chuyện tự nhiên, nhân vật biểu cảm phong phú.
- **Thách thức**:
  - Cần đồng bộ toạ độ xuất hiện của `ChatWindow` theo vị trí nhân vật sao cho không bị tràn ra ngoài màn hình (clamp).
