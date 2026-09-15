import os
from datetime import datetime
import pg8000
from pg8000.native import Connection, DatabaseError
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# الحصول على رابط قاعدة البيانات من المتغيرات البيئية
DATABASE_URL = os.getenv('DATABASE_URL')

def get_db_connection():
    """إنشاء اتصال بقاعدة البيانات باستخدام pg8000"""
    if not DATABASE_URL:
        raise ValueError("❌ DATABASE_URL غير موجود في المتغيرات البيئية")
    
    try:
        # تحليل URL
        # مثال: postgresql://user:password@host:port/database
        if DATABASE_URL.startswith('postgresql://'):
            parts = DATABASE_URL.replace('postgresql://', '').split('@')
            user_pass = parts[0].split(':')
            host_port_db = parts[1].split('/')
            host_port = host_port_db[0].split(':')
            
            user = user_pass[0]
            password = user_pass[1] if len(user_pass) > 1 else ''
            host = host_port[0]
            port = int(host_port[1]) if len(host_port) > 1 else 5432
            database = host_port_db[1] if len(host_port_db) > 1 else ''
            
            conn = Connection(
                user=user,
                password=password,
                host=host,
                port=port,
                database=database
            )
            logger.info("✅ تم الاتصال بقاعدة البيانات")
            return conn
        else:
            # لو كان مجرد نص connection string
            conn = Connection(DATABASE_URL)
            logger.info("✅ تم الاتصال بقاعدة البيانات")
            return conn
    except Exception as e:
        logger.error(f"❌ خطأ في الاتصال بقاعدة البيانات: {e}")
        raise

