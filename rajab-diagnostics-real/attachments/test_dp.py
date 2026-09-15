# ملف test_db.py
from database import init_db, get_db_connection

def test_connection():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT version()")
        version = cur.fetchone()
        print(f"✅ متصل بنجاح: {version[0]}")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ خطأ في الاتصال: {e}")

if __name__ == "__main__":
    test_connection()