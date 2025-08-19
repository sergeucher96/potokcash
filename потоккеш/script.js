document.addEventListener('DOMContentLoaded', () => {
    // --- ИНИЦИАЛИЗАЦИЯ ---
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
    }
    
    // --- ГЛОБАЛЬНОЕ СОСТОЯНИЕ ---
    const state = {
        currentStep: 1,
        archetype: 'growing',
        unlockedAchievements: new Set(),
        visitedTabs: new Set(),
        savedPlans: JSON.parse(localStorage.getItem('savedPlans')) || [],
        lastCalculation: null,
        isInitialLoad: true
    };

    // --- НАВИГАЦИЯ И ПРОГРЕСС-БАР ---
    const updateProgressBar = (step) => {
        state.currentStep = step;
        document.querySelectorAll('.progress-step').forEach(el => {
            const stepNum = parseInt(el.dataset.step, 10);
            el.classList.toggle('completed', stepNum < step);
            el.classList.toggle('active', stepNum === step);
        });
    };

    const showScreen = (screenId, step) => {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        updateProgressBar(step);
    };

    // --- УВЕДОМЛЕНИЯ ---
    const showAchievement = (id, icon, title, subtitle) => {
        if (state.unlockedAchievements.has(id)) return;
        state.unlockedAchievements.add(id);
        const container = document.getElementById('achievement-container');
        const achDiv = document.createElement('div');
        achDiv.className = 'achievement-popup';
        achDiv.innerHTML = `<span>${icon}</span> <div class="achievement-text"><strong>${title}</strong><small>${subtitle}</small></div>`;
        container.appendChild(achDiv);
        setTimeout(() => achDiv.remove(), 4000);
    };

    const pulseMessages = ["🚀 Кто-то только что запустил 'Быстрый Поток'!", "📈 Новый 'Растущий Поток' был запущен!", "🏛️ Пользователь начал свой 'Накопительный Поток'."];
    setInterval(() => {
        const pulseEl = document.getElementById('pulse-notification');
        pulseEl.innerHTML = pulseMessages[Math.floor(Math.random() * pulseMessages.length)];
        pulseEl.classList.add('show');
        setTimeout(() => pulseEl.classList.remove('show'), 4000);
    }, 12000);

    // --- ФИНАЛЬНЫЙ ЭКРАН ---
    const renderFinalSummary = () => {
        const container = document.getElementById('summary-container');
        if (state.lastCalculation) {
            const { name, result, investment } = state.lastCalculation;
            container.innerHTML = `<p>Вы рассчитали, что <strong>${name}</strong> при вкладе ${investment} может принести вам <strong>${result}</strong>. <br>В личном кабинете вы можете,выбрать любой поток и сумму.<br><b>Не откладывайте свой рост!</p>`;
        } else {
            container.innerHTML = `<p>Вы увидели потенциал. Теперь сделайте первый шаг, чтобы превратить расчеты в реальность.</p>`;
        }
    };

    // --- ЛОГИКА КАЛЬКУЛЯТОРА ---
    const calculatorContent = document.getElementById('calculator-content');
    const tabs = document.querySelectorAll('.tab-button');
    

    const panesHTML = {
         'growing': `...`, 'fast': `...`, 'cumulative': `...`
    };

    panesHTML.growing = `
        <div id="calc-growing" class="calculator-pane">
            <p class="pane-description">Программа, где ваша прибыль растет с каждым днем. Чем дольше работают деньги — тем больше они приносят.</p>
            <div class="input-area">
                <div class="input-group">
                    <label for="growing-amount">Сумма вклада</label>
                    <input type="number" id="growing-amount" value="1000" step="100" min="1000">
                </div>
            </div>
            <div class="result-area">
                <div class="result-header"><span>Результат через 6 месяцев</span><h3 id="growing-result-total">1 320.00 ₽</h3></div>
                <div class="progress-bar-viz"><div id="growing-progress-fill" class="progress-bar-fill"></div></div>
                <div class="result-stats">
                    <div class="stat-item"><span>Вклад</span><strong id="growing-investment">1 000.00 ₽</strong></div>
                    <div class="stat-item"><span>Прибыль</span><strong id="growing-profit">+ 320.00 ₽</strong></div>
                    <div class="stat-item"><span>ROI</span><strong id="growing-roi">+32.00%</strong></div>
                </div>
                <button class="btn btn-main-action" data-action="next">Я готов начать!</button>
            </div>
        </div>`;
    panesHTML.fast = `
        <div id="calc-fast" class="calculator-pane">
            <p class="pane-description">Программа для тех, кто хочет получить быстрый результат и увидеть прибыль уже в течение месяца.</p>
            <div class="input-area">
                 <div class="input-group">
                    <label>Сумма старта</label>
                    <div class="radio-options">
                        <label><input type="radio" name="fast-amount" value="3000" checked> <span>3K</span></label>
                        <label><input type="radio" name="fast-amount" value="15000"> <span>15K</span></label>
                        <label><input type="radio" name="fast-amount" value="30000"> <span>30K</span></label>
                    </div>
                </div>
            </div>
            <div class="result-area">
                <div class="result-header"><span>Результат через 30 дней</span><h3 id="fast-result-total">3 600.00 ₽</h3></div>
                <div class="progress-bar-viz"><div id="fast-progress-fill" class="progress-bar-fill"></div></div>
                <div class="result-stats">
                    <div class="stat-item"><span>Вклад</span><strong id="fast-investment">3 000.00 ₽</strong></div>
                    <div class="stat-item"><span>Прибыль</span><strong id="fast-profit">+ 600.00 ₽</strong></div>
                    <div class="stat-item"><span>ROI</span><strong id="fast-roi">+20.00%</strong></div>
                </div>
                 <button class="btn btn-main-action" data-action="next">Я готов начать!</button>
            </div>
        </div>`;
    panesHTML.cumulative = `
        <div id="calc-cumulative" class="calculator-pane">
            <p class="pane-description">Стратегия для создания крупного капитала. Превратите небольшие регулярные взносы в серьезную сумму.</p>
            <div class="input-area">
                <div class="input-group"><label for="cumulative-amount">Ежемесячный вклад</label><input type="number" id="cumulative-amount" value="1000" step="500" min="1000"></div>
                <div class="input-group">
                    <label>Срок</label>
                    <div class="radio-options">
                        <label><input type="radio" name="cumulative-years" value="3" checked> <span>3г</span></label>
                        <label><input type="radio" name="cumulative-years" value="5"> <span>5л</span></label>
                        <label><input type="radio" name="cumulative-years" value="10"> <span>10л</span></label>
                    </div>
                </div>
            </div>
            <div class="result-area">
                 <div class="result-header"><span id="cumulative-result-label">Капитал через 3 года</span><h3 id="cumulative-result-total">180 000 ₽</h3></div>
                 <div class="progress-bar-viz"><div id="cumulative-progress-fill" class="progress-bar-fill"></div></div>
                 <div class="result-stats">
                    <div class="stat-item"><span>Вложено</span><strong id="cumulative-investment">36 000 ₽</strong></div>
                    <div class="stat-item"><span>Прибыль</span><strong id="cumulative-profit">+ 144 000 ₽</strong></div>
                    <div class="stat-item"><span>Множитель</span><strong id="cumulative-roi">x5</strong></div>
                </div>
                 <button class="btn btn-main-action" data-action="next">Я готов начать!</button>
            </div>
        </div>`;

    const fastPotokData = { 3000: 3600, 15000: 16800, 30000: 33300 };
    const cumulativeMultipliers = {
        1000: [5, 8, 16], 2500: [5.25, 8.25, 17], 5000: [5.5, 8.5, 18], 10000: [5.75, 8.75, 19]
    };
    const yearMap = { 3: 0, 5: 1, 10: 2 };
    const formatCurrency = (val, frac = 0) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: frac, maximumFractionDigits: frac }).format(val);

    const calculations = {
        'growing': () => {
            const investment = parseFloat(document.getElementById('growing-amount').value) || 0;
            const total = (investment / 1000) * 1320;
            state.lastCalculation = { name: "'Растущий Поток'", investment: formatCurrency(investment, 2), result: formatCurrency(total, 2) };
            document.getElementById('growing-result-total').textContent = formatCurrency(total, 2);
            document.getElementById('growing-investment').textContent = formatCurrency(investment, 2);
            document.getElementById('growing-profit').textContent = `+ ${formatCurrency(total - investment, 2)}`;
            document.getElementById('growing-roi').textContent = `+${((total - investment) / investment * 100).toFixed(2)}%`;
            document.getElementById('growing-progress-fill').style.width = `${Math.min(((total - investment) / investment * 100), 100)}%`;
        },
        'fast': () => {
            const investment = parseFloat(document.querySelector('input[name="fast-amount"]:checked').value);
            const total = fastPotokData[investment] || 0;
            state.lastCalculation = { name: "'Быстрый Поток'", investment: formatCurrency(investment, 2), result: formatCurrency(total, 2) };
            document.getElementById('fast-result-total').textContent = formatCurrency(total, 2);
            document.getElementById('fast-investment').textContent = formatCurrency(investment, 2);
            document.getElementById('fast-profit').textContent = `+ ${formatCurrency(total - investment, 2)}`;
            document.getElementById('fast-roi').textContent = `+${((total - investment) / investment * 100).toFixed(2)}%`;
            document.getElementById('fast-progress-fill').style.width = `${Math.min(((total - investment) / investment * 100), 100)}%`;
        },
        'cumulative': () => {
            const amount = parseFloat(document.getElementById('cumulative-amount').value) || 0;
            const years = parseInt(document.querySelector('input[name="cumulative-years"]:checked').value, 10);
            const yearIndex = yearMap[years];
            const amountKey = Object.keys(cumulativeMultipliers).reverse().find(key => amount >= key) || 1000;
            const multiplier = cumulativeMultipliers[amountKey][yearIndex];
            const investment = amount * years * 12;
            const total = investment * multiplier;
            state.lastCalculation = { name: "'Накопительный Поток'", investment: formatCurrency(investment), result: formatCurrency(total) };
            const yearText = (years === 1) ? 'год' : (years < 5 ? 'года' : 'лет');
            document.getElementById('cumulative-result-label').textContent = `Капитал через ${years} ${yearText}`;
            document.getElementById('cumulative-result-total').textContent = formatCurrency(total);
            document.getElementById('cumulative-investment').textContent = formatCurrency(investment);
            document.getElementById('cumulative-profit').textContent = `+ ${formatCurrency(total - investment)}`;
            document.getElementById('cumulative-roi').textContent = `x${multiplier}`;
            document.getElementById('cumulative-progress-fill').style.width = '100%';
        }
    };
    
    const renderSavedPlans = () => {
        const savedPlansContainer = document.getElementById('saved-plans-container');
        if (!savedPlansContainer) return;
        savedPlansContainer.innerHTML = '';
        if (state.savedPlans.length === 0) return;
        
        state.savedPlans.forEach((plan, index) => {
            const planEl = document.createElement('div');
            planEl.className = 'saved-plan';
            planEl.innerHTML = `<div class="saved-plan-info"><strong>${plan.name}</strong>: ${plan.summary}</div>
                              <div class="saved-plan-actions"><button data-delete-id="${index}">❌</button></div>`;
            savedPlansContainer.appendChild(planEl);
        });
    };
    
    document.body.addEventListener('click', e => {
        if (e.target && e.target.closest('#saved-plans-container') && e.target.dataset.deleteId) {
            state.savedPlans.splice(e.target.dataset.deleteId, 1);
            localStorage.setItem('savedPlans', JSON.stringify(state.savedPlans));
            renderSavedPlans();
        }
    });
    
    const setupCalculator = (type) => {
        if (!panesHTML[type]) return;
        
        calculatorContent.innerHTML = panesHTML[type];
        calculations[type]();
        
        const pane = calculatorContent.querySelector('.calculator-pane');
        pane.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                if(state.isInitialLoad) {
                    showAchievement('first_calc', '💡', 'Достижение открыто!', 'Первый расчет');
                    state.isInitialLoad = false;
                }
                calculations[type]();
            });
        });

        // === ИЗМЕНЕНИЕ ЗДЕСЬ: Назначаем переход на финальный экран на новую кнопку ===
        const nextBtn = pane.querySelector('[data-action="next"]');
        nextBtn.addEventListener('click', () => {
            renderFinalSummary();
            showScreen('final-screen', 4);
        });
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetType = tab.dataset.target;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            state.visitedTabs.add(targetType);
            if(state.visitedTabs.size === 3) {
                 showAchievement('strategist', '🧠', 'Достижение открыто!', 'Стратег');
            }
            
            setupCalculator(targetType);
        });
    });

    document.querySelectorAll('.archetype-card').forEach(card => {
        card.addEventListener('click', (e) => {
            state.archetype = e.currentTarget.dataset.archetype;
            showScreen('benefits-screen', 2);
        });
    });

    document.getElementById('to-calculator-btn').addEventListener('click', () => {
        const targetTab = document.querySelector(`.tab-button[data-target="${state.archetype}"]`);
        if (targetTab) {
            tabs.forEach(t => t.classList.remove('active'));
            targetTab.classList.add('active');
        }
        setupCalculator(state.archetype);
        renderSavedPlans();
        showScreen('calculator-screen', 3);
    });
    
    // === ИЗМЕНЕНИЕ ЗДЕСЬ: Эта кнопка теперь сохраняет план ===
    document.getElementById('save-plan-btn').addEventListener('click', () => {
        const activeTab = document.querySelector('.tab-button.active');
        if (!activeTab) return;
        const type = activeTab.dataset.target;
        
        let plan = { type, name: '', summary: '' };
        if (type === 'fast') {
            const investment = document.querySelector('input[name="fast-amount"]:checked').value;
            plan.name = 'Быстрый';
            plan.summary = `${formatCurrency(investment)} → ${formatCurrency(fastPotokData[investment])}`;
        } else if (type === 'growing') {
             const investment = document.getElementById('growing-amount').value;
             const total = (investment / 1000) * 1320;
             plan.name = 'Растущий';
             plan.summary = `${formatCurrency(investment)} → ${formatCurrency(total)}`;
        } else if (type === 'cumulative') {
             const investment = document.getElementById('cumulative-amount').value;
             const years = document.querySelector('input[name="cumulative-years"]:checked').value;
             plan.name = 'Накопительный';
             plan.summary = `${formatCurrency(investment)}/мес на ${years}г`;
        }

        if (state.savedPlans.length < 3) {
            state.savedPlans.push(plan);
            localStorage.setItem('savedPlans', JSON.stringify(state.savedPlans));
            renderSavedPlans();
            showAchievement('saver', '💾', 'Достижение открыто!', 'План сохранен');
        } else {
             showAchievement('plan_limit', '⚠️', 'Достижение открыто!', 'Можно сохранить до 3 планов');
        }
    });

    setupCalculator(state.archetype);
});