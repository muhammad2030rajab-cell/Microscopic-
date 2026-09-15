"""
المحرك الطبي الرئيسي - يربط كل المكونات
"""

from calculations import *
from interpretation import interpret_result
from tests_data import get_test_info, get_all_categories
from database import get_report_details

class MedicalEngine:
    def __init__(self):
        self.calculated_tests = {}  # للتحاليل المحسوبة
    
    def process_report(self, report_id):
        """معالجة تقرير كامل وإضافة التحاليل المحسوبة والتفسيرات"""
        report = get_report_details(report_id)
        if not report:
            return None
        
        # إضافة التفسيرات للتحاليل الموجودة
        for test in report['tests']:
            interpretation = interpret_result(
                test['name'], 
                test['value'], 
                report['gender'],
                report.get('age')
            )
            test['interpretation'] = interpretation
        
        # إضافة التحاليل المحسوبة
        self.add_calculated_tests(report)
        
        return report
    
    def add_calculated_tests(self, report):
        """إضافة تحاليل محسوبة (زي LDL, A/G ratio)"""
        tests_dict = {t['name']: t['value'] for t in report['tests']}
        
        # حساب نسبة A/G
        if 'Albumin' in tests_dict and 'Globulin' in tests_dict:
            ag_ratio = calculate_ag_ratio(
                float(tests_dict['Albumin']), 
                float(tests_dict['Globulin'])
            )
            if ag_ratio:
                report['tests'].append({
                    'name': 'A/G Ratio',
                    'value': ag_ratio,
                    'unit': '',
                    'normal_range': '1.0-2.5',
                    'interpretation': interpret_result('A/G Ratio', ag_ratio, report['gender'])
                })
        
        # حساب LDL إذا متوفر
        if all(k in tests_dict for k in ['Total Cholesterol', 'HDL', 'Triglycerides']):
            ldl = calculate_ldl_from_friedewald(
                float(tests_dict['Total Cholesterol']),
                float(tests_dict['HDL']),
                float(tests_dict['Triglycerides'])
            )
            if ldl:
                report['tests'].append({
                    'name': 'LDL (محسوب)',
                    'value': ldl,
                    'unit': 'mg/dL',
                    'normal_range': 'حتى 100',
                    'interpretation': interpret_result('LDL', ldl, report['gender'])
                })
        
        return report
    
    def generate_summary(self, report):
        """توليد ملخص طبي للتقرير"""
        summary = {
            'normal_count': 0,
            'abnormal_count': 0,
            'critical_count': 0,
            'recommendations': []
        }
        
        for test in report['tests']:
            if 'interpretation' in test:
                status = test['interpretation']['status']
                if status == 'طبيعي':
                    summary['normal_count'] += 1
                elif status in ['مرتفع', 'منخفض']:
                    summary['abnormal_count'] += 1
                    if self.is_critical(test):
                        summary['critical_count'] += 1
                        summary['recommendations'].append(
                            f"{test['name']}: {test['interpretation']['interpretation']}"
                        )
        
        return summary
    
    def is_critical(self, test):
        """التحقق مما إذا كانت النتيجة حرجة"""
        critical_tests = {
            'Glucose': {'high': 300, 'low': 50},
            'Potassium': {'high': 6.5, 'low': 2.5},
            'Sodium': {'high': 155, 'low': 120},
            'Hemoglobin': {'low': 7},
        }
        
        if test['name'] in critical_tests:
            try:
                val = float(test['value'])
                criteria = critical_tests[test['name']]
                
                if 'high' in criteria and val > criteria['high']:
                    return True
                if 'low' in criteria and val < criteria['low']:
                    return True
            except:
                pass
        
        return False