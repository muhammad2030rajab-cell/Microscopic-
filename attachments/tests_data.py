# ======================== جميع أنواع التحاليل الطبية ========================

TESTS_DATA = {
    # ========== 1. وظائف الكبد (Liver Functions) ==========
    'وظائف الكبد': {
        'SGPT (ALT)': {'unit': 'U/L', 'normal_male': 'حتى 45', 'normal_female': 'حتى 35'},
        'SGOT (AST)': {'unit': 'U/L', 'normal_male': 'حتى 40', 'normal_female': 'حتى 35'},
        'ALP': {'unit': 'U/L', 'normal_male': 'حتى 130', 'normal_female': 'حتى 130'},
        'GGT': {'unit': 'U/L', 'normal_male': 'حتى 55', 'normal_female': 'حتى 38'},
        'Total Bilirubin': {'unit': 'mg/dL', 'normal_male': 'حتى 1.2', 'normal_female': 'حتى 1.2'},
        'Direct Bilirubin': {'unit': 'mg/dL', 'normal_male': 'حتى 0.3', 'normal_female': 'حتى 0.3'},
        'Indirect Bilirubin': {'unit': 'mg/dL', 'normal_male': 'حتى 0.9', 'normal_female': 'حتى 0.9'},
        'Total Protein': {'unit': 'g/dL', 'normal_male': '6.6-8.3', 'normal_female': '6.6-8.3'},
        'Albumin': {'unit': 'g/dL', 'normal_male': '3.5-5.0', 'normal_female': '3.5-5.0'},
        'Globulin': {'unit': 'g/dL', 'normal_male': '2.3-3.5', 'normal_female': '2.3-3.5'},
        'A/G Ratio': {'unit': '', 'normal_male': '1.0-2.5', 'normal_female': '1.0-2.5'},
        'LDH': {'unit': 'U/L', 'normal_male': '140-280', 'normal_female': '140-280'},
        '5-Nucleotidase': {'unit': 'U/L', 'normal_male': 'حتى 15', 'normal_female': 'حتى 15'},
    },
    
    # ========== 2. وظائف الكلى (Kidney Functions) ==========
    'وظائف الكلى': {
        'Creatinine': {'unit': 'mg/dL', 'normal_male': '0.7-1.2', 'normal_female': '0.6-1.1'},
        'Urea': {'unit': 'mg/dL', 'normal_male': '15-45', 'normal_female': '15-45'},
        'BUN': {'unit': 'mg/dL', 'normal_male': '7-20', 'normal_female': '7-20'},
        'Uric Acid': {'unit': 'mg/dL', 'normal_male': '3.5-7.2', 'normal_female': '2.6-6.0'},
        'Sodium': {'unit': 'mmol/L', 'normal_male': '135-145', 'normal_female': '135-145'},
        'Potassium': {'unit': 'mmol/L', 'normal_male': '3.5-5.1', 'normal_female': '3.5-5.1'},
        'Chloride': {'unit': 'mmol/L', 'normal_male': '98-108', 'normal_female': '98-108'},
        'Calcium': {'unit': 'mg/dL', 'normal_male': '8.5-10.5', 'normal_female': '8.5-10.5'},
        'Ionized Calcium': {'unit': 'mg/dL', 'normal_male': '4.5-5.3', 'normal_female': '4.5-5.3'},
        'Phosphorus': {'unit': 'mg/dL', 'normal_male': '2.5-4.5', 'normal_female': '2.5-4.5'},
        'Magnesium': {'unit': 'mg/dL', 'normal_male': '1.7-2.5', 'normal_female': '1.7-2.5'},
        'eGFR': {'unit': 'mL/min', 'normal_male': 'أكثر من 90', 'normal_female': 'أكثر من 90'},
    },
    
    # ========== 3. صورة دم كاملة (Complete Blood Count) ==========
    'صورة دم كاملة (CBC)': {
        'WBCs': {'unit': 'x10^3/μL', 'normal_male': '4.0-11.0', 'normal_female': '4.0-11.0'},
        'RBCs': {'unit': 'x10^6/μL', 'normal_male': '4.5-6.0', 'normal_female': '4.0-5.5'},
        'Hemoglobin': {'unit': 'g/dL', 'normal_male': '13.5-17.5', 'normal_female': '12.0-15.5'},
        'Hematocrit': {'unit': '%', 'normal_male': '40-52', 'normal_female': '36-47'},
        'MCV': {'unit': 'fL', 'normal_male': '80-100', 'normal_female': '80-100'},
        'MCH': {'unit': 'pg', 'normal_male': '27-34', 'normal_female': '27-34'},
        'MCHC': {'unit': 'g/dL', 'normal_male': '32-36', 'normal_female': '32-36'},
        'RDW': {'unit': '%', 'normal_male': '11.5-14.5', 'normal_female': '11.5-14.5'},
        'Platelets': {'unit': 'x10^3/μL', 'normal_male': '150-450', 'normal_female': '150-450'},
        'MPV': {'unit': 'fL', 'normal_male': '7.5-11.5', 'normal_female': '7.5-11.5'},
        'Neutrophils': {'unit': '%', 'normal_male': '40-70', 'normal_female': '40-70'},
        'Lymphocytes': {'unit': '%', 'normal_male': '20-40', 'normal_female': '20-40'},
        'Monocytes': {'unit': '%', 'normal_male': '2-8', 'normal_female': '2-8'},
        'Eosinophils': {'unit': '%', 'normal_male': '1-4', 'normal_female': '1-4'},
        'Basophils': {'unit': '%', 'normal_male': '0.5-1', 'normal_female': '0.5-1'},
        'Absolute Neutrophils': {'unit': 'x10^3/μL', 'normal_male': '2.0-7.0', 'normal_female': '2.0-7.0'},
        'Absolute Lymphocytes': {'unit': 'x10^3/μL', 'normal_male': '1.0-3.0', 'normal_female': '1.0-3.0'},
        'Absolute Monocytes': {'unit': 'x10^3/μL', 'normal_male': '0.2-1.0', 'normal_female': '0.2-1.0'},
        'Absolute Eosinophils': {'unit': 'x10^3/μL', 'normal_male': '0.02-0.5', 'normal_female': '0.02-0.5'},
        'Absolute Basophils': {'unit': 'x10^3/μL', 'normal_male': '0.02-0.1', 'normal_female': '0.02-0.1'},
    },
    
    # ========== 4. دهون وقلب (Lipid Profile) ==========
    'دهون وقلب': {
        'Total Cholesterol': {'unit': 'mg/dL', 'normal_male': 'حتى 200', 'normal_female': 'حتى 200'},
        'Triglycerides': {'unit': 'mg/dL', 'normal_male': 'حتى 150', 'normal_female': 'حتى 150'},
        'HDL': {'unit': 'mg/dL', 'normal_male': 'أكثر من 40', 'normal_female': 'أكثر من 50'},
        'LDL': {'unit': 'mg/dL', 'normal_male': 'حتى 100', 'normal_female': 'حتى 100'},
        'VLDL': {'unit': 'mg/dL', 'normal_male': '5-30', 'normal_female': '5-30'},
        'Non-HDL Cholesterol': {'unit': 'mg/dL', 'normal_male': 'حتى 130', 'normal_female': 'حتى 130'},
        'Cholesterol/HDL Ratio': {'unit': '', 'normal_male': 'أقل من 5', 'normal_female': 'أقل من 4.5'},
        'Apo A1': {'unit': 'mg/dL', 'normal_male': '115-220', 'normal_female': '115-220'},
        'Apo B': {'unit': 'mg/dL', 'normal_male': '55-125', 'normal_female': '55-125'},
        'Lipoprotein (a)': {'unit': 'mg/dL', 'normal_male': 'أقل من 30', 'normal_female': 'أقل من 30'},
    },
    
    # ========== 5. سكر (Diabetes) ==========
    'سكر': {
        'Fasting Glucose': {'unit': 'mg/dL', 'normal_male': '70-100', 'normal_female': '70-100'},
        'Random Glucose': {'unit': 'mg/dL', 'normal_male': 'حتى 140', 'normal_female': 'حتى 140'},
        'HbA1c': {'unit': '%', 'normal_male': 'أقل من 5.7', 'normal_female': 'أقل من 5.7'},
        '2h Postprandial': {'unit': 'mg/dL', 'normal_male': 'حتى 140', 'normal_female': 'حتى 140'},
        'Insulin': {'unit': 'μIU/mL', 'normal_male': '2-25', 'normal_female': '2-25'},
        'C-Peptide': {'unit': 'ng/mL', 'normal_male': '0.5-2.7', 'normal_female': '0.5-2.7'},
        'Fructosamine': {'unit': 'μmol/L', 'normal_male': '200-285', 'normal_female': '200-285'},
        'Microalbumin': {'unit': 'mg/L', 'normal_male': 'أقل من 20', 'normal_female': 'أقل من 20'},
    },
    
    # ========== 6. إنزيمات القلب (Cardiac Enzymes) ==========
    'إنزيمات القلب': {
        'CK': {'unit': 'U/L', 'normal_male': '55-170', 'normal_female': '30-145'},
        'CK-MB': {'unit': 'U/L', 'normal_male': 'أقل من 25', 'normal_female': 'أقل من 25'},
        'Troponin I': {'unit': 'ng/mL', 'normal_male': 'أقل من 0.04', 'normal_female': 'أقل من 0.04'},
        'Troponin T': {'unit': 'ng/mL', 'normal_male': 'أقل من 0.01', 'normal_female': 'أقل من 0.01'},
        'LDH': {'unit': 'U/L', 'normal_male': '140-280', 'normal_female': '140-280'},
        'Myoglobin': {'unit': 'ng/mL', 'normal_male': 'أقل من 90', 'normal_female': 'أقل من 65'},
        'BNP': {'unit': 'pg/mL', 'normal_male': 'أقل من 100', 'normal_female': 'أقل من 100'},
        'Pro-BNP': {'unit': 'pg/mL', 'normal_male': 'أقل من 125', 'normal_female': 'أقل من 125'},
    },
    
    # ========== 7. هرمونات الغدة الدرقية (Thyroid) ==========
    'هرمونات الغدة الدرقية': {
        'TSH': {'unit': 'mIU/L', 'normal_male': '0.4-4.5', 'normal_female': '0.4-4.5'},
        'T3': {'unit': 'ng/dL', 'normal_male': '80-200', 'normal_female': '80-200'},
        'T4': {'unit': 'μg/dL', 'normal_male': '5-12', 'normal_female': '5-12'},
        'Free T3': {'unit': 'pg/mL', 'normal_male': '2.3-4.2', 'normal_female': '2.3-4.2'},
        'Free T4': {'unit': 'ng/dL', 'normal_male': '0.8-1.8', 'normal_female': '0.8-1.8'},
        'Thyroglobulin': {'unit': 'ng/mL', 'normal_male': '3-40', 'normal_female': '3-40'},
        'Anti-TPO': {'unit': 'IU/mL', 'normal_male': 'أقل من 35', 'normal_female': 'أقل من 35'},
        'Anti-Tg': {'unit': 'IU/mL', 'normal_male': 'أقل من 40', 'normal_female': 'أقل من 40'},
    },
    
    # ========== 8. فيتامينات ومعادن (Vitamins & Minerals) ==========
    'فيتامينات ومعادن': {
        'Vitamin D': {'unit': 'ng/mL', 'normal_male': '30-100', 'normal_female': '30-100'},
        'Vitamin B12': {'unit': 'pg/mL', 'normal_male': '200-900', 'normal_female': '200-900'},
        'Vitamin A': {'unit': 'μg/dL', 'normal_male': '30-80', 'normal_female': '30-80'},
        'Vitamin E': {'unit': 'mg/dL', 'normal_male': '5-18', 'normal_female': '5-18'},
        'Vitamin K': {'unit': 'ng/mL', 'normal_male': '0.2-3.2', 'normal_female': '0.2-3.2'},
        'Folate': {'unit': 'ng/mL', 'normal_male': '3-20', 'normal_female': '3-20'},
        'Ferritin': {'unit': 'ng/mL', 'normal_male': '24-336', 'normal_female': '11-307'},
        'Iron': {'unit': 'μg/dL', 'normal_male': '65-175', 'normal_female': '50-170'},
        'TIBC': {'unit': 'μg/dL', 'normal_male': '250-450', 'normal_female': '250-450'},
        'Transferrin': {'unit': 'mg/dL', 'normal_male': '200-360', 'normal_female': '200-360'},
        'Zinc': {'unit': 'μg/dL', 'normal_male': '70-120', 'normal_female': '70-120'},
        'Copper': {'unit': 'μg/dL', 'normal_male': '70-140', 'normal_female': '80-155'},
        'Selenium': {'unit': 'μg/L', 'normal_male': '70-150', 'normal_female': '70-150'},
    },
    
    # ========== 9. سيولة ودم (Coagulation) ==========
    'سيولة ودم': {
        'PT': {'unit': 'sec', 'normal_male': '11-13.5', 'normal_female': '11-13.5'},
        'PTT': {'unit': 'sec', 'normal_male': '25-35', 'normal_female': '25-35'},
        'INR': {'unit': '', 'normal_male': '0.8-1.1', 'normal_female': '0.8-1.1'},
        'Fibrinogen': {'unit': 'mg/dL', 'normal_male': '200-400', 'normal_female': '200-400'},
        'D-Dimer': {'unit': 'μg/mL', 'normal_male': 'أقل من 0.5', 'normal_female': 'أقل من 0.5'},
        'Bleeding Time': {'unit': 'min', 'normal_male': '2-9', 'normal_female': '2-9'},
        'Clotting Time': {'unit': 'min', 'normal_male': '5-15', 'normal_female': '5-15'},
        'Protein C': {'unit': '%', 'normal_male': '70-140', 'normal_female': '70-140'},
        'Protein S': {'unit': '%', 'normal_male': '70-140', 'normal_female': '60-130'},
        'Antithrombin III': {'unit': '%', 'normal_male': '80-120', 'normal_female': '80-120'},
    },
    
    # ========== 10. التهابات وروماتيزم (Inflammation) ==========
    'التهابات وروماتيزم': {
        'CRP': {'unit': 'mg/L', 'normal_male': 'أقل من 6', 'normal_female': 'أقل من 6'},
        'HS-CRP': {'unit': 'mg/L', 'normal_male': 'أقل من 2', 'normal_female': 'أقل من 2'},
        'ESR 1st Hour': {'unit': 'mm/hr', 'normal_male': '0-15', 'normal_female': '0-20'},
        'ESR 2nd Hour': {'unit': 'mm/hr', 'normal_male': '0-30', 'normal_female': '0-35'},
        'RF': {'unit': 'IU/mL', 'normal_male': 'أقل من 20', 'normal_female': 'أقل من 20'},
        'ASO': {'unit': 'IU/mL', 'normal_male': 'أقل من 200', 'normal_female': 'أقل من 200'},
        'ANA': {'unit': 'Titer', 'normal_male': 'Negative', 'normal_female': 'Negative'},
        'Anti-CCP': {'unit': 'U/mL', 'normal_male': 'أقل من 20', 'normal_female': 'أقل من 20'},
        'HLA-B27': {'unit': '', 'normal_male': 'Negative', 'normal_female': 'Negative'},
    },
    
    # ========== 11. أورام (Tumor Markers) ==========
    'أورام (Tumor Markers)': {
        'PSA': {'unit': 'ng/mL', 'normal_male': 'أقل من 4', 'normal_female': 'أقل من 0.5'},
        'Free PSA': {'unit': 'ng/mL', 'normal_male': 'أقل من 1', 'normal_female': 'N/A'},
        'CEA': {'unit': 'ng/mL', 'normal_male': 'أقل من 5', 'normal_female': 'أقل من 5'},
        'AFP': {'unit': 'ng/mL', 'normal_male': 'أقل من 10', 'normal_female': 'أقل من 10'},
        'CA 15-3': {'unit': 'U/mL', 'normal_male': 'أقل من 30', 'normal_female': 'أقل من 30'},
        'CA 19-9': {'unit': 'U/mL', 'normal_male': 'أقل من 37', 'normal_female': 'أقل من 37'},
        'CA 125': {'unit': 'U/mL', 'normal_male': 'أقل من 35', 'normal_female': 'أقل من 35'},
        'Beta-hCG': {'unit': 'mIU/mL', 'normal_male': 'أقل من 5', 'normal_female': 'أقل من 5'},
        'Calcitonin': {'unit': 'pg/mL', 'normal_male': 'أقل من 10', 'normal_female': 'أقل من 5'},
        'Chromogranin A': {'unit': 'ng/mL', 'normal_male': 'أقل من 100', 'normal_female': 'أقل من 100'},
    },
    
    # ========== 12. بول (Urine Analysis) ==========
    'تحليل بول': {
        'Color': {'unit': '', 'normal_male': 'Yellow', 'normal_female': 'Yellow'},
        'Appearance': {'unit': '', 'normal_male': 'Clear', 'normal_female': 'Clear'},
        'Specific Gravity': {'unit': '', 'normal_male': '1.005-1.030', 'normal_female': '1.005-1.030'},
        'pH': {'unit': '', 'normal_male': '5-8', 'normal_female': '5-8'},
        'Protein': {'unit': 'mg/dL', 'normal_male': 'Negative', 'normal_female': 'Negative'},
        'Glucose': {'unit': 'mg/dL', 'normal_male': 'Negative', 'normal_female': 'Negative'},
        'Ketones': {'unit': 'mg/dL', 'normal_male': 'Negative', 'normal_female': 'Negative'},
        'Bilirubin': {'unit': '', 'normal_male': 'Negative', 'normal_female': 'Negative'},
        'Blood': {'unit': '', 'normal_male': 'Negative', 'normal_female': 'Negative'},
        'Leukocytes': {'unit': '', 'normal_male': 'Negative', 'normal_female': 'Negative'},
        'Nitrite': {'unit': '', 'normal_male': 'Negative', 'normal_female': 'Negative'},
        'Urobilinogen': {'unit': 'mg/dL', 'normal_male': '0.2-1.0', 'normal_female': '0.2-1.0'},
        'RBCs in Urine': {'unit': '/HPF', 'normal_male': '0-2', 'normal_female': '0-2'},
        'WBCs in Urine': {'unit': '/HPF', 'normal_male': '0-5', 'normal_female': '0-5'},
        'Casts': {'unit': '/LPF', 'normal_male': '0-5', 'normal_female': '0-5'},
        'Crystals': {'unit': '', 'normal_male': 'Few', 'normal_female': 'Few'},
        'Bacteria': {'unit': '', 'normal_male': 'Negative', 'normal_female': 'Negative'},
    },
    
    # ========== 13. براز (Stool Analysis) ==========
    'تحليل براز': {
        'Color': {'unit': '', 'normal_male': 'Brown', 'normal_female': 'Brown'},
        'Consistency': {'unit': '', 'normal_male': 'Formed', 'normal_female': 'Formed'},
        'Mucus': {'unit': '', 'normal_male': 'Negative', 'normal_female': 'Negative'},
        'Blood': {'unit': '', 'normal_male': 'Negative', 'normal_female': 'Negative'},
        'Pus Cells': {'unit': '/HPF', 'normal_male': '0-2', 'normal_female': '0-2'},
        'RBCs': {'unit': '/HPF', 'normal_male': '0-2', 'normal_female': '0-2'},
        'Ova & Parasites': {'unit': '', 'normal_male': 'Negative', 'normal_female': 'Negative'},
        'Fat Globules': {'unit': '', 'normal_male': 'Few', 'normal_female': 'Few'},
        'Undigested Food': {'unit': '', 'normal_male': 'Few', 'normal_female': 'Few'},
        'Occult Blood': {'unit': '', 'normal_male': 'Negative', 'normal_female': 'Negative'},
    },
    
    # ========== 14. هرمونات (Hormones) ==========
    'هرمونات': {
        'Cortisol AM': {'unit': 'μg/dL', 'normal_male': '5-25', 'normal_female': '5-25'},
        'Cortisol PM': {'unit': 'μg/dL', 'normal_male': '3-16', 'normal_female': '3-16'},
        'ACTH': {'unit': 'pg/mL', 'normal_male': '10-60', 'normal_female': '10-60'},
        'Prolactin': {'unit': 'ng/mL', 'normal_male': '2-18', 'normal_female': '3-30'},
        'FSH': {'unit': 'mIU/mL', 'normal_male': '1.5-12', 'normal_female': '3-20'},
        'LH': {'unit': 'mIU/mL', 'normal_male': '1.5-9', 'normal_female': '2-15'},
        'Testosterone': {'unit': 'ng/dL', 'normal_male': '300-1000', 'normal_female': '15-70'},
        'Estradiol': {'unit': 'pg/mL', 'normal_male': '10-40', 'normal_female': '15-350'},
        'Progesterone': {'unit': 'ng/mL', 'normal_male': '0.2-1.4', 'normal_female': '0.2-25'},
        'DHEA-S': {'unit': 'μg/dL', 'normal_male': '100-450', 'normal_female': '45-320'},
        'Aldosterone': {'unit': 'ng/dL', 'normal_male': '4-31', 'normal_female': '4-31'},
        'Renin': {'unit': 'ng/mL/hr', 'normal_male': '0.5-4', 'normal_female': '0.5-4'},
        'PTH': {'unit': 'pg/mL', 'normal_male': '10-65', 'normal_female': '10-65'},
    },
    
    # ========== 15. أمراض معدية (Infectious Diseases) ==========
    'أمراض معدية': {
        'HBsAg': {'unit': '', 'normal_male': 'Negative', 'normal_female': 'Negative'},
        'Anti-HBs': {'unit': 'mIU/mL', 'normal_male': 'أكثر من 10', 'normal_female': 'أكثر من 10'},
        'HBcAb': {'unit': '', 'normal_male': 'Negative', 'normal_female': 'Negative'},
        'HBeAg': {'unit': '', 'normal_male': 'Negative', 'normal_female': 'Negative'},
        'Anti-HCV': {'unit': '', 'normal_male': 'Negative', 'normal_female': 'Negative'},
        'HIV Ab': {'unit': '', 'normal_male': 'Negative', 'normal_female': 'Negative'},
        'VDRL': {'unit': '', 'normal_male': 'Non-reactive', 'normal_female': 'Non-reactive'},
        'TPHA': {'unit': '', 'normal_male': 'Negative', 'normal_female': 'Negative'},
        'Widal Test': {'unit': 'Titer', 'normal_male': 'أقل من 1:80', 'normal_female': 'أقل من 1:80'},
        'Mantoux Test': {'unit': 'mm', 'normal_male': 'أقل من 10', 'normal_female': 'أقل من 10'},
        'EBV VCA IgM': {'unit': '', 'normal_male': 'Negative', 'normal_female': 'Negative'},
        'CMV IgM': {'unit': '', 'normal_male': 'Negative', 'normal_female': 'Negative'},
        'Rubella IgG': {'unit': 'IU/mL', 'normal_male': 'أكثر من 10', 'normal_female': 'أكثر من 10'},
    },
    
    # ========== 16. مناعة (Immunology) ==========
    'مناعة': {
        'IgG': {'unit': 'mg/dL', 'normal_male': '700-1600', 'normal_female': '700-1600'},
        'IgA': {'unit': 'mg/dL', 'normal_male': '70-400', 'normal_female': '70-400'},
        'IgM': {'unit': 'mg/dL', 'normal_male': '40-230', 'normal_female': '40-230'},
        'IgE': {'unit': 'IU/mL', 'normal_male': 'أقل من 100', 'normal_female': 'أقل من 100'},
        'C3': {'unit': 'mg/dL', 'normal_male': '90-180', 'normal_female': '90-180'},
        'C4': {'unit': 'mg/dL', 'normal_male': '10-40', 'normal_female': '10-40'},
        'CH50': {'unit': 'U/mL', 'normal_male': '30-75', 'normal_female': '30-75'},
    },
}

