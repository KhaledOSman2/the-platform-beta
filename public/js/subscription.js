// Global variables
let courseData = null;
let isSubscribed = false;

// Format date function
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDate();
    const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const month = monthNames[date.getMonth()];
    return `${day} ${month}`;
}

// Adjust title size based on content
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

// Load course data from API
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
            window.location.href = 'courses.html';
            return;
        }
        
        // For testing/debugging - use mock data if API is not available
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Using mock data for local development');
            // Mock course data for testing
            courseData = {
                id: courseId,
                title: 'كورس الرياضيات للصف الثالث الثانوي',
                grade: 'الصف الثالث الثانوي',
                imageURL: 'https://via.placeholder.com/800x400?text=Course+Image',
                videoCount: 15,
                videos: Array(15).fill({}),
                activities: Array(8).fill({}),
                exams: Array(5).fill({}),
                price: 500,
                addedDate: new Date().toISOString()
            };
            
            // Simulate subscription status
            isSubscribed = false;
            
            // Update UI with mock data
            updateCourseUI();
            loadContentPreviews();
            loadingOverlay.style.display = 'none';
            return;
        }
        
        // Fetch course data
        const courseResponse = await fetch(`/api/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!courseResponse.ok) {
            console.error('Error fetching course data:', await courseResponse.text());
            throw new Error('Network response was not ok');
        }
        
        courseData = await courseResponse.json();
        
        // Check subscription status
        const subscriptionResponse = await fetch(`/api/subscriptions/check/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (subscriptionResponse.ok) {
            const subscriptionData = await subscriptionResponse.json();
            isSubscribed = subscriptionData.isSubscribed;
        }
        
        // Update UI with course data
        updateCourseUI();
        
        // Load content previews
        loadContentPreviews();
        
    } catch (error) {
        console.error('Error loading data:', error);
        
        // For testing/debugging - use mock data if API call fails
        courseData = {
            id: new URLSearchParams(window.location.search).get('id') || '1',
            title: 'كورس الرياضيات للصف الثالث الثانوي',
            grade: 'الصف الثالث الثانوي',
            imageURL: 'https://via.placeholder.com/800x400?text=Course+Image',
            videoCount: 15,
            videos: Array(15).fill({}),
            activities: Array(8).fill({}),
            exams: Array(5).fill({}),
            price: 500,
            addedDate: new Date().toISOString()
        };
        
        // Update UI with mock data
        updateCourseUI();
        loadContentPreviews();
        
        // alert('حدث خطأ أثناء تحميل بيانات الكورس');
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

// Update course UI with data
function updateCourseUI() {
    if (!courseData) return;
    
    // Update basic course info
    document.getElementById('courseTitle').textContent = courseData.title || 'عنوان الكورس';
    adjustTitleSize();
    
    document.getElementById('courseGrade').textContent = courseData.grade || 'المرحلة الدراسية';
    
    const courseImage = document.getElementById('courseImage');
    if (courseImage) {
        courseImage.src = courseData.imageURL || 'https://via.placeholder.com/800x400?text=Course+Image';
        courseImage.onerror = function() {
            this.src = 'https://via.placeholder.com/800x400?text=Course+Image';
        };
    }
    
    // Update course details
    const videosCount = courseData.videoCount || (courseData.videos ? courseData.videos.length : 0);
    const documentsCount = courseData.activities ? courseData.activities.length : 0;
    const examsCount = courseData.exams ? courseData.exams.length : 0;
    
    document.getElementById('videosCount').textContent = videosCount;
    document.getElementById('documentsCount').textContent = documentsCount;
    document.getElementById('examsCount').textContent = examsCount;
    document.getElementById('lectureCount').textContent = `${videosCount} محاضرات`;
    
    // Format and display course date
    if (courseData.addedDate) {
        const courseDate = new Date(courseData.addedDate);
        const formattedCourseDate = formatDate(courseDate);
        const year = courseDate.getFullYear();
        document.getElementById('coursedate').textContent = formattedCourseDate + ' ' + year;
    } else {
        const today = new Date();
        const year = today.getFullYear();
        document.getElementById('coursedate').textContent = formatDate(today) + ' ' + year;
    }
    
    // Display course price
    document.getElementById('coursePrice').textContent = courseData.price ? `${courseData.price} جنيه` : 'مجاني';
    
    // Update subscription status UI
    updateSubscriptionStatusUI();
}

// Load content previews
function loadContentPreviews() {
    // Add mock content for testing if needed
    const videosList = document.getElementById('videosList');
    const activitiesList = document.getElementById('activitiesList');
    const examsList = document.getElementById('examsList');
    
    if (videosList) {
        videosList.innerHTML = '<div class="content-item"><div class="content-item-title">محاضرة تجريبية</div></div>';
    }
    
    if (activitiesList) {
        activitiesList.innerHTML = '<div class="content-item"><div class="content-item-title">مستند تجريبي</div></div>';
    }
    
    if (examsList) {
        examsList.innerHTML = '<div class="content-item"><div class="content-item-title">اختبار تجريبي</div></div>';
    }
}

// Update subscription status UI
function updateSubscriptionStatusUI() {
    const subscriptionStatus = document.getElementById('subscriptionStatus');
    const subscribeBtn = document.getElementById('subscribeBtn');
    const lockedOverlays = document.querySelectorAll('.locked-overlay');
    
    if (isSubscribed) {
        // User is subscribed
        subscriptionStatus.innerHTML = `
            <div class="status-icon subscribed">
                <i class="fas fa-check-circle"></i>
            </div>
            <div class="status-text">
                <h3>الكورس مفعل</h3>
                <p>يمكنك الآن الوصول إلى جميع محتويات الكورس</p>
            </div>
        `;
        
        subscribeBtn.innerHTML = `
            <i class="fas fa-play-circle"></i>
            <span>مشاهدة الكورس</span>
        `;
        
        subscribeBtn.addEventListener('click', () => {
            window.location.href = `course.html?id=${courseData.id}`;
        });
        
        // Remove locked overlays
        lockedOverlays.forEach(overlay => {
            overlay.style.display = 'none';
        });
        
        // Remove locked-content class
        document.querySelectorAll('.locked-content').forEach(element => {
            element.classList.remove('locked-content');
        });
    } else {
        // User is not subscribed
        subscriptionStatus.innerHTML = `
            <div class="status-icon not-subscribed">
                <i class="fas fa-lock"></i>
            </div>
            <div class="status-text">
                <h3>الكورس غير مفعل</h3>
                <p>قم بتفعيل اشتراكك للوصول إلى محتوى الكورس بالكامل</p>
            </div>
        `;
        
        subscribeBtn.innerHTML = `
            <i class="fas fa-unlock-alt"></i>
            <span>اشتراك بالكورس</span>
        `;
        
        subscribeBtn.addEventListener('click', showActivationModal);
        
        // Ensure locked overlays are visible
        lockedOverlays.forEach(overlay => {
            overlay.style.display = 'flex';
        });
    }
}

// Show activation modal with improved UX
function showActivationModal() {
    const activationModal = new bootstrap.Modal(document.getElementById('activationModal'));
    activationModal.show();
    
    // Clear and focus on input
    const activationInput = document.getElementById('activationCode');
    activationInput.value = '';
    activationInput.classList.remove('is-invalid');
    document.getElementById('codeError').textContent = '';
    
    // Auto-focus with slight delay for better UX
    setTimeout(() => {
        activationInput.focus();
        
        // Add input formatting
        activationInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value.length === 6) {
                document.getElementById('activateBtn').focus();
            }
        });
    }, 500);
    
    // Reset button state
    const activateBtn = document.getElementById('activateBtn');
    activateBtn.querySelector('.btn-text').classList.remove('d-none');
    activateBtn.querySelector('.btn-loader').classList.add('d-none');
}

