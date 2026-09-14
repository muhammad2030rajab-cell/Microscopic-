from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
import io
from datetime import datetime

def create_pdf_report(report_details):
    """إنشاء تقرير PDF مطابق للصورة تماماً"""
    buffer = io.BytesIO()
    
    # إعداد المستند
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72,
    )
    
    # العناصر
    elements = []
    styles = getSampleStyleSheet()
    
    # ========== 1. معلومات المريض ==========
    # Patient Name
    p_name = Paragraph(f"Patient Name<br/><b>السيد / {report_details['patient_name']}</b>", styles['Normal'])
    elements.append(p_name)
    elements.append(Spacer(1, 0.1*inch))
    
    # Age / Sex
    age_sex = Paragraph(f"Age / Sex<br/><b>{report_details['age']} Years / {'Male' if report_details['gender'] == 'ذكر' else 'Female'}</b>", styles['Normal'])
    elements.append(age_sex)
    elements.append(Spacer(1, 0.1*inch))
    
    # Referred By
    referred = Paragraph(f"Referred By<br/><b>Himself</b>", styles['Normal'])
    elements.append(referred)
    elements.append(Spacer(1, 0.1*inch))
    
    # Patient ID
    patient_id = Paragraph(f"Patient ID.<br/><b>1-250-215-1004</b>", styles['Normal'])
    elements.append(patient_id)
    elements.append(Spacer(1, 0.1*inch))
    
    # Request Date
    req_date = Paragraph(f"Request Date<br/><b>{datetime.now().strftime('%d-%b-%Y %I:%M %p')}</b>", styles['Normal'])
    elements.append(req_date)
    elements.append(Spacer(1, 0.1*inch))
    
    # Printed In
    printed = Paragraph(f"Printed In<br/><b>{datetime.now().strftime('%d-%b-%Y %I:%M %p')}</b>", styles['Normal'])
    elements.append(printed)
    elements.append(Spacer(1, 0.3*inch))
    
    # ========== 2. عنوان التقرير ==========
    title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Heading1'],
        fontSize=16,
        alignment=TA_CENTER,
        spaceAfter=20,
        fontName='Helvetica-Bold'
    )
    title = Paragraph("BIOCHEMISTRY REPORT", title_style)
    elements.append(title)
    elements.append(Spacer(1, 0.2*inch))
    
    # ========== 3. Liver Functions Section ==========
    liver_title = Paragraph("Liver Functions:", styles['Heading2'])
    elements.append(liver_title)
    elements.append(Spacer(1, 0.1*inch))
    
    # تجميع تحاليل وظائف الكبد
    liver_tests = []
    for test in report_details['tests']:
        if any(x in test['test_name'] for x in ['SGPT', 'SGOT', 'AST', 'ALT', 'GGT']):
            liver_tests.append(test)
    
    if liver_tests:
        for test in liver_tests:
            # SGGT (Aspartate Aminotransferase) : 35 U/L
            test_line = f"- <b>{test['test_name']}</b> : {test['result_value']} {test.get('unit', '')}"
            elements.append(Paragraph(test_line, styles['Normal']))
            
            # Male Up To 40 U/L (مسافة بادئة)
            normal_range = test.get('normal_range', '')
            if normal_range:
                if 'حتى' in normal_range:
                    normal_value = normal_range.replace('حتى', '').strip()
                    normal_line = f"  Male Up To {normal_value} {test.get('unit', '')}"
                elif '-' in normal_range:
                    normal_line = f"  Male {normal_range} {test.get('unit', '')}"
                else:
                    normal_line = f"  Male {normal_range} {test.get('unit', '')}"
                elements.append(Paragraph(normal_line, styles['Normal']))
            
            elements.append(Spacer(1, 0.05*inch))
    
    # AST/ALT Ratio (إذا كان موجود)
    for test in report_details['tests']:
        if 'AST/ALT' in test['test_name'] or 'Ratio' in test['test_name']:
            elements.append(Spacer(1, 0.1*inch))
            ratio_line = f"- <b>{test['test_name']}</b> : {test['result_value']}"
            elements.append(Paragraph(ratio_line, styles['Normal']))
            
            normal_range = test.get('normal_range', '')
            if normal_range:
                normal_line = f"  Male {normal_range}"
                elements.append(Paragraph(normal_line, styles['Normal']))
            break
    
    elements.append(Spacer(1, 0.3*inch))
    
    # ========== 4. Kidney Functions Section (لو موجودة) ==========
    kidney_tests = []
    for test in report_details['tests']:
        if any(x in test['test_name'] for x in ['Creatinine', 'Urea', 'Uric Acid']):
            kidney_tests.append(test)
    
    if kidney_tests:
        kidney_title = Paragraph("Kidney Functions:", styles['Heading2'])
        elements.append(kidney_title)
        elements.append(Spacer(1, 0.1*inch))
        
        for test in kidney_tests:
            test_line = f"- <b>{test['test_name']}</b> : {test['result_value']} {test.get('unit', '')}"
            elements.append(Paragraph(test_line, styles['Normal']))
            
            normal_range = test.get('normal_range', '')
            if normal_range:
                if 'حتى' in normal_range:
                    normal_value = normal_range.replace('حتى', '').strip()
                    normal_line = f"  Male Up To {normal_value} {test.get('unit', '')}"
                else:
                    normal_line = f"  Male {normal_range} {test.get('unit', '')}"
                elements.append(Paragraph(normal_line, styles['Normal']))
            
            elements.append(Spacer(1, 0.05*inch))
        
        elements.append(Spacer(1, 0.2*inch))
    
    # ========== 5. CBC Section (لو موجودة) ==========
    cbc_tests = []
    for test in report_details['tests']:
        if any(x in test['test_name'] for x in ['WBC', 'RBC', 'Hemoglobin', 'Platelet']):
            cbc_tests.append(test)
    
    if cbc_tests:
        cbc_title = Paragraph("Complete Blood Count:", styles['Heading2'])
        elements.append(cbc_title)
        elements.append(Spacer(1, 0.1*inch))
        
        for test in cbc_tests:
            test_line = f"- <b>{test['test_name']}</b> : {test['result_value']} {test.get('unit', '')}"
            elements.append(Paragraph(test_line, styles['Normal']))
            
            normal_range = test.get('normal_range', '')
            if normal_range:
                if 'حتى' in normal_range:
                    normal_value = normal_range.replace('حتى', '').strip()
                    normal_line = f"  Male Up To {normal_value} {test.get('unit', '')}"
                else:
                    normal_line = f"  Male {normal_range} {test.get('unit', '')}"
                elements.append(Paragraph(normal_line, styles['Normal']))
            
            elements.append(Spacer(1, 0.05*inch))
        
        elements.append(Spacer(1, 0.2*inch))
    
    # ========== 6. Lipid Profile Section (لو موجودة) ==========
    lipid_tests = []
    for test in report_details['tests']:
        if any(x in test['test_name'] for x in ['Cholesterol', 'Triglyceride', 'HDL', 'LDL']):
            lipid_tests.append(test)
    
    if lipid_tests:
        lipid_title = Paragraph("Lipid Profile:", styles['Heading2'])
        elements.append(lipid_title)
        elements.append(Spacer(1, 0.1*inch))
        
        for test in lipid_tests:
            test_line = f"- <b>{test['test_name']}</b> : {test['result_value']} {test.get('unit', '')}"
            elements.append(Paragraph(test_line, styles['Normal']))
            
            normal_range = test.get('normal_range', '')
            if normal_range:
                if 'حتى' in normal_range:
                    normal_value = normal_range.replace('حتى', '').strip()
                    normal_line = f"  Male Up To {normal_value} {test.get('unit', '')}"
                else:
                    normal_line = f"  Male {normal_range} {test.get('unit', '')}"
                elements.append(Paragraph(normal_line, styles['Normal']))
            
            elements.append(Spacer(1, 0.05*inch))
        
        elements.append(Spacer(1, 0.2*inch))
    
    # ========== 7. Diabetes Section (لو موجودة) ==========
    diabetes_tests = []
    for test in report_details['tests']:
        if any(x in test['test_name'] for x in ['Glucose', 'HbA1c']):
            diabetes_tests.append(test)
    
    if diabetes_tests:
        diabetes_title = Paragraph("Diabetes Profile:", styles['Heading2'])
        elements.append(diabetes_title)
        elements.append(Spacer(1, 0.1*inch))
        
        for test in diabetes_tests:
            test_line = f"- <b>{test['test_name']}</b> : {test['result_value']} {test.get('unit', '')}"
            elements.append(Paragraph(test_line, styles['Normal']))
            
            normal_range = test.get('normal_range', '')
            if normal_range:
                if 'حتى' in normal_range:
                    normal_value = normal_range.replace('حتى', '').strip()
                    normal_line = f"  Male Up To {normal_value} {test.get('unit', '')}"
                else:
                    normal_line = f"  Male {normal_range} {test.get('unit', '')}"
                elements.append(Paragraph(normal_line, styles['Normal']))
            
            elements.append(Spacer(1, 0.05*inch))
        
        elements.append(Spacer(1, 0.2*inch))
    
    # ========== 8. التوقيع ==========
    signature_style = ParagraphStyle(
        'Signature',
        parent=styles['Normal'],
        fontSize=11,
        alignment=TA_RIGHT,
        spaceBefore=30,
    )
    
    signature = Paragraph("Doctor's signature:<br/>Thanks", signature_style)
    elements.append(signature)
    
    # بناء PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer