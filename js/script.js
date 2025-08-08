// --- Element Selectors ---
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const dueDateInput = document.getElementById('due-date-input');
const taskList = document.getElementById('task-list');
const filterBtns = document.querySelectorAll('.filter-btn');
const toast = document.getElementById('toast');
const searchInput = document.getElementById('search-input');
const searchToggle = document.getElementById('search-toggle');
const themeToggle = document.getElementById('theme-toggle');
const detailFilter = document.getElementById('detail-filter');
const actionHeader = document.getElementById('action-header');
const headerArrow = document.getElementById('header-arrow');

const modalBg = document.getElementById('modal-bg');
const editModal = document.getElementById('edit-modal');
const editTaskForm = document.getElementById('edit-task-form');
const editTaskTitle = document.getElementById('edit-task-title');
const editTaskDate = document.getElementById('edit-task-date');
const editSubtasks = document.getElementById('edit-subtasks');
const newSubtaskInput = document.getElementById('new-subtask-input');
const addEditSubtaskBtn = document.getElementById('add-edit-subtask');
const cancelEditBtn = document.getElementById('cancel-edit');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let searchKeyword = '';
let editingTaskId = null;
let currentDetail = 'all';
let openActionIndex = null; // index of row with open action, or 'all'

const saveTasks = () => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
};

const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
};

function getCountdown(dueDate) {
    const now = new Date();
    const due = new Date(dueDate);
    let diff = due - now;
    if (diff <= 0) return 'Expired';
    let days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);
    let hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);
    let minutes = Math.floor(diff / (1000 * 60));
    diff -= minutes * (1000 * 60);
    let seconds = Math.floor(diff / 1000);
    let str = '';
    if (days > 0) str += `${days}d `;
    if (hours > 0 || days > 0) str += `${hours}h `;
    if (minutes > 0 || hours > 0 || days > 0) str += `${minutes}m `;
    str += `${seconds}s left`;
    return str;
}

function renderTasks() {
    taskList.innerHTML = '';
    let filteredTasks = tasks.filter(task => {
        if (currentFilter === 'completed') return task.isCompleted;
        if (currentFilter === 'active') return !task.isCompleted;
        return true;
    }).filter(task => task.text.toLowerCase().includes(searchKeyword));

    // Detail filter
    const now = new Date();
    filteredTasks = filteredTasks.filter(task => {
        const due = new Date(task.dueDate);
        if (currentDetail === 'today') {
            return due.toDateString() === now.toDateString();
        }
        if (currentDetail === 'nextday') {
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);
            return due.toDateString() === tomorrow.toDateString();
        }
        if (currentDetail === 'overdue') {
            return due - now < 0 && !task.isCompleted;
        }
        if (currentDetail === 'nextweek') {
            const week = new Date(now);
            week.setDate(now.getDate() + 7);
            return due > now && due <= week;
        }
        if (currentDetail === 'nextmonth') {
            const month = new Date(now);
            month.setMonth(now.getMonth() + 1);
            return due > now && due <= month;
        }
        return true;
    });

    if (filteredTasks.length === 0) {
        taskList.innerHTML = '<li class="no-tasks">No tasks found.</li>';
        return;
    }
    filteredTasks.forEach((task, idx) => {
        const li = document.createElement('li');
        li.className = `task-item${task.isCompleted ? ' completed' : ''}`;
        li.dataset.id = task.id;

        const dueObj = new Date(task.dueDate);
        const formattedDate = dueObj.toLocaleDateString('en-US', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
        const formattedTime = dueObj.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit'
        });

        li.innerHTML = `
            <span class="task-num">${idx + 1}</span>
            <div class="task-content">
                <span class="task-text">${task.text}</span>
                <span class="due-date">${formattedDate}</span>
                <span class="countdown" data-duedate="${task.dueDate}">${formattedTime} &mdash; ${getCountdown(task.dueDate)}</span>
                <ul class="subtasks">
                    ${Array.isArray(task.subtasks) ? task.subtasks.map((st, i) => `
                        <li>
                            <input type="checkbox" ${st.done ? 'checked' : ''} data-taskid="${task.id}" data-subidx="${i}">
                            <span style="${st.done ? 'text-decoration:line-through;color:#aaa;' : ''}">${st.text}</span>
                            <button class="edit-subtask-btn" data-taskid="${task.id}" data-subidx="${i}" title="Edit Subtask"><i class="material-icons" style="font-size:16px;">edit</i></button>
                            <button class="delete-subtask-btn" data-taskid="${task.id}" data-subidx="${i}" title="Delete Subtask"><i class="material-icons" style="font-size:16px;">delete</i></button>
                        </li>
                    `).join('') : ''}
                </ul>
            </div>
            <span class="row-arrow-icon arrow-icon" title="Show actions">&#9660;</span>
            <div class="task-actions" data-index="${idx}">
                <button class="complete-btn" title="Mark as Done"><i class="material-icons">check_circle</i></button>
                <button class="edit-btn" title="Edit Task"><i class="material-icons">edit</i></button>
                <button class="delete-btn" title="Delete Task"><i class="material-icons">delete</i></button>
            </div>
        `;
        taskList.appendChild(li);
    });

    // Show/hide actions
    document.querySelectorAll('.task-actions').forEach((el, i) => {
        if (openActionIndex === 'all' || openActionIndex === i) {
            el.classList.add('visible');
        } else {
            el.classList.remove('visible');
        }
    });
    document.querySelectorAll('.row-arrow-icon').forEach((el, i) => {
        if (openActionIndex === 'all' || openActionIndex === i) {
            el.classList.add('open');
        } else {
            el.classList.remove('open');
        }
    });
    // Header arrow
    if (openActionIndex === 'all') {
        actionHeader.classList.add('open');
    } else {
        actionHeader.classList.remove('open');
    }
}

