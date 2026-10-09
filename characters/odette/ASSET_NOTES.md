# ASSET_NOTES – Odette (chibi)

> Nhân vật gốc © HoYoverse. Chỉ dùng cá nhân/fan, không phát hành công khai.

## 0. Chuẩn bị
1. Lưu ảnh turnaround gốc vào `characters/odette/reference/odette_turnaround.png` (4 góc: trước, 2 bên, sau).
2. Cắt thêm `reference/front.png`, `side.png`, `back.png` nếu Flow cần ảnh đơn.
3. Mỗi lần tạo ảnh, ghi vào bảng **Nhật ký** (cuối file): prompt, ảnh tham chiếu, ảnh chọn.

## 1. Bảng nhận diện (dán vào MỌI prompt – giữ nhất quán)
Rút từ ảnh gốc:
- **Tóc**: xanh băng nhạt (pale ice-blue), mái lệch ôm mặt, búi tròn phía sau có bím tết bên cạnh, có sợi lông vũ trắng cong như ăng-ten (ahoge-feather) trên đỉnh đầu, trang sức bạc nhỏ trên tóc.
- **Mắt**: tím violet, to, long lanh.
- **Trang phục**: váy ballet tutu trắng–xanh băng nhiều lớp; áo corset xanh navy đậm có hoạ tiết tim bạc ở ngực; vai có lông vũ trắng; phía sau là các dải đuôi lông vũ dài xanh–navy.
- **Tay**: tay áo mỏng trắng; **găng tay navy đậm với dây chéo hình chữ X** (tay trái); cổ tay có viền lông vũ.
- **Chân**: tất cao trắng có hoạ tiết hoa văn bạc; giày cao gót dây bạc.
- **Bảng màu**: trắng ngà, xanh băng, navy, tím, bạc.

**Khối mô tả chuẩn (copy vào mọi prompt):**
```
Odette from Genshin Impact, chibi style (2.5 heads tall), pale ice-blue hair with side-swept bangs, bun with a small braid, a curved white feather ahoge on top, violet eyes, white and ice-blue layered ballet tutu dress, deep navy corset bodice with silver heart emblem, white feather shoulder accents, long navy-and-blue feather tail panels at the back, dark navy gloves with X-shaped straps, white patterned thigh-high stockings, silver strappy high heels
```

**Khối phong cách & nền (copy vào mọi prompt):**
```
clean anime chibi illustration, crisp lineart, soft cel shading, consistent proportions, full body, centered, flat solid pure green (#00FF00) background, no shadow on background, no text, no watermark, high resolution
```
> Dùng nền xanh lá chroma vì trang phục không có màu xanh lá → tách nền dễ. Nếu Flow viền xanh vào tóc, đổi sang nền xám trung tính #808080.

## 2. Danh sách ảnh cần tạo (theo độ ưu tiên)

### Nhóm A – Master (BẮT BUỘC, làm trước; mọi thứ khác dựa vào đây)
| # | File | Mô tả |
|---|------|-------|
| A1 | `master/front_neutral.png` | Chibi đứng chính diện, biểu cảm trung tính, tay thả tự nhiên |
| A2 | `master/side_right.png` | Chibi nhìn nghiêng phải (dùng cho đi bộ) |
| A3 | `master/back.png` | Chibi nhìn từ sau (tuỳ chọn, để kiểm chứng đuôi lông vũ) |

**Prompt A1** (đính kèm ảnh turnaround làm tham chiếu):
```
Using the attached character turnaround as the exact reference for design and colors, create a chibi version. {KHỐI MÔ TẢ CHUẨN}. Standing front view, neutral calm elegant expression, hands relaxed at sides, slight poised posture like a ballerina. {KHỐI PHONG CÁCH & NỀN}
```
**Prompt A2** (đính kèm A1 + turnaround):
```
Same exact chibi character as the attached image, same outfit and proportions. Pure side view facing right, standing neutral pose. {KHỐI PHONG CÁCH & NỀN}
```

