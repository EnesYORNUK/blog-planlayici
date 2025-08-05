const { ipcRenderer } = require('electron');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

// Global değişkenler
let schedulers = [];
let currentMonth = moment();
let selectedScheduler = null;
let completedTasks = new Set();

// DOM elementleri
const elements = {
    addSchedulerBtn: document.getElementById('addSchedulerBtn'),
    schedulerModal: document.getElementById('schedulerModal'),
    closeModal: document.getElementById('closeModal'),
    cancelBtn: document.getElementById('cancelBtn'),
    schedulerForm: document.getElementById('schedulerForm'),
    schedulerList: document.getElementById('schedulerList'),
    todayTasks: document.getElementById('todayTasks'),
    timeline: document.getElementById('timeline'),
    currentMonth: document.getElementById('currentMonth'),
    prevMonth: document.getElementById('prevMonth'),
    nextMonth: document.getElementById('nextMonth'),
    updateBtn: document.getElementById('updateBtn'),
    minimizeBtn: document.getElementById('minimizeBtn'),
    notification: document.getElementById('notification'),
    notificationText: document.getElementById('notificationText'),
    frequencyType: document.getElementById('frequencyType'),
    frequencyValue: document.getElementById('frequencyValue'),
    frequencyUnit: document.getElementById('frequencyUnit'),
    endType: document.getElementById('endType'),
    durationGroup: document.getElementById('durationGroup'),
    endDateGroup: document.getElementById('endDateGroup')
};

// Veri dosyası yolu
const dataPath = path.join(__dirname, 'data.json');

// Uygulama başlatma
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadData();
    renderTimeline();
    renderSchedulerList();
    checkTodayTasks();
    startNotificationCheck();
});

// Uygulama başlatma
function initializeApp() {
    // Bugünün tarihini başlangıç tarihi olarak ayarla
    document.getElementById('startDate').value = moment().format('YYYY-MM-DD');
    
    // Form değişikliklerini dinle
    elements.frequencyType.addEventListener('change', updateFrequencyUnit);
    elements.endType.addEventListener('change', toggleEndTypeFields);
    
    // İlk yükleme
    updateFrequencyUnit();
    toggleEndTypeFields();
}

// Event listener'ları ayarla
function setupEventListeners() {
    // Modal işlemleri
    elements.addSchedulerBtn.addEventListener('click', showModal);
    elements.closeModal.addEventListener('click', hideModal);
    elements.cancelBtn.addEventListener('click', hideModal);
    elements.schedulerForm.addEventListener('submit', handleSchedulerSubmit);
    
    // Timeline kontrolleri
    elements.prevMonth.addEventListener('click', () => navigateMonth(-1));
    elements.nextMonth.addEventListener('click', () => navigateMonth(1));
    
    // Header butonları
    elements.updateBtn.addEventListener('click', () => ipcRenderer.invoke('check-updates'));
    elements.minimizeBtn.addEventListener('click', () => ipcRenderer.invoke('minimize-to-tray'));
    
    // Modal dışına tıklama
    elements.schedulerModal.addEventListener('click', (e) => {
        if (e.target === elements.schedulerModal) {
            hideModal();
        }
    });
}

// Veri yükleme
function loadData() {
    try {
        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            schedulers = data.schedulers || [];
            completedTasks = new Set(data.completedTasks || []);
        }
    } catch (error) {
        console.error('Veri yükleme hatası:', error);
        schedulers = [];
        completedTasks = new Set();
    }
}

// Veri kaydetme
function saveData() {
    try {
        const data = {
            schedulers: schedulers,
            completedTasks: Array.from(completedTasks)
        };
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Veri kaydetme hatası:', error);
    }
}

// Modal işlemleri
function showModal() {
    elements.schedulerModal.classList.add('show');
    document.getElementById('companyName').focus();
}

function hideModal() {
    elements.schedulerModal.classList.remove('show');
    elements.schedulerForm.reset();
    document.getElementById('startDate').value = moment().format('YYYY-MM-DD');
    updateFrequencyUnit();
    toggleEndTypeFields();
}

// Form işlemleri
function updateFrequencyUnit() {
    const type = elements.frequencyType.value;
    const unit = type === 'weekly' ? 'hafta' : 'ay';
    elements.frequencyUnit.textContent = unit;
}

