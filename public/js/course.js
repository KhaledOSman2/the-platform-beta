let currentVideoIndex = 0;
let videos = [];

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDate();
    const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const month = monthNames[date.getMonth()];
    return `${day} ${month}`;
}

function adjustTitleSize() {
    const titleElement = document.getElementById('courseTitle');
    if (!titleElement) return;

    const titleText = titleElement.textContent || '';
    const wordCount = titleText.split(/\s+/).length;
    const charCount = titleText.length;

    // تعديل حجم الخط بناءً على عدد الكلمات وطول النص
    if (charCount > 80) {
        titleElement.style.fontSize = '1.2rem';
    } else if (charCount > 60 || wordCount > 8) {
        titleElement.style.fontSize = '1.4rem';
    } else if (charCount > 40 || wordCount > 6) {
        titleElement.style.fontSize = '1.7rem';
    } else if (charCount > 20 || wordCount > 4) {
        titleElement.style.fontSize = '2rem';
    } else {
        titleElement.style.fontSize = '2.5rem';
    }
}

async function loadCourseData() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('id');
        if (!courseId) {
            alert('لم يتم العثور على معرف الكورس');
            return;
        }
        const courseResponse = await fetch(`/api/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!courseResponse.ok) throw new Error('Network response was not ok');
        const course = await courseResponse.json();
        document.getElementById('courseTitle').textContent = course.title;
        // استدعاء دالة ضبط حجم العنوان بعد تعيين النص
        adjustTitleSize();
        document.getElementById('courseGrade').textContent = course.grade;
        document.getElementById('courseImage').src = course.imageURL;
        document.getElementById('courseVideo').src = course.videoURL;
        document.getElementById('videoTitle').textContent = course.videos[0]?.title || '';

        // New: Update lecture count dynamically
        const lectureCount = course.videoCount !== undefined ? course.videoCount : (course.videos ? course.videos.length : 0);
        document.getElementById('lectureCount').textContent = `${lectureCount} محاضرات`;

        // إصلاح: التحقق من وجود تاريخ إضافة الكورس
        if (course.addedDate) {
            const courseDate = new Date(course.addedDate);
            const formattedCourseDate = formatDate(courseDate);
            const year = courseDate.getFullYear();
            document.getElementById('coursedate').textContent = formattedCourseDate + ' ' + year;
        } else {
            // إذا لم يكن متوفرًا، استخدم تاريخ اليوم أو عرض رسالة بديلة
            const year = today.getFullYear();
            document.getElementById('coursedate').textContent = formatDate(new Date()) + ' ' + year;
        }



        videos = course.videos || [];
        const videosList = document.getElementById('videosList');
        videosList.innerHTML = '';
        if (videos.length > 0) {
            document.getElementById('noVideoMessage').style.display = 'none';
            videos.forEach((video, index) => {
                const li = document.createElement('div');
                li.className = 'content-item videos';
                li.innerHTML = `
                    <div class="content-item-header">
                        <div class="content-item-title">
                            <i class="fas fa-video"></i>
                            <span>المحاضرة ${index + 1}:</span></span>
                        </div>
                        <div class="content-item-badge">
                            <i class="fas fa-calendar-alt"></i>
                                        ${formatDate(video.addedDate)}
                        </div>
                                </div>
                    <div class="content-item-body">${video.title}</div>
                `;
                li.dataset.index = index;
                li.addEventListener('click', () => {
                    currentVideoIndex = index;
                    updateVideo();
                });
                videosList.appendChild(li);
            });
            updateNavButtons();
            highlightCurrentVideo();
        } else {
            document.getElementById('courseVideo').style.display = 'none';
            document.getElementById('noVideoMessage').style.display = 'block';
            videosList.innerHTML = `
                <div class="empty-content-item videos">
                    <i class="fas fa-video-slash"></i>
                    <div class="empty-title">لا تتوفر محاضرات حاليا</div>
                    <div class="empty-message">سيتم إضافة المحاضرات قريبا</div>
                </div>`;
        }

        const activitiesList = document.getElementById('activitiesList');
        activitiesList.innerHTML = '';
        if (course.activities && course.activities.length > 0) {
            course.activities.forEach((activity, index) => {
                const li = document.createElement('div');
                li.className = 'content-item activities';
                li.innerHTML = `
                    <div class="content-item-header">
                        <div class="content-item-title">
                            <i class="fas fa-file-pdf"></i>
                            <span>المستند ${index + 1}:</span></span>
                        </div>
                        <div class="content-item-badge">
                            <i class="fas fa-calendar-alt"></i>
                                        ${formatDate(activity.addedDate)}
                                </div>
                            </div>
                    <div class="content-item-body">${activity.title}</div>
                        `;
                li.style.cursor = 'pointer';
                li.addEventListener('click', () => {
                    // Create an anchor element to trigger download
                    const downloadLink = document.createElement('a');
                    downloadLink.href = activity.filePath;
                    downloadLink.download = activity.title || `document-${index + 1}`;
                    downloadLink.style.display = 'none';
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                });
                activitiesList.appendChild(li);
            });
        } else {
            activitiesList.innerHTML = `
                <div class="empty-content-item activities">
                    <i class="fas fa-file-pdf"></i>
                    <div class="empty-title">لا تتوفر مستندات حاليا</div>
                    <div class="empty-message">سيتم إضافة المستندات والملفات قريبا</div>
                </div>`;
        }

        const examsList = document.getElementById('examsList');
        examsList.innerHTML = '';
        try {
            const examsResponse = await fetch(`/api/exams?courseId=${courseId}&grade=${course.grade}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!examsResponse.ok) throw new Error('Network response was not ok');
            const { exams } = await examsResponse.json();
            if (exams && exams.length > 0) {
                exams.forEach((exam, index) => {
                    const li = document.createElement('div');
                    li.className = 'content-item exams';
                    li.innerHTML = `
                        <div class="content-item-header">
                            <div class="content-item-title">
                                <i class="fas fa-clipboard-check"></i>
                                <span>الاختبار ${index + 1}:</span></span>
                            </div>
                            <div class="content-item-badge">
                                <i class="fas fa-calendar-alt"></i>
                                        ${formatDate(exam.addedDate)}
                                </div>
                            </div>
                        <div class="content-item-body">${exam.title}</div>
                        `;
                    li.style.cursor = 'pointer';
                    li.addEventListener('click', () => {
                        viewExam(exam.googleFormUrl, exam.title);
                    });
                    examsList.appendChild(li);
                });
            } else {
                examsList.innerHTML = `
                    <div class="empty-content-item exams">
                        <i class="fas fa-clipboard-check"></i>
                        <div class="empty-title">لا تتوفر اختبارات حاليا</div>
                        <div class="empty-message">سيتم إضافة الاختبارات عند انتهاء شرح الدروس</div>
                    </div>`;
            }
        } catch (examsError) {
            console.error('Error loading exams:', examsError);
            examsList.innerHTML = `
                <div class="empty-content-item exams">
                    <i class="fas fa-clipboard-check"></i>
                    <div class="empty-title">لا تتوفر اختبارات حاليا</div>
                    <div class="empty-message">سيتم إضافة الاختبارات عند انتهاء شرح الدروس</div>
                </div>`;
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            alert('انتهت صلاحية الجلسة الرجاء تسجيل الدخول مرة أخرى.');
        }
    } catch (error) {
        console.error('Error loading course data:', error);
        alert('حدث خطأ أثناء جلب بيانات الكورس');
    } finally {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => loadingOverlay.style.display = 'none', 300);
    }
}

