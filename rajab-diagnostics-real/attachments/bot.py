import os
import logging
from telegram import Update, ReplyKeyboardRemove, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    ConversationHandler,
    filters,
    CallbackQueryHandler,
)

# استيراد جميع الدوال
from database import (
    init_db, get_lab_by_user, verify_lab,
    add_lab_user, create_report, add_test_to_report,
    get_report_details,
    get_report_with_normal_ranges,
    add_new_lab, get_all_labs, delete_lab,
    get_db_connection,  # save_lab_details تم إزالتها
    # get_lab_details تم إزالتها
    ensure_admin_lab_exists
)

from tests_data import (
    get_all_categories, get_tests_by_category,
    get_test_unit, get_normal_range
)

from pdf_generator import create_pdf_report

# إعدادات التسجيل
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

TOKEN = os.getenv("TOKEN")
if not TOKEN:
    raise ValueError("❌ لم يتم تعيين TOKEN في متغيرات البيئة")

# ================= ID المشرف =================
ADMIN_ID = 8226018082
ADMIN_LAB_NAME = "Rajab"
ADMIN_PASSWORD = "2030"

# ================= STATES =================
(ASK_LAB_NAME, ASK_LAB_PASSWORD, ASK_PATIENT_NAME, ASK_AGE, ASK_GENDER, 
 ASK_DOCTOR, ASK_TEST_CATEGORY, ASK_MULTIPLE_TESTS, ASK_TEST_RESULTS, 
 ASK_EDIT_MENU, ASK_EDIT_TEST, ASK_NEW_VALUE, ASK_NEW_RANGE) = range(13)

# ================= START & AUTH =================
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    # ====== لو المشرف ======
    if user_id == ADMIN_ID:
        lab_info = get_lab_by_user(user_id)
        
        if not lab_info:
            # شوف إذا كان المعمل الرئيسي موجود
            lab_info = verify_lab(ADMIN_LAB_NAME, ADMIN_PASSWORD)
            
            if lab_info:
                lab_id, lab_name = lab_info
                # سجل المستخدم في المعمل
                add_lab_user(user_id, lab_id, lab_name)
                lab_info = (lab_id, lab_name)
            else:
                # لو المعمل مش موجود، أنشئه
                lab_id = add_new_lab(ADMIN_LAB_NAME, ADMIN_PASSWORD)
                if lab_id:
                    add_lab_user(user_id, lab_id, ADMIN_LAB_NAME)
                    lab_info = (lab_id, ADMIN_LAB_NAME)
        
        if lab_info:
            lab_id, lab_name = lab_info
            context.user_data["lab_id"] = lab_id
            context.user_data["lab_name"] = lab_name
            
            await update.message.reply_text(
                f"👋 مرحباً بك يا مشرف!\n"
                f"🧪 أنت في معمل: {lab_name}\n\n"
                f"📋 الأوامر المتاحة:\n"
                f"/new - إنشاء تقرير جديد\n"
                f"/add_lab - إضافة معمل جديد\n"
                f"/list_labs - عرض المعامل\n"
                f"/delete_lab - حذف معمل\n"
                f"/lab_info - عرض معلومات المعمل\n"
                f"/set_phone - تعيين رقم الهاتف\n"
                f"/set_address - تعيين العنوان\n"
                f"/set_doctor_name - تعيين اسم الدكتور\n"
                f"/set_doctor_degree - تعيين الشهادة\n"
                f"/set_doctor_specialty - تعيين التخصص\n"
                f"/help - المساعدة\n"
                f"/cancel - إلغاء العملية"
            )
            return ConversationHandler.END
    
    # ====== للمستخدمين العاديين ======
    lab_info = get_lab_by_user(user_id)

    if lab_info:
        lab_id, lab_name = lab_info
        context.user_data["lab_id"] = lab_id
        context.user_data["lab_name"] = lab_name
        await update.message.reply_text(
            f"🧪 مرحباً بك في معمل ({lab_name})\n"
            "استخدم أمر /new لإنشاء تقرير جديد."
        )
        return ConversationHandler.END

    await update.message.reply_text(
        "🔐 نظام المعامل الطبية\n\n"
        "أدخل اسم المعمل الخاص بك:"
    )
    return ASK_LAB_NAME

