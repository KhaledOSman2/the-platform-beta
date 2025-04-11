document.addEventListener('DOMContentLoaded', async function () {
    try {
        // Fetch all grades from the API
        const gradesResponse = await fetch('/api/grades');
        const grades = await gradesResponse.json();
        const gradeOrder = grades.map(grade => grade.name);

        // Fetch all courses from the API
        const coursesResponse = await fetch('/api/all-courses');
        const courses = await coursesResponse.json();

        // Show noCoursesMessage if no courses are available
        const noCoursesMessage = document.getElementById('noCoursesMessage');
        if (courses.length === 0) {
            noCoursesMessage.style.display = 'block';
        } else {
            noCoursesMessage.style.display = 'none';
        }

        const coursesByGrade = {};
        // Categorize courses by grade
        courses.forEach(course => {
            if (!coursesByGrade[course.grade]) {
                coursesByGrade[course.grade] = [];
            }
            coursesByGrade[course.grade].push(course);
        });

        const coursesByGradeContainer = document.getElementById('coursesByGrade');
        const gradeFilter = document.getElementById('gradeFilter');

        // Add options to the dropdown
        gradeOrder.forEach(grade => {
            const option = document.createElement('option');
            option.value = grade;
            option.textContent = grade;
            gradeFilter.appendChild(option);
        });

        // إضافة عداد إجمالي الكورسات في قسم الهيرو
        const heroTotalCourses = document.getElementById('heroTotalCourses');
        heroTotalCourses.innerHTML = `
            <i class="fas fa-book-open"></i>
            <span>${courses.length} كورس متاح</span>
        `;

        // تعيين عدد الكورسات في قسم التصفية
        const totalCoursesCount = document.getElementById('totalCoursesCount');
        totalCoursesCount.textContent = courses.length;

        // Function to render courses based on selected grade
        function renderCourses(filterGrade) {
            coursesByGradeContainer.innerHTML = ''; // Clear previous content

            if (filterGrade === 'all') {
                let hasCourses = false;
                let totalDisplayedCourses = 0;

                gradeOrder.forEach(grade => {
                    if (coursesByGrade[grade] && coursesByGrade[grade].length > 0) {
                        createGradeSection(grade, coursesByGrade[grade]);
                        hasCourses = true;
                        totalDisplayedCourses += coursesByGrade[grade].length;
                    }
                });

                // Update hero counter for all courses
                heroTotalCourses.innerHTML = `
                    <i class="fas fa-book-open"></i>
                    <span>${totalDisplayedCourses} كورس متاح</span>
                `;

                // تحديث عدد الكورسات في قسم التصفية
                totalCoursesCount.textContent = totalDisplayedCourses;

                // Show noCoursesMessage if no courses found in any grade
                noCoursesMessage.style.display = hasCourses ? 'none' : 'block';
            } else {
                if (coursesByGrade[filterGrade] && coursesByGrade[filterGrade].length > 0) {
                    createGradeSection(filterGrade, coursesByGrade[filterGrade]);

                    // Update hero counter for filtered grade
                    heroTotalCourses.innerHTML = `
                        <i class="fas fa-book-open"></i>
                        <span>${coursesByGrade[filterGrade].length} كورس متاح في ${filterGrade}</span>
                    `;

                    // تحديث عدد الكورسات في قسم التصفية
                    totalCoursesCount.textContent = coursesByGrade[filterGrade].length;

                    noCoursesMessage.style.display = 'none';
                } else {
                    coursesByGradeContainer.innerHTML = '';

                    // Update hero counter for filtered grade with zero courses
                    heroTotalCourses.innerHTML = `
                        <i class="fas fa-book-open"></i>
                        <span>0 كورس متاح في ${filterGrade}</span>
                    `;

                    // تحديث عدد الكورسات في قسم التصفية
                    totalCoursesCount.textContent = 0;

                    noCoursesMessage.style.display = 'block';
                }
            }
        }
        //تاريخ انشاء الكورس
        function formatDate(dateStr) {
            const date = new Date(dateStr);
            const day = date.getDate();
            const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
            const month = monthNames[date.getMonth()];
            return `${day} ${month}`;
        }

        // Modified function: sort courses descending and add a new badge to the newest course.
        function createGradeSection(grade, coursesArray) {
            coursesArray = coursesArray.slice().reverse();
            const gradeSection = document.createElement('div');
            gradeSection.className = 'mb-5';
            gradeSection.innerHTML = `
                <div class="grade-section-header">
                    <h3 class="grade-section-title">${grade}</h3>
                    <div class="grade-section-count">
                        <i class="fas fa-book-open"></i>
                        ${coursesArray.length} كورس
                    </div>
                </div>
                <div class="row g-4">
                    ${coursesArray.map((course, index) => {
                const badge = (index === 0)
                    ? `<span class="new-badge"><i class="fas fa-star me-1"></i> جديد</span>`
                    : '';

                // تنسيق تاريخ الكورس
                let formattedDate = '';
                if (course.addedDate) {
                    const courseDate = new Date(course.addedDate);
                    formattedDate = formatDate(courseDate);
                    const year = courseDate.getFullYear();
                    formattedDate += ' ' + year;
                } else {
                    const today = new Date();
                    formattedDate = formatDate(today) + ' ' + today.getFullYear();
                }

                return `
                <div class="col-lg-4 col-md-6 mb-4">
                    <div class="course-card card rounded-4 overflow-hidden shadow">
                        <div class="position-relative overflow-hidden">
                            <img src="${course.imageURL || 'images/course-placeholder.jpg'}" 
                                class="card-img-top" 
                                alt="${course.title}">
                            ${badge}
                        </div>
                        <div class="card-body p-4">
                            <span class="grade-badge"><i class="fas fa-graduation-cap"></i>${course.grade}</span>
                           
                            <h5 class="card-title fw-bold mb-3">${course.title}</h5>
                            <div class="course-meta">
                                <span class="lectures-count" style="box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 20px;">
                                    <i class="fas fa-play-circle me-2"></i>
                                    ${course.videosCount !== undefined ? course.videosCount : 0} محاضرات
                                </span>
                                <div class="rating">
                                    <i class="fas fa-star"></i>
                                    <span>4.5</span>
                                </div>
                            </div>
                            <button class="watch-cta-button mt-3 w-100"; 
                                    onclick="window.location.href='course.html?id=${course.id}'">
                                <i class="fas fa-play me-2"></i> مشاهدة الكورس
                            </button>
                        </div>
                    </div>
                </div>`;
            }).join('')}
                </div>
            `;
            document.getElementById('coursesByGrade').appendChild(gradeSection);
        }

        /**<span class="lectures-count" style="box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); background:#d4edda; color:#000; border-radius: 20px;"><i class="fas fa-calendar me-2"></i>${formattedDate}</span>**/
        
        
        // Make renderCourses function global
        window.renderCourses = renderCourses;

        // Render all courses by default
        renderCourses('all');

        // Listen for changes in the dropdown to filter courses
        gradeFilter.addEventListener('change', function () {
            renderCourses(this.value);
        });

        // تحديث عدد الكورسات المرئية في البداية
        const checkVisibleCourses = function () {
            const gradeSections = document.querySelectorAll('#coursesByGrade > div');
            let visibleCoursesCount = 0;

            gradeSections.forEach(section => {
                const visibleCourses = section.querySelectorAll('.col-lg-4[style=""]');
                visibleCoursesCount += visibleCourses.length;
            });

            document.getElementById('totalCoursesCount').textContent = visibleCoursesCount;
        };

        // استدعاء الدالة في البداية
        checkVisibleCourses();

        // جعل الدالة متاحة عالمياً
        window.checkVisibleCourses = checkVisibleCourses;

    } catch (error) {
        console.error('حدث خطأ أثناء جلب الكورسات:', error);
    }
});

