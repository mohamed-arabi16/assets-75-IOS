import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      "nav.dashboard": "Dashboard",
      "nav.income": "Income",
      "nav.expenses": "Expenses", 
      "nav.debts": "Debts",
      "nav.assets": "Assets",
      "nav.settings": "Settings",
      
      // Common
      "common.add": "Add",
      "common.edit": "Edit",
      "common.delete": "Delete",
      "common.cancel": "Cancel",
      "common.save": "Save",
      "common.export": "Export",
      
      // Dashboard
      "dashboard.title": "Financial Dashboard",
      "dashboard.subtitle": "Overview of your financial health and current balance",
      
      // Settings
      "settings.title": "Settings",
      "settings.subtitle": "Customize your Balance Tracker experience",
      "settings.currency": "Currency Preferences",
      "settings.appearance": "Appearance",
      "settings.language": "Language & Region",
      "settings.theme.light": "Light",
      "settings.theme.dark": "Dark",
      "settings.theme.system": "System",
      
      // Export
      "export.success": "Data exported successfully!",
      "export.error": "Failed to export data"
    }
  },
  ar: {
    translation: {
      // Navigation
      "nav.dashboard": "لوحة التحكم",
      "nav.income": "الدخل",
      "nav.expenses": "المصروفات",
      "nav.debts": "الديون",
      "nav.assets": "الأصول",
      "nav.settings": "الإعدادات",
      
      // Common
      "common.add": "إضافة",
      "common.edit": "تعديل",
      "common.delete": "حذف",
      "common.cancel": "إلغاء",
      "common.save": "حفظ",
      "common.export": "تصدير",
      
      // Dashboard
      "dashboard.title": "لوحة التحكم المالية",
      "dashboard.subtitle": "نظرة عامة على صحتك المالية والرصيد الحالي",
      
      // Settings
      "settings.title": "الإعدادات",
      "settings.subtitle": "تخصيص تجربة متتبع الرصيد الخاص بك",
      "settings.currency": "تفضيلات العملة",
      "settings.appearance": "المظهر",
      "settings.language": "اللغة والمنطقة",
      "settings.theme.light": "فاتح",
      "settings.theme.dark": "داكن",
      "settings.theme.system": "النظام",
      
      // Export
      "export.success": "تم تصدير البيانات بنجاح!",
      "export.error": "فشل في تصدير البيانات"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;