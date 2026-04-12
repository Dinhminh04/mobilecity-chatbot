from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from contextlib import contextmanager
import os
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

app = FastAPI(title="MobileCity Admin API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://mobilecity:mobilecity123@postgres:5432/mobilecity_db")
engine = create_engine(DATABASE_URL)

def get_db():
    with engine.connect() as conn:
        yield conn

# ── PYDANTIC MODELS ──────────────────────────────────────────

class ProductCreate(BaseModel):
    name: str
    brand: str
    price: int
    original_price: Optional[int] = None
    stock: int = 0
    specs: Optional[dict] = None
    features: Optional[list] = None
    warranty_months: int = 12
    image_url: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    price: Optional[int] = None
    original_price: Optional[int] = None
    stock: Optional[int] = None
    specs: Optional[dict] = None
    features: Optional[list] = None
    warranty_months: Optional[int] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class OrderStatusUpdate(BaseModel):
    status: str

class HandoffUpdate(BaseModel):
    status: str
    assigned_staff: Optional[str] = None
    note: Optional[str] = None

# ── DASHBOARD ────────────────────────────────────────────────

@app.get("/api/dashboard/stats")
def get_dashboard_stats(db=Depends(get_db)):
    stats = {}

    r = db.execute(text("SELECT COUNT(*) FROM products WHERE is_active = TRUE")).scalar()
    stats["total_products"] = r

    r = db.execute(text("SELECT COUNT(*) FROM orders")).scalar()
    stats["total_orders"] = r

    r = db.execute(text("SELECT COUNT(DISTINCT session_id) FROM conversations")).scalar()
    stats["total_sessions"] = r

    r = db.execute(text("SELECT COUNT(*) FROM handoff_requests WHERE status = 'pending'")).scalar()
    stats["pending_handoffs"] = r

    r = db.execute(text("SELECT COALESCE(SUM(p.price), 0) FROM orders o JOIN products p ON o.product_id = p.id WHERE o.status = 'delivered'")).scalar()
    stats["total_revenue"] = int(r)

    r = db.execute(text("SELECT COUNT(*) FROM orders WHERE status = 'pending'")).scalar()
    stats["pending_orders"] = r

    # Orders by status
    rows = db.execute(text("""
        SELECT status, COUNT(*) as count FROM orders GROUP BY status
    """)).fetchall()
    stats["orders_by_status"] = [{"status": row[0], "count": row[1]} for row in rows]

    # Recent orders
    rows = db.execute(text("""
        SELECT o.id, o.order_code, o.customer_name, o.customer_phone,
               p.name as product_name, o.status, o.created_at
        FROM orders o LEFT JOIN products p ON o.product_id = p.id
        ORDER BY o.created_at DESC LIMIT 5
    """)).fetchall()
    stats["recent_orders"] = [dict(row._mapping) for row in rows]

    # Top products
    rows = db.execute(text("""
        SELECT p.name, p.brand, COUNT(o.id) as order_count
        FROM products p LEFT JOIN orders o ON p.id = o.product_id
        GROUP BY p.id, p.name, p.brand
        ORDER BY order_count DESC LIMIT 5
    """)).fetchall()
    stats["top_products"] = [dict(row._mapping) for row in rows]

    return stats

# ── PRODUCTS ─────────────────────────────────────────────────

@app.get("/api/products")
def get_products(
    page: int = 1, limit: int = 10,
    brand: Optional[str] = None,
    search: Optional[str] = None,
    db=Depends(get_db)
):
    offset = (page - 1) * limit
    where = ["is_active = TRUE"]
    params = {"limit": limit, "offset": offset}

    if brand:
        where.append("brand = :brand")
        params["brand"] = brand
    if search:
        where.append("(name ILIKE :search OR brand ILIKE :search)")
        params["search"] = f"%{search}%"

    where_clause = " AND ".join(where)

    total = db.execute(text(f"SELECT COUNT(*) FROM products WHERE {where_clause}"), params).scalar()
    rows = db.execute(text(f"""
        SELECT * FROM products WHERE {where_clause}
        ORDER BY created_at DESC LIMIT :limit OFFSET :offset
    """), params).fetchall()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "data": [dict(row._mapping) for row in rows]
    }