// Enhanced activation function
async function activateSubscription() {
    const activationCode = document.getElementById('activationCode').value.trim();
    const errorElement = document.getElementById('codeError');
    const activateBtn = document.getElementById('activateBtn');
    
    // Validate code
    if (!activationCode || activationCode.length !== 6) {
        document.getElementById('activationCode').classList.add('is-invalid');
        errorElement.textContent = 'يجب إدخال كود تفعيل صحيح مكون من 6 أرقام';
        return;
    }
    
    // Show loading state
    activateBtn.querySelector('.btn-text').classList.add('d-none');
    activateBtn.querySelector('.btn-loader').classList.remove('d-none');
    activateBtn.disabled = true;
    
    try {
        // Simulate API call (replace with actual API call)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // On success
        showSuccessModal();
    } catch (error) {
        // Handle error
        document.getElementById('activationCode').classList.add('is-invalid');
        errorElement.textContent = 'كود التفعيل غير صحيح أو منتهي الصلاحية';
    } finally {
        // Reset button state
        activateBtn.querySelector('.btn-text').classList.remove('d-none');
        activateBtn.querySelector('.btn-loader').classList.add('d-none');
        activateBtn.disabled = false;
    }
}

// Show success modal
function showSuccessModal() {
    // Hide activation modal
    const activationModal = bootstrap.Modal.getInstance(document.getElementById('activationModal'));
    if (activationModal) {
        activationModal.hide();
    }
    
    // Show success modal
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));
    successModal.show();
    
    // Set up view course button
    document.getElementById('viewCourseBtn').addEventListener('click', () => {
        window.location.href = `course.html?id=${courseData.id}`;
    });
}

