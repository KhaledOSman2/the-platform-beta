// Global variables
let activeCodes = [];
let usedCodes = [];
let currentFilter = 'all';
let codesPage = 1;
const codesPerPage = 10;

// When the document is ready
document.addEventListener('DOMContentLoaded', function () {
    // Initial data loading
    loadStatistics();
    loadCodes();
    setupEventListeners();
});

// Load statistics for dashboard
function loadStatistics() {
    // This would normally be an API call
    // For now we'll just set dummy statistics
    document.getElementById('totalActiveCodes').textContent = '0';
    document.getElementById('totalUsedCodes').textContent = '0';
    document.getElementById('totalSubscriptions').textContent = '0';

    // API call would be something like:
    // fetch('/api/subscription-stats', {
    //     method: 'GET',
    //     headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // })
    // .then(response => response.json())
    // .then(data => {
    //     document.getElementById('totalActiveCodes').textContent = data.activeCodes;
    //     document.getElementById('totalUsedCodes').textContent = data.usedCodes;
    //     document.getElementById('totalSubscriptions').textContent = data.totalSubscriptions;
    // })
    // .catch(error => console.error('Error loading statistics:', error));
}

// Load activation codes
function loadCodes(page = 1) {
    // This would normally be an API call to get codes from the server
    // For now, we'll just set up the structure

    // API call would be something like:
    // fetch(`/api/activation-codes?page=${page}&filter=${currentFilter}`, {
    //     method: 'GET',
    //     headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // })
    // .then(response => response.json())
    // .then(data => {
    //     activeCodes = data.activeCodes;
    //     usedCodes = data.usedCodes;
    //     displayCodes();
    //     updateCodesPagination(data.totalPages, page);
    // })
    // .catch(error => console.error('Error loading codes:', error));

    // For now, we'll just update the UI to show it's ready for data
    const codesTable = document.getElementById('codesTable');
    const tbody = codesTable.querySelector('tbody');

    // Clear existing rows
    tbody.innerHTML = '';

    // Add a placeholder row
    const row = document.createElement('tr');
    row.innerHTML = `
        <td colspan="9" class="text-center">
            <div class="alert alert-info m-0">
                لا توجد أكواد للعرض حالياً. قم بإنشاء أكواد جديدة باستخدام زر "إنشاء أكواد".
            </div>
        </td>
    `;
    tbody.appendChild(row);

    // Update pagination
    updateCodesPagination(1, 1);
}

// Display codes based on current filter
function displayCodes() {
    const codesTable = document.getElementById('codesTable');
    const tbody = codesTable.querySelector('tbody');

    // Clear existing rows
    tbody.innerHTML = '';

    // Determine which codes to display based on filter
    let codesToDisplay = [];
    if (currentFilter === 'all') {
        codesToDisplay = [...activeCodes, ...usedCodes];
    } else if (currentFilter === 'active') {
        codesToDisplay = [...activeCodes];
    } else if (currentFilter === 'used') {
        codesToDisplay = [...usedCodes];
    }

    // Calculate pagination
    const startIndex = (codesPage - 1) * codesPerPage;
    const endIndex = startIndex + codesPerPage;
    const paginatedCodes = codesToDisplay.slice(startIndex, endIndex);

    // If no codes, show a message
    if (paginatedCodes.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="9" class="text-center">
                <div class="alert alert-info m-0">
                    لا توجد أكواد تطابق الفلتر الحالي.
                </div>
            </td>
        `;
        tbody.appendChild(row);
        return;
    }

    // Add rows for each code
    paginatedCodes.forEach((code, index) => {
        const row = document.createElement('tr');
        const isActive = !code.usedBy;
        const statusClass = isActive ? 'success' : 'secondary';
        const statusText = isActive ? 'نشط' : 'مستخدم';

        row.innerHTML = `
            <td>${startIndex + index + 1}</td>
            <td>${code.code}</td>
            <td>${getSubscriptionTypeName(code.subscriptionType)}</td>
            <td>${formatDate(code.creationDate)}</td>
            <td>${formatDate(code.expiryDate)}</td>
            <td><span class="badge bg-${statusClass}">${statusText}</span></td>
            <td>${code.usedBy || '-'}</td>
            <td>${code.usageDate ? formatDate(code.usageDate) : '-'}</td>
            <td>
                <button class="btn btn-sm btn-primary view-code" data-code-id="${code.id}" title="عرض التفاصيل">
                    <i class="fas fa-eye"></i>
                </button>
                ${isActive ? `
                <button class="btn btn-sm btn-warning disable-code" data-code-id="${code.id}" title="تعطيل الكود">
                    <i class="fas fa-ban"></i>
                </button>
                ` : ''}
                <button class="btn btn-sm btn-danger delete-code" data-code-id="${code.id}" title="حذف الكود">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Attach event listeners to buttons
    attachCodeActionListeners();
}

// Update the pagination for codes
function updateCodesPagination(totalPages, currentPage) {
    const pagination = document.getElementById('codesPagination');
    const ul = pagination.querySelector('ul');

    // Clear existing pagination
    ul.innerHTML = '';

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `
        <a class="page-link" href="#" aria-label="Previous" ${currentPage > 1 ? `data-page="${currentPage - 1}"` : ''}>
            <span aria-hidden="true">&laquo;</span>
        </a>
    `;
    ul.appendChild(prevLi);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
        ul.appendChild(li);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `
        <a class="page-link" href="#" aria-label="Next" ${currentPage < totalPages ? `data-page="${currentPage + 1}"` : ''}>
            <span aria-hidden="true">&raquo;</span>
        </a>
    `;
    ul.appendChild(nextLi);

    // Attach event listeners
    ul.querySelectorAll('a.page-link').forEach(link => {
        if (link.dataset.page) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                codesPage = parseInt(this.dataset.page);
                loadCodes(codesPage);
            });
        }
    });
}

