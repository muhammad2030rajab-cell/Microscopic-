"""
وحدات الحسابات التلقائية للتحاليل الطبية
"""

def calculate_bun_creatinine_ratio(bun, creatinine):
    """حساب نسبة BUN/Creatinine"""
    if creatinine and creatinine > 0:
        return round(bun / creatinine, 2)
    return None

def calculate_ag_ratio(albumin, globulin):
    """حساب نسبة A/G"""
    if globulin and globulin > 0:
        return round(albumin / globulin, 2)
    return None

def calculate_bmi(weight, height_cm):
    """حساب كتلة الجسم"""
    if weight and height_cm and height_cm > 0:
        height_m = height_cm / 100
        return round(weight / (height_m ** 2), 2)
    return None

def calculate_ldl_from_friedewald(total_chol, hdl, triglycerides):
    """حساب LDL باستخدام معادلة Friedewald"""
    if triglycerides < 400:
        ldl = total_chol - hdl - (triglycerides / 5)
        return round(ldl, 2) if ldl > 0 else None
    return None

def interpret_egfr(creatinine, age, gender):
    """حساب معدل الترشيح الكبيبي (eGFR)"""
    if not creatinine or creatinine <= 0:
        return None
    
    # معادلة CKD-EPI (مبسطة)
    if gender == 'أنثى':
        if creatinine <= 0.7:
            egfr = 144 * ((creatinine / 0.7) ** -0.329) * (0.993 ** age)
        else:
            egfr = 144 * ((creatinine / 0.7) ** -1.209) * (0.993 ** age)
    else:  # ذكر
        if creatinine <= 0.9:
            egfr = 141 * ((creatinine / 0.9) ** -0.411) * (0.993 ** age)
        else:
            egfr = 141 * ((creatinine / 0.9) ** -1.209) * (0.993 ** age)
    
    return round(egfr, 1)