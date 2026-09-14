import os
import logging
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes
from database import register_lab, get_db_connection

TOKEN = os.getenv("TOKEN")
ADMIN_IDS = [8226018082]  # ضع معرف التليجرام بتاعك هنا

async def add_lab(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """إضافة معمل جديد - للمشرف فقط"""
    user_id = update.effective_user.id
    
    if user_id not in ADMIN_IDS:
        await update.message.reply_text("⛔ هذا الأمر للمشرف فقط")
        return
    
    try:
        # /add_lab اسم_المعمل كلمة_السر
        lab_name = context.args[0]
        lab_password = context.args[1]
        
        lab_id = register_lab(lab_name, lab_password)
        
        if lab_id:
            await update.message.reply_text(
                f"✅ تم إضافة المعمل بنجاح!\n"
                f"🆔 رقم المعمل: {lab_id}\n"
                f"📌 اسم المعمل: {lab_name}\n"
                f"🔑 كلمة السر: {lab_password}"
            )
        else:
            await update.message.reply_text("❌ فشل في إضافة المعمل. الاسم موجود مسبقاً")
    except (IndexError, ValueError):
        await update.message.reply_text("❌ الاستخدام: /add_lab [اسم المعمل] [كلمة السر]")

async def list_labs(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """عرض قائمة المعامل - للمشرف فقط"""
    user_id = update.effective_user.id
    
    if user_id not in ADMIN_IDS:
        await update.message.reply_text("⛔ هذا الأمر للمشرف فقط")
        return
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT lab_id, lab_name, created_at FROM labs ORDER BY lab_id")
    labs = cur.fetchall()
    cur.close()
    conn.close()
    
    if not labs:
        await update.message.reply_text("📭 لا توجد معامل مسجلة")
        return
    
    labs_text = "📋 **قائمة المعامل:**\n\n"
    for lab in labs:
        labs_text += f"🆔 {lab[0]} | {lab[1]} | {lab[2][:10]}\n"
    
    await update.message.reply_text(labs_text)

def main():
    app = ApplicationBuilder().token(TOKEN).build()
    
    app.add_handler(CommandHandler("add_lab", add_lab))
    app.add_handler(CommandHandler("list_labs", list_labs))
    
    print("✅ Admin bot is running...")
    app.run_polling()

if __name__ == "__main__":
    main()