### Nhóm B – Biểu cảm (9 ảnh, dùng ảnh A1 làm tham chiếu)
Giữ **cùng góc, cùng tư thế, cùng khung**, chỉ đổi mặt (và tay nhẹ nếu cần).
| # | File | Biểu cảm |
|---|------|----------|
| B1 | `expr/neutral.png` | Lạnh, điềm tĩnh (lấy lại A1) |
| B2 | `expr/happy.png` | Mỉm cười nhẹ, mắt cong nhẹ (vẫn kiềm chế) |
| B3 | `expr/soft.png` | Dịu dàng, mắt hơi buồn, cười nhẹ |
| B4 | `expr/sad.png` | Buồn u hoài, mắt rũ |
| B5 | `expr/angry.png` | Lạnh lùng nghiêm khắc, lông mày nhíu, ánh mắt sắc |
| B6 | `expr/surprised.png` | Mắt mở to, miệng nhỏ tròn |
| B7 | `expr/shy.png` | Má ửng hồng, nhìn lảng đi |
| B8 | `expr/thinking.png` | Một ngón tay chạm cằm, nhìn lên |
| B9 | `expr/sleepy.png` | Mắt khép lim dim, hơi gật |

**Prompt mẫu (thay `{EXPR}`):**
```
Edit the attached image: keep the exact same character, outfit, pose, camera angle, framing and background. Change ONLY the facial expression to: {EXPR}. Do not change anything else. {KHỐI PHONG CÁCH & NỀN}
```
Giá trị `{EXPR}` gợi ý: `a faint gentle smile, eyes softly curved, elegant and restrained` (happy) · `cold stern look, brows slightly furrowed, sharp eyes` (angry) · `eyes wide open, tiny round mouth` (surprised) · `blushing cheeks, looking away to the side, lips pressed` (shy) · `half-closed drowsy eyes, small yawn-less peaceful face` (sleepy)…

### Nhóm C – Miệng nhép (2 ảnh mới + dùng lại neutral)
Vì các ảnh A/B cùng khung hình, cùng thân, chỉ khác mặt, ta chỉ cần **cắt vùng miệng** rồi đặt đè lên mọi biểu cảm.
| # | File | Mô tả |
|---|------|-------|
| C1 | `mouth/m0.png` | Khép – cắt từ `expr/neutral.png` (không cần tạo mới) |
| C2 | `mouth/m1.png` | Hé nhẹ |
| C3 | `mouth/m2.png` | Mở chữ "a" |

Tạo C2, C3 từ `master/front_neutral.png`:
```
Edit the attached image: keep EVERYTHING identical (same canvas size, framing, scale, pose, outfit, colors, outlines). Change ONLY the mouth to: {slightly parted lips, small | open mouth saying "ah", small round}. Do not move or resize anything. {KHỐI PHONG CÁCH & NỀN}
```
> Script `tools/` (làm ở GĐ1) sẽ so sánh với neutral để tự cắt vùng khác biệt → `mouth/m*.png` + toạ độ.

### Nhóm D – Clip chuyển động (quy trình video → khung hình)

Walk đã chứng minh quy trình **Flow (Veo) video + ffmpeg** cho kết quả mượt hơn nhiều so với vẽ từng khung. Mọi pose còn lại dùng lại đúng quy trình này. Code (nhún, squash, lật ngang) chỉ còn là phần bổ sung.

| Thứ | Làm bằng | Ví dụ |
|-----|----------|-------|
| Chuyển động chính | **Clip video → frames** | idle, walk, react, sit, sleep, drag, fall, land, dance |
| Biểu cảm, miệng | Tráo ảnh (nhóm B, C) | đổi mặt, nhép miệng |
| Bổ sung | Code transform | lật ngang để đi trái, phát ngược clip (đứng dậy/thức dậy), nhún nhẹ, squash khi va chạm |

#### D1. Quy trình chuẩn cho mỗi clip
1. Tạo **ảnh khởi đầu nền xanh** 1080×1920 (9:16) bằng lệnh ở D2.
2. Flow: *Frames to Video* (hoặc Image to Video). Start = ảnh khởi đầu. Với clip **lặp**, đặt **End = Start** để vòng khép kín.
3. Prompt = **khối chung D3** + **mô tả riêng ở D4**. Video ngắn 4–8 s.
4. Lưu `pose/ingredient/<clip>/<clip>.mp4`.
5. Trích frame (ffmpeg, 24 fps) → xem contact sheet có đánh số → chọn một chu kỳ (D5).
6. colorkey + despill → scale về **192×384** → `pose/<clip>_<n>.png`.
7. Làm GIF xem thử vòng lặp; ghi nhật ký (mục 5) + khai báo trong `character.json`.