const addTask = (e) => {
    e.preventDefault();
    const taskText = taskInput.value.trim();
    const dueDate = dueDateInput.value;
    if (taskText === '' || dueDate === '') {
        showToast('Please fill all fields!');
        return;
    }
    const newTask = {
        id: Date.now(),
        text: taskText,
        dueDate: dueDate,
        isCompleted: false,
        subtasks: []
    };
    tasks.push(newTask);
    saveTasks();
    renderTasks();
    showToast('Task added!');
    taskForm.reset();
};

const handleTaskAction = (e) => {
    const target = e.target.closest('button');
    if (!target) return;
    const parentLi = target.closest('.task-item');
    const taskId = Number(parentLi.dataset.id);

    // Mark as Done
    if (target.classList.contains('complete-btn')) {
        const task = tasks.find(t => t.id === taskId);
        task.isCompleted = !task.isCompleted;
        saveTasks();
        renderTasks();
        showToast(task.isCompleted ? 'Task completed!' : 'Task set to active.');
    }

    // Delete Task
    if (target.classList.contains('delete-btn')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderTasks();
        showToast('Task deleted!');
    }

    // Edit Task
    if (target.classList.contains('edit-btn')) {
        openEditModal(taskId);
    }
};

const handleFilter = (e) => {
    filterBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = e.target.dataset.filter;
    renderTasks();
};

detailFilter.addEventListener('change', (e) => {
    currentDetail = e.target.value;
    renderTasks();
});

searchToggle.addEventListener('click', () => {
    if (searchInput.style.display === 'none' || searchInput.style.display === '') {
        searchInput.style.display = 'block';
        searchInput.focus();
    } else {
        searchInput.style.display = 'none';
        searchInput.value = '';
        searchKeyword = '';
        renderTasks();
    }
});
searchInput.addEventListener('input', (e) => {
    searchKeyword = e.target.value.toLowerCase();
    renderTasks();
});

taskList.addEventListener('click', (e) => {
    // Checklist subtask
    if (e.target.type === 'checkbox' && e.target.dataset.subidx !== undefined) {
        const taskId = Number(e.target.dataset.taskid);
        const subIdx = Number(e.target.dataset.subidx);
        const task = tasks.find(t => t.id === taskId);
        task.subtasks[subIdx].done = e.target.checked;
        saveTasks();
        renderTasks();
    }
    // Edit subtask
    if (e.target.classList.contains('edit-subtask-btn')) {
        const taskId = Number(e.target.dataset.taskid);
        const subIdx = Number(e.target.dataset.subidx);
        const task = tasks.find(t => t.id === taskId);
        const subtask = task.subtasks[subIdx];
        const newText = prompt('Edit subtask:', subtask.text);
        if (newText !== null && newText.trim() !== '') {
            subtask.text = newText.trim();
            saveTasks();
            renderTasks();
        }
    }
    // Delete subtask
    if (e.target.classList.contains('delete-subtask-btn')) {
        const taskId = Number(e.target.dataset.taskid);
        const subIdx = Number(e.target.dataset.subidx);
        const task = tasks.find(t => t.id === taskId);
        task.subtasks.splice(subIdx, 1);
        saveTasks();
        renderTasks();
    }
    // Row arrow
    if (e.target.classList.contains('row-arrow-icon')) {
        const li = e.target.closest('.task-item');
        const index = Array.from(taskList.children).indexOf(li);
        if (openActionIndex === index) {
            openActionIndex = null;
        } else {
            openActionIndex = index;
        }
        renderTasks();
    }
});

document.addEventListener('click', function(e) {
    // Hide actions if click outside task list and header
    if (
        !e.target.closest('.task-item') &&
        !e.target.closest('.col-action') &&
        !e.target.closest('.table-header')
    ) {
        openActionIndex = null;
        renderTasks();
    }
});

// Table header action arrow: toggle all actions
actionHeader.addEventListener('click', function(e) {
    if (e.target.classList.contains('arrow-icon')) {
        if (openActionIndex === 'all') {
            openActionIndex = null;
        } else {
            openActionIndex = 'all';
        }
        renderTasks();
    }
});