def init_db():
    """إنشاء جداول قاعدة البيانات في PostgreSQL"""
    conn = None
    try:
        conn = get_db_connection()
        
        # جدول المعامل
        conn.run('''
            CREATE TABLE IF NOT EXISTS labs (
                lab_id SERIAL PRIMARY KEY,
                lab_name TEXT UNIQUE NOT NULL,
                lab_password TEXT NOT NULL,
                phone TEXT,
                address TEXT,
                doctor_name TEXT,
                doctor_degree TEXT,
                doctor_specialty TEXT,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # جدول المستخدمين المسموح لهم
        conn.run('''
            CREATE TABLE IF NOT EXISTS lab_users (
                user_id BIGINT PRIMARY KEY,
                lab_id INTEGER NOT NULL,
                lab_name TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (lab_id) REFERENCES labs(lab_id) ON DELETE CASCADE
            )
        ''')
        
        # جدول التقارير
        conn.run('''
            CREATE TABLE IF NOT EXISTS reports (
                report_id SERIAL PRIMARY KEY,
                lab_id INTEGER NOT NULL,
                patient_name TEXT NOT NULL,
                age INTEGER,
                gender TEXT,
                doctor TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (lab_id) REFERENCES labs(lab_id) ON DELETE CASCADE
            )
        ''')
        
        # جدول نتائج التحاليل (معدل بإضافة custom_range)
        conn.run('''
            CREATE TABLE IF NOT EXISTS test_results (
                result_id SERIAL PRIMARY KEY,
                report_id INTEGER NOT NULL,
                test_name TEXT NOT NULL,
                result_value TEXT NOT NULL,
                custom_range TEXT,
                FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE
            )
        ''')
        
        # إنشاء فهارس للسرعة
        conn.run('CREATE INDEX IF NOT EXISTS idx_lab_users_user_id ON lab_users(user_id)')
        conn.run('CREATE INDEX IF NOT EXISTS idx_reports_lab_id ON reports(lab_id)')
        conn.run('CREATE INDEX IF NOT EXISTS idx_test_results_report_id ON test_results(report_id)')
        
        logger.info("✅ تم إنشاء جداول PostgreSQL بنجاح")
        
        # تأكد من وجود معمل المشرف
        ensure_admin_lab_exists()
    except Exception as e:
        logger.error(f"❌ خطأ في إنشاء الجداول: {e}")
    finally:
        if conn:
            conn.close()

def ensure_admin_lab_exists():
    """التأكد من وجود معمل المشرف"""
    conn = None
    try:
        conn = get_db_connection()
        
        # استخدم نفس البيانات من bot.py
        ADMIN_LAB_NAME = "Rajab"  # نفس الاسم
        ADMIN_PASSWORD = "2030"    # نفس كلمة السر
        
        # شوف إذا كان المعمل موجود
        result = conn.run("SELECT lab_id FROM labs WHERE lab_name = :1", (ADMIN_LAB_NAME,))
        
        if not result:
            # أنشئ المعمل
            result = conn.run("""
                INSERT INTO labs (lab_name, lab_password) 
                VALUES (:1, :2)
                RETURNING lab_id
            """, (ADMIN_LAB_NAME, ADMIN_PASSWORD))
            lab_id = result[0][0]
            logger.info(f"✅ تم إنشاء معمل {ADMIN_LAB_NAME}")
            logger.info(f"🔑 كلمة السر: {ADMIN_PASSWORD}")
    except Exception as e:
        logger.error(f"❌ خطأ في إنشاء معمل المشرف: {e}")
    finally:
        if conn:
            conn.close()

# ================= دوال المعامل =================

def register_lab(lab_name, lab_password):
    """تسجيل معمل جديد (للمشرف فقط)"""
    conn = None
    try:
        conn = get_db_connection()
        result = conn.run("""
            INSERT INTO labs (lab_name, lab_password) 
            VALUES (:1, :2)
            RETURNING lab_id
        """, (lab_name, lab_password))
        lab_id = result[0][0]
        logger.info(f"✅ تم تسجيل معمل جديد: {lab_name}")
        return lab_id
    except Exception as e:
        logger.error(f"❌ خطأ في تسجيل معمل: {e}")
        return None
    finally:
        if conn:
            conn.close()

def add_new_lab(lab_name, lab_password):
    """إضافة معمل جديد (للمشرف فقط)"""
    return register_lab(lab_name, lab_password)

def verify_lab(lab_name, lab_password):
    """التحقق من صحة بيانات المعمل"""
    conn = None
    try:
        conn = get_db_connection()
        result = conn.run("""
            SELECT lab_id, lab_name FROM labs 
            WHERE lab_name = :1 AND lab_password = :2
        """, (lab_name, lab_password))
        
        if result:
            return (result[0][0], result[0][1])
        return None
    except Exception as e:
        logger.error(f"❌ خطأ في التحقق من المعمل: {e}")
        return None
    finally:
        if conn:
            conn.close()

def add_lab_user(user_id, lab_id, lab_name):
    """إضافة مستخدم لمعمل"""
    conn = None
    try:
        conn = get_db_connection()
        conn.run("""
            INSERT INTO lab_users (user_id, lab_id, lab_name) 
            VALUES (:1, :2, :3)
            ON CONFLICT (user_id) 
            DO UPDATE SET lab_id = :2, lab_name = :3
        """, (user_id, lab_id, lab_name))
        logger.info(f"✅ تم إضافة مستخدم {user_id} إلى معمل {lab_name}")
        return True
    except Exception as e:
        logger.error(f"❌ خطأ في إضافة مستخدم: {e}")
        return False
    finally:
        if conn:
            conn.close()

def get_lab_by_user(user_id):
    """الحصول على معمل المستخدم"""
    conn = None
    try:
        conn = get_db_connection()
        result = conn.run("""
            SELECT lab_id, lab_name FROM lab_users 
            WHERE user_id = :1
        """, (user_id,))
        
        if result:
            return (result[0][0], result[0][1])
        return None
    except Exception as e:
        logger.error(f"❌ خطأ في الحصول على معمل المستخدم: {e}")
        return None
    finally:
        if conn:
            conn.close()

def get_lab_name(user_id):
    """الحصول على اسم المعمل (للتوافق مع الكود القديم)"""
    lab_info = get_lab_by_user(user_id)
    return lab_info[1] if lab_info else None

def get_all_labs():
    """الحصول على جميع المعامل (للمشرف فقط)"""
    conn = None
    try:
        conn = get_db_connection()
        result = conn.run("""
            SELECT lab_id, lab_name, lab_password, phone, address, 
                   doctor_name, doctor_degree, doctor_specialty, created_at 
            FROM labs 
            ORDER BY lab_id
        """)
        
        labs = []
        for row in result:
            labs.append({
                'lab_id': row[0],
                'lab_name': row[1],
                'lab_password': row[2],
                'phone': row[3],
                'address': row[4],
                'doctor_name': row[5],
                'doctor_degree': row[6],
                'doctor_specialty': row[7],
                'created_at': row[8]
            })
        return labs
    except Exception as e:
        logger.error(f"❌ خطأ في الحصول على المعامل: {e}")
        return []
    finally:
        if conn:
            conn.close()

def delete_lab(lab_id):
    """حذف معمل (للمشرف فقط)"""
    conn = None
    try:
        conn = get_db_connection()
        conn.run("DELETE FROM labs WHERE lab_id = :1", (lab_id,))
        logger.info(f"✅ تم حذف معمل {lab_id}")
        return True
    except Exception as e:
        logger.error(f"❌ خطأ في حذف معمل: {e}")
        return False
    finally:
        if conn:
            conn.close()

# ================= دوال التقارير =================

def create_report(user_id, patient_data):
    """إنشاء تقرير جديد"""
    lab_info = get_lab_by_user(user_id)
    if not lab_info:
        logger.error(f"❌ المستخدم {user_id} ليس لديه معمل")
        return None
    
    lab_id = lab_info[0]
    
    conn = None
    try:
        conn = get_db_connection()
        result = conn.run('''
            INSERT INTO reports (lab_id, patient_name, age, gender, doctor)
            VALUES (:1, :2, :3, :4, :5)
            RETURNING report_id
        ''', (lab_id, patient_data['name'], patient_data['age'], 
              patient_data['gender'], patient_data['doctor']))
        report_id = result[0][0]
        logger.info(f"✅ تم إنشاء تقرير جديد: {report_id}")
        return report_id
    except Exception as e:
        logger.error(f"❌ خطأ في إنشاء تقرير: {e}")
        return None
    finally:
        if conn:
            conn.close()

def add_test_to_report(report_id, test_name, result_value, custom_range=None):
    """إضافة تحليل للتقرير مع دعم المدى المخصص"""
    conn = None
    try:
        conn = get_db_connection()
        conn.run('''
            INSERT INTO test_results (report_id, test_name, result_value, custom_range)
            VALUES (:1, :2, :3, :4)
        ''', (report_id, test_name, result_value, custom_range))
        logger.info(f"✅ تم إضافة تحليل {test_name} للتقرير {report_id}")
        return True
    except Exception as e:
        logger.error(f"❌ خطأ في إضافة تحليل: {e}")
        return False
    finally:
        if conn:
            conn.close()

def get_report_details(report_id):
    """الحصول على تفاصيل التقرير"""
    conn = None
    try:
        conn = get_db_connection()
        
        # معلومات التقرير مع اسم المعمل
        report_result = conn.run('''
            SELECT r.report_id, r.lab_id, r.patient_name, r.age, r.gender, r.doctor, r.created_at, 
                   l.lab_name, l.phone, l.address, l.doctor_name, l.doctor_degree, l.doctor_specialty
            FROM reports r
            JOIN labs l ON r.lab_id = l.lab_id
            WHERE r.report_id = :1
        ''', (report_id,))
        
        if not report_result:
            return None
        
        row = report_result[0]
        report = {
            'report_id': row[0],
            'lab_id': row[1],
            'patient_name': row[2],
            'age': row[3],
            'gender': row[4],
            'doctor': row[5],
            'created_at': row[6],
            'lab_name': row[7],
            'phone': row[8],
            'address': row[9],
            'doctor_name': row[10],
            'doctor_degree': row[11],
            'doctor_specialty': row[12]
        }
        
        # التحاليل مع custom_range
        tests_result = conn.run('''
            SELECT test_name, result_value, custom_range
            FROM test_results 
            WHERE report_id = :1
        ''', (report_id,))
        
        tests = []
        for test_row in tests_result:
            tests.append({
                'test_name': test_row[0],
                'result_value': test_row[1],
                'custom_range': test_row[2]
            })
        
        report['tests'] = tests
        return report
    except Exception as e:
        logger.error(f"❌ خطأ في الحصول على تفاصيل التقرير: {e}")
        return None
    finally:
        if conn:
            conn.close()

def get_report_with_normal_ranges(report_id):
    """الحصول على التقرير مع المدى الطبيعي"""
    try:
        from tests_data import get_normal_range, get_test_unit
    except ImportError:
        # لو ملف tests_data مش موجود
        def get_normal_range(test_name, gender): return "غير محدد"
        def get_test_unit(test_name): return ""
    
    report = get_report_details(report_id)
    if not report:
        return None
    
    # إضافة المدى الطبيعي لكل تحليل
    for test in report['tests']:
        test['unit'] = get_test_unit(test['test_name'])
        # استخدم custom_range إذا موجود، وإلا استخدم المدى الطبيعي
        if test.get('custom_range'):
            test['normal_range'] = test['custom_range']
        else:
            test['normal_range'] = get_normal_range(test['test_name'], report.get('gender', 'ذكر'))
    
    return report

# ================= دوال إضافية للتوافق =================

def save_lab_details(lab_id, **kwargs):
    """
    حفظ تفاصيل المختبر
    """
    conn = None
    try:
        conn = get_db_connection()
        
        fields = []
        values = []
        
        for key, value in kwargs.items():
            fields.append(f"{key} = :{len(values)+1}")
            values.append(value)
        
        if not fields:
            return True
        
        values.append(lab_id)
        query = f"UPDATE labs SET {', '.join(fields)} WHERE lab_id = :{len(values)}"
        
        conn.run(query, tuple(values))
        logger.info(f"✅ تم حفظ تفاصيل المختبر {lab_id}")
        return True
    except Exception as e:
        logger.error(f"❌ خطأ في حفظ تفاصيل المختبر: {e}")
        return False
    finally:
        if conn:
            conn.close()

def get_lab_details(lab_id):
    """
    استرجاع تفاصيل المختبر
    """
    conn = None
    try:
        conn = get_db_connection()
        result = conn.run("""
            SELECT phone, address, doctor_name, doctor_degree, doctor_specialty, details 
            FROM labs WHERE lab_id = :1
        """, (lab_id,))
        
        if result and result[0]:
            row = result[0]
            return {
                'phone': row[0],
                'address': row[1],
                'doctor_name': row[2],
                'doctor_degree': row[3],
                'doctor_specialty': row[4],
                'details': row[5]
            }
        return {
            'phone': '',
            'address': '',
            'doctor_name': '',
            'doctor_degree': '',
            'doctor_specialty': '',
            'details': ''
        }
    except Exception as e:
        logger.error(f"❌ خطأ في استرجاع تفاصيل المختبر: {e}")
        return {}
    finally:
        if conn:
            conn.close()# ================= دوال المعامل =================

def register_lab(lab_name, lab_password):
    """تسجيل معمل جديد (للمشرف فقط)"""
    conn = None
    try:
        conn = get_db_connection()
        result = conn.run("""
            INSERT INTO labs (lab_name, lab_password) 
            VALUES (:1, :2)
            RETURNING lab_id
        """, (lab_name, lab_password))
        lab_id = result[0][0]
        logger.info(f"✅ تم تسجيل معمل جديد: {lab_name}")
        return lab_id
    except Exception as e:
        logger.error(f"❌ خطأ في تسجيل معمل: {e}")
        return None
    finally:
        if conn:
            conn.close()

def add_new_lab(lab_name, lab_password):
    """إضافة معمل جديد (للمشرف فقط)"""
    return register_lab(lab_name, lab_password)

def verify_lab(lab_name, lab_password):
    """التحقق من صحة بيانات المعمل"""
    conn = None
    try:
        conn = get_db_connection()
        result = conn.run("""
            SELECT lab_id, lab_name FROM labs 
            WHERE lab_name = :1 AND lab_password = :2
        """, (lab_name, lab_password))
        
        if result:
            return (result[0][0], result[0][1])
        return None
    except Exception as e:
        logger.error(f"❌ خطأ في التحقق من المعمل: {e}")
        return None
    finally:
        if conn:
            conn.close()

def add_lab_user(user_id, lab_id, lab_name):
    """إضافة مستخدم لمعمل"""
    conn = None
    try:
        conn = get_db_connection()
        conn.run("""
            INSERT INTO lab_users (user_id, lab_id, lab_name) 
            VALUES (:1, :2, :3)
            ON CONFLICT (user_id) 
            DO UPDATE SET lab_id = :2, lab_name = :3
        """, (user_id, lab_id, lab_name))
        logger.info(f"✅ تم إضافة مستخدم {user_id} إلى معمل {lab_name}")
        return True
    except Exception as e:
        logger.error(f"❌ خطأ في إضافة مستخدم: {e}")
        return False
    finally:
        if conn:
            conn.close()

def get_lab_by_user(user_id):
    """الحصول على معمل المستخدم"""
    conn = None
    try:
        conn = get_db_connection()
        result = conn.run("""
            SELECT lab_id, lab_name FROM lab_users 
            WHERE user_id = :1
        """, (user_id,))
        
        if result:
            return (result[0][0], result[0][1])
        return None
    except Exception as e:
        logger.error(f"❌ خطأ في الحصول على معمل المستخدم: {e}")
        return None
    finally:
        if conn:
            conn.close()

def get_lab_name(user_id):
    """الحصول على اسم المعمل (للتوافق مع الكود القديم)"""
    lab_info = get_lab_by_user(user_id)
    return lab_info[1] if lab_info else None

def get_all_labs():
    """الحصول على جميع المعامل (للمشرف فقط)"""
    conn = None
    try:
        conn = get_db_connection()
        result = conn.run("""
            SELECT lab_id, lab_name, lab_password, created_at 
            FROM labs 
            ORDER BY lab_id
        """)
        
        labs = []
        for row in result:
            labs.append({
                'lab_id': row[0],
                'lab_name': row[1],
                'lab_password': row[2],
                'created_at': row[3]
            })
        return labs
    except Exception as e:
        logger.error(f"❌ خطأ في الحصول على المعامل: {e}")
        return []
    finally:
        if conn:
            conn.close()

def delete_lab(lab_id):
    """حذف معمل (للمشرف فقط)"""
    conn = None
    try:
        conn = get_db_connection()
        conn.run("DELETE FROM labs WHERE lab_id = :1", (lab_id,))
        logger.info(f"✅ تم حذف معمل {lab_id}")
        return True
    except Exception as e:
        logger.error(f"❌ خطأ في حذف معمل: {e}")
        return False
    finally:
        if conn:
            conn.close()

# ================= دوال التقارير =================

def create_report(user_id, patient_data):
    """إنشاء تقرير جديد"""
    lab_info = get_lab_by_user(user_id)
    if not lab_info:
        logger.error(f"❌ المستخدم {user_id} ليس لديه معمل")
        return None
    
    lab_id = lab_info[0]
    
    conn = None
    try:
        conn = get_db_connection()
        result = conn.run('''
            INSERT INTO reports (lab_id, patient_name, age, gender, doctor)
            VALUES (:1, :2, :3, :4, :5)
            RETURNING report_id
        ''', (lab_id, patient_data['name'], patient_data['age'], 
              patient_data['gender'], patient_data['doctor']))
        report_id = result[0][0]
        logger.info(f"✅ تم إنشاء تقرير جديد: {report_id}")
        return report_id
    except Exception as e:
        logger.error(f"❌ خطأ في إنشاء تقرير: {e}")
        return None
    finally:
        if conn:
            conn.close()

def add_test_to_report(report_id, test_name, result_value):
    """إضافة تحليل للتقرير"""
    conn = None
    try:
        conn = get_db_connection()
        conn.run('''
            INSERT INTO test_results (report_id, test_name, result_value)
            VALUES (:1, :2, :3)
        ''', (report_id, test_name, result_value))
        logger.info(f"✅ تم إضافة تحليل {test_name} للتقرير {report_id}")
        return True
    except Exception as e:
        logger.error(f"❌ خطأ في إضافة تحليل: {e}")
        return False
    finally:
        if conn:
            conn.close()

def get_report_details(report_id):
    """الحصول على تفاصيل التقرير"""
    conn = None
    try:
        conn = get_db_connection()
        
        # معلومات التقرير مع اسم المعمل
        report_result = conn.run('''
            SELECT r.report_id, r.lab_id, r.patient_name, r.age, r.gender, r.doctor, r.created_at, l.lab_name 
            FROM reports r
            JOIN labs l ON r.lab_id = l.lab_id
            WHERE r.report_id = :1
        ''', (report_id,))
        
        if not report_result:
            return None
        
        row = report_result[0]
        report = {
            'report_id': row[0],
            'lab_id': row[1],
            'patient_name': row[2],
            'age': row[3],
            'gender': row[4],
            'doctor': row[5],
            'created_at': row[6],
            'lab_name': row[7]
        }
        
        # التحاليل
        tests_result = conn.run('''
            SELECT test_name, result_value 
            FROM test_results 
            WHERE report_id = :1
        ''', (report_id,))
        
        tests = []
        for test_row in tests_result:
            tests.append({
                'test_name': test_row[0],
                'result_value': test_row[1]
            })
        
        report['tests'] = tests
        return report
    except Exception as e:
        logger.error(f"❌ خطأ في الحصول على تفاصيل التقرير: {e}")
        return None
    finally:
        if conn:
            conn.close()

def get_report_with_normal_ranges(report_id):
    """الحصول على التقرير مع المدى الطبيعي"""
    try:
        from tests_data import get_normal_range, get_test_unit
    except ImportError:
        # لو ملف tests_data مش موجود
        def get_normal_range(test_name, gender): return "غير محدد"
        def get_test_unit(test_name): return ""
    
    report = get_report_details(report_id)
    if not report:
        return None
    
    # إضافة المدى الطبيعي لكل تحليل
    for test in report['tests']:
        test['unit'] = get_test_unit(test['test_name'])
        test['normal_range'] = get_normal_range(test['test_name'], report.get('gender', 'ذكر'))
    
    return report

# ================= دوال إضافية للتوافق =================

def save_lab_details(lab_id, details):
    """
    حفظ تفاصيل المختبر
    """
    conn = None
    try:
        conn = get_db_connection()
        conn.run("UPDATE labs SET details = :1 WHERE lab_id = :2", (details, lab_id))
        logger.info(f"✅ تم حفظ تفاصيل المختبر {lab_id}")
        return True
    except Exception as e:
        logger.error(f"❌ خطأ في حفظ تفاصيل المختبر: {e}")
        return False
    finally:
        if conn:
            conn.close()

def get_lab_details(lab_id):
    """
    استرجاع تفاصيل المختبر
    """
    conn = None
    try:
        conn = get_db_connection()
        result = conn.run("SELECT details FROM labs WHERE lab_id = :1", (lab_id,))
        
        if result and result[0][0]:
            return result[0][0]
        return None
    except Exception as e:
        logger.error(f"❌ خطأ في استرجاع تفاصيل المختبر: {e}")
        return None
    finally:
        if conn:
            conn.close()