function toggleEndTypeFields() {
    const endType = elements.endType.value;
    elements.durationGroup.style.display = endType === 'duration' ? 'block' : 'none';
    elements.endDateGroup.style.display = endType === 'endDate' ? 'block' : 'none';
}

function handleSchedulerSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(elements.schedulerForm);
    const scheduler = {
        id: Date.now().toString(),
        companyName: formData.get('companyName'),
        startDate: formData.get('startDate'),
        frequencyType: formData.get('frequencyType'),
        frequencyValue: parseInt(formData.get('frequencyValue')),
        endType: formData.get('endType'),
        durationYears: formData.get('durationYears') ? parseInt(formData.get('durationYears')) : null,
        endDate: formData.get('endDate') || null,
        createdAt: moment().toISOString()
    };
    
    schedulers.push(scheduler);
    saveData();
    
    renderSchedulerList();
    renderTimeline();
    checkTodayTasks();
    
    hideModal();
    showNotification('Blog zamanlayıcı başarıyla eklendi!');
}

// Zamanlayıcı listesi render
function renderSchedulerList() {
    elements.schedulerList.innerHTML = '';
    
    schedulers.forEach(scheduler => {
        const item = document.createElement('div');
        item.className = 'scheduler-item';
        if (selectedScheduler && selectedScheduler.id === scheduler.id) {
            item.classList.add('active');
        }
        
        const frequencyText = scheduler.frequencyType === 'weekly' ? 'hafta' : 'ay';
        const endText = getEndText(scheduler);
        
        item.innerHTML = `
            <div class="scheduler-name">${scheduler.companyName}</div>
            <div class="scheduler-info">
                ${scheduler.frequencyValue} ${frequencyText}da bir • ${endText}
            </div>
        `;
        
        item.addEventListener('click', () => {
            selectedScheduler = scheduler;
            renderSchedulerList();
            renderTimeline();
        });
        
        elements.schedulerList.appendChild(item);
    });
}

function getEndText(scheduler) {
    switch (scheduler.endType) {
        case 'unlimited':
            return 'Sınırsız';
        case 'duration':
            return `${scheduler.durationYears} yıl`;
        case 'endDate':
            return moment(scheduler.endDate).format('DD.MM.YYYY');
        default:
            return '';
    }
}

// Timeline render
function renderTimeline() {
    const year = currentMonth.year();
    const month = currentMonth.month();
    
    elements.currentMonth.textContent = currentMonth.format('MMMM YYYY');
    
    const firstDay = moment([year, month, 1]);
    const lastDay = moment([year, month + 1, 0]);
    const startDate = firstDay.clone().startOf('week');
    const endDate = lastDay.clone().endOf('week');
    
    elements.timeline.innerHTML = '';
    
    let currentDate = startDate.clone();
    const today = moment();
    
    while (currentDate.isSameOrBefore(endDate)) {
        const dayElement = document.createElement('div');
        dayElement.className = 'timeline-day';
        
        // Bugün kontrolü
        if (currentDate.isSame(today, 'day')) {
            dayElement.classList.add('today');
        }
        
        // Ay kontrolü
        if (currentDate.month() !== month) {
            dayElement.style.opacity = '0.3';
        }
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = currentDate.date();
        
        const dayTasks = document.createElement('div');
        dayTasks.className = 'day-tasks';
        
        // Bu gün için görevleri kontrol et
        const tasksForDay = getTasksForDate(currentDate);
        if (tasksForDay.length > 0) {
            dayElement.classList.add('has-task');
            dayTasks.textContent = `${tasksForDay.length} görev`;
            
            // Tamamlanan görevleri kontrol et
            const completedTasksForDay = tasksForDay.filter(task => 
                completedTasks.has(`${task.schedulerId}-${currentDate.format('YYYY-MM-DD')}`)
            );
            
            if (completedTasksForDay.length === tasksForDay.length && tasksForDay.length > 0) {
                dayElement.classList.add('completed');
                dayElement.classList.remove('has-task');
            }
        }
        
        dayElement.appendChild(dayNumber);
        dayElement.appendChild(dayTasks);
        
        // Gün tıklama olayı
        dayElement.addEventListener('click', () => {
            if (tasksForDay.length > 0) {
                showDayTasks(currentDate, tasksForDay);
            }
        });
        
        elements.timeline.appendChild(dayElement);
        currentDate.add(1, 'day');
    }
}