@app.get("/api/products/{product_id}")
def get_product(product_id: int, db=Depends(get_db)):
    row = db.execute(text("SELECT * FROM products WHERE id = :id"), {"id": product_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    return dict(row._mapping)

@app.post("/api/products", status_code=201)
def create_product(product: ProductCreate, db=Depends(get_db)):
    import json
    specs_json = json.dumps(product.specs) if product.specs else None
    result = db.execute(text("""
        INSERT INTO products (name, brand, price, original_price, stock, specs, features, warranty_months, image_url)
        VALUES (:name, :brand, :price, :original_price, :stock, :specs::jsonb, :features, :warranty_months, :image_url)
        RETURNING id
    """), {
        "name": product.name, "brand": product.brand, "price": product.price,
        "original_price": product.original_price, "stock": product.stock,
        "specs": specs_json, "features": product.features,
        "warranty_months": product.warranty_months, "image_url": product.image_url
    })
    db.commit()
    return {"id": result.scalar(), "message": "Product created"}

@app.put("/api/products/{product_id}")
def update_product(product_id: int, product: ProductUpdate, db=Depends(get_db)):
    import json
    fields = {}
    if product.name is not None: fields["name"] = product.name
    if product.brand is not None: fields["brand"] = product.brand
    if product.price is not None: fields["price"] = product.price
    if product.original_price is not None: fields["original_price"] = product.original_price
    if product.stock is not None: fields["stock"] = product.stock
    if product.specs is not None: fields["specs"] = json.dumps(product.specs)
    if product.features is not None: fields["features"] = product.features
    if product.warranty_months is not None: fields["warranty_months"] = product.warranty_months
    if product.image_url is not None: fields["image_url"] = product.image_url
    if product.is_active is not None: fields["is_active"] = product.is_active

    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join([f"{k} = :{k}" for k in fields])
    fields["id"] = product_id
    db.execute(text(f"UPDATE products SET {set_clause}, updated_at = NOW() WHERE id = :id"), fields)
    db.commit()
    return {"message": "Product updated"}

@app.delete("/api/products/{product_id}")
def delete_product(product_id: int, db=Depends(get_db)):
    db.execute(text("UPDATE products SET is_active = FALSE WHERE id = :id"), {"id": product_id})
    db.commit()
    return {"message": "Product deleted"}

# ── ORDERS ───────────────────────────────────────────────────

@app.get("/api/orders")
def get_orders(
    page: int = 1, limit: int = 10,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db=Depends(get_db)
):
    offset = (page - 1) * limit
    where = ["1=1"]
    params = {"limit": limit, "offset": offset}

    if status:
        where.append("o.status = :status")
        params["status"] = status
    if search:
        where.append("(o.customer_name ILIKE :search OR o.order_code ILIKE :search OR o.customer_phone ILIKE :search)")
        params["search"] = f"%{search}%"

    where_clause = " AND ".join(where)

    total = db.execute(text(f"SELECT COUNT(*) FROM orders o WHERE {where_clause}"), params).scalar()
    rows = db.execute(text(f"""
        SELECT o.*, p.name as product_name, p.brand as product_brand, p.price as product_price
        FROM orders o LEFT JOIN products p ON o.product_id = p.id
        WHERE {where_clause}
        ORDER BY o.created_at DESC LIMIT :limit OFFSET :offset
    """), params).fetchall()

    return {
        "total": total, "page": page, "limit": limit,
        "data": [dict(row._mapping) for row in rows]
    }

@app.put("/api/orders/{order_id}/status")
def update_order_status(order_id: int, body: OrderStatusUpdate, db=Depends(get_db)):
    valid = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]
    if body.status not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid}")
    db.execute(text("UPDATE orders SET status = :status, updated_at = NOW() WHERE id = :id"),
               {"status": body.status, "id": order_id})
    db.commit()
    return {"message": "Order status updated"}

