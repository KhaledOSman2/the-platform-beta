document.addEventListener('DOMContentLoaded', function () {
    // التحقق من وجود التوكن في localStorage
    const token = localStorage.getItem('token');

    // إضافة عنوان قسم الكورسات بتصميم محسن
    const coursesSectionHeader = document.createElement('div');
    coursesSectionHeader.className = 'courses-section-header mb-4';
    coursesSectionHeader.innerHTML = `
        <div class="title-area">
            <h2 class="courses-title">الكورسات الخاصة بك <span id="coursesCounter" class="courses-count"></span></h2>
            <div class="courses-decoration"></div>
        </div>
        <div class="search-container">
            <div class="search-bar-wrapper">
                <input type="text" id="courseSearch" class="form-control search-input" placeholder="ابحث عن كورس...">
                <i class="fas fa-search search-icon"></i>
            </div>
        </div>
    `;

    // إضافة العنصر قبل عنصر coursesGrid
    const coursesGrid = document.getElementById('coursesGrid');
    coursesGrid.parentNode.insertBefore(coursesSectionHeader, coursesGrid);

    // إزالة صندوق البحث القديم إذا كان موجودًا


    // Open Profile Modal on link click
    document.getElementById('profileLink').addEventListener('click', function (e) {
        e.preventDefault();
        const modal = new bootstrap.Modal(document.getElementById('profileModal'));
        modal.show();
    });

    // Fetch profile info from /api/dashboard and pre-fill form
    let currentUserId = null;
    fetch('/api/dashboard', { headers: { 'Authorization': 'Bearer ' + token } })
        .then(response => response.json())
        .then(data => {
            const user = data.user;
            currentUserId = user.id;
            document.getElementById('username').value = user.username || '';
            document.getElementById('email').value = user.email || '';
            // Pre-fill password with existing password
            document.getElementById('password').value = user.password || '';

            // Fetch available grades and set dropdown options
            fetch('/api/grades')
                .then(response => response.json())
                .then(grades => {
                    const gradeSelect = document.getElementById('grade');
                    grades.forEach(g => {
                        const option = document.createElement('option');
                        option.value = g.name;
                        option.textContent = g.name;
                        if (g.name === user.grade) option.selected = true;
                        gradeSelect.appendChild(option);
                    });
                })
                .catch(error => console.error('Error fetching grades:', error));
        })
        .catch(error => console.error('Error fetching profile:', error));

    // تعديل: تحديث badge الإشعارات عند تحميل الصفحة
    async function fetchNotificationsCount() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // الحصول على الصف الدراسي للمستخدم الحالي
            const userGrade = await getUserGrade();

            const response = await fetch('/api/notifications', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            let notifications = await response.json();

            // تصفية الإشعارات ليتم عرض الإشعارات العامة والإشعارات المخصصة للصف الدراسي للمستخدم فقط
            notifications = notifications.filter(notification =>
                !notification.grade || // إذا لم يكن هناك صف محدد (للتوافق مع الإشعارات القديمة)
                notification.grade === 'عام' || // إذا كان الإشعار عامًا
                notification.grade === userGrade // إذا كان الإشعار مخصصًا لصف المستخدم
            );

            document.getElementById('notificationCountBadge').textContent = notifications.length;
        } catch (error) {
            console.error('Error fetching notifications count:', error);
        }
    }
    fetchNotificationsCount();

    // إضافة مستمع لزر الإشعارات لتحديث القائمة عند النقر
    const notificationsButton = document.getElementById('notificationsButton');
    if (notificationsButton) {
        notificationsButton.addEventListener('click', function (e) {
            e.preventDefault();
            const dropdown = this.nextElementSibling;
            if (dropdown.style.display === 'block') {
                dropdown.style.display = 'none';
            } else {
                dropdown.style.display = 'block';
                // تحميل الإشعارات عند فتح القائمة
                loadNotifications();
            }
        });
    }

    // جلب الدورات مع إرسال التوكن في الهيدر
    fetchCourses();

    // إضافة مستمع لحدث البحث
    document.getElementById('courseSearch').addEventListener('input', function (e) {
        const searchTerm = e.target.value.toLowerCase();
        filterCourses(searchTerm);
    });


    // Profile form submission
    document.getElementById('profileForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        // Store the original email and grade values to ensure they're preserved
        const originalEmail = document.getElementById('email').value.trim();
        const originalGrade = document.getElementById('grade').value.trim();

        const updatedData = {
            username: document.getElementById('username').value.trim(),
            email: originalEmail, // Use the original email
            password: document.getElementById('password').value.trim(),
            grade: originalGrade // Use the original grade
        };
        try {
            const response = await fetch(`/api/users/${currentUserId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });
            const result = await response.json();
            alert(result.message);
            // إذا تم إرسال علم logout، نقوم بتسجيل الخروج وإعادة التوجيه
            if (result.logout) {
                localStorage.removeItem('token');
                localStorage.removeItem('grade');
                window.location.href = 'login.html';
                return;
            }
            document.getElementById('password').value = '';
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    });

    // إضافة كود للتحكم في قائمة الإشعارات على الجوال
    const notificationDropdown = notificationsButton.closest('.notification-dropdown');

    // عند النقر على زر الإشعارات
    notificationsButton.addEventListener('click', function () {
        // إضافة فئة للجسم عند فتح القائمة في وضع الهاتف
        if (window.innerWidth <= 767) {
            document.body.classList.toggle('notification-open');
            notificationDropdown.classList.toggle('show');
        }
    });

    // إغلاق القائمة عند النقر خارجها في وضع الهاتف
    document.addEventListener('click', function (event) {
        if (window.innerWidth <= 767 &&
            !notificationDropdown.contains(event.target) &&
            document.body.classList.contains('notification-open')) {
            document.body.classList.remove('notification-open');
            notificationDropdown.classList.remove('show');
        }
    });
});

async function fetchCourses() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/courses', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        // إذا كان الرد غير مخول يتم إعادة التوجيه لصفحة تسجيل الدخول
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('grade');
            window.location.href = 'login.html';
            alert('انتهت صلاحية الجلسة الرجاء تسجيل الدخول مرة أخرى.');
            return;
        }

        const courses = await response.json();
        displayCourses(courses);
    } catch (error) {
        console.error('حدث خطأ أثناء جلب الكورسات:', error);
    }
}

function displayCourses(courses) {
    const coursesGrid = document.getElementById('coursesGrid');
    const noCoursesMessage = document.getElementById('noCoursesMessage');
    coursesGrid.innerHTML = '';

    // تحديث عداد الكورسات
    const coursesCounter = document.getElementById('coursesCounter');
    if (coursesCounter) {
        if (courses.length > 0) {
            coursesCounter.innerHTML = `<i class="fas fa-book-open"></i>${courses.length} كورس`;
            coursesCounter.style.display = 'inline-flex';

            // إضافة فئة updated لتفعيل تأثير النبض
            coursesCounter.classList.add('updated');

            // إزالة الفئة بعد انتهاء التأثير
            setTimeout(() => {
                coursesCounter.classList.remove('updated');
            }, 600);
        } else {
            coursesCounter.style.display = 'none';
        }
    }

    if (courses.length === 0) {
        noCoursesMessage.style.display = 'block';
        noCoursesMessage.innerHTML = '<i class="fas fa-folder-open"></i><p>لا توجد كورسات متاحة لك حالياً</p>';
    } else {
        noCoursesMessage.style.display = 'none';
        // Reverse courses array so newest shows first
        courses = courses.reverse();

        // إضافة عنصر الصف قبل إضافة البطاقات
        coursesGrid.classList.add('row');

        courses.forEach((course, index) => {
            // Add "جديد" badge to the first (newest) course
            const badge = (index === 0)
                ? `<span class="new-badge"><i class="fas fa-star me-1"></i> جديد</span>`
                : '';

            const courseCard = document.createElement('div');
            courseCard.className = 'col-lg-4 col-md-6 mb-4'; // تحديد عرض البطاقة
            courseCard.innerHTML = `
                    <div class="course-card card rounded-4 overflow-hidden shadow">
                        <div class="position-relative overflow-hidden">
                            <img src="${course.imageURL || 'images/course-placeholder.jpg'}" 
                                class="card-img-top" 
                                alt="${course.title}">
                            ${badge}
                        </div>
                        <div class="card-body">
                        <span class="grade-badge"><i class="fas fa-graduation-cap"></i>${course.grade}</span>
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
            coursesGrid.appendChild(courseCard);
        });
    }
}

