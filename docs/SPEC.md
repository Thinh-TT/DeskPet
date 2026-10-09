# SPEC – DeskPet

> Trợ lý desktop dạng nhân vật anime 2D: sống trên màn hình, trò chuyện bằng tiếng Việt (text/voice), và về sau điều khiển ứng dụng theo lệnh.

## 1. Mục tiêu & phạm vi
- Nền tảng: **Windows** (mở rộng sau). Dự án cá nhân, kiểm soát kiến trúc.
- Ngôn ngữ giao tiếp chính: **Tiếng Việt**.
- Nhân vật **thay được dễ dàng** (Character Pack). Asset ban đầu tạo bằng AI từ vài ảnh tham chiếu.
- LLM **đa nhà cung cấp** (Gemini / OpenAI / Claude), đổi được khi chạy.
- Agent luôn **hỏi xác nhận** trước hành động nguy hiểm; có whitelist + log.

## 2. Non-goals (hiện tại)
- macOS/Linux, mobile.
- Phát hành công khai, installer ký số.
- Model 3D, Live2D rig đầy đủ (để ngỏ, xem ARCHITECTURE).
- Chạy LLM/STT/TTS offline (thiết kế để cắm thêm sau).

## 3. Yêu cầu chức năng

### F1 – Nhân vật trên màn hình (Tầng 1)
| ID | Yêu cầu |
|----|---------|
| F1.1 | Cửa sổ trong suốt, không viền, always-on-top, không hiện taskbar. |
| F1.2 | **Click-through theo pixel**: vùng trong suốt cho chuột xuyên qua; chỉ pixel nhân vật bắt chuột. |
| F1.3 | Tự di chuyển (đi bộ qua lại, nhàn rỡi, ngồi, ngủ) trong vùng làm việc, tôn trọng taskbar & đa màn hình. |
| F1.4 | Tương tác: click (phản ứng), double-click, kéo thả (bị nhấc lên), vuốt ve (hover kéo dài). |
| F1.5 | State machine hành vi: `idle, walk, sit, sleep, dragged, falling, react, talk, listen, think`. |
| F1.6 | Menu tray: ẩn/hiện, chọn nhân vật, cài đặt, thoát. Menu chuột phải trên nhân vật. |
| F1.7 | Cài đặt: kích thước, tốc độ, tần suất hành vi, tự khởi động cùng Windows. |

### F2 – Trò chuyện có ngữ cảnh (Tầng 2)
| ID | Yêu cầu |
|----|---------|
| F2.1 | Khung chat nhỏ (bong bóng + ô nhập) gắn cạnh nhân vật; streaming token. |
| F2.2 | Persona/system prompt nằm trong Character Pack (tên, tính cách, cách xưng hô). |
| F2.3 | Ngữ cảnh hội thoại + tóm tắt khi dài; có thể đính kèm ngữ cảnh màn hình (tuỳ chọn, opt-in). |
| F2.4 | LLM đầu ra kèm **thẻ cảm xúc/hành động** (`[emotion:happy]`) → nhân vật đổi biểu cảm. |
| F2.5 | Chọn/đổi provider & model; API key lưu bằng kho khoá hệ điều hành (không plaintext). |

### F3 – Voice (Tầng 3)
| ID | Yêu cầu |
|----|---------|
| F3.1 | STT tiếng Việt: push-to-talk (phím tắt toàn cục), sau đó tuỳ chọn wake word/VAD. |
| F3.2 | TTS tiếng Việt chất lượng cao, phát streaming theo câu. |
| F3.3 | **Nhép miệng** theo biên độ âm thanh (không cần viseme ở bản đầu). |
| F3.4 | Ngắt lời (barge-in): người dùng nói thì bot dừng nói. |
| F3.5 | Độ trễ mục tiêu: hết lời nói → bắt đầu phát tiếng ≤ 3 s. |

### F4 – Bộ nhớ & chủ động (Tầng 4)
| ID | Yêu cầu |
|----|---------|
| F4.1 | Bộ nhớ dài hạn: sự kiện/sở thích người dùng, lưu cục bộ (SQLite), truy xuất theo ngữ nghĩa. |
| F4.2 | Người dùng xem/sửa/xoá được mọi ký ức. |
| F4.3 | Nhắc việc & hành vi chủ động (hẹn giờ, lịch, "đã lâu không nói chuyện"), có chế độ Không làm phiền. |

### F5 – Agent (Tầng 5, chia nấc)
| Nấc | Khả năng | Rủi ro |
|-----|----------|--------|
| A1 | Mở/đóng app, mở file/URL, tìm web | Thấp |
| A2 | Đọc/ghi file trong thư mục cho phép; chạy lệnh terminal (sandbox, allowlist) | Trung bình |
| A3 | Điều khiển trình duyệt (Playwright) | Trung bình |
| A4 | Tích hợp qua MCP/API (Calendar, Gmail, Spotify…) | Trung bình – OAuth |
| A5 | Computer use: chụp màn hình → chuột/bàn phím | Cao |

Yêu cầu chung cho agent:
- Mọi tool khai báo **mức rủi ro** (`safe | confirm | dangerous`).
- `confirm`/`dangerous` → hộp thoại xác nhận có mô tả hành động cụ thể.
- Nhật ký hành động (audit log) bất biến, xem được trong UI.
- **Nút dừng khẩn cấp** (phím tắt toàn cục) huỷ mọi tác vụ đang chạy.
- Nội dung từ web/file/email là **dữ liệu không tin cậy** (chống prompt injection): không bao giờ tự thực thi lệnh nằm trong đó.

### F6 – Character Pack
- Một thư mục = một nhân vật, mô tả bằng `character.json` (xem ARCHITECTURE).
- Đổi nhân vật không cần sửa code. Có công cụ kiểm tra hợp lệ (`validate-pack`).
- Quy trình tạo asset bằng AI được ghi lại để tái lập (prompt, ảnh tham chiếu, seed).

## 4. Yêu cầu phi chức năng
- **Hiệu năng**: idle ≤ 3% CPU, ≤ 250 MB RAM, 60 FPS khi hoạt hoạ (hạ xuống 30 khi không focus).
- **Riêng tư**: không gửi ảnh màn hình/âm thanh nếu người dùng chưa bật; hiển thị rõ khi đang nghe/đang chụp.
- **Tin cậy**: lỗi mạng/LLM không làm nhân vật treo; có trạng thái lỗi thân thiện.
- **Mở rộng**: provider, tool, renderer, character đều là plugin theo interface.
- **Khả kiểm thử**: logic lõi (state machine, agent loop, permission) test được không cần UI.

## 5. Tiêu chí hoàn thành MVP (Tầng 1)
1. Nhân vật hiện trong suốt, đi qua lại, không chặn thao tác ở vùng trống.
2. Click/kéo thả phản ứng đúng animation.
3. Đổi sang nhân vật thứ hai chỉ bằng đổi thư mục pack.
4. Idle CPU trong ngưỡng.

## 6. Câu hỏi còn mở
- ~~Tên nhân vật/tính cách~~ → **Đã chốt**: Odette (Genshin Impact), dạng chibi. Xem `characters/odette/` (`persona.md`, `character.json`, `ASSET_NOTES.md`). Lưu ý bản quyền: nhân vật © HoYoverse, chỉ dùng cá nhân/fan.
- Chọn nhà cung cấp STT/TTS tiếng Việt cụ thể (so sánh ở Giai đoạn 3).
- Có muốn nâng cấp lên Live2D sau khi có asset layered không?
- Chọn giọng TTS phù hợp Odette (nữ, điềm tĩnh, quý phái) – thử ở GĐ3.