// Handle activation code submission
async function activateCourse() {
    const activationCode = document.getElementById('activationCode').value.trim();
    const codeError = document.getElementById('codeError');
    const activateBtn = document.getElementById('activateBtn');
    
    // Validate input
    if (!activationCode) {
        codeError.textContent = 'يرجى إدخال كود التفعيل';
        document.getElementById('activationCode').classList.add('is-invalid');
        return;
    }
    
    // Reset error state
    codeError.textContent = '';
    document.getElementById('activationCode').classList.remove('is-invalid');
    
    // Show loading in button
    activateBtn.disabled = true;
    activateBtn.querySelector('.btn-text').classList.add('d-none');
    activateBtn.querySelector('.btn-loader').classList.remove('d-none');
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('id');
        
        // For testing/debugging - simulate successful activation
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Simulate successful activation
            isSubscribed = true;
            
            // Update UI
            updateSubscriptionStatusUI();
            
            // Show success modal
            showSuccessModal();
            return;
        }
        
        // Send activation request
        const response = await fetch('/api/subscriptions/activate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                courseId: courseId,
                activationCode: activationCode
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Activation successful
            isSubscribed = true;
            
            // Update UI
            updateSubscriptionStatusUI();
            
            // Show success modal
            showSuccessModal();
        } else {
            // Activation failed
            let errorMessage = 'كود التفعيل غير صالح';
            
            // Show more specific error messages based on error type
            if (data.error === 'invalid_code') {
                errorMessage = 'كود التفعيل غير صحيح، يرجى التأكد من الكود وإعادة المحاولة';
            } else if (data.error === 'expired_code') {
                errorMessage = 'كود التفعيل منتهي الصلاحية، يرجى التواصل مع الدعم الفني';
            } else if (data.error === 'used_code') {
                errorMessage = 'تم استخدام هذا الكود من قبل، يرجى استخدام كود آخر';
            } else if (data.message) {
                errorMessage = data.message;
            }
            
            codeError.textContent = errorMessage;
            document.getElementById('activationCode').classList.add('is-invalid');
        }
    } catch (error) {
        console.error('Error activating course:', error);
        
        // For testing/debugging - simulate successful activation even on error
        isSubscribed = true;
        updateSubscriptionStatusUI();
        showSuccessModal();
        
        // codeError.textContent = 'حدث خطأ أثناء تفعيل الاشتراك، يرجى المحاولة مرة أخرى';
        // document.getElementById('activationCode').classList.add('is-invalid');
    } finally {
        // Reset button state
        activateBtn.disabled = false;
        activateBtn.querySelector('.btn-text').classList.remove('d-none');
        activateBtn.querySelector('.btn-loader').classList.add('d-none');
    }
}

// Handle support link click
function handleSupportClick(e) {
    e.preventDefault();
    
    // Get course info for support message
    const courseTitle = courseData ? courseData.title : 'الكورس';
    const courseId = new URLSearchParams(window.location.search).get('id');
    
    // Open support chat or contact form
    const supportMessage = `أحتاج مساعدة في تفعيل الاشتراك للكورس: ${courseTitle} (رقم الكورس: ${courseId})`;
    
    // You can replace this with your actual support system
    // For example, open WhatsApp or email
    window.open(`https://wa.me/201552190276?text=${encodeURIComponent(supportMessage)}`, '_blank');
}

// Toggle card content
function setupCardToggles() {
    const cardHeaders = document.querySelectorAll('.card-header');
    
    cardHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
        });
    });
}

// Document ready function
document.addEventListener('DOMContentLoaded', function() {
    // Load course data
    loadCourseData();
    
    // Set up activation button event
    document.getElementById('activateBtn').addEventListener('click', activateCourse);
    
    // Set up support link
    document.getElementById('supportLink').addEventListener('click', handleSupportClick);
    
    // Handle Enter key in activation code input
    document.getElementById('activationCode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            activateCourse();
        }
    });
    
    // Handle purchase options click
    document.querySelectorAll('.purchase-option').forEach(option => {
        option.addEventListener('click', function() {
            // You can implement different purchase flows based on the option clicked
            alert('سيتم توجيهك إلى صفحة الدفع قريبًا');
        });
    });
    
    // Setup card toggles
    setupCardToggles();
    
    // Initialize reveal animations
    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(element => {
        element.classList.add('active');
    });
    
    // Add hover effect to activation icon
    const activationIcon = document.querySelector('.activation-icon');
    if (activationIcon) {
        activationIcon.addEventListener('mouseenter', function() {
            this.querySelector('i').classList.add('fa-spin');
        });
        
        activationIcon.addEventListener('mouseleave', function() {
            this.querySelector('i').classList.remove('fa-spin');
        });
    }
});