function openEditModal(taskId) {
    editingTaskId = taskId;
    const task = tasks.find(t => t.id === taskId);
    editTaskTitle.value = task.text;
    editTaskDate.value = task.dueDate;
    renderEditSubtasks(task.subtasks);
    modalBg.style.display = 'flex';
}
function closeEditModal() {
    modalBg.style.display = 'none';
    editingTaskId = null;
    editTaskForm.reset();
    renderEditSubtasks([]);
}
function renderEditSubtasks(subtasks) {
    editSubtasks.innerHTML = '';
    subtasks.forEach((st, i) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <input type="checkbox" ${st.done ? 'checked' : ''} data-edit-subidx="${i}">
            <span class="edit-subtask-text" style="${st.done ? 'text-decoration:line-through;color:#aaa;' : ''}">${st.text}</span>
            <button class="edit-subtask-btn" data-edit-subidx="${i}" title="Edit Subtask"><i class="material-icons" style="font-size:16px;">edit</i></button>
            <button class="delete-subtask-btn" data-edit-subidx="${i}" title="Delete Subtask"><i class="material-icons" style="font-size:16px;">delete</i></button>
        `;
        editSubtasks.appendChild(li);
    });
}
editSubtasks.addEventListener('click', (e) => {
    const task = tasks.find(t => t.id === editingTaskId);
    if (e.target.classList.contains('edit-subtask-btn')) {
        const subIdx = Number(e.target.dataset.editSubidx);
        const subtask = task.subtasks[subIdx];
        const newText = prompt('Edit subtask:', subtask.text);
        if (newText !== null && newText.trim() !== '') {
            subtask.text = newText.trim();
            renderEditSubtasks(task.subtasks);
        }
    }
    if (e.target.classList.contains('delete-subtask-btn')) {
        const subIdx = Number(e.target.dataset.editSubidx);
        task.subtasks.splice(subIdx, 1);
        renderEditSubtasks(task.subtasks);
    }
    if (e.target.type === 'checkbox' && e.target.dataset.editSubidx !== undefined) {
        const subIdx = Number(e.target.dataset.editSubidx);
        task.subtasks[subIdx].done = e.target.checked;
        renderEditSubtasks(task.subtasks);
    }
});
addEditSubtaskBtn.addEventListener('click', () => {
    const task = tasks.find(t => t.id === editingTaskId);
    const subText = newSubtaskInput.value.trim();
    if (subText) {
        task.subtasks.push({ text: subText, done: false });
        newSubtaskInput.value = '';
        renderEditSubtasks(task.subtasks);
    }
});
editTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const task = tasks.find(t => t.id === editingTaskId);
    task.text = editTaskTitle.value.trim();
    task.dueDate = editTaskDate.value;
    saveTasks();
    renderTasks();
    closeEditModal();
    showToast('Task updated!');
});
cancelEditBtn.addEventListener('click', (e) => {
    e.preventDefault();
    closeEditModal();
});
modalBg.addEventListener('click', function(e) {
    if (e.target === modalBg) closeEditModal();
});

const setTheme = (theme) => {
    document.body.classList.toggle('light', theme === 'light');
    localStorage.setItem('theme', theme);
    themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
};
themeToggle.addEventListener('click', () => {
    const newTheme = document.body.classList.contains('light') ? 'dark' : 'light';
    setTheme(newTheme);
});
document.addEventListener('DOMContentLoaded', () => {
    setTheme(localStorage.getItem('theme') || 'dark');
});

taskForm.addEventListener('submit', addTask);
taskList.addEventListener('click', handleTaskAction);
filterBtns.forEach(btn => btn.addEventListener('click', handleFilter));
renderTasks();

setInterval(() => {
    document.querySelectorAll('.countdown').forEach(el => {
        el.textContent = (() => {
            const dueObj = new Date(el.dataset.duedate);
            const formattedTime = dueObj.toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit'
            });
            return formattedTime + ' — ' + getCountdown(el.dataset.duedate);
        })();
    });
}, 1000);

// --- Render arrow for each row ---
function renderRowArrows() {
    document.querySelectorAll('#task-list .task-item').forEach((li, idx) => {
        let arrow = li.querySelector('.row-arrow-icon');
        if (!arrow) {
            arrow = document.createElement('span');
            arrow.className = 'row-arrow-icon arrow-icon';
            arrow.innerHTML = '&#9660;';
            arrow.style.cursor = 'pointer';
            arrow.title = 'Show actions';
            // Insert arrow after due date
            const dueDate = li.querySelector('.due-date');
            if (dueDate) {
                dueDate.parentNode.insertBefore(arrow, dueDate.nextSibling);
            }
        }
    });
}
const origRenderTasks = renderTasks;
renderTasks = function() {
    origRenderTasks();
    renderRowArrows();
};
renderTasks();