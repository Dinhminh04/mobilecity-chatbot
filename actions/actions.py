from rasa_sdk import Action, FormValidationAction
from rasa_sdk.events import SlotSet
from rasa_sdk.types import DomainDict
from typing import Any, Dict, Text
from google import genai
from google.genai import types
import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

# ─────────────────────────────────────────────
# Cấu hình Gemini API
# ─────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

# ─────────────────────────────────────────────
# Cấu hình PostgreSQL
# ─────────────────────────────────────────────
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://mobilecity:mobilecity123@postgres:5432/mobilecity_db"
)

def get_db_conn():
    try:
        return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    except Exception as e:
        print(f"[DB] Không kết nối được PostgreSQL: {e}")
        return None

def get_inventory_info(keyword: str = None) -> str:
    """
    Query DB lấy thông tin tồn kho thực tế.
    Nếu có keyword thì tìm sản phẩm cụ thể, không thì lấy tất cả.
    Trả về string để nhét vào prompt Gemini.
    """
    conn = get_db_conn()
    if not conn:
        return ""
    try:
        cur = conn.cursor()
        if keyword:
            cur.execute("""
                SELECT name, brand, price, original_price, stock, warranty_months
                FROM products
                WHERE is_active = TRUE
                  AND (name ILIKE %s OR brand ILIKE %s)
                ORDER BY stock DESC
                LIMIT 10
            """, (f"%{keyword}%", f"%{keyword}%"))
        else:
            cur.execute("""
                SELECT name, brand, price, original_price, stock, warranty_months
                FROM products
                WHERE is_active = TRUE
                ORDER BY brand, price
            """)
        rows = cur.fetchall()
        if not rows:
            return ""

        lines = ["📦 THÔNG TIN TỒN KHO THỰC TẾ TỪ HỆ THỐNG (cập nhật realtime):"]
        for r in rows:
            price_str = f"{r['price']:,}₫".replace(",", ".")
            orig_str = ""
            if r['original_price'] and r['original_price'] > r['price']:
                discount = round((1 - r['price'] / r['original_price']) * 100)
                orig_str = f" (giảm {discount}%)"

            if r['stock'] == 0:
                stock_str = "❌ HẾT HÀNG"
            elif r['stock'] <= 3:
                stock_str = f"⚠️ SẮP HẾT (chỉ còn {r['stock']} chiếc)"
            else:
                stock_str = f"✅ CÒN HÀNG ({r['stock']} chiếc)"

            lines.append(
                f"- {r['name']} ({r['brand']}): {price_str}{orig_str} | {stock_str} | BH: {r['warranty_months']} tháng"
            )

        lines.append("\n⚠️ YÊU CẦU QUAN TRỌNG: Dựa vào danh sách trên để trả lời chính xác về tồn kho.")
        lines.append("Nếu stock = 0 thì PHẢI nói HẾT HÀNG, đừng tự bịa.")
        return "\n".join(lines)
    except Exception as e:
        print(f"[DB get_inventory] {e}")
        return ""
    finally:
        conn.close()

def log_conversation(session_id: str, sender: str, message: str,
                     intent: str = None, confidence: float = None):
    conn = get_db_conn()
    if not conn:
        return
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO conversations
                (session_id, sender, message, intent, confidence)
            VALUES (%s, %s, %s, %s, %s)
        """, (session_id, sender, message, intent, confidence))
        conn.commit()
    except Exception as e:
        print(f"[DB log_conversation] {e}")
    finally:
        conn.close()

def save_order_to_db(session_id: str, ho_ten: str, so_dien_thoai: str,
                     dia_chi: str, san_pham: str):
    conn = get_db_conn()
    if not conn:
        return None
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT COUNT(*) as cnt FROM orders WHERE DATE(created_at) = CURRENT_DATE"
        )
        row = cur.fetchone()
        today_count = (row["cnt"] if row else 0) + 1
        order_code = f"DH{datetime.now().strftime('%Y%m%d')}{today_count:03d}"

        cur.execute(
            "SELECT id, stock FROM products WHERE name ILIKE %s AND is_active = TRUE LIMIT 1",
            (f"%{san_pham}%",)
        )
        p = cur.fetchone()
        product_id = p["id"] if p else None

        cur.execute("""
            INSERT INTO orders
                (order_code, product_id, customer_name, customer_phone,
                 customer_address, payment_method, status, session_id)
            VALUES (%s, %s, %s, %s, %s, 'COD', 'pending', %s)
        """, (order_code, product_id, ho_ten, so_dien_thoai, dia_chi, session_id))

        # Giảm tồn kho nếu còn hàng
        if product_id and p and p["stock"] > 0:
            cur.execute(
                "UPDATE products SET stock = stock - 1 WHERE id = %s",
                (product_id,)
            )

        conn.commit()
        return order_code
    except Exception as e:
        print(f"[DB save_order] {e}")
        return None
    finally:
        conn.close()

def save_handoff_to_db(session_id: str, trigger: str = "manual",
                       fallback_count: int = 0,
                       customer_name: str = None, customer_phone: str = None):
    conn = get_db_conn()
    if not conn:
        return
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO handoff_requests
                (session_id, customer_name, customer_phone,
                 trigger_reason, fallback_count, status)
            VALUES (%s, %s, %s, %s, %s, 'pending')
        """, (session_id, customer_name, customer_phone, trigger, fallback_count))
        conn.commit()
    except Exception as e:
        print(f"[DB save_handoff] {e}")
    finally:
        conn.close()

