// Immediate check before any DOM operations
(function () {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.replace('login.html?from=admin');
    }
})();

document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html?from=admin';
        return;
    }

    const itemsPerPage = 5;
    let usersPage = 1;
    let coursesPage = 1;
    let gradesPage = 1;
    let notificationsPage = 1;

    // تفعيل وظائف البحث
    const userSearchInput = document.getElementById('userSearch');
    const courseSearchInput = document.getElementById('courseSearch');

    if (userSearchInput) {
        userSearchInput.addEventListener('input', function () {
            filterTable('#usersTable tbody tr', this.value.toLowerCase());
        });
    }

    if (courseSearchInput) {
        courseSearchInput.addEventListener('input', function () {
            filterTable('#coursesTable tbody tr', this.value.toLowerCase());
        });
    }

    // وظيفة البحث في أي جدول
    function filterTable(tableSelector, searchTerm) {
        const rows = document.querySelectorAll(tableSelector);
        rows.forEach(row => {
            const textContent = row.textContent.toLowerCase();
            row.style.display = textContent.includes(searchTerm) ? '' : 'none';
        });
    }

    function sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        const temp = document.createElement('div');
        temp.textContent = input;
        return temp.innerHTML.replace(/[<>&"']/g, '');
    }

    function loadUsers(page = 1) {
        fetch('/api/users', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(response => response.json())
            .then(users => {
                window.allUsers = users;
                const totalPages = Math.ceil(users.length / itemsPerPage);
                document.getElementById('usersTotalPages').textContent = totalPages;
                const start = (page - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                const paginatedUsers = users.slice(start, end);

                const tbody = document.querySelector('#usersTable tbody');
                tbody.innerHTML = '';

                paginatedUsers.forEach(user => {
                    const tr = document.createElement('tr');
                    tr.classList.add('table-light');

                    const td1 = document.createElement('td');
                    td1.innerHTML = `
                        <div class="user-info-container">
                            <div class="username fw-bold">${sanitizeInput(user.username)}</div>
                            <div class="user-badges">
                                    ${user.isAdmin ? '<span class="badge bg-success">Admin</span>' : ''}
                                    ${user.isBanned ? '<span class="badge bg-danger">محظور</span>' : ''}
                            </div>
                        </div>
                    `;

                    const td2 = document.createElement('td');
                    td2.textContent = sanitizeInput(user.email);

                    const td3 = document.createElement('td');
                    td3.textContent = sanitizeInput(user.grade || 'N/A');

                    // أزرار التعديل والحذف في خانة التعديل
                    const td4 = document.createElement('td');
                    td4.innerHTML = `
                        <button class="btn btn-sm btn-warning" title="تعديل" onclick='editUser(${JSON.stringify({
                        id: user.id,
                        username: sanitizeInput(user.username),
                        email: sanitizeInput(user.email),
                        password: sanitizeInput(user.password),
                        grade: sanitizeInput(user.grade),
                        isAdmin: user.isAdmin,
                        isBanned: user.isBanned
                    })})'><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" title="حذف" onclick="deleteUser(${user.id})"><i class="fas fa-trash"></i></button>
                    `;

                    // أزرار الحظر والادمن في خانة الإجراءات
                    const td5 = document.createElement('td');
                    td5.innerHTML = `
                        ${user.isBanned ?
                            `<button class="btn btn-sm btn-outline-success" title="إلغاء الحظر" onclick="unbanUser(${user.id})"><i class="fas fa-unlock"></i></button>` :
                            `<button class="btn btn-sm btn-outline-danger" title="حظر" onclick="banUser(${user.id})"><i class="fas fa-ban"></i></button>`}
                        ${user.isAdmin ?
                            `<button class="btn btn-sm btn-outline-secondary" title="إزالة صلاحية الادمن" onclick="removeAdmin(${user.id})"><i class="fas fa-user-minus"></i></button>` :
                            `<button class="btn btn-sm btn-outline-primary" title="ترقية إلى ادمن" onclick="makeAdmin(${user.id})"><i class="fas fa-user-shield"></i></button>`}
                    `;

                    tr.appendChild(td1);
                    tr.appendChild(td2);
                    tr.appendChild(td3);
                    tr.appendChild(td4);
                    tr.appendChild(td5); // نضع خانة الإجراءات قبل خانة التعديل
                    tbody.appendChild(tr);
                });

                // تفعيل أزرار التنقل بين الصفحات
                updateUsersPagination();
            })
            .catch(err => console.error(err));
    }

    function loadCourses(page = 1) {
        fetch('/api/admin-courses', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(response => response.json())
            .then(courses => {
                if (!Array.isArray(courses)) return;
                window.allCourses = courses;

                const totalPages = Math.ceil(courses.length / itemsPerPage);
                document.getElementById('coursesTotalPages').textContent = totalPages;
                const start = (page - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                const paginatedCourses = courses.slice(start, end);

                const tbody = document.querySelector('#coursesTable tbody');
                tbody.innerHTML = '';

                paginatedCourses.forEach(course => {
                    const tr = document.createElement('tr');
                    tr.classList.add('table-light');

                    // Image cell
                    const tdImage = document.createElement('td');
                    tdImage.className = 'course-image-cell';
                    tdImage.innerHTML = `
                        <img src="${sanitizeInput(course.imageURL || '')}" class="course-image" alt="صورة الكورس" onclick="showCourseImage('${sanitizeInput(course.imageURL || '')}')">
                    `;

                    // Title cell
                    const tdTitle = document.createElement('td');
                    tdTitle.className = 'scrollable-content';
                    tdTitle.innerHTML = `<div class="fw-bold">${sanitizeInput(course.title || '')}</div>`;

                    // Grade cell
                    const tdGrade = document.createElement('td');
                    tdGrade.textContent = sanitizeInput(course.grade || '');

                    // Price cell
                    const tdPrice = document.createElement('td');
                    tdPrice.innerHTML = `<span class="badge bg-success">${course.price ? course.price + ' جنيه' : 'مجاني'}</span>`;

                    // Videos cell
                    const tdVideos = document.createElement('td');
                    tdVideos.innerHTML = `
                            <span class="badge bg-primary rounded-pill">${course.videos ? course.videos.length : 0}</span>
                    `;

                    // Activities cell
                    const tdActivities = document.createElement('td');
                    tdActivities.innerHTML = `
                            <span class="badge bg-info rounded-pill">${course.activities ? course.activities.length : 0}</span>
                    `;

                    // Exams cell
                    const tdExams = document.createElement('td');
                    tdExams.innerHTML = `
                            <span class="badge bg-warning rounded-pill">${course.exams ? course.exams.length : 0}</span>
                    `;

                    // Actions cell - تعديل طريقة عرض الأزرار لتكون مناسبة للجوال
                    const tdActions = document.createElement('td');
                    tdActions.innerHTML = `
                            <button class="btn btn-sm btn-warning" title="تعديل" onclick='editCourse(${JSON.stringify(course)})'><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-danger" title="حذف" onclick="deleteCourse(${course.id})"><i class="fas fa-trash"></i></button>
                    `;

                    tr.appendChild(tdImage);
                    tr.appendChild(tdTitle);
                    tr.appendChild(tdGrade);
                    tr.appendChild(tdPrice);
                    tr.appendChild(tdVideos);
                    tr.appendChild(tdActivities);
                    tr.appendChild(tdExams);
                    tr.appendChild(tdActions);
                    tbody.appendChild(tr);
                });

                // تفعيل أزرار التنقل بين الصفحات
                updateCoursesPagination();
            })
            .catch(err => console.error(err));
    }

    function loadAnalytics() {
        fetch('/api/analytics', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(response => response.json())
            .then(data => {
                if (!data || typeof data !== 'object') return;
                const videosCount = parseInt(data.totalVideos, 10);
                document.getElementById('totalVideos').textContent = videosCount || 0;
                document.getElementById('totalUsers').textContent = data.totalUsers || 0;
                document.getElementById('totalCourses').textContent = data.totalCourses || 0;
                document.getElementById('totalExams').textContent = data.totalExams || 0;
            })
            .catch(err => console.error(err));
    }

    function loadGrades(page = 1) {
        fetch('/api/grades', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(response => response.json())
            .then(grades => {
                if (!Array.isArray(grades)) return;
                const totalPages = Math.ceil(grades.length / itemsPerPage);
                document.getElementById('gradesTotalPages').textContent = totalPages;
                const start = (page - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                const paginatedGrades = grades.slice(start, end);

                const gradeSelect = document.getElementById('courseGrade');
                if (gradeSelect) {
                    gradeSelect.innerHTML = '';
                    grades.forEach(grade => {
                        const option = document.createElement('option');
                        option.value = sanitizeInput(grade.name || '');
                        option.textContent = sanitizeInput(grade.name || '');
                        gradeSelect.appendChild(option);
                    });
                }

                // تعبئة قائمة الصفوف الدراسية في نموذج إضافة طالب جديد
                const newGradeSelect = document.getElementById('newGrade');
                if (newGradeSelect) {
                    newGradeSelect.innerHTML = '';
                    grades.forEach(grade => {
                        const option = document.createElement('option');
                        option.value = sanitizeInput(grade.name || '');
                        option.textContent = sanitizeInput(grade.name || '');
                        newGradeSelect.appendChild(option);
                    });
                }

                const gradesTableBody = document.querySelector('#gradesTable tbody');
                if (gradesTableBody) {
                    gradesTableBody.innerHTML = '';
                    paginatedGrades.forEach(grade => {
                        const studentsCount = window.allUsers.filter(user => user.grade === grade.name).length;
                        const coursesCount = window.allCourses.filter(course => course.grade === grade.name).length;
                        const examsCount = window.allCourses.reduce((count, course) => {
                            return course.grade === grade.name ? count + (course.exams ? course.exams.length : 0) : count;
                        }, 0);
                        const activitiesCount = window.allCourses.reduce((count, course) => {
                            return course.grade === grade.name ? count + (course.activities ? course.activities.length : 0) : count;
                        }, 0);
                        const gradevideoCount = window.allCourses.reduce((count, course) => {
                            return course.grade === grade.name ? count + (course.videos ? course.videos.length : 0) : count;
                        }, 0);

                        const tr = document.createElement('tr');
                        tr.classList.add('table-light');

                        const td1 = document.createElement('td');
                        td1.innerHTML = `<span class="fw-bold">${sanitizeInput(grade.name || '')}</span>`;

                        const td2 = document.createElement('td');
                        td2.innerHTML = `<span class="badge bg-primary rounded-pill">${studentsCount}</span>`;

                        const td3 = document.createElement('td');
                        td3.innerHTML = `<span class="badge bg-success rounded-pill">${coursesCount}</span>`;

                        const td4 = document.createElement('td');
                        td4.innerHTML = `<span class="badge bg-info rounded-pill">${gradevideoCount}</span>`;

                        const td5 = document.createElement('td');
                        td5.innerHTML = `<span class="badge bg-warning rounded-pill">${activitiesCount}</span>`;

                        const td6 = document.createElement('td');
                        td6.innerHTML = `<span class="badge bg-danger rounded-pill">${examsCount}</span>`;

                        const td7 = document.createElement('td');
                        td7.innerHTML = `
                            <button class="btn btn-sm btn-danger" title="حذف" onclick="deleteGrade(${grade.id})"><i class="fas fa-trash"></i></button>
                        `;

                        tr.appendChild(td1);
                        tr.appendChild(td2);
                        tr.appendChild(td3);
                        tr.appendChild(td4);
                        tr.appendChild(td5);
                        tr.appendChild(td6);
                        tr.appendChild(td7);
                        gradesTableBody.appendChild(tr);
                    });
                }

                // تفعيل أزرار التنقل بين الصفحات
                updateGradesPagination();
            })
            .catch(err => console.error(err));
    }

    function loadNotifications(page = 1) {
        fetch('/api/notifications', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(response => response.json())
            .then(notifications => {
                if (!Array.isArray(notifications)) return;
                const totalPages = Math.ceil(notifications.length / itemsPerPage);
                document.getElementById('notificationsTotalPages').textContent = totalPages;
                const start = (page - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                const paginatedNotifications = notifications.slice(start, end);

                const tbody = document.querySelector('#notificationsTable tbody');
                tbody.innerHTML = '';

                paginatedNotifications.forEach(notification => {
                    const tr = document.createElement('tr');
                    tr.classList.add('table-light');

                    const td1 = document.createElement('td');
                    td1.innerHTML = `<span class="fw-bold">${sanitizeInput(notification.title || '')}</span>`;

                    const td2 = document.createElement('td');
                    td2.className = 'notification-content';
                    td2.textContent = sanitizeInput(notification.content || '');

                    const td3 = document.createElement('td');
                    // إظهار "عام" إذا كان الإشعار عامًا أو لم يتم تحديد صف
                    td3.textContent = sanitizeInput(notification.grade || 'عام');
                    // إضافة فئة خاصة للإشعارات العامة
                    if (notification.grade === 'عام' || !notification.grade) {
                        td3.innerHTML = `<span class="badge bg-primary">${sanitizeInput(notification.grade || 'عام')}</span>`;
                    } else {
                        td3.innerHTML = `<span class="badge bg-info">${sanitizeInput(notification.grade)}</span>`;
                    }

                    const td4 = document.createElement('td');
                    td4.innerHTML = `
                        <button class="btn btn-sm btn-warning" title="تعديل" onclick='editNotification(${JSON.stringify(notification)})'><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" title="حذف" onclick="deleteNotification(${notification.id})"><i class="fas fa-trash"></i></button>
                    `;

                    tr.appendChild(td1);
                    tr.appendChild(td2);
                    tr.appendChild(td3);
                    tr.appendChild(td4);
                    tbody.appendChild(tr);
                });

                // تفعيل أزرار التنقل بين الصفحات
                updateNotificationsPagination();
            })
            .catch(err => console.error(err));
    }

    // Load all data on page load
    loadUsers();
    loadCourses();
    loadAnalytics();
    loadGrades();
    loadNotifications();

    // إضافة وظيفة مستمع الأحداث مرة واحدة عند تحميل الصفحة
    function setupPageListeners() {
        // مستمعات أزرار التنقل للمستخدمين
        document.getElementById('prevUsersPage').addEventListener('click', (e) => {
            e.preventDefault();
            if (usersPage > 1) {
                usersPage--;
                document.getElementById('usersPageNumber').value = usersPage;
                updateUsersPagination();
                loadUsers(usersPage);
            }
        });

        document.getElementById('nextUsersPage').addEventListener('click', (e) => {
            e.preventDefault();
            const totalPages = parseInt(document.getElementById('usersTotalPages').textContent);
            if (usersPage < totalPages) {
                usersPage++;
                document.getElementById('usersPageNumber').value = usersPage;
                updateUsersPagination();
                loadUsers(usersPage);
            }
        });

        // مستمعات أزرار التنقل للكورسات
        document.getElementById('prevCoursesPage').addEventListener('click', (e) => {
            e.preventDefault();
            if (coursesPage > 1) {
                coursesPage--;
                document.getElementById('coursesPageNumber').value = coursesPage;
                updateCoursesPagination();
                loadCourses(coursesPage);
            }
        });

        document.getElementById('nextCoursesPage').addEventListener('click', (e) => {
            e.preventDefault();
            const totalPages = parseInt(document.getElementById('coursesTotalPages').textContent);
            if (coursesPage < totalPages) {
                coursesPage++;
                document.getElementById('coursesPageNumber').value = coursesPage;
                updateCoursesPagination();
                loadCourses(coursesPage);
            }
        });

        // مستمعات أزرار التنقل للصفوف الدراسية
        document.getElementById('prevGradesPage').addEventListener('click', (e) => {
            e.preventDefault();
            if (gradesPage > 1) {
                gradesPage--;
                document.getElementById('gradesPageNumber').value = gradesPage;
                updateGradesPagination();
                loadGrades(gradesPage);
            }
        });

        document.getElementById('nextGradesPage').addEventListener('click', (e) => {
            e.preventDefault();
            const totalPages = parseInt(document.getElementById('gradesTotalPages').textContent);
            if (gradesPage < totalPages) {
                gradesPage++;
                document.getElementById('gradesPageNumber').value = gradesPage;
                updateGradesPagination();
                loadGrades(gradesPage);
            }
        });

        // مستمعات أزرار التنقل للإشعارات
        document.getElementById('prevNotificationsPage').addEventListener('click', (e) => {
            e.preventDefault();
            if (notificationsPage > 1) {
                notificationsPage--;
                document.getElementById('notificationsPageNumber').value = notificationsPage;
                updateNotificationsPagination();
                loadNotifications(notificationsPage);
            }
        });

        document.getElementById('nextNotificationsPage').addEventListener('click', (e) => {
            e.preventDefault();
            const totalPages = parseInt(document.getElementById('notificationsTotalPages').textContent);
            if (notificationsPage < totalPages) {
                notificationsPage++;
                document.getElementById('notificationsPageNumber').value = notificationsPage;
                updateNotificationsPagination();
                loadNotifications(notificationsPage);
            }
        });

        // ربط مستمعات أحداث صفحات المستخدمين
        document.querySelectorAll('#usersTab .pagination .page-item[data-page]').forEach(item => {
            const pageLink = item.querySelector('a');
            pageLink.addEventListener('click', function (e) {
                e.preventDefault();
                const pageNum = parseInt(item.getAttribute('data-page'));
                if (!isNaN(pageNum)) {
                    usersPage = pageNum;
                    document.getElementById('usersPageNumber').value = usersPage;
                    updateUsersPagination();
                    loadUsers(usersPage);
                }
            });
        });

        // ربط مستمعات أحداث صفحات الكورسات
        document.querySelectorAll('#coursesTab .pagination .page-item[data-page]').forEach(item => {
            const pageLink = item.querySelector('a');
            pageLink.addEventListener('click', function (e) {
                e.preventDefault();
                const pageNum = parseInt(item.getAttribute('data-page'));
                if (!isNaN(pageNum)) {
                    coursesPage = pageNum;
                    document.getElementById('coursesPageNumber').value = coursesPage;
                    updateCoursesPagination();
                    loadCourses(coursesPage);
                }
            });
        });

        // ربط مستمعات أحداث صفحات الصفوف الدراسية
        document.querySelectorAll('#gradesTab .pagination .page-item[data-page]').forEach(item => {
            const pageLink = item.querySelector('a');
            pageLink.addEventListener('click', function (e) {
                e.preventDefault();
                const pageNum = parseInt(item.getAttribute('data-page'));
                if (!isNaN(pageNum)) {
                    gradesPage = pageNum;
                    document.getElementById('gradesPageNumber').value = gradesPage;
                    updateGradesPagination();
                    loadGrades(gradesPage);
                }
            });
        });

        // ربط مستمعات أحداث صفحات الإشعارات
        document.querySelectorAll('#notificationsTab .pagination .page-item[data-page]').forEach(item => {
            const pageLink = item.querySelector('a');
            pageLink.addEventListener('click', function (e) {
                e.preventDefault();
                const pageNum = parseInt(item.getAttribute('data-page'));
                if (!isNaN(pageNum)) {
                    notificationsPage = pageNum;
                    document.getElementById('notificationsPageNumber').value = notificationsPage;
                    updateNotificationsPagination();
                    loadNotifications(notificationsPage);
                }
            });
        });

        // تحميل الصفوف الدراسية في نموذج الإشعارات
        fetch('/api/grades')
            .then(response => response.json())
            .then(grades => {
                const gradeSelect = document.getElementById('notificationGrade');
                // الحفاظ على خيار "إشعار عام"
                const generalOption = gradeSelect.querySelector('option[value="عام"]');
                gradeSelect.innerHTML = '';
                gradeSelect.appendChild(generalOption);

                grades.forEach(grade => {
                    const option = document.createElement('option');
                    option.value = grade.name;
                    option.textContent = grade.name;
                    gradeSelect.appendChild(option);
                });
            })
            .catch(err => console.error('Error loading grades for notifications:', err));
    }

    // تحديث مرة واحدة فقط بعد تحميل الصفحة
    setTimeout(() => {
        setupPageListeners();
        updateUsersPagination();
        updateCoursesPagination();
        updateGradesPagination();
        updateNotificationsPagination();
    }, 500);

    function updateUsersPagination() {
        const totalPages = parseInt(document.getElementById('usersTotalPages').textContent);
        const pageItems = document.querySelectorAll('#usersTab .pagination .page-item[data-page]');

        // تفعيل أو تعطيل أزرار التالي والسابق
        document.getElementById('prevUsersPageItem').classList.toggle('disabled', usersPage <= 1);
        document.getElementById('nextUsersPageItem').classList.toggle('disabled', usersPage >= totalPages);

        // تعيين الصفحات بناءً على الصفحة الحالية
        let startPage = Math.max(1, usersPage - 1);
        if (startPage + 2 > totalPages) startPage = Math.max(1, totalPages - 2);

        pageItems.forEach((item, index) => {
            const pageNum = startPage + index;
            const pageLink = item.querySelector('a');

            // تحديث محتوى زر الصفحة
            pageLink.textContent = pageNum;
            item.setAttribute('data-page', pageNum);
            item.classList.toggle('active', pageNum === usersPage);
            item.style.display = pageNum <= totalPages ? '' : 'none';
        });
    }

    function updateCoursesPagination() {
        const totalPages = parseInt(document.getElementById('coursesTotalPages').textContent);
        const pageItems = document.querySelectorAll('#coursesTab .pagination .page-item[data-page]');

        document.getElementById('prevCoursesPageItem').classList.toggle('disabled', coursesPage <= 1);
        document.getElementById('nextCoursesPageItem').classList.toggle('disabled', coursesPage >= totalPages);

        let startPage = Math.max(1, coursesPage - 1);
        if (startPage + 2 > totalPages) startPage = Math.max(1, totalPages - 2);

        pageItems.forEach((item, index) => {
            const pageNum = startPage + index;
            const pageLink = item.querySelector('a');

            // تحديث محتوى زر الصفحة
            pageLink.textContent = pageNum;
            item.setAttribute('data-page', pageNum);
            item.classList.toggle('active', pageNum === coursesPage);
            item.style.display = pageNum <= totalPages ? '' : 'none';
        });
    }

    function updateGradesPagination() {
        const totalPages = parseInt(document.getElementById('gradesTotalPages').textContent);
        const pageItems = document.querySelectorAll('#gradesTab .pagination .page-item[data-page]');

        document.getElementById('prevGradesPageItem').classList.toggle('disabled', gradesPage <= 1);
        document.getElementById('nextGradesPageItem').classList.toggle('disabled', gradesPage >= totalPages);

        let startPage = Math.max(1, gradesPage - 1);
        if (startPage + 2 > totalPages) startPage = Math.max(1, totalPages - 2);

        pageItems.forEach((item, index) => {
            const pageNum = startPage + index;
            const pageLink = item.querySelector('a');

            // تحديث محتوى زر الصفحة
            pageLink.textContent = pageNum;
            item.setAttribute('data-page', pageNum);
            item.classList.toggle('active', pageNum === gradesPage);
            item.style.display = pageNum <= totalPages ? '' : 'none';
        });
    }

    function updateNotificationsPagination() {
        const totalPages = parseInt(document.getElementById('notificationsTotalPages').textContent);
        const pageItems = document.querySelectorAll('#notificationsTab .pagination .page-item[data-page]');

        document.getElementById('prevNotificationsPageItem').classList.toggle('disabled', notificationsPage <= 1);
        document.getElementById('nextNotificationsPageItem').classList.toggle('disabled', notificationsPage >= totalPages);

        let startPage = Math.max(1, notificationsPage - 1);
        if (startPage + 2 > totalPages) startPage = Math.max(1, totalPages - 2);

        pageItems.forEach((item, index) => {
            const pageNum = startPage + index;
            const pageLink = item.querySelector('a');

            // تحديث محتوى زر الصفحة
            pageLink.textContent = pageNum;
            item.setAttribute('data-page', pageNum);
            item.classList.toggle('active', pageNum === notificationsPage);
            item.style.display = pageNum <= totalPages ? '' : 'none';
        });
    }

    // Set up tab change event listeners
    document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (event) {
            const targetId = event.target.getAttribute('data-bs-target');

            // Update window location hash for better navigation
            window.location.hash = targetId.replace('#', '');

            // Check if we need to refresh any data based on the active tab
            if (targetId === '#usersTab') {
                loadUsers(usersPage);
            } else if (targetId === '#coursesTab') {
                loadCourses(coursesPage);
            } else if (targetId === '#gradesTab') {
                loadGrades(gradesPage);
            } else if (targetId === '#notificationsTab') {
                loadNotifications(notificationsPage);
            }
        });
    });

    // Check if there's a hash in the URL and activate the corresponding tab
    if (window.location.hash) {
        const tabId = window.location.hash.replace('#', '');
        const tab = document.querySelector(`button[data-bs-target="#${tabId}"]`);
        if (tab) {
            bootstrap.Tab.getOrCreateInstance(tab).show();
        }
    }

    const gradeForm = document.getElementById('gradeForm');
    if (gradeForm) {
        gradeForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const name = sanitizeInput(document.getElementById('gradeName').value);

            fetch('/api/grades', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name })
            })
                .then(response => response.json())
                .then(res => {
                    alert(res.message);
                    loadGrades();
                    gradeForm.reset();
                    const gradeModal = bootstrap.Modal.getInstance(document.getElementById('gradeModal'));
                    if (gradeModal) gradeModal.hide();
                })
                .catch(err => console.error(err));
        });
    }

    window.deleteGrade = function (gradeId) {
        if (confirm('هل أنت متأكد من حذف الصف الدراسي؟')) {
            fetch(`/api/grades/${gradeId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(response => response.json())
                .then(res => {
                    alert(res.message);
                    loadGrades();
                })
                .catch(err => console.error(err));
        }
    };

    const courseForm = document.getElementById('courseForm');
    if (courseForm) {
        courseForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const id = document.getElementById('courseId').value;
            const title = sanitizeInput(document.getElementById('courseTitle').value);
            const grade = sanitizeInput(document.getElementById('courseGrade').value);
            const price = sanitizeInput(document.getElementById('coursePrice').value);
            const courseImageInput = document.getElementById('courseImage');
            const courseImage = courseImageInput ? courseImageInput.files[0] : null;

            const videos = Array.from(document.querySelectorAll('.video-input')).map(input => {
                const videoTitle = sanitizeInput(input.querySelector('.video-title').value);
                const videoUrl = sanitizeInput(input.querySelector('.video-url').value);
                const videoId = input.querySelector('.video-id') ? sanitizeInput(input.querySelector('.video-id').value) : '';
                return { id: videoId, title: videoTitle, url: videoUrl };
            });

            const activities = [];
            for (const input of document.querySelectorAll('.activity-input')) {
                const activityTitle = sanitizeInput(input.querySelector('.activity-title').value);
                const activityFile = input.querySelector('.activity-file').files[0];
                const activityId = input.querySelector('.activity-id') ? sanitizeInput(input.querySelector('.activity-id').value) : '';
                if (activityFile) {
                    const formDataActivity = new FormData();
                    formDataActivity.append('activityFile', activityFile);
                    const response = await fetch('/api/uploadActivity', {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                        body: formDataActivity
                    });
                    const data = await response.json();
                    activities.push({ id: activityId, title: activityTitle, filePath: data.filePath, addedDate: new Date().toISOString() });
                } else {
                    const existingFilePath = sanitizeInput(input.querySelector('.existing-file-path').value);
                    if (existingFilePath) activities.push({ id: activityId, title: activityTitle, filePath: existingFilePath });
                }
            }

            const examInputs = document.querySelectorAll('.exam-input');
            const exams = Array.from(examInputs).map(input => {
                const titleEl = input.querySelector('.exam-title');
                const urlEl = input.querySelector('.exam-url');
                const idEl = input.querySelector('.exam-id');
                if (!titleEl || !urlEl) return null;
                const examTitle = sanitizeInput(titleEl.value.trim());
                const examUrl = sanitizeInput(urlEl.value.trim());
                const examId = idEl ? sanitizeInput(idEl.value) : '';
                return {
                    id: examId || '',
                    title: examTitle,
                    googleFormUrl: examUrl,
                    courseId: id || '',
                    grade: grade
                };
            }).filter(exam => exam !== null && exam.title && exam.googleFormUrl);

            const formData = new FormData();
            formData.append('title', title);
            formData.append('grade', grade);
            formData.append('price', price);
            if (courseImage) {
                formData.append('courseImage', courseImage);
            } else if (id) {
                formData.append('existingImageURL', sanitizeInput(document.getElementById('courseImageURL').value));
            }
            formData.append('videos', JSON.stringify(videos));
            formData.append('activities', JSON.stringify(activities));
            formData.append('exams', JSON.stringify(exams));

            const method = id ? 'PUT' : 'POST';
            const urlEndpoint = id ? `/api/courses/${id}` : '/api/courses';

            fetch(urlEndpoint, {
                method,
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            })
                .then(response => response.json())
                .then(res => {
                    alert(res.message);
                    loadCourses();
                    courseForm.reset();
                    document.getElementById('courseId').value = '';
                    const videosContainer = document.getElementById('videosContainer');
                    if (videosContainer) videosContainer.innerHTML = '';
                    const activitiesContainer = document.getElementById('activitiesContainer');
                    if (activitiesContainer) activitiesContainer.innerHTML = '';
                    const examsContainer = document.getElementById('examsContainer');
                    if (examsContainer) examsContainer.innerHTML = '';
                    const courseModal = bootstrap.Modal.getInstance(document.getElementById('courseModal'));
                    if (courseModal) courseModal.hide();
                })
                .catch(err => console.error(err));
        });
    }

    const addVideoButton = document.getElementById('addVideoButton');
    if (addVideoButton) {
        addVideoButton.addEventListener('click', function () {
            const videosContainer = document.getElementById('videosContainer');
            const videoInput = document.createElement('div');
            videoInput.className = 'video-input';
            videoInput.innerHTML = `
                <div class="input-group">
                    <input type="text" class="form-control video-title" placeholder="عنوان الفيديو">
                </div>
                <div class="input-group">
                    <input type="url" class="form-control video-url" placeholder="رابط الفيديو">
                </div>
                <button type="button" class="btn btn-danger" onclick="deleteCourseVideo(this, '')"><i class="fas fa-trash"></i></button>
            `;
            videosContainer.appendChild(videoInput);
        });
    }

    window.deleteCourseVideo = function (btn, videoId) {
        if (videoId && confirm('هل أنت متأكد من حذف الفيديو؟')) {
            fetch(`/api/videos/${videoId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(response => response.json())
                .then(res => {
                    alert(res.message);
                    btn.parentElement.remove();
                    loadCourses();
                })
                .catch(err => console.error(err));
        } else if (confirm('هل أنت متأكد من حذف الفيديو؟')) {
            btn.parentElement.remove();
        }
    };

    const addActivityButton = document.getElementById('addActivityButton');
    if (addActivityButton) {
        addActivityButton.addEventListener('click', function () {
            const activitiesContainer = document.getElementById('activitiesContainer');
            const activityInput = document.createElement('div');
            activityInput.className = 'activity-input';
            activityInput.innerHTML = `
                <div class="input-group">
                    <input type="text" class="form-control activity-title" placeholder="عنوان المستند" required>
                </div>
                <div class="input-group">
                    <input type="file" class="form-control activity-file" accept=".pdf,video/*" required>
                </div>
                <button type="button" class="btn btn-danger" onclick="deleteCourseActivity(this, '')"><i class="fas fa-trash"></i></button>
            `;
            activitiesContainer.appendChild(activityInput);
        });
    }

    window.deleteCourseActivity = function (btn, activityId) {
        if (activityId && confirm('هل أنت متأكد من حذف المستند؟')) {
            fetch(`/api/activities/${activityId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(response => response.json())
                .then(res => {
                    alert(res.message);
                    btn.parentElement.remove();
                    loadCourses();
                })
                .catch(err => console.error(err));
        } else if (confirm('هل أنت متأكد من حذف المستند؟')) {
            btn.parentElement.remove();
        }
    };

    const addExamButton = document.getElementById('addExamButton');
    if (addExamButton) {
        addExamButton.addEventListener('click', function () {
            const examsContainer = document.getElementById('examsContainer');
            const examInput = document.createElement('div');
            examInput.className = 'exam-input';
            examInput.innerHTML = `
                <div class="input-group">
                    <input type="text" class="form-control exam-title" placeholder="عنوان الاختبار" required>
                </div>
                <div class="input-group">
                    <input type="url" class="form-control exam-url" placeholder="رابط استبيان جوجل" required>
                </div>
                <button type="button" class="btn btn-danger delete-exam-btn"><i class="fas fa-trash"></i></button>
            `;

            // إضافة مستمع الحدث للزر الجديد
            const deleteButton = examInput.querySelector('.delete-exam-btn');
            deleteButton.addEventListener('click', function () {
                if (confirm('هل أنت متأكد من حذف الاختبار؟')) {
                    examInput.remove();
                }
            });

            examsContainer.appendChild(examInput);
        });
    }

    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const id = document.getElementById('userId').value;
            const username = sanitizeInput(document.getElementById('editUsername').value);
            const email = sanitizeInput(document.getElementById('editEmail').value);
            const password = sanitizeInput(document.getElementById('editPassword').value);
            const grade = sanitizeInput(document.getElementById('editGrade').value);

            const payload = { username, email, password, grade };

            fetch(`/api/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            })
                .then(response => response.json())
                .then(res => {
                    alert(res.message);
                    loadUsers();
                    userForm.reset();
                    const userModal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
                    if (userModal) userModal.hide();
                })
                .catch(err => console.error(err));
        });
    }

    window.deleteUser = function (userId) {
        if (confirm('هل أنت متأكد من حذف المستخدم؟')) {
            fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(response => response.json())
                .then(res => {
                    alert(res.message);
                    location.reload();
                })
                .catch(err => console.error(err));
        }
    };

    window.editUser = function (user) {
        document.getElementById('userId').value = user.id;
        document.getElementById('editUsername').value = sanitizeInput(user.username);
        document.getElementById('editEmail').value = sanitizeInput(user.email);
        document.getElementById('editPassword').value = sanitizeInput(user.password);

        fetch('/api/grades', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(response => response.json())
            .then(grades => {
                const gradeSelect = document.getElementById('editGrade');
                gradeSelect.innerHTML = '';
                grades.forEach(grade => {
                    const option = document.createElement('option');
                    option.value = sanitizeInput(grade.name);
                    option.textContent = sanitizeInput(grade.name);
                    if (grade.name === user.grade) {
                        option.selected = true;
                    }
                    gradeSelect.appendChild(option);
                });
            })
            .catch(err => console.error('Error loading grades:', err));

        const userModal = new bootstrap.Modal(document.getElementById('userModal'));
        userModal.show();
    };

    window.banUser = function (userId) {
        if (confirm('هل أنت متأكد من حظر هذا المستخدم؟')) {
            fetch(`/api/users/${userId}/ban`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(response => response.json())
                .then(res => {
                    alert(res.message);
                    loadUsers();
                })
                .catch(err => console.error(err));
        }
    };

    window.unbanUser = function (userId) {
        if (confirm('هل أنت متأكد من إلغاء حظر هذا المستخدم؟')) {
            fetch(`/api/users/${userId}/unban`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(response => response.json())
                .then(res => {
                    alert(res.message);
                    loadUsers();
                })
                .catch(err => console.error(err));
        }
    };

    window.deleteCourse = function (courseId) {
        if (confirm('هل أنت متأكد من حذف الكورس؟')) {
            fetch(`/api/courses/${courseId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(response => response.json())
                .then(res => {
                    alert(res.message);
                    location.reload();
                })
                .catch(err => console.error(err));
        }
    };

    window.editCourse = function (course) {
        document.getElementById('courseId').value = course.id;
        document.getElementById('courseTitle').value = sanitizeInput(course.title);
        document.getElementById('courseGrade').value = sanitizeInput(course.grade);
        document.getElementById('coursePrice').value = course.price || 0;
        document.getElementById('courseImageURL').value = sanitizeInput(course.imageURL);

        const videosContainer = document.getElementById('videosContainer');
        videosContainer.innerHTML = '';
        (course.videos || []).forEach(video => {
            const videoInput = document.createElement('div');
            videoInput.className = 'video-input';
            videoInput.innerHTML = `
                <input type="hidden" class="video-id" value="${sanitizeInput(video.id || '')}">
                <div class="input-group">
                    <input type="text" class="form-control video-title" placeholder="عنوان الفيديو" value="${sanitizeInput(video.title)}">
                </div>
                <div class="input-group">
                    <input type="url" class="form-control video-url" placeholder="رابط الفيديو" value="${sanitizeInput(video.url)}">
                </div>
                <button type="button" class="btn btn-danger" onclick="deleteCourseVideo(this, '${sanitizeInput(video.id || '')}')"><i class="fas fa-trash"></i></button>
            `;
            videosContainer.appendChild(videoInput);
        });

        const activitiesContainer = document.getElementById('activitiesContainer');
        activitiesContainer.innerHTML = '';
        (course.activities || []).forEach(activity => {
            const activityInput = document.createElement('div');
            activityInput.className = 'activity-input';
            activityInput.innerHTML = `
                <input type="hidden" class="activity-id" value="${sanitizeInput(activity.id || '')}">
                <div class="input-group">
                    <input type="text" class="form-control activity-title" placeholder="عنوان المستند" value="${sanitizeInput(activity.title)}" required>
                </div>
                <div class="input-group">
                    <input type="file" class="form-control activity-file" accept=".pdf,video/*">
                </div>
                <input type="hidden" class="existing-file-path" value="${sanitizeInput(activity.filePath)}">
                <button type="button" class="btn btn-danger" onclick="deleteCourseActivity(this, '${sanitizeInput(activity.id || '')}')"><i class="fas fa-trash"></i></button>
            `;
            activitiesContainer.appendChild(activityInput);
        });

        const examsContainer = document.getElementById('examsContainer');
        examsContainer.innerHTML = '';
        (course.exams || []).forEach(exam => {
            const examInput = document.createElement('div');
            examInput.className = 'exam-input';
            examInput.innerHTML = `
                <input type="hidden" class="exam-id" value="${sanitizeInput(exam.id || '')}">
                <div class="input-group">
                    <input type="text" class="form-control exam-title" placeholder="عنوان الاختبار" value="${sanitizeInput(exam.title)}" required>
                </div>
                <div class="input-group">
                    <input type="url" class="form-control exam-url" placeholder="رابط استبيان جوجل" value="${sanitizeInput(exam.googleFormUrl)}" required>
                </div>
                <button type="button" class="btn btn-danger delete-exam-btn"><i class="fas fa-trash"></i></button>
            `;

            // إضافة مستمع الحدث للزر الجديد
            const deleteButton = examInput.querySelector('.delete-exam-btn');
            deleteButton.addEventListener('click', function () {
                if (confirm('هل أنت متأكد من حذف الاختبار؟')) {
                    if (exam.id) {
                        fetch(`/api/exams/${exam.id}`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` }
                        })
                            .then(response => response.json())
                            .then(res => {
                                alert(res.message);
                                examInput.remove();
                                loadCourses();
                            })
                            .catch(err => {
                                console.error(err);
                                examInput.remove();
                            });
                    } else {
                        examInput.remove();
                    }
                }
            });

            examsContainer.appendChild(examInput);
        });

        const courseModal = new bootstrap.Modal(document.getElementById('courseModal'));
        courseModal.show();
    };

    window.makeAdmin = function (userId) {
        if (confirm('هل أنت متأكد من ترقية هذا المستخدم إلى ادمن؟')) {
            fetch(`/api/users/${userId}/make-admin`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(response => response.json())
                .then(res => {
                    alert(res.message);
                    loadUsers();
                })
                .catch(err => console.error(err));
        }
    };

    window.removeAdmin = function (userId) {
        if (confirm('هل أنت متأكد من إزالة صلاحية الادمن لهذا المستخدم؟')) {
            fetch(`/api/users/${userId}/remove-admin`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(response => response.json())
                .then(res => {
                    alert(res.message);
                    loadUsers();
                })
                .catch(err => console.error(err));
        }
    };

    const addStudentForm = document.getElementById('addStudentForm');
    if (addStudentForm) {
        addStudentForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const username = sanitizeInput(document.getElementById('newUsername').value);
            const email = sanitizeInput(document.getElementById('newEmail').value);
            const password = sanitizeInput(document.getElementById('newPassword').value);
            const grade = sanitizeInput(document.getElementById('newGrade').value);

            if (window.allUsers && window.allUsers.find(user => user.email === email)) {
                alert('البريد الإلكتروني موجود مسبقًا');
                return;
            }

            fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, grade })
            })
                .then(response => response.json().then(data => ({ status: response.status, body: data })))
                .then(res => {
                    alert(res.body.message);
                    if (res.status === 200) {
                        loadUsers();
                        addStudentForm.reset();
                        document.getElementById('addStudentModal').setAttribute('class', 'modal fade');
                        document.getElementById('addStudentModal').setAttribute('style', 'display: none;');
                        document.querySelector('.modal-backdrop').remove();
                        document.querySelector('body').classList.remove('modal-open');
                        document.querySelector('body').setAttribute('style', '');
                    }
                })
                .catch(err => console.error(err));
        });
    }

    const notificationForm = document.getElementById('notificationForm');
    if (notificationForm) {
        notificationForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const id = document.getElementById('notificationId').value;
            const title = sanitizeInput(document.getElementById('notificationTitle').value);
            const content = sanitizeInput(document.getElementById('notificationContent').value);
            const grade = sanitizeInput(document.getElementById('notificationGrade').value);
            const payload = { title, content, grade };

            const method = id ? 'PUT' : 'POST';
            const urlEndpoint = id ? `/api/notifications/${id}` : '/api/notifications';

            fetch(urlEndpoint, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            })
                .then(response => response.json())
                .then(res => {
                    alert(res.message);
                    loadNotifications();
                    notificationForm.reset();
                    document.getElementById('notificationId').value = '';
                    const notificationModal = bootstrap.Modal.getInstance(document.getElementById('notificationModal'));
                    if (notificationModal) notificationModal.hide();
                })
                .catch(err => console.error(err));
        });
    }

    window.deleteNotification = function (notificationId) {
        if (confirm('هل أنت متأكد من حذف الإشعار؟')) {
            fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(response => response.json())
                .then(res => {
                    alert(res.message);
                    loadNotifications();
                })
                .catch(err => console.error(err));
        }
    };

    window.editNotification = function (notification) {
        document.getElementById('notificationId').value = notification.id;
        document.getElementById('notificationTitle').value = sanitizeInput(notification.title);
        document.getElementById('notificationContent').value = sanitizeInput(notification.content);

        // تحديد الصف الدراسي المستهدف في القائمة المنسدلة
        const gradeSelect = document.getElementById('notificationGrade');
        const gradeValue = notification.grade || 'عام';

        // البحث عن الخيار المناسب وتحديده
        for (let i = 0; i < gradeSelect.options.length; i++) {
            if (gradeSelect.options[i].value === gradeValue) {
                gradeSelect.selectedIndex = i;
                break;
            }
        }

        const notificationModal = new bootstrap.Modal(document.getElementById('notificationModal'));
        notificationModal.show();
    };

    // تحسين عرض صورة الكورس المنبثقة
    window.showCourseImage = function (imageURL) {
        const modal = document.getElementById('courseImageModal');
        const modalImg = document.getElementById('courseImageModalContent');

        if (!modal || !modalImg) return;

        modalImg.src = imageURL;
        modal.classList.add('show');

        const closeBtn = document.getElementsByClassName('course-image-modal-close')[0];
        if (closeBtn) {
            closeBtn.onclick = function () {
                modal.classList.remove('show');
            }
        }

        // إغلاق موديال عند النقر خارج الصورة
        modal.onclick = function (event) {
            if (event.target === modal) {
                modal.classList.remove('show');
            }
        }
    }

    // إضافة وظيفة deleteCourseExam لضمان التوافقية
    window.deleteCourseExam = function (btn, examId) {
        if (confirm('هل أنت متأكد من حذف الاختبار؟')) {
            const parentElement = btn.closest('.exam-input');
            if (parentElement) {
                if (examId) {
                    fetch(`/api/exams/${examId}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` }
                    })
                        .then(response => response.json())
                        .then(res => {
                            alert(res.message);
                            parentElement.remove();
                            loadCourses();
                        })
                        .catch(err => {
                            console.error(err);
                            parentElement.remove();
                        });
                } else {
                    parentElement.remove();
                }
            }
        }
    };
});
