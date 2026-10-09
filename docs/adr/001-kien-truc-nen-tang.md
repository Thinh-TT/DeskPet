# 001. Kiến trúc nền tảng DeskPet: Electron + Vite + TypeScript & Mô hình Phân tách Xử lý

- **Trạng thái**: Đã chấp thuận (Accepted)
- **Ngày**: 2026-10-09

## Bối cảnh
DeskPet là ứng dụng desktop hỗ trợ hiển thị nhân vật anime 2D tương tác sống động trên màn hình Windows, kết hợp trò chuyện tiếng Việt (LLM/STT/TTS) và khả năng mở rộng thành tác nhân tự động (Agent).
Hệ thống đòi hỏi:
1. Cửa sổ trong suốt, không viền, always-on-top, click-through theo pixel.
2. Renderer hoạt họa 2D nhẹ, mượt mà (dự kiến PixiJS WebGL).
3. Kiến trúc mở rộng cho LLM đa nhà cung cấp, lưu trữ bí mật an toàn, và điều khiển tác vụ với phân quyền chặt chẽ.
4. Kiểm thử độc lập phần logic mà không cần khởi động toàn bộ môi trường Electron.

## Lựa chọn
1. **Desktop Shell**: **Electron** kết hợp **TypeScript** (`strict: true`).
   - *Lý do*: Electron hỗ trợ toàn diện các API cửa sổ trong suốt, tray, always-on-top và hệ sinh thái Node.js phong phú phục vụ cho LLM, MCP SDK, Playwright.
   - *Phương án thay thế cân nhắc*: Tauri (nhẹ hơn, nhưng hệ sinh thái tác nhân Node/TypeScript cần chạy sidecar phức tạp hơn).
2. **Công cụ Build & HMR**: **electron-vite** + **Vite**.
   - *Lý do*: Tốc độ khởi động và HMR tức thì, cấu hình tách bạch cho Main, Preload và Renderer.
3. **Mô hình Phân tách Xử lý (Process Boundaries)**:
   - **Main process** đảm nhiệm toàn bộ logic nghiệp vụ (Behavior Engine, Conversation Orchestrator, LLM Providers, Voice, Memory, Agent Tools, Permission Gate).
   - **Renderer process** chỉ nhận dữ liệu và kết xuất hiển thị (PixiJS cho cửa sổ Pet; React cho chat/settings).
   - **Preload**: Cung cấp API hẹp, tối thiểu qua `contextBridge`. Bắt buộc `contextIsolation: true` và `nodeIntegration: false`.
   - **IPC**: Mọi kênh và dữ liệu truyền thông qua IPC phải được khai báo tập trung và kiểm thực bằng schema **Zod**.
4. **Kiểm thử logic**:
   - Sử dụng **Vitest** để chạy độc lập các bài kiểm thử đơn vị đối với logic thuần (State machine, Parser, IPC Schema, Permission) mà không cần nạp runtime Electron.

## Hệ quả
- **Tích cực**:
  - Bảo mật tối đa: Renderer không thể tự ý gọi Node.js API hay truy cập hệ thống tệp.
  - Tách bạch mối quan tâm (SoC): Dễ dàng kiểm thử tự động, tái cấu trúc hoặc nâng cấp renderer (ví dụ: chuyển từ sprite sang Live2D) mà không làm xáo trộn logic nghiệp vụ ở Main process.
  - Vòng lặp phát triển nhanh nhờ Vite HMR và Vitest.
- **Tiêu cực / Thách thức**:
  - Dung lượng phân phối ban đầu của Electron lớn hơn native/Tauri.
  - Cần kiểm soát chặt chẽ mức tiêu thụ CPU/RAM khi chạy idle thông qua việc quản lý tốc độ khung hình và dọn dẹp tài nguyên.