> `pose/ingredient/` (mp4, frame thô) rất nặng, **không đưa vào repo** (thêm vào `.gitignore` ở GĐ0). Chỉ giữ `pose/<clip>_<n>.png` và lệnh tái lập.

#### D2. Ảnh khởi đầu nền xanh
Cùng một tỉ lệ và đường chân (đáy ảnh trừ 100 px) cho mọi clip để chân không "nhảy" khi đổi clip. Lệnh (PowerShell, chạy tại `characters/odette`):
```powershell
ffmpeg -y -f lavfi -i "color=c=0x00FF00:s=1080x1920" -i master\front_neutral.png `
  -filter_complex "[1:v]scale=-1:1500[fg];[0:v][fg]overlay=(W-w)/2:H-h-100:format=auto" `
  -frames:v 1 pose\ingredient\_start\front_neutral_green.png
```
Đã tạo sẵn: `pose/ingredient/_start/front_neutral_green.png`, `side_right_green.png`. Với ảnh khởi đầu khác (keyframe fall/drag, frame cuối clip trước), thay tên file đầu vào.

#### D3. Khối prompt video chung (dán vào MỌI clip)
```
The same exact chibi character as the first frame. Her design, outfit, hair, colors, line weight and proportions must NOT change at any moment. Locked static camera, no zoom, no pan, no cut. The character stays in the same place in the center of the frame. Plain flat solid bright green (#00FF00) background, no shadows, no floor, no particles, no text. 2D anime animation style, smooth natural motion.
```
Negative (nếu Flow có ô riêng): `camera movement, zoom, scene change, extra characters, background elements, outfit change, face change`.

#### D4. Danh sách clip và prompt riêng
Thay `{CHUYỂN ĐỘNG}` trong: `{KHỐI CHUNG D3} Motion: {CHUYỂN ĐỘNG}`.

| Clip | Loại | Start → End | `{CHUYỂN ĐỘNG}` | Frame / fps |
|------|------|-------------|------------------|-------------|
| `idle` | lặp | front → front | `Stands calmly with gentle breathing, body sways very slightly, hair strands and tail feathers sway softly, blinks once, then returns exactly to the starting pose.` | 12 / 6 |
| `react` | 1 lần | front → front | `Gets startled: a small jump with wide eyes and raised arms, then lands lightly and returns to the starting pose.` | 8–10 / 12 |
| `think` | lặp | front → front | `Raises one finger to her chin, looks up thoughtfully, head tilts slightly, small gentle sway, then returns to the starting pose.` | 8–12 / 6 |
| `dance` | 1 lần (đặc trưng) | front → front | `Performs one graceful ballet pirouette on tiptoes, skirt and tail feathers flare outward, then finishes in the starting pose with a tiny elegant bow.` | 12–16 / 12 |
| `sit_down` | 1 lần | front → (không) | `Sits down on the ground, legs stretched forward together, hands resting on her lap, then stays still.` | 8–12 / 10 |
| `sit` | lặp | **frame cuối `sit_down`** → chính nó | `Sits calmly, gentle breathing, feet swing very slightly, blinks once, then returns to the starting pose.` | 8–12 / 5 |
| `sleep_down` | 1 lần | frame cuối `sit` → (không) | `Hugs her knees, rests her head on her knees, closes her eyes and falls asleep, then stays completely still.` | 8–12 / 8 |
| `sleep` | lặp | frame cuối `sleep_down` → chính nó | `Sleeping peacefully, very slow gentle breathing, tiny head bob, otherwise completely still.` | 8 / 4 |
| `drag` | lặp | **keyframe drag** → chính nó | `Dangling in the air, hanging from an invisible hand holding the back of her collar: legs swing gently, arms hang down, annoyed pouting face, body sways slightly like a pendulum.` | 8–12 / 8 |
| `fall` | lặp | **keyframe fall** → chính nó | `Falling through the air: hair, tail feathers and skirt flutter upward, arms flail slightly, startled wide eyes, body tilts slightly left and right.` | 8 / 12 |
| `land` | 1 lần | keyframe fall → front | `Lands on the ground with knees bending and body squashing, wobbles a little, then straightens up into a calm standing pose.` | 8–10 / 12 |
| `walk` | lặp | side_right → side_right | ✔ đã xong (12 frame). Đi trái = lật ngang | 12 / 8 |