# ─────────────────────────────────────────────
# Danh sách nhân viên tư vấn MobileCity
# ─────────────────────────────────────────────
NHAN_VIEN = [
    {"ten": "Nguyễn Văn Hùng",  "chuc_vu": "Trưởng phòng tư vấn", "sdt": "0912 111 222", "email": "hung.nguyen@mobilecity.vn"},
    {"ten": "Trần Thị Mai",     "chuc_vu": "Chuyên viên tư vấn",   "sdt": "0923 333 444", "email": "mai.tran@mobilecity.vn"},
    {"ten": "Lê Minh Tuấn",     "chuc_vu": "Chuyên viên tư vấn",   "sdt": "0934 555 666", "email": "tuan.le@mobilecity.vn"},
]

# ─────────────────────────────────────────────
# System prompt MobileCity
# ─────────────────────────────────────────────
SYSTEM_PROMPT = """
Bạn là trợ lý tư vấn AI của MobileCity - chuỗi cửa hàng điện thoại uy tín tại Việt Nam.
Website: https://mobilecity.vn

=== PHONG CÁCH GIAO TIẾP ===
- Nói chuyện như người bạn am hiểu công nghệ đang tư vấn cho bạn bè
- Dùng "mình/bạn" thay vì "tôi/anh chị" khi phù hợp
- Ngắn gọn, đi thẳng vào vấn đề, không vòng vo
- Dùng emoji thoải mái để trình bày sinh động 📱⚡🔥
- Khi khách viết tắt hay nhắn tin kiểu teen thì reply tự nhiên theo phong cách đó

=== SẢN PHẨM MOBILECITY ===

1. 📱 IPHONE - Chính hãng VN/A & Xách tay
   - iPhone 13, 14, 15, 16, 17 series
   - 🔗 https://mobilecity.vn/dien-thoai

2. 📱 SAMSUNG GALAXY - Chính hãng
   - A-series: A15, A35, A55, A56, A36
   - S-series: S24, S25, S25 Ultra, S26, S26 Ultra
   - Z-series: Z Fold, Z Flip
   - 🔗 https://mobilecity.vn/dien-thoai

3. 📱 OPPO - Chính hãng
   - Reno 12, Reno 13 | A-series | Find X
   - 🔗 https://mobilecity.vn/dien-thoai

4. 📱 XIAOMI - Chính hãng & Xách tay
   - Redmi Note 14, Note 15 Pro | Xiaomi 14T, 15T | POCO
   - 🔗 https://mobilecity.vn/dien-thoai

5. 💻 MÁY TÍNH BẢNG
   - iPad (Air, Pro, Mini) | Samsung Tab | Xiaomi Pad
   - 🔗 https://mobilecity.vn/may-tinh-bang

6. ⌚ ĐỒNG HỒ THÔNG MINH
   - Apple Watch Series 9, Ultra 2, SE | Samsung Galaxy Watch 6, 7
   - 🔗 https://mobilecity.vn/phu-kien-dong-ho-thong-minh

7. 🎧 PHỤ KIỆN
   - AirPods, tai nghe Samsung, ốp lưng, sạc
   - 🔗 https://mobilecity.vn/phu-kien

=== CHÍNH SÁCH ===
- Bảo hành: 12-18 tháng | Trả góp: 0% lãi suất, duyệt 15 phút
- Đổi trả: 30 ngày nếu lỗi NSX | Giao hàng: 2 giờ nội thành HN & HCM

=== NHÂN VIÊN TƯ VẤN ===
- 👤 Nguyễn Văn Hùng  | Trưởng phòng | 📞 0912 111 222 | hung.nguyen@mobilecity.vn
- 👤 Trần Thị Mai     | Chuyên viên  | 📞 0923 333 444 | mai.tran@mobilecity.vn
- 👤 Lê Minh Tuấn     | Chuyên viên  | 📞 0934 555 666 | tuan.le@mobilecity.vn

=== QUY TẮC TRẢ LỜI ===
1. Thân thiện như bạn bè tư vấn nhau, kèm emoji tự nhiên
2. Hỏi giá → đưa con số cụ thể luôn
3. So sánh → chỉ ra thẳng cái nào tốt hơn
4. TỒN KHO → PHẢI dùng thông tin từ [THÔNG TIN TỒN KHO THỰC TẾ] bên dưới
   - stock = 0 → báo HẾT HÀNG, gợi ý sản phẩm tương tự còn hàng
   - stock <= 3 → báo SẮP HẾT, khuyên đặt ngay
   - stock > 3 → báo CÒN HÀNG
5. Đặt hàng → hỏi: tên, SĐT, địa chỉ, sản phẩm; xác nhận rồi báo NV liên hệ 30 phút
6. Muốn gặp NV → giới thiệu CỤ THỂ một nhân viên kèm SĐT
7. KHÔNG tự bịa link, chỉ dùng link đã cung cấp
"""