async def get_lab_name(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data["temp_lab_name"] = update.message.text.strip()
    await update.message.reply_text("🔑 أدخل كلمة السر:")
    return ASK_LAB_PASSWORD

async def check_lab_password(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    lab_name = context.user_data.get("temp_lab_name")
    lab_password = update.message.text.strip()
    
    lab_info = verify_lab(lab_name, lab_password)
    
    if lab_info:
        lab_id, lab_name = lab_info
        
        if add_lab_user(user_id, lab_id, lab_name):
            context.user_data["lab_id"] = lab_id
            context.user_data["lab_name"] = lab_name
            
            await update.message.reply_text(
                f"✅ تم التحقق بنجاح!\n"
                f"مرحباً بك في معمل ({lab_name})"
            )
            
            await update.message.reply_text(
                "استخدم أمر /new لإنشاء تقرير جديد"
            )
            return ConversationHandler.END
        else:
            await update.message.reply_text("❌ حدث خطأ في التسجيل. حاول مرة أخرى.")
            return ConversationHandler.END
    else:
        await update.message.reply_text(
            "❌ اسم المعمل أو كلمة السر خطأ.\n"
            "أرسل /start للمحاولة مرة أخرى"
        )
        return ConversationHandler.END

# ================= أوامر المشرف =================
async def admin_add_lab(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    if user_id != ADMIN_ID:
        await update.message.reply_text("⛔ هذا الأمر للمشرف فقط")
        return
    
    try:
        if len(context.args) < 2:
            await update.message.reply_text(
                "❌ الاستخدام الصحيح:\n"
                "/add_lab [اسم المعمل] [كلمة السر]\n\n"
                "مثال:\n"
                "/add_lab معمل_النور 123456"
            )
            return
        
        lab_name = context.args[0]
        lab_password = context.args[1]
        
        lab_id = add_new_lab(lab_name, lab_password)
        
        if lab_id:
            await update.message.reply_text(
                f"✅ تم إضافة المعمل بنجاح!\n\n"
                f"📌 اسم المعمل: {lab_name}\n"
                f"🔑 كلمة السر: {lab_password}\n"
                f"🆔 رقم المعمل: {lab_id}\n\n"
                f"يمكن للمعمل الآن استخدام هذه البيانات للدخول"
            )
        else:
            await update.message.reply_text(
                "❌ فشل في إضافة المعمل\n"
                "تأكد أن اسم المعمل غير مكرر"
            )
    except Exception as e:
        await update.message.reply_text(f"❌ حدث خطأ: {str(e)}")

async def admin_list_labs(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    if user_id != ADMIN_ID:
        await update.message.reply_text("⛔ هذا الأمر للمشرف فقط")
        return
    
    labs = get_all_labs()
    
    if not labs:
        await update.message.reply_text("📭 لا توجد معامل مسجلة")
        return
    
    labs_text = "📋 قائمة المعامل المسجلة:\n\n"
    for lab in labs:
        created_date = str(lab[3])[:10] if lab[3] else "غير معروف"
        labs_text += f"🆔 {lab[0]} | 📌 {lab[1]} | 🔑 {lab[2]} | 📅 {created_date}\n"
        if lab[6]:
            labs_text += f"   👨‍⚕️ د. {lab[6]}\n"
    
    labs_text += "\nلاستخدام: /add_lab [الاسم] [كلمة السر]"
    await update.message.reply_text(labs_text)

async def admin_delete_lab(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    if user_id != ADMIN_ID:
        await update.message.reply_text("⛔ هذا الأمر للمشرف فقط")
        return
    
    try:
        if len(context.args) < 1:
            await update.message.reply_text(
                "❌ الاستخدام الصحيح:\n"
                "/delete_lab [رقم المعمل]"
            )
            return
        
        lab_id = int(context.args[0])
        
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT lab_name FROM labs WHERE lab_id = %s", (lab_id,))
        lab = cur.fetchone()
        cur.close()
        conn.close()
        
        if lab and lab[0] == ADMIN_LAB_NAME:
            await update.message.reply_text("❌ لا يمكن حذف المعمل الرئيسي")
            return
        
        if delete_lab(lab_id):
            await update.message.reply_text(f"✅ تم حذف المعمل رقم {lab_id} بنجاح")
        else:
            await update.message.reply_text("❌ فشل في حذف المعمل")
    except Exception as e:
        await update.message.reply_text(f"❌ حدث خطأ: {str(e)}")

# ================= دوال إعدادات المعمل =================
async def lab_info(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    lab_info = get_lab_by_user(user_id)
    if not lab_info:
        await update.message.reply_text("❌ لم يتم العثور على المعمل")
        return
    
    lab_id, lab_name = lab_info
    details = get_lab_details(lab_id)
    
    text = f"""
🏥 **{lab_name}**
━━━━━━━━━━━━━━━━━━━
👨‍⚕️ **الدكتور:** {details['doctor_name']}
📜 **الشهادة:** {details['doctor_degree']}
🔬 **التخصص:** {details['doctor_specialty']}
📞 **الهاتف:** {details['phone']}
📍 **العنوان:** {details['address']}
━━━━━━━━━━━━━━━━━━━

**الأوامر المتاحة:**
/set_doctor_name [الاسم] - تعيين اسم الدكتور
/set_doctor_degree [الشهادة] - تعيين الشهادة
/set_doctor_specialty [التخصص] - تعيين التخصص
/set_phone [رقم] - تعيين رقم الهاتف
/set_address [العنوان] - تعيين العنوان
    """
    
    await update.message.reply_text(text)

async def set_lab_phone(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    if user_id != ADMIN_ID:
        await update.message.reply_text("⛔ هذا الأمر للمشرف فقط")
        return
    
    if len(context.args) < 1:
        await update.message.reply_text("❌ الاستخدام: /set_phone [رقم الهاتف]")
        return
    
    phone = context.args[0]
    lab_info = get_lab_by_user(user_id)
    
    if not lab_info:
        await update.message.reply_text("❌ لم يتم العثور على المعمل")
        return
    
    lab_id = lab_info[0]
    save_lab_details(lab_id, phone=phone)
    
    await update.message.reply_text(f"✅ تم حفظ رقم الهاتف: {phone}")

async def set_lab_address(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    if user_id != ADMIN_ID:
        await update.message.reply_text("⛔ هذا الأمر للمشرف فقط")
        return
    
    if len(context.args) < 1:
        await update.message.reply_text("❌ الاستخدام: /set_address [العنوان]")
        return
    
    address = " ".join(context.args)
    lab_info = get_lab_by_user(user_id)
    
    if not lab_info:
        await update.message.reply_text("❌ لم يتم العثور على المعمل")
        return
    
    lab_id = lab_info[0]
    save_lab_details(lab_id, address=address)
    
    await update.message.reply_text(f"✅ تم حفظ العنوان: {address}")

async def set_doctor_name(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    if user_id != ADMIN_ID:
        await update.message.reply_text("⛔ هذا الأمر للمشرف فقط")
        return
    
    if len(context.args) < 1:
        await update.message.reply_text("❌ الاستخدام: /set_doctor_name [الاسم]")
        return
    
    doctor_name = " ".join(context.args)
    lab_info = get_lab_by_user(user_id)
    
    if not lab_info:
        await update.message.reply_text("❌ لم يتم العثور على المعمل")
        return
    
    lab_id = lab_info[0]
    save_lab_details(lab_id, doctor_name=doctor_name)
    
    await update.message.reply_text(f"✅ تم حفظ اسم الدكتور: {doctor_name}")

async def set_doctor_degree(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    if user_id != ADMIN_ID:
        await update.message.reply_text("⛔ هذا الأمر للمشرف فقط")
        return
    
    if len(context.args) < 1:
        await update.message.reply_text("❌ الاستخدام: /set_doctor_degree [الشهادة]")
        return
    
    doctor_degree = " ".join(context.args)
    lab_info = get_lab_by_user(user_id)
    
    if not lab_info:
        await update.message.reply_text("❌ لم يتم العثور على المعمل")
        return
    
    lab_id = lab_info[0]
    save_lab_details(lab_id, doctor_degree=doctor_degree)
    
    await update.message.reply_text(f"✅ تم حفظ الشهادة: {doctor_degree}")

async def set_doctor_specialty(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    if user_id != ADMIN_ID:
        await update.message.reply_text("⛔ هذا الأمر للمشرف فقط")
        return
    
    if len(context.args) < 1:
        await update.message.reply_text("❌ الاستخدام: /set_doctor_specialty [التخصص]")
        return
    
    doctor_specialty = " ".join(context.args)
    lab_info = get_lab_by_user(user_id)
    
    if not lab_info:
        await update.message.reply_text("❌ لم يتم العثور على المعمل")
        return
    
    lab_id = lab_info[0]
    save_lab_details(lab_id, doctor_specialty=doctor_specialty)
    
    await update.message.reply_text(f"✅ تم حفظ التخصص: {doctor_specialty}")

# ================= REPORT LOGIC =================
async def new_report(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    if "lab_id" not in context.user_data:
        await update.message.reply_text("⚠️ يجب تسجيل الدخول أولاً. أرسل /start")
        return ConversationHandler.END

    await update.message.reply_text(
        "👤 أدخل اسم المريض:\n"
        "(يمكنك كتابته بالعربية أو الإنجليزية)"
    )
    return ASK_PATIENT_NAME

async def get_patient_name(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data["name"] = update.message.text.strip()
    await update.message.reply_text("🎂 السن:")
    return ASK_AGE

async def get_age(update: Update, context: ContextTypes.DEFAULT_TYPE):
    age_text = update.message.text
    if not age_text.isdigit():
        await update.message.reply_text("❌ برجاء إدخال العمر بالأرقام فقط:")
        return ASK_AGE
    
    context.user_data["age"] = int(age_text)
    await update.message.reply_text("⚧ النوع (ذكر / أنثى):")
    return ASK_GENDER

async def get_gender(update: Update, context: ContextTypes.DEFAULT_TYPE):
    gender = update.message.text.strip()
    if gender not in ["ذكر", "أنثى"]:
        await update.message.reply_text("❌ برجاء إدخال 'ذكر' أو 'أنثى' فقط:")
        return ASK_GENDER
    
    context.user_data["gender"] = gender
    await update.message.reply_text("👨‍⚕️ اسم الطبيب المعالج:")
    return ASK_DOCTOR

async def get_doctor(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    context.user_data["doctor"] = update.message.text.strip()

    report_id = create_report(user_id, context.user_data)
    context.user_data["current_report_id"] = report_id
    context.user_data["tests_list"] = []
    context.user_data["pending_tests"] = []
    context.user_data["custom_ranges"] = {}
    context.user_data["selected_categories"] = []

    categories = get_all_categories()
    
    keyboard = []
    for i, category in enumerate(categories):
        keyboard.append([InlineKeyboardButton(f"📌 {category}", callback_data=f"toggle_category_{i}")])
    
    keyboard.append([InlineKeyboardButton("✅ تم الاختيار", callback_data="done_categories")])
    
    context.user_data["all_categories"] = categories
    
    await update.message.reply_text(
        "📊 **اختر الأقسام المطلوبة:**",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )
    return ASK_TEST_CATEGORY

# ================= معالجة اختيار الأقسام =================
async def handle_category_selection(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    if query.data == "done_categories":
        selected_indices = context.user_data.get("selected_categories", [])
        categories = context.user_data.get("all_categories", [])
        
        if not selected_indices:
            await query.message.reply_text("❌ لم تختار أي قسم!")
            return ASK_TEST_CATEGORY
        
        selected_category_names = [categories[i] for i in selected_indices]
        context.user_data["selected_categories"] = selected_category_names
        context.user_data["current_category_index"] = 0
        
        categories_text = "✅ **الأقسام المختارة:**\n\n"
        for cat in selected_category_names:
            categories_text += f"• {cat}\n"
        
        await query.message.reply_text(categories_text)
        return await show_category_tests(query, context)
    
    elif query.data.startswith("toggle_category_"):
        index = int(query.data.split("_")[2])
        selected = context.user_data.get("selected_categories", [])
        
        if index in selected:
            selected.remove(index)
        else:
            selected.append(index)
        
        context.user_data["selected_categories"] = selected
        
        categories = context.user_data.get("all_categories", [])
        keyboard = []
        for i, category in enumerate(categories):
            status = "✅" if i in selected else "📌"
            keyboard.append([InlineKeyboardButton(f"{status} {category}", callback_data=f"toggle_category_{i}")])
        
        keyboard.append([InlineKeyboardButton("✅ تم الاختيار", callback_data="done_categories")])
        
        await query.message.edit_reply_markup(InlineKeyboardMarkup(keyboard))
        return ASK_TEST_CATEGORY

# ================= دوال عرض واختيار التحاليل =================
async def show_category_tests(query, context):
    selected_categories = context.user_data.get("selected_categories", [])
    current_index = context.user_data.get("current_category_index", 0)
    
    if current_index >= len(selected_categories):
        if context.user_data.get("pending_tests"):
            return await start_test_results(query.message, context)
        await query.message.reply_text("❌ لم تختار أي تحاليل!")
        return ConversationHandler.END
    
    current_category = selected_categories[current_index]
    tests = get_tests_by_category(current_category)
    
    if not tests:
        context.user_data["current_category_index"] = current_index + 1
        return await show_category_tests(query, context)
    
    context.user_data["category_tests"] = tests
    context.user_data["selected_tests"] = []
    context.user_data["current_category"] = current_category
    
    keyboard = []
    for i, test in enumerate(tests):
        keyboard.append([InlineKeyboardButton(f"{i+1}. {test}", callback_data=f"toggle_test_{i}")])
    
    nav_buttons = []
    if current_index > 0:
        nav_buttons.append(InlineKeyboardButton("🔙 السابق", callback_data="prev_category"))
    nav_buttons.append(InlineKeyboardButton("⏭️ تخطي", callback_data="skip_category"))
    nav_buttons.append(InlineKeyboardButton("✅ تم", callback_data="done_category_tests"))
    keyboard.append(nav_buttons)
    keyboard.append([InlineKeyboardButton("🔙 رجوع للأقسام", callback_data="back_to_categories")])
    
    await query.message.reply_text(
        f"🧪 **{current_category}** ({current_index+1}/{len(selected_categories)})\n\nاختر التحاليل:",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )
    return ASK_MULTIPLE_TESTS

async def start_test_results(message, context):
    pending_tests = context.user_data.get("pending_tests", [])
    if not pending_tests:
        await message.reply_text("❌ لا توجد تحاليل!")
        return ConversationHandler.END
    
    first_test = pending_tests[0]
    await message.reply_text(
        f"🔤 **التحليل الأول:** {first_test}\n"
        f"📊 {get_test_unit(first_test)}\n"
        f"✅ {get_normal_range(first_test, context.user_data.get('gender', 'ذكر'))}\n\n"
        "أدخل النتيجة:"
    )
    return ASK_TEST_RESULTS

async def handle_test_selection(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data = query.data
    
    if data == "prev_category":
        context.user_data["current_category_index"] -= 1
        return await show_category_tests(query, context)
    
    if data == "skip_category":
        context.user_data["current_category_index"] += 1
        return await show_category_tests(query, context)
    
    if data == "done_category_tests":
        selected = context.user_data.get("selected_tests", [])
        tests = context.user_data.get("category_tests", [])
        if selected:
            if "pending_tests" not in context.user_data:
                context.user_data["pending_tests"] = []
            context.user_data["pending_tests"].extend([tests[i] for i in selected])
        context.user_data["current_category_index"] += 1
        return await show_category_tests(query, context)
    
    if data == "back_to_categories":
        categories = context.user_data.get("all_categories", [])
        keyboard = []
        for i, cat in enumerate(categories):
            keyboard.append([InlineKeyboardButton(f"📌 {cat}", callback_data=f"toggle_category_{i}")])
        keyboard.append([InlineKeyboardButton("✅ تم", callback_data="done_categories")])
        await query.message.reply_text("📊 اختر الأقسام:", reply_markup=InlineKeyboardMarkup(keyboard))
        return ASK_TEST_CATEGORY
    
    if data.startswith("toggle_test_"):
        index = int(data.split("_")[2])
        selected = context.user_data.get("selected_tests", [])
        if index in selected:
            selected.remove(index)
        else:
            selected.append(index)
        context.user_data["selected_tests"] = selected
        
        tests = context.user_data["category_tests"]
        keyboard = []
        for i, test in enumerate(tests):
            status = "✅" if i in selected else "⬜"
            keyboard.append([InlineKeyboardButton(f"{status} {i+1}. {test}", callback_data=f"toggle_test_{i}")])
        
        nav_buttons = []
        if context.user_data["current_category_index"] > 0:
            nav_buttons.append(InlineKeyboardButton("🔙 السابق", callback_data="prev_category"))
        nav_buttons.append(InlineKeyboardButton("⏭️ تخطي", callback_data="skip_category"))
        nav_buttons.append(InlineKeyboardButton("✅ تم", callback_data="done_category_tests"))
        keyboard.append(nav_buttons)
        keyboard.append([InlineKeyboardButton("🔙 رجوع للأقسام", callback_data="back_to_categories")])
        
        await query.message.edit_reply_markup(InlineKeyboardMarkup(keyboard))
        return ASK_MULTIPLE_TESTS

# ================= إدخال النتائج =================
async def enter_test_results(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text.strip()
    pending = context.user_data.get("pending_tests", [])
    if not pending:
        return await show_tests_menu(update, context)
    
    current = pending[0]
    result = text
    custom = None
    if '|' in text:
        parts = text.split('|')
        result = parts[0].strip()
        custom = parts[1].strip()
    
    report_id = context.user_data.get("current_report_id")
    add_test_to_report(report_id, current, result, custom)
    
    if "tests_list" not in context.user_data:
        context.user_data["tests_list"] = []
    context.user_data["tests_list"].append({"name": current, "result": result, "custom_range": custom})
    
    if custom:
        if "custom_ranges" not in context.user_data:
            context.user_data["custom_ranges"] = {}
        context.user_data["custom_ranges"][current] = custom
    
    pending.pop(0)
    context.user_data["pending_tests"] = pending
    
    if pending:
        next_test = pending[0]
        await update.message.reply_text(
            f"✅ تم حفظ {current}\n\n🔹 {next_test}\n"
            f"📊 {get_test_unit(next_test)}\n"
            f"✅ {get_normal_range(next_test, context.user_data.get('gender', 'ذكر'))}\n\nأدخل النتيجة:"
        )
        return ASK_TEST_RESULTS
    
    return await show_tests_menu(update, context)

# ================= قائمة التحاليل المضافة =================
async def show_tests_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    tests_list = context.user_data.get("tests_list", [])
    
    if not tests_list:
        if hasattr(update, 'callback_query') and update.callback_query:
            await update.callback_query.message.reply_text("❌ لا توجد تحاليل مضافة!")
        else:
            await update.message.reply_text("❌ لا توجد تحاليل مضافة!")
        return ConversationHandler.END
    
    tests_text = "📋 **التحاليل المضافة:**\n\n"
    for i, test in enumerate(tests_list, 1):
        if test.get('custom_range'):
            tests_text += f"{i}. {test['name']}: {test['result']} (مدى: {test['custom_range']})\n"
        else:
            tests_text += f"{i}. {test['name']}: {test['result']}\n"
    
    tests_text += f"\nإجمالي التحاليل: {len(tests_list)}"
    
    keyboard = [
        [InlineKeyboardButton("➕ إضافة تحاليل", callback_data="add_more")],
        [InlineKeyboardButton("✏️ تعديل القيمة", callback_data="edit_test")],
        [InlineKeyboardButton("📊 تعديل المعدل الطبيعي", callback_data="edit_normal_range")],
        [InlineKeyboardButton("🗑️ حذف تحليل", callback_data="delete_test")],
        [InlineKeyboardButton("✅ إنهاء وإنشاء التقرير", callback_data="finish_report")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    if hasattr(update, 'callback_query') and update.callback_query:
        await update.callback_query.message.reply_text(tests_text, reply_markup=reply_markup)
    else:
        await update.message.reply_text(tests_text, reply_markup=reply_markup)
    
    return ASK_EDIT_MENU

# ================= معالجة قائمة التعديل =================
async def handle_edit_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    if query.data == "add_more":
        categories = get_all_categories()
        context.user_data["all_categories"] = categories
        context.user_data["selected_categories"] = []
        
        keyboard = []
        for i, category in enumerate(categories):
            keyboard.append([InlineKeyboardButton(f"📌 {category}", callback_data=f"toggle_category_{i}")])
        keyboard.append([InlineKeyboardButton("✅ تم", callback_data="done_categories")])
        
        await query.message.reply_text("📊 اختر الأقسام:", reply_markup=InlineKeyboardMarkup(keyboard))
        return ASK_TEST_CATEGORY
    
    elif query.data == "edit_test":
        tests_list = context.user_data.get("tests_list", [])
        keyboard = []
        for i, test in enumerate(tests_list):
            keyboard.append([InlineKeyboardButton(f"{i+1}. {test['name']}", callback_data=f"edit_test_{i}")])
        keyboard.append([InlineKeyboardButton("🔙 رجوع", callback_data="back_to_menu")])
        await query.message.reply_text("اختر التحليل:", reply_markup=InlineKeyboardMarkup(keyboard))
        return ASK_EDIT_TEST
    
    elif query.data == "edit_normal_range":
        tests_list = context.user_data.get("tests_list", [])
        keyboard = []
        for i, test in enumerate(tests_list):
            current = test.get('custom_range', 'افتراضي')
            keyboard.append([InlineKeyboardButton(f"{i+1}. {test['name']} ({current})", callback_data=f"edit_range_{i}")])
        keyboard.append([InlineKeyboardButton("🔙 رجوع", callback_data="back_to_menu")])
        await query.message.reply_text("اختر التحليل:", reply_markup=InlineKeyboardMarkup(keyboard))
        return ASK_EDIT_TEST
    
    elif query.data == "delete_test":
        tests_list = context.user_data.get("tests_list", [])
        keyboard = []
        for i, test in enumerate(tests_list):
            keyboard.append([InlineKeyboardButton(f"{i+1}. {test['name']}", callback_data=f"delete_test_{i}")])
        keyboard.append([InlineKeyboardButton("🔙 رجوع", callback_data="back_to_menu")])
        await query.message.reply_text("اختر التحليل للحذف:", reply_markup=InlineKeyboardMarkup(keyboard))
        return ASK_EDIT_TEST
    
    elif query.data == "finish_report":
        return await finish_report(update, context)
    
    elif query.data == "back_to_menu":
        return await show_tests_menu(update, context)

# ================= دوال التعديل =================
async def handle_edit_selection(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data = query.data
    
    if data.startswith("edit_test_"):
        index = int(data.split("_")[2])
        context.user_data["editing_index"] = index
        test = context.user_data["tests_list"][index]
        await query.message.reply_text(
            f"✏️ تعديل {test['name']}\n"
            f"القيمة: {test['result']}\n"
            f"أدخل القيمة الجديدة:"
        )
        return ASK_NEW_VALUE
    
    elif data.startswith("edit_range_"):
        index = int(data.split("_")[2])
        context.user_data["editing_range_index"] = index
        test = context.user_data["tests_list"][index]
        await query.message.reply_text(
            f"✏️ تعديل المعدل لـ {test['name']}\n"
            f"أدخل المعدل الجديد (مثال: 100-140):"
        )
        return ASK_NEW_RANGE
    
    elif data.startswith("delete_test_"):
        index = int(data.split("_")[2])
        tests_list = context.user_data.get("tests_list", [])
        if 0 <= index < len(tests_list):
            deleted = tests_list.pop(index)
            context.user_data["tests_list"] = tests_list
            await query.message.reply_text(f"✅ تم حذف {deleted['name']}")
        return await show_tests_menu(update, context)
    
    return await show_tests_menu(update, context)

async def update_test_value(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text.strip()
    index = context.user_data.get("editing_index")
    
    if index is not None:
        tests_list = context.user_data.get("tests_list", [])
        old_name = tests_list[index]['name']
        
        custom = None
        if '|' in text:
            parts = text.split('|')
            result = parts[0].strip()
            custom = parts[1].strip()
        else:
            result = text
        
        tests_list[index]["result"] = result
        tests_list[index]["custom_range"] = custom
        context.user_data["tests_list"] = tests_list
        
        await update.message.reply_text(f"✅ تم تعديل {old_name}")
    
    return await show_tests_menu(update, context)

async def update_normal_range(update: Update, context: ContextTypes.DEFAULT_TYPE):
    new_range = update.message.text.strip()
    index = context.user_data.get("editing_range_index")
    
    if index is not None:
        tests_list = context.user_data.get("tests_list", [])
        test = tests_list[index]
        tests_list[index]["custom_range"] = new_range
        context.user_data["tests_list"] = tests_list
        await update.message.reply_text(f"✅ تم تحديث معدل {test['name']}")
    
    return await show_tests_menu(update, context)

# ================= PDF FUNCTION =================
async def send_pdf_report(update: Update, context: ContextTypes.DEFAULT_TYPE, report_id):
    try:
        report_details = get_report_with_normal_ranges(report_id)
        
        if not report_details:
            await update.message.reply_text("❌ خطأ في استرجاع التقرير")
            return
        
        custom_ranges = context.user_data.get("custom_ranges", {})
        for test in report_details['tests']:
            if test['test_name'] in custom_ranges:
                test['custom_range'] = custom_ranges[test['test_name']]
        
        pdf_buffer = create_pdf_report(report_details)
        
        await context.bot.send_document(
            chat_id=update.effective_chat.id,
            document=pdf_buffer,
            filename=f"Medical_Report_{report_details['patient_name']}.pdf",
            caption="📄 BIOCHEMISTRY REPORT"
        )
        
    except Exception as e:
        logging.error(f"خطأ في إنشاء PDF: {e}")
        await update.message.reply_text("❌ حدث خطأ في إنشاء ملف PDF")

async def finish_report(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    if query:
        await query.answer()
        message = query.message
    else:
        message = update.message
    
    report_id = context.user_data.get("current_report_id")
    tests_list = context.user_data.get("tests_list", [])
    
    if not report_id:
        await message.reply_text("❌ حدث خطأ: لا يوجد تقرير حالي")
        return ConversationHandler.END
    
    report_details = get_report_details(report_id)
    
    if not report_details:
        await message.reply_text("❌ حدث خطأ: لم يتم العثور على التقرير")
        return ConversationHandler.END
    
    report_text = f"""
📋 **تقرير المعمل**
━━━━━━━━━━━━━━━━━━━
🧪 **المعمل:** {report_details.get('lab_name', 'غير محدد')}
👤 **المريض:** {report_details.get('patient_name', 'غير محدد')}
🎂 **السن:** {report_details.get('age', 'غير محدد')}
⚧ **النوع:** {report_details.get('gender', 'غير محدد')}
👨‍⚕️ **الطبيب:** {report_details.get('doctor', 'غير محدد')}
📅 **التاريخ:** {str(report_details.get('created_at', ''))[:10]}
━━━━━━━━━━━━━━━━━━━
📊 **التحاليل المضافة:** {len(tests_list)}
━━━━━━━━━━━━━━━━━━━
"""
    
    await message.reply_text(report_text)
    
    try:
        await send_pdf_report(update, context, report_id)
    except Exception as e:
        logging.error(f"خطأ في إرسال PDF: {e}")
        await message.reply_text("✅ تم حفظ التقرير")
    
    context.user_data.clear()
    return ConversationHandler.END

# ================= GENERAL =================
async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data.clear()
    await update.message.reply_text("❌ تم إلغاء العملية الحالية.", reply_markup=ReplyKeyboardRemove())
    return ConversationHandler.END

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    
    help_text = (
        "📋 **قائمة الأوامر المتاحة:**\n\n"
        "/start - بدء المحادثة وتسجيل الدخول\n"
        "/new - إنشاء تقرير جديد\n"
        "/help - عرض هذه المساعدة\n"
        "/cancel - إلغاء العملية الحالية"
    )
    
    if user_id == ADMIN_ID:
        help_text += (
            "\n\n⚙️ **أوامر المشرف:**\n"
            "/add_lab [الاسم] [كلمة السر] - إضافة معمل جديد\n"
            "/list_labs - عرض جميع المعامل\n"
            "/delete_lab [رقم] - حذف معمل\n"
            "/lab_info - عرض معلومات المعمل\n"
            "/set_phone [رقم] - تعيين رقم الهاتف\n"
            "/set_address [العنوان] - تعيين العنوان\n"
            "/set_doctor_name [الاسم] - تعيين اسم الدكتور\n"
            "/set_doctor_degree [الشهادة] - تعيين الشهادة\n"
            "/set_doctor_specialty [التخصص] - تعيين التخصص"
        )
    
    await update.message.reply_text(help_text)

# ================= MAIN =================
def main():
    app = ApplicationBuilder().token(TOKEN).build()

    init_db()
    ensure_admin_lab_exists()

    # أوامر المشرف
    app.add_handler(CommandHandler("add_lab", admin_add_lab))
    app.add_handler(CommandHandler("list_labs", admin_list_labs))
    app.add_handler(CommandHandler("delete_lab", admin_delete_lab))
    app.add_handler(CommandHandler("lab_info", lab_info))
    app.add_handler(CommandHandler("set_phone", set_lab_phone))
    app.add_handler(CommandHandler("set_address", set_lab_address))
    app.add_handler(CommandHandler("set_doctor_name", set_doctor_name))
    app.add_handler(CommandHandler("set_doctor_degree", set_doctor_degree))
    app.add_handler(CommandHandler("set_doctor_specialty", set_doctor_specialty))

    conv_handler = ConversationHandler(
        entry_points=[CommandHandler("start", start), CommandHandler("new", new_report)],
        states={
            ASK_LAB_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_lab_name)],
            ASK_LAB_PASSWORD: [MessageHandler(filters.TEXT & ~filters.COMMAND, check_lab_password)],
            ASK_PATIENT_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_patient_name)],
            ASK_AGE: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_age)],
            ASK_GENDER: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_gender)],
            ASK_DOCTOR: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_doctor)],
            ASK_TEST_CATEGORY: [CallbackQueryHandler(handle_category_selection)],
            ASK_MULTIPLE_TESTS: [CallbackQueryHandler(handle_test_selection)],
            ASK_TEST_RESULTS: [MessageHandler(filters.TEXT & ~filters.COMMAND, enter_test_results)],
            ASK_EDIT_MENU: [CallbackQueryHandler(handle_edit_menu)],
            ASK_EDIT_TEST: [CallbackQueryHandler(handle_edit_selection)],
            ASK_NEW_VALUE: [MessageHandler(filters.TEXT & ~filters.COMMAND, update_test_value)],
            ASK_NEW_RANGE: [MessageHandler(filters.TEXT & ~filters.COMMAND, update_normal_range)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
        allow_reentry=True,
    )

    app.add_handler(conv_handler)
    app.add_handler(CommandHandler("help", help_command))

    print("✅ Bot is running properly...")
    app.run_polling()
