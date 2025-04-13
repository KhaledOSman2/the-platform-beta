// إدارة الإشعارات العامة
document.addEventListener('DOMContentLoaded', function() {
    // الوصول إلى عناصر الإشعار
    const notificationsSection = document.getElementById('notificationsSection');
    const notificationTitle = document.getElementById('notificationTitle');
    const notificationMessage = document.getElementById('notificationMessage');
    
    // التحقق من وجود توكن
    const token = localStorage.getItem('token');
    
    if (!token) {
        // إذا كان المستخدم غير مسجل دخول، عرض إشعار افتراضي للزوار
        showDefaultNotification("مرحباً بك في منصة NUMBER 1", "تصفح الكورسات المتاحة وسجل الدخول للاستفادة من كافة المزايا");
    } else {
        // محاولة جلب الإشعارات للمستخدمين المسجلين
        fetchPublicNotifications();
    }
    
    // دالة لعرض إشعار افتراضي بنص محدد
    function showDefaultNotification(title, message) {
        notificationTitle.textContent = title;
        notificationMessage.textContent = message;
        notificationsSection.style.display = 'block';
        console.log('تم عرض إشعار افتراضي');
    }
    
    // دالة لجلب إشعارات عامة بدون حاجة لمصادقة
    async function fetchPublicNotifications() {
        try {
            // جلب أول إشعار عام أو إشعار متاح للجميع
            // لاحظ: نستخدم هنا طريقة GET ونتجاهل الاستجابة غير المصرّح بها (403)
            
            // نقوم بعمل GET مباشر للإشعارات عبر العنوان وإذا فشل نستخدم القيمة الافتراضية
            const response = await fetch('/api/all-courses');
            
            if (response.ok) {
                // عرض إشعار ديناميكي عن الكورسات
                showDefaultNotification(
                    "كورسات جديدة متاحة الآن", 
                    "اكتشف أحدث الكورسات المضافة للمنصة وابدأ رحلة التعلم الآن"
                );
            } else {
                // عرض إشعار افتراضي إذا فشل جلب الكورسات
                showDefaultNotification(
                    "مرحباً بك في منصة NUMBER 1",
                    "المنصة التعليمية الأولى للدراسات الاجتماعية"
                );
            }
            
            console.log("تم عرض إشعار عام");
            
        } catch (error) {
            console.error('خطأ في جلب الإشعارات:', error);
            
            // عرض إشعار افتراضي في حالة فشل الاتصال
            showDefaultNotification(
                "مرحباً بك في منصة NUMBER 1",
                "استمتع بتجربة تعلم فريدة مع أفضل المحتويات التعليمية"
            );
        }
    }
}); 