// Filter codes based on status
function filterCodes(filter) {
    currentFilter = filter;
    codesPage = 1; // Reset to first page when changing filter
    loadCodes(codesPage);

    // Update active filter button
    document.querySelectorAll('.filter-options button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.filter-options button[data-filter="${filter}"]`).classList.add('active');
}

// Search codes
function searchCodes(searchTerm) {
    if (!searchTerm.trim()) {
        loadCodes(1); // Reset to first page with no search
        return;
    }

    // This would normally be an API call with search parameter
    // For now, just simulate empty results
    const codesTable = document.getElementById('codesTable');
    const tbody = codesTable.querySelector('tbody');

    tbody.innerHTML = `
        <tr>
            <td colspan="9" class="text-center">
                <div class="alert alert-info m-0">
                    جاري البحث عن "${searchTerm}"...
                </div>
            </td>
        </tr>
    `;

    // In a real implementation, you would do:
    // fetch(`/api/activation-codes/search?term=${encodeURIComponent(searchTerm)}&filter=${currentFilter}`, {
    //     method: 'GET',
    //     headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // })
    // .then(response => response.json())
    // .then(data => {
    //     // Update the table with search results
    //     displaySearchResults(data.codes);
    //     updateCodesPagination(data.totalPages, 1);
    // })
    // .catch(error => console.error('Error searching codes:', error));
}

// Generate new activation codes
function generateCodes() {
    const count = document.getElementById('codeCount').value;
    const subscriptionType = document.getElementById('subscriptionType').value;
    const expiryDate = document.getElementById('expiryDate').value;
    const prefix = document.getElementById('codePrefix').value || '';
    const notes = document.getElementById('notes').value || '';

    // Validate inputs
    if (!count || count < 1 || count > 100) {
        alert('يرجى إدخال عدد صحيح للأكواد بين 1 و 100.');
        return;
    }

    // In a real implementation, you would send this data to your server:
    // fetch('/api/activation-codes/generate', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${localStorage.getItem('token')}`
    //     },
    //     body: JSON.stringify({
    //         count,
    //         subscriptionType,
    //         expiryDate,
    //         prefix,
    //         notes
    //     })
    // })
    // .then(response => response.json())
    // .then(data => {
    //     if (data.success) {
    //         // Hide modal
    //         const modal = bootstrap.Modal.getInstance(document.getElementById('createCodesModal'));
    //         modal.hide();
    //
    //         // Reload codes
    //         loadCodes(1);
    //         loadStatistics();
    //
    //         // Show success message
    //         alert(`تم إنشاء ${count} كود بنجاح!`);
    //     } else {
    //         alert('حدث خطأ أثناء إنشاء الأكواد: ' + data.message);
    //     }
    // })
    // .catch(error => {
    //     console.error('Error generating codes:', error);
    //     alert('حدث خطأ أثناء إنشاء الأكواد.');
    // });

    // For demo purposes, just show a success message
    const modal = bootstrap.Modal.getInstance(document.getElementById('createCodesModal'));
    modal.hide();

    // Show success message
    alert(`تم طلب إنشاء ${count} كود بنجاح!`);

    // Reset form
    document.getElementById('createCodesForm').reset();
}

// Export codes to Excel/CSV
function exportCodes(filter) {
    // This would normally be an API call to generate and download an export file
    // For now, just alert the user
    alert(`سيتم تصدير الأكواد (${filter}) قريباً...`);

    // In a real implementation:
    // window.location.href = `/api/activation-codes/export?filter=${filter}&token=${localStorage.getItem('token')}`;
}

// Helper function to format dates
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG');
}

// Helper function to get subscription type name
function getSubscriptionTypeName(type) {
    const types = {
        'basic': 'أساسي',
        'standard': 'قياسي',
        'premium': 'متميز'
    };
    return types[type] || type;
}