# ======================== الدوال المساعدة ========================

def get_all_categories():
    """الحصول على جميع أقسام التحاليل"""
    return list(TESTS_DATA.keys())

def get_tests_by_category(category):
    """الحصول على تحاليل قسم معين"""
    return list(TESTS_DATA.get(category, {}).keys())

def get_test_unit(test_name):
    """الحصول على وحدة قياس التحليل"""
    for category in TESTS_DATA.values():
        if test_name in category:
            return category[test_name]['unit']
    return ''

def get_normal_range(test_name, gender='ذكر'):
    """الحصول على المدى الطبيعي حسب الجنس"""
    for category in TESTS_DATA.values():
        if test_name in category:
            test_info = category[test_name]
            if gender == 'ذكر':
                return test_info.get('normal_male', 'غير محدد')
            else:
                return test_info.get('normal_female', test_info.get('normal_male', 'غير محدد'))
    return 'غير محدد'

def get_test_info(test_name):
    """الحصول على جميع معلومات التحليل"""
    for category in TESTS_DATA.values():
        if test_name in category:
            return category[test_name]
    return None

def search_tests(query):
    """البحث عن تحليل بالاسم"""
    query = query.lower()
    results = []
    for category_name, tests in TESTS_DATA.items():
        for test_name in tests.keys():
            if query in test_name.lower():
                results.append({
                    'name': test_name,
                    'category': category_name,
                    'info': tests[test_name]
                })
    return results

def get_category_stats():
    """إحصائيات عدد التحاليل في كل قسم"""
    stats = {}
    for category, tests in TESTS_DATA.items():
        stats[category] = len(tests)
    return stats