Không cần ảnh/clip mới cho: **stand_up** (= `sit_down` phát ngược), **wake_up** (= `sleep_down` phát ngược), **listen/talk** (= `idle` + tráo miệng/biểu cảm).

**Keyframe cho `drag` và `fall`:** bắt đầu từ ảnh đứng thì video mất nhiều giây "chuyển tiếp" và khó lặp. Hãy tạo trước **ảnh tĩnh** tư thế đó (đính kèm `front_neutral.png`), ghép nền xanh bằng D2, rồi mới làm video lặp.
```
Same exact chibi character as the attached image, same outfit, proportions, line weight and colors, silver strappy high heels. Pose: {POSE}. Same canvas size and scale. Clean anime chibi illustration, full body, centered, flat solid pure green (#00FF00) background, no shadow, no text.
```
| Keyframe | `{POSE}` |
|----------|----------|
| drag | `being lifted up by the back of the collar, feet dangling off the ground, arms hanging down, annoyed pouting face, front view` |
| fall | `falling downward, arms raised up, skirt puffed upward modestly, legs together, startled wide-eyed face, front view` |

#### D5. Chọn frame
- Trích 24 fps vào `frames/`; dùng contact sheet đánh số như bạn đã làm cho walk.
- Chọn **một chu kỳ**: với clip `End = Start`, frame đầu ≈ frame cuối → **bỏ frame cuối trùng** để vòng lặp không đứng hình.
- Số frame: loop nhẹ (idle/sit/sleep) 8–12 @ 4–6 fps; hành động (react/land/dance) 8–16 @ 12 fps.
- Loại frame: đổi mặt/trang phục, mờ chuyển động, mất chi tiết, viền xanh dày.
- **Crop bằng một cửa sổ cố định cho cả clip** (không crop sát từng frame), để chân không rung. Giữ cùng scale giữa các clip.
- Xem GIF trước khi nhận: nếu giật ở chỗ nối vòng → chọn lại điểm cắt.

#### D6. Mẹo
- **Nối clip (chain):** lấy frame cuối clip trước làm Start của clip sau:
  `ffmpeg -sseof -0.1 -i sit_down.mp4 -frames:v 1 sit_down_last.png`. Sau 2–3 lần nối, thiết kế dễ "trôi" → kiểm tra với ảnh master.
- **Phát ngược** bằng code (`"reverse": true` trong manifest), không cần xuất thêm ảnh.
- **Anchor mỗi clip:** `feet` (đứng, đi, ngồi, ngủ); `head` (drag – bám con trỏ ở đỉnh đầu); `center` (fall).
- Nếu Veo thêm zoom/chuyển cảnh: rút ngắn mô tả, thêm negative, hoặc tạo lại (mỗi clip thường cần 1–3 lần thử).
- Nếu tóc xanh nhạt/viền bị colorkey ăn mất: giảm similarity; nếu viền xanh dính: tăng despill.

#### D7. Lệnh đã dùng (lấy walk làm ví dụ)

**Các lệnh chỉ để tham khảo, mỗi clip mới cần tự đo khung crop, lấy mẫu màu nền thực tế, thay đổi tham số cho phù hợp, KHÔNG cần ghi lại lệnh của những pose khác nhau**

Lệnh chạy trong PowerShell tại thư mục `characters/odette` (hoặc tiền tố `characters/odette/` nếu đứng từ root):