def ask_gemini(user_message: str, history: list = [], state: dict = {},
               inventory_info: str = "") -> str:
    try:
        contents = []
        for h in history[-20:]:
            contents.append(types.Content(
                role=h["role"],
                parts=[types.Part(text=h["parts"][0])]
            ))
        state_text = (
            f"\n\n[TRẠNG THÁI HIỆN TẠI: {json.dumps(state, ensure_ascii=False)}]"
            if state else ""
        )
        # Thêm thông tin tồn kho vào prompt
        inventory_text = f"\n\n{inventory_info}" if inventory_info else ""

        contents.append(types.Content(
            role="user",
            parts=[types.Part(text=f"{SYSTEM_PROMPT}{inventory_text}{state_text}\n\nKhách hàng: {user_message}")]
        ))
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=contents
        )
        return response.text
    except Exception as e:
        print(f"[GEMINI ERROR] {e}")
        return "Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau."


def get_history(tracker) -> list:
    history = []
    for event in tracker.events:
        if event.get("event") == "user":
            text = event.get("text", "")
            if text:
                history.append({"role": "user", "parts": [text]})
        elif event.get("event") == "bot":
            text = event.get("text", "")
            if text:
                history.append({"role": "model", "parts": [text]})
    return history[-20:]


def get_state(tracker) -> dict:
    return {
        "ho_ten": tracker.get_slot("name"),
        "so_dien_thoai": tracker.get_slot("phone"),
        "dia_chi": tracker.get_slot("address"),
        "san_pham_muon_dat": tracker.get_slot("product"),
        "ngan_sach": tracker.get_slot("budget"),
    }

def extract_keyword(message: str) -> str:
    """Trích từ khóa sản phẩm từ tin nhắn để query DB."""
    brands = ["iphone", "samsung", "oppo", "xiaomi", "realme", "vivo",
              "ipad", "apple watch", "redmi", "poco", "galaxy"]
    msg_lower = message.lower()
    for brand in brands:
        if brand in msg_lower:
            return brand
    return ""


# ─────────────────────────────────────────────
# ACTIONS
# ─────────────────────────────────────────────