function updateVideo() {
    const video = videos[currentVideoIndex];
    document.getElementById('courseVideo').src = video.url;
    document.getElementById('videoTitle').textContent = video.title;
    updateNavButtons();
    highlightCurrentVideo();
}

function updateNavButtons() {
    const prevBtn = document.getElementById('prevVideoBtn');
    const nextBtn = document.getElementById('nextVideoBtn');
    prevBtn.disabled = currentVideoIndex === 0;
    nextBtn.disabled = currentVideoIndex === videos.length - 1;
}

function highlightCurrentVideo() {
    const items = document.querySelectorAll('#videosList .content-item');
    items.forEach(item => {
        item.classList.remove('current');
        item.style.pointerEvents = 'auto';
    });

    if (items.length > currentVideoIndex) {
        items[currentVideoIndex].classList.add('current');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadCourseData();

    document.querySelectorAll('.card-header').forEach(header => {
        header.addEventListener('click', function () {
            const cardBody = this.nextElementSibling;

            cardBody.classList.toggle('show');

            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);

            const icon = this.querySelector('i:last-child');
            if (isExpanded) {
                icon.style.transform = 'rotate(0deg)';
            } else {
                icon.style.transform = 'rotate(180deg)';
            }
        });
    });

    const revealElements = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    revealElements.forEach(el => observer.observe(el));

    document.getElementById('prevVideoBtn').addEventListener('click', () => {
        if (currentVideoIndex > 0) {
            currentVideoIndex--;
            updateVideo();
        }
    });
    document.getElementById('nextVideoBtn').addEventListener('click', () => {
        if (currentVideoIndex < videos.length - 1) {
            currentVideoIndex++;
            updateVideo();
        }
    });

    // إضافة استدعاء لضبط حجم العنوان عند تغيير حجم النافذة
    window.addEventListener('resize', adjustTitleSize);
});

function viewExam(googleFormUrl, examTitle) {
    const examModal = new bootstrap.Modal(document.getElementById('examModal'));
    document.getElementById('examIframe').src = googleFormUrl;
    document.getElementById('examModalLabel').textContent = examTitle;
    examModal.show();
}

window.onscroll = function () {
    const backToTopBtn = document.getElementById("backToTopBtn");
    backToTopBtn.style.display = (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) ? "block" : "none";
};

function topFunction() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