function navigateMonth(direction) {
    currentMonth.add(direction, 'month');
    renderTimeline();
}

// Görev hesaplama
function getTasksForDate(date) {
    const tasks = [];
    
    schedulers.forEach(scheduler => {
        const startDate = moment(scheduler.startDate);
        const endDate = getEndDate(scheduler);
        
        if (date.isSameOrAfter(startDate) && date.isSameOrBefore(endDate)) {
            const daysSinceStart = date.diff(startDate, 'days');
            const frequencyDays = scheduler.frequencyType === 'weekly' 
                ? scheduler.frequencyValue * 7 
                : scheduler.frequencyValue * 30;
            
            if (daysSinceStart % frequencyDays === 0) {
                tasks.push({
                    schedulerId: scheduler.id,
                    companyName: scheduler.companyName,
                    date: date.format('YYYY-MM-DD')
                });
            }
        }
    });
    
    return tasks;
}

function getEndDate(scheduler) {
    switch (scheduler.endType) {
        case 'unlimited':
            return moment().add(100, 'years'); // Çok uzak gelecek
        case 'duration':
            return moment(scheduler.startDate).add(scheduler.durationYears, 'years');
        case 'endDate':
            return moment(scheduler.endDate);
        default:
            return moment().add(100, 'years');
    }
}

// Bugünkü görevleri kontrol et
function checkTodayTasks() {
    const today = moment();
    const todayTasks = getTasksForDate(today);
    
    elements.todayTasks.innerHTML = '';
    
    if (todayTasks.length === 0) {
        elements.todayTasks.innerHTML = '<div style="color: #718096; font-style: italic;">Bugün için görev yok</div>';
        return;
    }
    
    todayTasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        
        const taskKey = `${task.schedulerId}-${task.date}`;
        const isCompleted = completedTasks.has(taskKey);
        
        if (isCompleted) {
            taskElement.classList.add('completed');
        }
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = isCompleted;
        
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                completedTasks.add(taskKey);
            } else {
                completedTasks.delete(taskKey);
            }
            saveData();
            renderTimeline();
            checkTodayTasks();
        });
        
        const taskText = document.createElement('div');
        taskText.className = 'task-text';
        taskText.textContent = `${task.companyName} - Blog yayınla`;
        
        taskElement.appendChild(checkbox);
        taskElement.appendChild(taskText);
        elements.todayTasks.appendChild(taskElement);
    });
}

// Gün görevlerini göster
function showDayTasks(date, tasks) {
    const dateStr = date.format('DD.MM.YYYY');
    const taskList = tasks.map(task => 
        `${task.companyName} - Blog yayınla`
    ).join('\n');
    
    showNotification(`${dateStr} için ${tasks.length} görev:\n${taskList}`);
}

// Bildirim sistemi
function showNotification(message) {
    elements.notificationText.textContent = message;
    elements.notification.classList.add('show');
    
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}

// Periyodik kontrol
function startNotificationCheck() {
    setInterval(() => {
        const today = moment();
        const todayTasks = getTasksForDate(today);
        
        if (todayTasks.length > 0) {
            const uncompletedTasks = todayTasks.filter(task => {
                const taskKey = `${task.schedulerId}-${task.date}`;
                return !completedTasks.has(taskKey);
            });
            
            if (uncompletedTasks.length > 0) {
                showNotification(`Bugün ${uncompletedTasks.length} blog göreviniz var!`);
            }
        }
    }, 60000); // Her dakika kontrol et
}

// Form validation
document.getElementById('frequencyValue').addEventListener('input', function() {
    const value = parseInt(this.value);
    const type = elements.frequencyType.value;
    const max = type === 'weekly' ? 52 : 12;
    
    if (value > max) {
        this.value = max;
    } else if (value < 1) {
        this.value = 1;
    }
});

// Otomatik kaydetme
window.addEventListener('beforeunload', () => {
    saveData();
}); 