```powershell
# 0. Chuẩn bị thư mục chứa nguyên liệu
New-Item -ItemType Directory -Force -Path "pose\ingredient\walk\frames" | Out-Null

# 1. Trích toàn bộ khung hình thô (8 fps) từ video nguồn
ffmpeg -y -i "pose\ingredient\walk\walk.mp4" -r 8 -q:v 2 "pose\ingredient\walk\frames\frame_%03d.png"

# 2. Tạo contact sheet 16 khung đầu có đánh số để soi chu kỳ
ffmpeg -y -i "pose\ingredient\walk\frames\frame_%03d.png" `
  -vf "scale=270:-1,drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='%{n}':fontsize=36:fontcolor=white:box=1:boxcolor=black@0.6:x=20:y=20,tile=4x4" `
  -frames:v 1 "pose\ingredient\walk\walk_cycle_numbered.png"

# 3. Lệnh đơn cho 1 frame: colorkey + despill + crop bbox + scale 384 + pad canvas 192x384
ffmpeg -y -i "pose\ingredient\walk\frames\frame_001.png" `
  -vf "colorkey=0x00d000:0.35:0.1,despill=type=green:mix=0.5:expand=0.1,crop=760:1630:90:190,scale=-1:384,pad=192:384:(192-iw)/2:0:color=0x00000000" `
  "pose\walk_1.png"

# 4. Chạy hàng loạt 12 frames (chu kỳ frame 1..12 tương ứng n=0..11) xuất ra thành phẩm pose/
1..12 | ForEach-Object {
  $in = "pose\ingredient\walk\frames\frame_{0:D3}.png" -f $_
  $out = "pose\walk_$_.png"
  ffmpeg -y -i $in -vf "colorkey=0x00d000:0.35:0.1,despill=type=green:mix=0.5:expand=0.1,crop=760:1630:90:190,scale=-1:384,pad=192:384:(192-iw)/2:0:color=0x00000000" $out
}

# 5. Tạo ảnh GIF preview động lặp lại (8 fps, nền trong suốt) lưu vào ingredient/
ffmpeg -y -i "pose\walk_%d.png" `
  -vf "fps=8,split[s0][s1];[s0]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[s1][p]paletteuse=alpha_threshold=128" `
  "pose\ingredient\walk\walk_preview.gif"
```

#### D8. Thứ tự làm
1. Hoàn thiện nhóm B còn thiếu (soft, sad, thinking, blink) → kiểm tra m1, m2.
2. `idle` ✔ → `react` ✔ → `think` ✔ → `dance` ✔ → `drag` ✔ → `fall` ✔ → `land` ✔.
3. `sit_down` ✔ → `sit` ✔.
4. `sleep_down` ✔ → `sleep` ✔.

Tối thiểu cho GĐ1: `walk` ✔, `idle` ✔, `react` ✔, `think` ✔, `dance` ✔, `sit_down` ✔, `sit` ✔, `sleep_down` ✔, `sleep` ✔, `drag` ✔, `fall` ✔, `land` ✔ (ĐÃ HOÀN TẤT 100% CÁC CLIP CHUYỂN ĐỘNG CỦA GĐ1).

## 3. Lỗi thường gặp & cách xử
| Vấn đề | Cách xử |
|--------|---------|
| Tóc/trang phục lệch giữa các ảnh | Luôn đính kèm ảnh master + khối mô tả chuẩn; sửa nhỏ bằng prompt "Edit… change ONLY…" |
| Giày lệch (A1 bốt dây buộc vs A2 cao gót) | Chốt 1 kiểu cho mọi ảnh; thêm `silver strappy high heels (not boots)` hoặc ngược lại |
| Nhân vật trôi vị trí giữa khung | Căn lại điểm neo bằng script; nhắc "same canvas size, same framing" |
| Viền xanh lá/halo dính tóc | Đổi nền #808080 hoặc despill khi tách nền |
| Chân/giày biến dạng | Tạo lại khung đó |
| Quá nhiều chi tiết ở kích thước nhỏ | Thêm "simplified details"; tránh hoạ tiết tất quá dày |

## 4. Tiến độ asset
- [x] A1 `master/front_neutral.png`, A2 `master/side_right.png`
- [x] B: neutral, happy, angry, surprised, shy, sleepy
- [x] B: soft, sad, thinking · mới: blink
- [x] C: m1, m2 (m0 lấy từ neutral)
- [x] D: idle (12 frames), walk (12 frames), react (10 frames), think (12 frames), dance (14 frames), sit_down (12 frames), sit (12 frames), sleep_down (12 frames), sleep (12 frames), drag (13 frames), fall (12 frames), land (10 frames)