class ActionGeminiReply(Action):
    def name(self):
        return "action_gemini_reply"

    def run(self, dispatcher, tracker, domain):
        user_message = tracker.latest_message.get("text", "")
        history      = get_history(tracker)
        state        = get_state(tracker)
        intent       = tracker.latest_message.get("intent", {}).get("name")
        confidence   = tracker.latest_message.get("intent", {}).get("confidence")
        session_id   = tracker.sender_id

        # Log user message
        log_conversation(session_id, "user", user_message, intent, confidence)

        # Query tồn kho từ DB dựa theo keyword trong câu hỏi
        keyword = extract_keyword(user_message)
        inventory_info = get_inventory_info(keyword)

        reply = ask_gemini(user_message, history, state, inventory_info)
        dispatcher.utter_message(text=reply)

        # Log bot reply
        log_conversation(session_id, "bot", reply)
        return []


class ActionTriggerHandoff(Action):
    def name(self):
        return "action_trigger_handoff"

    def run(self, dispatcher, tracker, domain):
        history    = get_history(tracker)
        state      = get_state(tracker)
        session_id = tracker.sender_id

        fallback_count = sum(
            1 for e in tracker.events
            if e.get("event") == "action" and "fallback" in str(e.get("name", ""))
        )

        save_handoff_to_db(
            session_id=session_id,
            trigger="manual",
            fallback_count=fallback_count,
            customer_name=state.get("ho_ten"),
            customer_phone=state.get("so_dien_thoai"),
        )

        print("=" * 40)
        print("HANDOFF - Chuyển giao sang nhân viên MobileCity")
        for k, v in state.items():
            if v: print(f"  {k}: {v}")
        print(f"  Session: {session_id}")
        print("=" * 40)

        inventory_info = get_inventory_info()
        prompt = f"""
Khách hàng muốn gặp nhân viên tư vấn trực tiếp của MobileCity.
Thông tin đã biết về khách: {json.dumps(state, ensure_ascii=False)}

Hãy:
1. Thông báo đang kết nối với nhân viên tư vấn MobileCity phù hợp
2. Giới thiệu CỤ THỂ một nhân viên (tên, chức vụ, SĐT, email) từ danh sách
3. Nói rằng nhân viên sẽ liên hệ trong vòng 30 phút
4. Nếu khách chưa cung cấp số điện thoại, hỏi thêm để nhân viên có thể gọi lại
"""
        reply = ask_gemini(prompt, history, state, inventory_info)
        dispatcher.utter_message(text=reply)
        log_conversation(session_id, "bot", reply)
        return []


class ActionSaveLead(Action):
    def name(self):
        return "action_save_lead"

    def run(self, dispatcher, tracker, domain):
        state      = get_state(tracker)
        session_id = tracker.sender_id

        san_pham = state.get("san_pham_muon_dat") or ""

        # Kiểm tra tồn kho trước khi tạo đơn
        inventory_info = get_inventory_info(san_pham)

        order_code = save_order_to_db(
            session_id=session_id,
            ho_ten=state.get("ho_ten") or "",
            so_dien_thoai=state.get("so_dien_thoai") or "",
            dia_chi=state.get("dia_chi") or "",
            san_pham=san_pham,
        )

        print("=" * 40)
        print(f"ĐƠN HÀNG MỚI #{order_code}")
        for k, v in state.items():
            print(f"  {k}: {v}")
        print("=" * 40)

        prompt = f"""
Đã thu thập đủ thông tin đặt hàng của khách: {json.dumps(state, ensure_ascii=False)}
Mã đơn hàng được tạo: {order_code or 'đang xử lý'}

Dựa vào thông tin tồn kho thực tế để xác nhận:
- Nếu sản phẩm CÒN HÀNG: xác nhận đơn thành công, NV liên hệ 30 phút
- Nếu sản phẩm HẾT HÀNG: thông báo và gợi ý sản phẩm tương tự còn hàng

Hãy xác nhận một cách thân thiện và giới thiệu nhân viên phụ trách.
"""
        history = get_history(tracker)
        reply   = ask_gemini(prompt, history, state, inventory_info)
        dispatcher.utter_message(text=reply)
        log_conversation(session_id, "bot", reply)
        return []


