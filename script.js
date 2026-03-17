// DOM Elements
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const clearBtn = document.getElementById('clearBtn');
const totalTasksEl = document.getElementById('totalTasks');
const completedTasksEl = document.getElementById('completedTasks');
const pendingTasksEl = document.getElementById('pendingTasks');
const todoDate = document.getElementById('todoDate');
const todoTime = document.getElementById('todoTime');
const clearDateTime = document.getElementById('clearDateTime');

// State
let todos = [];
let currentFilter = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTodos();
    setDefaultDate();
    renderTodos();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });

    clearDateTime.addEventListener('click', () => {
        todoDate.value = '';
        todoTime.value = '';
        showNotification('Tanggal dan waktu telah dihapus');
    });

    clearBtn.addEventListener('click', clearCompletedTodos);
    
    // Event delegation untuk filter buttons - lebih reliable
    document.addEventListener('click', function(e) {
        const filterBtn = e.target.closest('.filter-btn');
        if (filterBtn) {
            e.preventDefault();
            e.stopPropagation();
            
            // Remove active dari semua buttons
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Tambah active ke yang diklik
            filterBtn.classList.add('active');
            
            // Update filter
            const filterValue = filterBtn.getAttribute('data-filter');
            currentFilter = filterValue;
            
            console.log('Filter changed to:', currentFilter);
            console.log('Todos count:', todos.length);
            
            // Render
            renderTodos();
        }
    });
}

// Add Todo
function addTodo() {
    const text = todoInput.value.trim();

    if (text === '') {
        showNotification('Masukan teks tugas!');
        todoInput.focus();
        return;
    }

    if (text.length > 100) {
        showNotification('Teks tugas terlalu panjang (maksimal 100 karakter)');
        return;
    }

    const newTodo = {
        id: Date.now(),
        text: text,
        completed: false,
        date: new Date().toLocaleDateString('id-ID'),
        scheduledDate: todoDate.value || null,
        scheduledTime: todoTime.value || null,
        createdAt: new Date()
    };

    todos.unshift(newTodo);
    saveTodos();
    renderTodos();
    todoInput.value = '';
    todoDate.value = '';
    todoTime.value = '';
    todoInput.focus();
    setDefaultDate();
}

// Toggle Todo Completion
function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos();
    }
}

// Delete Todo
function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    renderTodos();
}

// Clear Completed Todos
function clearCompletedTodos() {
    if (todos.some(t => t.completed)) {
        if (confirm('Yakin ingin menghapus semua tugas yang telah selesai?')) {
            todos = todos.filter(t => !t.completed);
            saveTodos();
            renderTodos();
            showNotification('Tugas yang selesai telah dihapus');
        }
    } else {
        showNotification('Tidak ada tugas yang selesai untuk dihapus');
    }
}

// Reset to Dummy Data
function resetToDummyData() {
    if (confirm('Yakin ingin mereset ke data dummy? Data sebelumnya akan dihapus.')) {
        todos = getDummyTodos();
        saveTodos();
        renderTodos();
        setDefaultDate();
        showNotification('Data telah direset ke data dummy');
    }
}

// Render Todos
function renderTodos() {
    console.log('=== RENDER TODOS CALLED ===');
    console.log('Current filter:', currentFilter);
    console.log('Total todos in array:', todos.length);
    
    // Log each todo's status
    todos.forEach((t, i) => {
        console.log(`Todo ${i}: "${t.text}" - completed: ${t.completed}`);
    });
    
    todoList.innerHTML = '';
    
    // Filter todos based on currentFilter
    let filtered = [];
    
    if (currentFilter === 'completed') {
        filtered = todos.filter(t => t.completed === true);
        console.log('COMPLETED filter: showing', filtered.length, 'todos');
    } else if (currentFilter === 'pending') {
        filtered = todos.filter(t => t.completed === false);
        console.log('PENDING filter: showing', filtered.length, 'todos');
    } else {
        filtered = [...todos];
        console.log('ALL filter: showing', filtered.length, 'todos');
    }

    // Show empty state if no todos
    if (filtered.length === 0) {
        emptyState.classList.add('show');
        todoList.style.display = 'none';
        updateStats();
        return;
    }
    
    // Show todos
    emptyState.classList.remove('show');
    todoList.style.display = 'block';

    filtered.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        
        let timeHtml = '';
        if (todo.scheduledDate) {
            const status = getTimeStatus(todo.scheduledDate);
            const formattedDate = formatDate(todo.scheduledDate);
            const timeText = todo.scheduledTime ? ` - ${todo.scheduledTime}` : '';
            timeHtml = `
                <div class="todo-time">
                    <i class="fas fa-calendar-alt"></i>
                    <span>${formattedDate}${timeText}</span>
                    <span class="time-badge ${status.class}">${status.label}</span>
                </div>
            `;
        }
        
        li.innerHTML = `
            <div class="checkbox" onclick="toggleTodo(${todo.id})">
                <i class="fas fa-check"></i>
            </div>
            <div class="todo-content">
                <div class="todo-text">${escapeHtml(todo.text)}</div>
                <div class="todo-date">${todo.date}</div>
                ${timeHtml}
            </div>
            <button class="delete-btn" onclick="deleteTodo(${todo.id})" title="Hapus tugas">
                <i class="fas fa-trash"></i>
            </button>
        `;
        todoList.appendChild(li);
    });

    updateStats();
}