# ── CONVERSATIONS ─────────────────────────────────────────────

@app.get("/api/conversations")
def get_conversations(page: int = 1, limit: int = 10, db=Depends(get_db)):
    offset = (page - 1) * limit
    total = db.execute(text("SELECT COUNT(DISTINCT session_id) FROM conversations")).scalar()
    rows = db.execute(text("""
        SELECT session_id,
               COUNT(*) as message_count,
               MIN(timestamp) as started_at,
               MAX(timestamp) as last_message_at,
               MAX(CASE WHEN sender = 'user' THEN message END) as last_user_message
        FROM conversations
        GROUP BY session_id
        ORDER BY last_message_at DESC
        LIMIT :limit OFFSET :offset
    """), {"limit": limit, "offset": offset}).fetchall()

    return {
        "total": total, "page": page, "limit": limit,
        "data": [dict(row._mapping) for row in rows]
    }

@app.get("/api/conversations/{session_id}")
def get_conversation_detail(session_id: str, db=Depends(get_db)):
    rows = db.execute(text("""
        SELECT * FROM conversations WHERE session_id = :sid ORDER BY timestamp ASC
    """), {"sid": session_id}).fetchall()
    return {"session_id": session_id, "messages": [dict(row._mapping) for row in rows]}

# ── HANDOFF REQUESTS ──────────────────────────────────────────

@app.get("/api/handoffs")
def get_handoffs(page: int = 1, limit: int = 10, status: Optional[str] = None, db=Depends(get_db)):
    offset = (page - 1) * limit
    where = ["1=1"]
    params = {"limit": limit, "offset": offset}

    if status:
        where.append("status = :status")
        params["status"] = status

    where_clause = " AND ".join(where)
    total = db.execute(text(f"SELECT COUNT(*) FROM handoff_requests WHERE {where_clause}"), params).scalar()
    rows = db.execute(text(f"""
        SELECT * FROM handoff_requests WHERE {where_clause}
        ORDER BY created_at DESC LIMIT :limit OFFSET :offset
    """), params).fetchall()

    return {
        "total": total, "page": page, "limit": limit,
        "data": [dict(row._mapping) for row in rows]
    }

@app.put("/api/handoffs/{handoff_id}")
def update_handoff(handoff_id: int, body: HandoffUpdate, db=Depends(get_db)):
    params = {"id": handoff_id, "status": body.status}
    extra = ""
    if body.assigned_staff:
        params["assigned_staff"] = body.assigned_staff
        extra += ", assigned_staff = :assigned_staff"
    if body.note:
        params["note"] = body.note
        extra += ", note = :note"
    if body.status == "resolved":
        extra += ", resolved_at = NOW()"

    db.execute(text(f"UPDATE handoff_requests SET status = :status{extra} WHERE id = :id"), params)
    db.commit()
    return {"message": "Handoff updated"}

# ── RASA WEBHOOK (nhận conversation từ Rasa) ─────────────────

class RasaMessage(BaseModel):
    session_id: str
    sender: str
    message: str
    intent: Optional[str] = None
    confidence: Optional[float] = None
    entities: Optional[dict] = None

@app.post("/api/rasa/log")
def log_rasa_message(msg: RasaMessage, db=Depends(get_db)):
    import json
    db.execute(text("""
        INSERT INTO conversations (session_id, sender, message, intent, confidence, entities)
        VALUES (:session_id, :sender, :message, :intent, :confidence, :entities::jsonb)
    """), {
        "session_id": msg.session_id, "sender": msg.sender, "message": msg.message,
        "intent": msg.intent, "confidence": msg.confidence,
        "entities": json.dumps(msg.entities) if msg.entities else None
    })
    db.commit()
    return {"message": "Logged"}

@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}