// Move the authentication code to a separate event listener to avoid conflicts
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

    // ربط وظيفة البحث بصندوق البحث
    document.getElementById('courseSearch').addEventListener('input', function () {
        searchCourses(this.value);
    });
});

// وظيفة البحث
function searchCourses(searchTerm) {
    searchTerm = searchTerm.toLowerCase().trim();
    const courseCards = document.querySelectorAll('.course-card');

    courseCards.forEach(card => {
        const title = card.querySelector('.card-title').textContent.toLowerCase();
        const parent = card.closest('.col-lg-4') || card;

        if (title.includes(searchTerm)) {
            parent.style.display = '';
        } else {
            parent.style.display = 'none';
        }
    });

    // التحقق مما إذا كانت جميع الكورسات مخفية
    checkVisibleCourses();
}

// التحقق من وجود كورسات مرئية
function checkVisibleCourses() {
    const gradeSections = document.querySelectorAll('#coursesByGrade > div');
    let hasVisibleCourses = false;
    let visibleCoursesCount = 0;

    gradeSections.forEach(section => {
        const visibleCourses = section.querySelectorAll('.col-lg-4[style=""]');
        const hiddenCourses = section.querySelectorAll('.col-lg-4[style="display: none;"]');

        if (visibleCourses.length > 0) {
            hasVisibleCourses = true;
            section.style.display = '';
            visibleCoursesCount += visibleCourses.length;
        } else {
            section.style.display = 'none';
        }
    });

    document.getElementById('noCoursesMessage').style.display = hasVisibleCourses ? 'none' : 'block';

    // تحديث عدد الكورسات المرئية في قسم التصفية
    document.getElementById('totalCoursesCount').textContent = visibleCoursesCount;
}