// Set up event listeners
function setupEventListeners() {
    // Code search
    const searchInput = document.getElementById('codeSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function () {
            searchCodes(this.value);
        }, 500));
    }

    // Filter buttons
    document.querySelectorAll('.filter-options button').forEach(btn => {
        btn.addEventListener('click', function () {
            filterCodes(this.dataset.filter);
        });
    });

    // Generate codes button
    const generateBtn = document.getElementById('generateCodesBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateCodes);
    }

    // Export buttons
    document.getElementById('exportAllCodes').addEventListener('click', () => exportCodes('all'));
    document.getElementById('exportActiveCodes').addEventListener('click', () => exportCodes('active'));
    document.getElementById('exportUsedCodes').addEventListener('click', () => exportCodes('used'));

    // Reset form when modal is closed
    document.getElementById('createCodesModal').addEventListener('hidden.bs.modal', function () {
        document.getElementById('createCodesForm').reset();
    });
}

// Attach event listeners to code action buttons
function attachCodeActionListeners() {
    // View code details
    document.querySelectorAll('.view-code').forEach(btn => {
        btn.addEventListener('click', function () {
            const codeId = this.dataset.codeId;
            viewCodeDetails(codeId);
        });
    });

    // Disable code
    document.querySelectorAll('.disable-code').forEach(btn => {
        btn.addEventListener('click', function () {
            const codeId = this.dataset.codeId;
            if (confirm('هل أنت متأكد من رغبتك في تعطيل هذا الكود؟')) {
                disableCode(codeId);
            }
        });
    });

    // Delete code
    document.querySelectorAll('.delete-code').forEach(btn => {
        btn.addEventListener('click', function () {
            const codeId = this.dataset.codeId;
            if (confirm('هل أنت متأكد من رغبتك في حذف هذا الكود؟ لا يمكن التراجع عن هذا الإجراء.')) {
                deleteCode(codeId);
            }
        });
    });
}

// View code details
function viewCodeDetails(codeId) {
    // In a real implementation, you would fetch details from the server:
    // fetch(`/api/activation-codes/${codeId}`, {
    //     method: 'GET',
    //     headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // })
    // .then(response => response.json())
    // .then(code => {
    //     // Populate the modal with code details
    //     document.getElementById('viewCodeValue').textContent = code.code;
    //     document.getElementById('viewSubscriptionType').textContent = getSubscriptionTypeName(code.subscriptionType);
    //     document.getElementById('viewCreationDate').textContent = formatDate(code.creationDate);
    //     document.getElementById('viewExpiryDate').textContent = formatDate(code.expiryDate);
    //     document.getElementById('viewStatus').textContent = code.usedBy ? 'مستخدم' : 'نشط';
    //     document.getElementById('viewUser').textContent = code.usedBy || '-';
    //     document.getElementById('viewUsageDate').textContent = code.usageDate ? formatDate(code.usageDate) : '-';
    //     document.getElementById('viewNotes').textContent = code.notes || '-';
    //
    //     // Show the modal
    //     const modal = new bootstrap.Modal(document.getElementById('codeDetailsModal'));
    //     modal.show();
    // })
    // .catch(error => console.error('Error getting code details:', error));

    // For demo purposes, show modal with placeholder data
    document.getElementById('viewCodeValue').textContent = 'ABC-123456';
    document.getElementById('viewSubscriptionType').textContent = 'أساسي';
    document.getElementById('viewCreationDate').textContent = formatDate(new Date());
    document.getElementById('viewExpiryDate').textContent = formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    document.getElementById('viewStatus').textContent = 'نشط';
    document.getElementById('viewUser').textContent = '-';
    document.getElementById('viewUsageDate').textContent = '-';
    document.getElementById('viewNotes').textContent = '-';

    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('codeDetailsModal'));
    modal.show();
}

// Disable a code
function disableCode(codeId) {
    // This would be an API call in a real implementation
    // fetch(`/api/activation-codes/${codeId}/disable`, {
    //     method: 'POST',
    //     headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // })
    // .then(response => response.json())
    // .then(data => {
    //     if (data.success) {
    //         // Reload codes
    //         loadCodes(codesPage);
    //         loadStatistics();
    //         alert('تم تعطيل الكود بنجاح.');
    //     } else {
    //         alert('حدث خطأ أثناء تعطيل الكود: ' + data.message);
    //     }
    // })
    // .catch(error => {
    //     console.error('Error disabling code:', error);
    //     alert('حدث خطأ أثناء تعطيل الكود.');
    // });

    // For demo purposes, just show a message
    alert('تم تعطيل الكود بنجاح.');
}

// Delete a code
function deleteCode(codeId) {
    // This would be an API call in a real implementation
    // fetch(`/api/activation-codes/${codeId}`, {
    //     method: 'DELETE',
    //     headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    // })
    // .then(response => response.json())
    // .then(data => {
    //     if (data.success) {
    //         // Reload codes
    //         loadCodes(codesPage);
    //         loadStatistics();
    //         alert('تم حذف الكود بنجاح.');
    //     } else {
    //         alert('حدث خطأ أثناء حذف الكود: ' + data.message);
    //     }
    // })
    // .catch(error => {
    //     console.error('Error deleting code:', error);
    //     alert('حدث خطأ أثناء حذف الكود.');
    // });

    // For demo purposes, just show a message
    alert('تم حذف الكود بنجاح.');
}

// Utility function for debouncing
function debounce(func, delay) {
    let timeout;
    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}
