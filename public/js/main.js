document.addEventListener('DOMContentLoaded', async function () {
    const currentPath = window.location.pathname;

    if (currentPath.endsWith('login.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const redirectFrom = urlParams.get('from');

        if (redirectFrom) {
            const alertContainer = document.getElementById('alertContainer');

            if (alertContainer) {
                let alertMessage = '';

                switch (redirectFrom) {
                    case 'admin':
                        alertMessage = 'غير مسموح لك بالوصول إلى هذه الصفحة';
                        break;
                    case 'dashboard':
                        alertMessage = 'برجاء تسجيل الدخول للوصول إلى لوحة التحكم';
                        break;
                    case 'course':
                        alertMessage = 'برجاء تسجيل الدخول لعرض الكورس';
                        break;
                    default:
                        alertMessage = 'برجاء تسجيل الدخول للوصول إلى هذا المحتوى';
                }

                alertContainer.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                    <strong>تنبيه!</strong> ${alertMessage}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="إغلاق"></button>
                </div>`;
            }
        }
    }

    // Skip token validation if already handled by preload script
    const isProtectedPage = currentPath.endsWith('dashboard.html') ||
        currentPath.endsWith('admin.html') ||
        currentPath.endsWith('course.html');

    // For pages that aren't protected or don't have preload scripts
    if (!isProtectedPage) {
        // تحميل قائمة الصفوف الدراسية في نموذج التسجيل
        if (currentPath.endsWith('register.html')) {
            const gradeSelect = document.getElementById('grade');
            try {
                const gradesResponse = await fetch('/api/grades');
                const grades = await gradesResponse.json();
                grades.forEach(grade => {
                    const option = document.createElement('option');
                    option.value = grade.name;
                    option.textContent = grade.name;
                    gradeSelect.appendChild(option);
                });
            } catch (err) {
                console.error('Error fetching grades:', err);
            }
        }
    }
});


AOS.init({
    duration: 1000
});

document.addEventListener('DOMContentLoaded', async function () {
    try {
        const response = await fetch('/api/all-courses');
        const courses = await response.json();
        const latestCoursesGrid = document.getElementById('latestCoursesGrid');

        courses.slice(-3).reverse().forEach(course => {
            const courseCard = document.createElement('div');
            courseCard.className = 'col-lg-4 col-md-6';
            courseCard.innerHTML = `
                <div class="course-card card rounded-4 overflow-hidden shadow">
                    <div class="position-relative overflow-hidden">
                        <img src="${course.imageURL || 'images/course-placeholder.jpg'}" 
                             class="card-img-top" 
                             alt="${course.title}">
                        <span class="new-badge"><i class="fas fa-star me-1"></i> جديد</span>
                    </div>
                    <div class="card-body">
                        <span class="grade-badge">${course.grade}</span>
                        <h5 class="card-title fw-bold">${course.title}</h5>
                        <div class="course-meta">
                           <span class="lectures-count" style="box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 20px;">
                                    <i class="fas fa-play-circle me-2"></i>
                                    ${course.videosCount !== undefined ? course.videosCount : 0} محاضرات
                                </span>
                            <button class="watch-cta-button" 
                                    onclick="window.location.href='course.html?id=${course.id}'">
                                مشاهدة الكورس
                            </button>
                        </div>
                    </div>
                </div>
            `;
            latestCoursesGrid.appendChild(courseCard);
        });
    } catch (error) {
        console.error('حدث خطأ أثناء جلب الكورسات:', error);
    }

});

document.addEventListener('DOMContentLoaded', function () {
    // التحقق من حالة تسجيل الدخول
    const isLoggedIn = !!localStorage.getItem('token');
    const authBtns = document.getElementById('authBtns');
    const userBtns = document.getElementById('userBtns');

    if (isLoggedIn) {
        authBtns.classList.add('d-none');
        userBtns.classList.remove('d-none');
    } else {
        authBtns.classList.remove('d-none');
        userBtns.classList.add('d-none');
    }

    // معالجة سلوك شريط التنقل على الشاشات المختلفة
    const navbarCollapse = document.getElementById('navbarNav');

    function adjustNavbar() {
        if (window.innerWidth < 992) {
            // للشاشات الصغيرة - إزالة الظهور التلقائي وتغيير الأنماط
            navbarCollapse.classList.remove('show');
        } else {
            // للشاشات الكبيرة - إضافة class للتأكد من العرض الصحيح
            navbarCollapse.classList.add('desktop-nav');
        }
    }

    // تنفيذ عند تحميل الصفحة
    adjustNavbar();

    // تنفيذ عند تغيير حجم الشاشة
    window.addEventListener('resize', adjustNavbar);

    // إصلاح زر تسجيل الخروج
    document.getElementById('logoutBtn').addEventListener('click', function () {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');

        // إعادة تحميل الصفحة أو الانتقال لصفحة تسجيل الدخول
        window.location.href = 'login.html';
        // إظهار رسالة تم تسجيل الخروج بنجاح
        alert('تم تسجيل الخروج بنجاح');
    });
});
