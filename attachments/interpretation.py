"""
تفسير نتائج التحاليل وتصنيفها
"""

def interpret_result(test_name, value, gender, age=None):
    """تفسير نتيجة تحليل معين"""
    from tests_data import get_normal_range_numeric
    
    normal_range = get_normal_range_numeric(test_name, gender)
    if not normal_range:
        return {
            'status': 'غير محدد',
            'interpretation': 'لا يوجد مدى طبيعي محدد لهذا التحليل',
            'color': 'gray'
        }
    
    # مقارنة القيمة بالمدى الطبيعي
    min_val = normal_range.get('min')
    max_val = normal_range.get('max')
    
    try:
        val = float(value)
        
        if max_val is not None and val > max_val:
            return {
                'status': 'مرتفع',
                'interpretation': get_high_interpretation(test_name),
                'color': 'red',
                'value': val,
                'max': max_val
            }
        elif min_val is not None and val < min_val:
            return {
                'status': 'منخفض',
                'interpretation': get_low_interpretation(test_name),
                'color': 'orange',
                'value': val,
                'min': min_val
            }
        else:
            return {
                'status': 'طبيعي',
                'interpretation': 'النتيجة ضمن المعدل الطبيعي',
                'color': 'green',
                'value': val,
                'min': min_val,
                'max': max_val
            }
    except:
        return {
            'status': 'غير رقمي',
            'interpretation': 'نتيجة غير رقمية',
            'color': 'gray'
        }

def get_high_interpretation(test_name):
    """تفسير النتائج المرتفعة"""
    interpretations = {
        'SGPT (ALT)': 'ارتفاع إنزيمات الكبد قد يشير إلى التهاب كبدي',
        'SGOT (AST)': 'ارتفاع إنزيمات الكبد قد يشير إلى تلف في خلايا الكبد',
        'Creatinine': 'ارتفاع الكرياتينين قد يشير إلى ضعف وظائف الكلى',
        'Urea': 'ارتفاع اليوريا قد يشير إلى الجفاف أو مشاكل في الكلى',
        'Uric Acid': 'ارتفاع حمض اليوريك قد يزيد خطر النقرس',
        'Glucose': 'ارتفاع السكر قد يشير إلى مرض السكري',
    }
    return interpretations.get(test_name, 'النتيجة أعلى من المعدل الطبيعي')

def get_low_interpretation(test_name):
    """تفسير النتائج المنخفضة"""
    interpretations = {
        'Hemoglobin': 'انخفاض الهيموجلوبين قد يشير إلى فقر الدم',
        'RBCs': 'انخفاض كريات الدم الحمراء قد يشير إلى فقر الدم',
        'WBCs': 'انخفاض كريات الدم البيضاء قد يشير إلى ضعف المناعة',
        'Platelets': 'انخفاض الصفائح قد يزيد خطر النزيف',
        'Vitamin D': 'نقص فيتامين د قد يؤثر على صحة العظام',
        'Vitamin B12': 'نقص فيتامين ب12 قد يسبب فقر الدم والاعتلال العصبي',
    }
    return interpretations.get(test_name, 'النتيجة أقل من المعدل الطبيعي')