class ActionCalculateQuote(Action):
    def name(self):
        return "action_calculate_quote"

    def run(self, dispatcher, tracker, domain):
        state      = get_state(tracker)
        history    = get_history(tracker)
        session_id = tracker.sender_id

        # Lấy tồn kho thực tế
        keyword = extract_keyword(tracker.latest_message.get("text", ""))
        inventory_info = get_inventory_info(keyword)

        prompt = f"""
Khách hàng muốn xem giá hoặc so sánh sản phẩm.
Thông tin: {json.dumps(state, ensure_ascii=False)}

Hãy:
1. Đưa ra thông tin giá tham khảo dựa trên tồn kho thực tế
2. Nếu sản phẩm HẾT HÀNG thì nói rõ và gợi ý sản phẩm tương tự còn hàng
3. Kèm link tham khảo thật
4. Giới thiệu chính sách trả góp 0% nếu phù hợp
"""
        reply = ask_gemini(prompt, history, state, inventory_info)
        dispatcher.utter_message(text=reply)
        log_conversation(session_id, "bot", reply)
        return []


# ─────────────────────────────────────────────
# FORM VALIDATION
# ─────────────────────────────────────────────

class ValidateCollectLeadForm(FormValidationAction):
    def name(self) -> Text:
        return "validate_collect_lead_form"

    async def validate_name(self, slot_value, dispatcher, tracker, domain):
        user_msg = tracker.latest_message.get("text", "").lower()
        keywords = ["iphone", "samsung", "oppo", "xiaomi", "ipad", "apple watch",
                    "giá", "so sánh", "trả góp", "bảo hành"]
        if any(k in user_msg for k in keywords):
            keyword = extract_keyword(user_msg)
            inventory_info = get_inventory_info(keyword)
            history = get_history(tracker)
            state   = get_state(tracker)
            reply   = ask_gemini(user_msg, history, state, inventory_info)
            dispatcher.utter_message(text=reply)
            dispatcher.utter_message(text="Anh/chị vui lòng cho mình biết họ tên để tiếp tục nhé?")
            return {"name": None}
        if any(x in user_msg for x in ["sửa", "đổi", "nhầm", "sua", "doi", "nham"]):
            dispatcher.utter_message(text="Anh/chị muốn sửa thông tin nào? Tên, số điện thoại hay địa chỉ?")
            return {"name": None}
        if slot_value and len(str(slot_value).strip()) > 0:
            return {"name": slot_value.strip()}
        dispatcher.utter_message(text="Anh/chị vui lòng nhập họ tên.")
        return {"name": None}

    async def validate_phone(self, slot_value, dispatcher, tracker, domain):
        user_msg = tracker.latest_message.get("text", "").lower()
        keywords = ["iphone", "samsung", "oppo", "xiaomi", "ipad", "apple watch",
                    "giá", "so sánh", "trả góp"]
        if any(k in user_msg for k in keywords):
            keyword = extract_keyword(user_msg)
            inventory_info = get_inventory_info(keyword)
            history = get_history(tracker)
            state   = get_state(tracker)
            reply   = ask_gemini(user_msg, history, state, inventory_info)
            dispatcher.utter_message(text=reply)
            dispatcher.utter_message(text="Số điện thoại liên hệ của anh/chị là gì?")
            return {"phone": None}
        if slot_value and len(str(slot_value).strip()) >= 8:
            return {"phone": slot_value.strip()}
        dispatcher.utter_message(text="Số điện thoại chưa hợp lệ, anh/chị vui lòng nhập lại.")
        return {"phone": None}

    async def validate_address(self, slot_value, dispatcher, tracker, domain):
        user_msg = tracker.latest_message.get("text", "").lower()
        keywords = ["iphone", "samsung", "oppo", "xiaomi", "ipad", "giá",
                    "so sánh", "trả góp"]
        if any(k in user_msg for k in keywords):
            keyword = extract_keyword(user_msg)
            inventory_info = get_inventory_info(keyword)
            history = get_history(tracker)
            state   = get_state(tracker)
            reply   = ask_gemini(user_msg, history, state, inventory_info)
            dispatcher.utter_message(text=reply)
            dispatcher.utter_message(text="Địa chỉ giao hàng của anh/chị?")
            return {"address": None}
        if slot_value and len(str(slot_value).strip()) > 0:
            return {"address": slot_value.strip()}
        dispatcher.utter_message(text="Anh/chị vui lòng nhập địa chỉ giao hàng.")
        return {"address": None}

    async def validate_product(self, slot_value, dispatcher, tracker, domain):
        if slot_value and len(str(slot_value).strip()) > 0:
            return {"product": slot_value.strip()}
        dispatcher.utter_message(text="Anh/chị muốn đặt sản phẩm nào?")
        return {"product": None}