"""
نظام تسجيل وإدارة التحاليل الطبية
"""

class TestRegistry:
    def __init__(self):
        self.tests = {}
        self.categories = {}
        self.load_default_tests()
    
    def load_default_tests(self):
        """تحميل التحاليل الافتراضية"""
        from tests_data import TESTS_DATA
        
        for category, tests in TESTS_DATA.items():
            self.add_category(category)
            for test_name, test_info in tests.items():
                self.register_test(test_name, category, test_info)
    
    def register_test(self, test_name, category, test_info):
        """تسجيل تحليل جديد"""
        if category not in self.categories:
            self.categories[category] = []
        
        self.tests[test_name] = {
            'name': test_name,
            'name_ar': test_info.get('name_ar', test_name),
            'category': category,
            'unit': test_info.get('unit', ''),
            'normal_male': test_info.get('normal_male', ''),
            'normal_female': test_info.get('normal_female', ''),
            'min_male': test_info.get('min_male'),
            'max_male': test_info.get('max_male'),
            'min_female': test_info.get('min_female'),
            'max_female': test_info.get('max_female'),
            'calculations': test_info.get('calculations', []),
            'interpretation': test_info.get('interpretation', ''),
        }
        
        if test_name not in self.categories[category]:
            self.categories[category].append(test_name)
    
    def get_test(self, test_name):
        """الحصول على معلومات تحليل"""
        return self.tests.get(test_name)
    
    def get_tests_by_category(self, category):
        """الحصول على تحاليل قسم معين"""
        return self.categories.get(category, [])
    
    def get_all_categories(self):
        """الحصول على جميع الأقسام"""
        return list(self.categories.keys())
    
    def search_tests(self, query):
        """البحث عن تحاليل"""
        query = query.lower()
        results = []
        
        for test_name, test_info in self.tests.items():
            if query in test_name.lower() or query in test_info['name_ar'].lower():
                results.append(test_info)
        
        return results
    
    def add_custom_test(self, test_data):
        """إضافة تحليل مخصص"""
        test_name = test_data['name']
        category = test_data.get('category', 'تحاليل مخصصة')
        
        if category not in self.categories:
            self.categories[category] = []
        
        self.tests[test_name] = test_data
        self.categories[category].append(test_name)
        
        return test_name

# إنشاء نسخة عامة من السجل
test_registry = TestRegistry()