// Update Statistics
function updateStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;

    totalTasksEl.textContent = total;
    completedTasksEl.textContent = completed;
    pendingTasksEl.textContent = pending;
}

// Local Storage Functions
function saveTodos() {
    const todosToSave = todos.map(todo => ({
        ...todo,
        createdAt: todo.createdAt instanceof Date ? todo.createdAt.toISOString() : todo.createdAt
    }));
    localStorage.setItem('todos', JSON.stringify(todosToSave));
}

function loadTodos() {
    const saved = localStorage.getItem('todos');
    todos = saved ? JSON.parse(saved) : getDummyTodos();
}

function getDummyTodos() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextDay = new Date(today);
    nextDay.setDate(nextDay.getDate() + 2);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const formatDate = (date) => date.toISOString().split('T')[0];

    return [
        {
            id: 1710700800000,
            text: 'Belajar Konsep Machine Learning - Supervised vs Unsupervised',
            completed: false,
            date: today.toLocaleDateString('id-ID'),
            scheduledDate: formatDate(today),
            scheduledTime: '09:00',
            createdAt: today.toISOString()
        },
        {
            id: 1710704400000,
            text: 'Implementasi Algoritma K-Means Clustering',
            completed: false,
            date: today.toLocaleDateString('id-ID'),
            scheduledDate: formatDate(tomorrow),
            scheduledTime: '14:00',
            createdAt: today.toISOString()
        },
        {
            id: 1710708000000,
            text: 'Review Dataset dan Preprocessing Data ML',
            completed: false,
            date: today.toLocaleDateString('id-ID'),
            scheduledDate: formatDate(nextDay),
            scheduledTime: '10:30',
            createdAt: today.toISOString()
        },
        {
            id: 1710711600000,
            text: 'Training Model dengan TensorFlow',
            completed: true,
            date: today.toLocaleDateString('id-ID'),
            scheduledDate: formatDate(today),
            scheduledTime: '16:00',
            createdAt: today.toISOString()
        },
        {
            id: 1710715200000,
            text: 'Evaluasi dan Tuning Hyperparameter',
            completed: false,
            date: today.toLocaleDateString('id-ID'),
            scheduledDate: formatDate(nextWeek),
            scheduledTime: '13:00',
            createdAt: today.toISOString()
        },
        {
            id: 1710718800000,
            text: 'Belajar Sistem Operasi - Memory Management',
            completed: false,
            date: today.toLocaleDateString('id-ID'),
            scheduledDate: formatDate(today),
            scheduledTime: '11:00',
            createdAt: today.toISOString()
        },
        {
            id: 1710722400000,
            text: 'Praktik File System dan Disk Scheduling',
            completed: false,
            date: today.toLocaleDateString('id-ID'),
            scheduledDate: formatDate(tomorrow),
            scheduledTime: '15:30',
            createdAt: today.toISOString()
        },
        {
            id: 1710726000000,
            text: 'Analisis CPU Scheduling Algorithms',
            completed: false,
            date: today.toLocaleDateString('id-ID'),
            scheduledDate: formatDate(nextDay),
            scheduledTime: '09:00',
            createdAt: today.toISOString()
        },
        {
            id: 1710729600000,
            text: 'Membuat Resume Materi Sistem Operasi',
            completed: false,
            date: today.toLocaleDateString('id-ID'),
            scheduledDate: formatDate(nextWeek),
            scheduledTime: '10:00',
            createdAt: today.toISOString()
        },
        {
            id: 1710733200000,
            text: 'Latihan Soal Deadlock dan Synchronization',
            completed: true,
            date: today.toLocaleDateString('id-ID'),
            scheduledDate: formatDate(today),
            scheduledTime: '17:00',
            createdAt: today.toISOString()
        }
    ];
}

// Utility Functions
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    todoDate.value = today;
}

function getTimeStatus(dateString) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const taskDate = new Date(dateString + 'T00:00:00');
    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { label: 'Terlewat', class: 'overdue' };
    } else if (diffDays === 0) {
        return { label: 'Hari Ini', class: 'today' };
    } else if (diffDays === 1) {
        return { label: 'Besok', class: 'tomorrow' };
    } else {
        return { label: diffDays + ' hari lagi', class: 'upcoming' };
    }
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('id-ID', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(99, 102, 241, 0.85);
        backdrop-filter: blur(10px);
        color: white;
        padding: 14px 20px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        font-size: 14px;
        font-weight: 500;
        z-index: 1000;
        animation: slideInTop 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutTop 0.3s ease-out forwards';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2500);
}

// Add animation styles to document
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInTop {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes slideOutTop {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-20px);
        }
    }
`;
document.head.appendChild(style);