function filterCourses(searchTerm) {
    const coursesGrid = document.getElementById('coursesGrid');
    const courseCards = Array.from(document.querySelectorAll('.col-lg-4.col-md-6.mb-4'));
    const noCoursesMessage = document.getElementById('noCoursesMessage');

    // تخزين نتائج البحث
    const matchingCourses = [];
    const nonMatchingCourses = [];

    // فحص وتقسيم الكورسات إلى مطابقة وغير مطابقة
    courseCards.forEach(courseWrapper => {
        const title = courseWrapper.querySelector('.card-title').textContent.toLowerCase();

        if (title.includes(searchTerm)) {
            matchingCourses.push(courseWrapper);
            courseWrapper.style.display = 'block';
        } else {
            nonMatchingCourses.push(courseWrapper);
            courseWrapper.style.display = 'none';
        }
    });

    // إظهار رسالة في حالة عدم وجود نتائج
    if (matchingCourses.length === 0 && searchTerm !== '') {
        noCoursesMessage.style.display = 'block';
        noCoursesMessage.innerHTML = '<i class="fas fa-search"></i><p>لا توجد نتائج للبحث</p>';
    } else {
        noCoursesMessage.style.display = 'none';
    }

    // إذا كان البحث فارغًا، استعادة الترتيب الأصلي
    if (searchTerm === '') {
        // إعادة تحميل وترتيب الكورسات
        fetchCourses();
        return;
    }

    // إعادة ترتيب الكورسات: الكورسات المطابقة أولاً
    coursesGrid.innerHTML = '';
    matchingCourses.forEach(course => {
        coursesGrid.appendChild(course);
    });

    // إضافة الكورسات غير المطابقة (مخفية) للحفاظ على هيكل الصفحة
    nonMatchingCourses.forEach(course => {
        coursesGrid.appendChild(course);
    });
}


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

        // إظهار رسالة تم تسجيل الخروج بنجاح
        alert('تم تسجيل الخروج بنجاح');

        // إعادة تحميل الصفحة أو الانتقال لصفحة تسجيل الدخول
        window.location.href = 'login.html';
    });
});