## 5. Nhật ký tạo ảnh
| Ngày | File | Công cụ/model | Prompt (rút gọn) | Tham chiếu | Ghi chú |
|------|------|---------------|------------------|-----------|---------|
| 2026-10-09 | `pose/walk_1..12.png` | Flow (Veo) + ffmpeg | Walks in place to the right, smooth looping walk cycle | `side_right.png` | Trích 12 frames chuẩn chu kỳ từ `walk.mp4`, colorkey + despill + scale chuẩn 192×384 |
| 2026-10-09 | `pose/idle_1..12.png` | Flow (Veo) + ffmpeg | Stands calmly with gentle breathing, body sways slightly, blinks once | `front_neutral.png` | Trích 12 frames chuẩn chu kỳ 3s từ `idle.mp4`, colorkey + despill + crop (700:1400:190:280) + scale 192×384, chân căn chuẩn y=380 khớp walk |
| 2026-10-09 | `pose/react_1..10.png` | Flow (Veo) + ffmpeg | Gets startled: a small jump with wide eyes and raised arms, then lands lightly | `front_neutral.png` | Trích 10 frames chuẩn động tác 12 fps từ `react.mp4`, colorkey + despill + crop (860:1720:110:18) + scale 192×384, chân tiếp đất y=380 khớp walk/idle |
| 2026-10-09 | `pose/think_1..12.png` | Flow (Veo) + ffmpeg | Raises one finger to chin, tilts head thoughtfully, gentle sway, returns to front | `front_neutral.png` | Trích 12 frames chu kỳ lặp 6 fps từ `think.mp4`, colorkey + despill + crop (906:1812:84:56) + scale 192×384, chân căn chuẩn y=380 khớp 100% |
| 2026-10-09 | `pose/dance_1..14.png` | Flow (Veo) + ffmpeg | Performs one graceful ballet pirouette on tiptoes, skirt and tail feathers flare outward, then finishes in starting pose with tiny elegant bow | `front_neutral.png` | Trích 14 frames chu kỳ 12 fps từ `dance.mp4`, colorkey + despill + crop (730:1460:175:155) + scale 192×384, chân căn chuẩn y=380 khớp 100% |
| 2026-10-09 | `pose/sit_down_1..12.png` | Flow (Veo) + ffmpeg | Sits down on the ground, legs stretched forward together, hands resting on lap, stays still | `front_neutral.png` | Trích 12 frames chu kỳ chuyển tiếp 10 fps từ `sit_down.mp4`, colorkey + despill + crop (740:1480:165:100) + scale 192×384, tiếp đất y=380 khớp 100% |
| 2026-10-09 | `pose/sit_1..12.png` | Flow (Veo) + ffmpeg | Sits calmly, gentle breathing, feet swing very slightly, blinks once, returns to starting pose | `sit_down_12.png` | Trích 12 frames chu kỳ lặp 6 fps từ `sit.mp4`, colorkey + despill + crop (740:1480:165:100) + scale 192×384, khớp tiếp nối tuyệt đối với `sit_down` |
| 2026-10-09 | `pose/sleep_down_1..12.png` | Flow (Veo) + ffmpeg | Sits down, hugs knees, closes eyes and falls asleep peacefully, stays still | `front_neutral.png` | Trích 12 frames chu kỳ chuyển tiếp 8 fps từ `sleep_down.mp4`, colorkey + despill + crop (740:1480:165:100) + scale 192×384, chân tiếp đất y=380 khớp 100% |
| 2026-10-09 | `pose/sleep_1..12.png` | Flow (Veo) + ffmpeg | Sleeping peacefully, slow gentle breathing, tiny head bob, completely still | `sleep_down_12.png` | Trích 12 frames chu kỳ lặp 4 fps từ `sleep.mp4`, colorkey + despill + crop (740:1480:165:100) + scale 192×384, khớp tiếp nối tuyệt đối với `sleep_down` |
| 2026-10-09 | `pose/drag_1..13.png` | Flow (Veo) + ffmpeg | Lifted in the air by collar/nape, transition lift-off (3 frames) + dangling swing (10 frames) | `front_neutral.png` | Trích 13 frames (3 frames nhấc lên + 10 frames lơ lửng) từ `drag.mp4`, đỉnh đầu cố định căn chuẩn (anchor: head), scale 184 + pad canvas 192×384 |
| 2026-10-09 | `pose/fall_1..12.png` | Flow (Veo) + ffmpeg | Falling through air: hair, tail feathers, skirt flutter upward, startled wide eyes, body sways slightly | `front_neutral.png` | Trích 12 frames chu kỳ lặp 12 fps từ `fall.mp4`, colorkey + despill + crop (950:1400:90:270) + scale 180 + pad căn giữa 192×384 (anchor: center) |
| 2026-10-09 | `pose/land_1..10.png` | Flow (Veo) + ffmpeg | Touchdown feet impact, deep squash bend, wobble balance, straightens up into standing pose | `front_neutral.png` | Trích 10 frames chu kỳ động tác 12 fps từ `land.mp4`, colorkey + despill + neo chuẩn đường chân mặt sàn (anchor: feet y=380), scale 192×384 |