// تعديل: إضافة متغير لتتبع حالة تحميل الإشعارات
let isLoadingNotifications = false;

// تحميل الإشعارات مع منع التكرار
async function loadNotifications() {
    // منع تكرار التحميل إذا كانت العملية جارية بالفعل
    if (isLoadingNotifications) return;

    isLoadingNotifications = true;

    const notificationsDropdown = document.getElementById('notificationsDropdown');
    // تفريغ القائمة قبل إضافة عناصر جديدة
    notificationsDropdown.innerHTML = '';

    try {
        // الحصول على الصف الدراسي للمستخدم الحالي
        const userGrade = await getUserGrade();

        const response = await fetch('/api/notifications', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        let notifications = await response.json();

        // تصفية الإشعارات ليتم عرض الإشعارات العامة والإشعارات المخصصة للصف الدراسي للمستخدم فقط
        notifications = notifications.filter(notification =>
            !notification.grade || // إذا لم يكن هناك صف محدد (للتوافق مع الإشعارات القديمة)
            notification.grade === 'عام' || // إذا كان الإشعار عامًا
            notification.grade === userGrade // إذا كان الإشعار مخصصًا لصف المستخدم
        );

        // ترتيب الإشعارات الأحدث أولاً
        notifications = notifications.reverse();
        document.getElementById('notificationCountBadge').textContent = notifications.length;

        if (notifications.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'لا توجد إشعارات';
            notificationsDropdown.appendChild(li);
        } else {
            notifications.forEach((notification, index) => {
                const li = document.createElement('li');

                // إضافة عنوان الإشعار (يظهر على اليمين)
                const titleSpan = document.createElement('span');
                titleSpan.className = 'notification-title';
                titleSpan.textContent = notification.title;
                li.appendChild(titleSpan);

                // إضافة شارة "جديد" للإشعار الأول فقط (يظهر على اليسار)
                if (index === 0) {
                    const badgeSpan = document.createElement('span');
                    badgeSpan.className = 'new-notification-badge';
                    badgeSpan.textContent = 'جديد';
                    li.appendChild(badgeSpan);
                }

                li.addEventListener('click', function () {
                    document.getElementById('notificationDetailsModalLabel').innerHTML =
                        `<i class="fas fa-bell"></i> ${notification.title}`;
                    document.getElementById('notificationDetailsContent').textContent = notification.content;
                    const notificationModal = new bootstrap.Modal(document.getElementById('notificationDetailsModal'));
                    notificationModal.show();
                });
                notificationsDropdown.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Error fetching notifications:', error);
    } finally {
        isLoadingNotifications = false;
    }
}

// دالة منفصلة لتحديث عدد الإشعارات فقط
async function fetchNotificationsCount() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // الحصول على الصف الدراسي للمستخدم الحالي
        const userGrade = await getUserGrade();

        const response = await fetch('/api/notifications', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        let notifications = await response.json();

        // تصفية الإشعارات ليتم عرض الإشعارات العامة والإشعارات المخصصة للصف الدراسي للمستخدم فقط
        notifications = notifications.filter(notification =>
            !notification.grade || // إذا لم يكن هناك صف محدد (للتوافق مع الإشعارات القديمة)
            notification.grade === 'عام' || // إذا كان الإشعار عامًا
            notification.grade === userGrade // إذا كان الإشعار مخصصًا لصف المستخدم
        );

        document.getElementById('notificationCountBadge').textContent = notifications.length;
    } catch (error) {
        console.error('Error fetching notifications count:', error);
    }
}

// دالة للحصول على الصف الدراسي للمستخدم الحالي
async function getUserGrade() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;

        const response = await fetch('/api/dashboard', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        return data.user.grade || null;
    } catch (error) {
        console.error('Error fetching user grade:', error);
        return null;
    }
}

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function () {
    // تحديث عدد الإشعارات فقط، بدون فتح القائمة
    fetchNotificationsCount();

    // تحميل الإشعارات فقط عند النقر على الزر
    const notificationsButton = document.getElementById('notificationsButton');
    if (notificationsButton) {
        // إزالة أي مستمعات أحداث سابقة لتجنب التكرار
        notificationsButton.replaceWith(notificationsButton.cloneNode(true));

        // إضافة مستمع حدث جديد
        document.getElementById('notificationsButton').addEventListener('click', function () {
            loadNotifications();
        });
    }
});