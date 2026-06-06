/*! ==============================================
   DateTimePicker v1.3.0
   自定义日期时间选择器 - 独立可复用模块
   依赖: DateTimePicker.css (样式)
   兼容: IE11+ / Chrome / Firefox / Safari / Edge
   新增: i18n国际化 | ES Module导出 | 内存泄漏修复 | 日历滚轮切换 | minDate/maxDate | disabled | ARIA
   ============================================== */

(function (global, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory();
        module.exports.default = module.exports;
    } else {
        global.DateTimePicker = factory();
        if (global.DateTimePicker) {
            global.DateTimePicker.default = global.DateTimePicker;
        }
    }
}(typeof window !== 'undefined' ? window : this, function () {
    'use strict';

    var _instances = {};
    var _instanceId = 0;
    var _bodyClickHandler = null;
    var _listenerRefCount = 0;
    var _lastFocusedPicker = null;

    /* ================================================
       默认国际化文案（中文）
       可通过 options.locale 按字段覆盖
       ================================================ */
    var DEFAULT_LOCALE = {
        weekdays: ['日', '一', '二', '三', '四', '五', '六'],
        months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        today: '今天',
        clear: '清除',
        confirm: '确定',
        cancel: '取消',
        placeholder: '请选择日期时间',
        datePlaceholder: '请选择日期',
        yearSuffix: '年',
        monthSuffix: '月'
    };

    var DEFAULT_OPTIONS = {
        format: 'YYYY-MM-DD HH:mm',
        placeholder: DEFAULT_LOCALE.placeholder,
        minuteStep: 1,
        zIndex: 1003,
        disabled: false,
        minDate: null,
        maxDate: null
    };

    function pad(n) {
        return n < 10 ? '0' + n : '' + n;
    }

    function isInvalidDate(d) {
        return !d || isNaN(d.getTime());
    }

    function parseDate(val) {
        if (!val) return null;
        var d = new Date(val);
        return isInvalidDate(d) ? null : d;
    }

    function formatDateTime(dateObj, fmt) {
        if (!dateObj) return '';
        var y = dateObj.getFullYear();
        var M = pad(dateObj.getMonth() + 1);
        var d = pad(dateObj.getDate());
        var h = pad(dateObj.getHours());
        var m = pad(dateObj.getMinutes());
        var s = pad(dateObj.getSeconds());
        return fmt
            .replace('YYYY', y)
            .replace('MM', M)
            .replace('DD', d)
            .replace('HH', h)
            .replace('mm', m)
            .replace('ss', s);
    }

    function DateTimePicker(selectorOrEl, options) {
        if (!(this instanceof DateTimePicker)) {
            return new DateTimePicker(selectorOrEl, options);
        }

        this._id = ++_instanceId;
        this._options = extend({}, DEFAULT_OPTIONS, options || {});

        // 国际化: 浅合并 locale，支持按需覆盖任意字段
        this._options.locale = extend({}, DEFAULT_LOCALE, (options && options.locale) || {});

        this._value = null;
        this._tempDate = null;
        this._calendarYear = null;
        this._calendarMonth = null;
        this._calendarMode = 'day';
        this._timeMenuOpen = null;
        this._minDate = parseDate(this._options.minDate);
        this._maxDate = parseDate(this._options.maxDate);

        this._initDom(selectorOrEl);
        this._bindEvents();
        this._setValue(this._nativeInput.value || '');

        _instances[this._id] = this;
        this._installGlobalListener();
    }

    function extend(target) {
        for (var i = 1; i < arguments.length; i++) {
            var src = arguments[i];
            if (src) {
                for (var key in src) {
                    if (src.hasOwnProperty(key)) {
                        target[key] = src[key];
                    }
                }
            }
        }
        return target;
    }

    DateTimePicker.prototype = {
        constructor: DateTimePicker,

        /* ========== DOM 构建 ========== */
        _initDom: function (selectorOrEl) {
            var self = this;
            var locale = self._options.locale;
            var nativeInput;

            if (typeof selectorOrEl === 'string') {
                nativeInput = document.querySelector(selectorOrEl);
            } else {
                nativeInput = selectorOrEl;
            }

            if (!nativeInput) {
                throw new Error('DateTimePicker: 目标元素不存在 - ' + selectorOrEl);
            }

            var wrapper = document.createElement('div');
            wrapper.className = 'dtp-wrapper';

            var customInput = document.createElement('div');
            customInput.className = 'dtp-input dtp-placeholder';
            customInput.tabIndex = self._options.disabled ? -1 : 0;
            customInput.textContent = self._options.placeholder || locale.placeholder;
            customInput.setAttribute('role', 'combobox');
            customInput.setAttribute('aria-haspopup', 'dialog');
            customInput.setAttribute('aria-expanded', 'false');
            customInput.setAttribute('aria-label', self._options.placeholder || locale.placeholder);

            if (self._options.disabled) {
                wrapper.classList.add('dtp-disabled');
                customInput.setAttribute('aria-disabled', 'true');
            }

            nativeInput.type = nativeInput.type || 'datetime-local';
            nativeInput.className = nativeInput.className + ' dtp-native-input';
            nativeInput.readOnly = true;

            var panel = document.createElement('div');
            panel.className = 'dtp-panel';

            var mainSection = document.createElement('div');
            mainSection.className = 'dtp-main-section';

            var dateInput = document.createElement('div');
            dateInput.className = 'dtp-date-input';

            var dateDisplay = document.createElement('span');
            dateDisplay.className = 'dtp-date-display';
            dateDisplay.textContent = locale.datePlaceholder;

            var calendarIcon = document.createElement('span');
            calendarIcon.className = 'dtp-calendar-icon';
            calendarIcon.textContent = '📅';

            dateInput.appendChild(dateDisplay);
            dateInput.appendChild(calendarIcon);

            var timeSection = document.createElement('div');
            timeSection.className = 'dtp-time-section';

            var hourPicker = document.createElement('div');
            hourPicker.className = 'dtp-time-picker';

            var hourValue = document.createElement('div');
            hourValue.className = 'dtp-time-value';
            hourValue.id = 'dtp-hour-value-' + self._id;
            hourValue.textContent = '--';

            var hourScroll = document.createElement('div');
            hourScroll.className = 'dtp-time-scroll';

            hourPicker.appendChild(hourValue);
            hourPicker.appendChild(hourScroll);

            var separator = document.createElement('div');
            separator.className = 'dtp-time-separator';
            separator.textContent = ':';

            var minutePicker = document.createElement('div');
            minutePicker.className = 'dtp-time-picker';

            var minuteValue = document.createElement('div');
            minuteValue.className = 'dtp-time-value';
            minuteValue.id = 'dtp-minute-value-' + self._id;
            minuteValue.textContent = '--';

            var minuteScroll = document.createElement('div');
            minuteScroll.className = 'dtp-time-scroll';

            minutePicker.appendChild(minuteValue);
            minutePicker.appendChild(minuteScroll);

            timeSection.appendChild(hourPicker);
            timeSection.appendChild(separator);
            timeSection.appendChild(minutePicker);

            mainSection.appendChild(dateInput);
            mainSection.appendChild(timeSection);

            var buttonSection = document.createElement('div');
            buttonSection.className = 'dtp-button-section';

            var cancelBtn = document.createElement('button');
            cancelBtn.className = 'dtp-btn dtp-btn--cancel';
            cancelBtn.type = 'button';
            cancelBtn.textContent = locale.cancel;

            var confirmBtn = document.createElement('button');
            confirmBtn.className = 'dtp-btn dtp-btn--confirm';
            confirmBtn.type = 'button';
            confirmBtn.textContent = locale.confirm;

            buttonSection.appendChild(cancelBtn);
            buttonSection.appendChild(confirmBtn);

            panel.appendChild(mainSection);
            panel.appendChild(buttonSection);

            var calendarPanel = document.createElement('div');
            calendarPanel.className = 'dtp-calendar-panel';

            wrapper.appendChild(customInput);
            wrapper.appendChild(panel);
            wrapper.appendChild(calendarPanel);

            nativeInput.parentNode.insertBefore(wrapper, nativeInput);
            wrapper.insertBefore(nativeInput, customInput);

            this._wrapper = wrapper;
            this._nativeInput = nativeInput;
            this._customInput = customInput;
            this._panel = panel;
            this._dateDisplay = dateDisplay;
            this._hourValue = hourValue;
            this._minuteValue = minuteValue;
            this._hourScroll = hourScroll;
            this._minuteScroll = minuteScroll;
            this._calendarPanel = calendarPanel;
            this._dateInput = dateInput;
            this._confirmBtn = confirmBtn;
            this._cancelBtn = cancelBtn;
        },

        /* ========== 事件绑定 ========== */
        _bindEvents: function () {
            var self = this;

            this._customInput.addEventListener('click', function (e) {
                e.stopPropagation();
                if (self._isDisabled()) return;
                _lastFocusedPicker = self;
                self._toggleDropDown();
            });

            this._confirmBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                self._confirm();
            });

            this._cancelBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                self._cancel();
            });

            this._dateInput.addEventListener('click', function (e) {
                e.stopPropagation();
                if (self._isDisabled()) return;
                self._showCalendar();
            });

            this._hourValue.addEventListener('click', function (e) {
                e.stopPropagation();
                if (self._isDisabled()) return;
                _lastFocusedPicker = self;
                self._toggleTimeScroll('hour');
            });

            this._minuteValue.addEventListener('click', function (e) {
                e.stopPropagation();
                if (self._isDisabled()) return;
                _lastFocusedPicker = self;
                self._toggleTimeScroll('minute');
            });

            this._hourValue.addEventListener('dblclick', function (e) {
                e.stopPropagation();
                if (self._isDisabled()) return;
                self._startTimeEdit('hour');
            });

            this._minuteValue.addEventListener('dblclick', function (e) {
                e.stopPropagation();
                if (self._isDisabled()) return;
                self._startTimeEdit('minute');
            });

            // 日历面板滚轮切换月份/年份
            this._calendarPanel.addEventListener('wheel', function (e) {
                if (!self._calendarPanel.classList.contains('dtp-open')) return;
                e.preventDefault();
                e.stopPropagation();
                self._calendarNav(e.deltaY > 0 ? 1 : -1);
            });
        },

        _installGlobalListener: function () {
            if (_bodyClickHandler) {
                _listenerRefCount++;
                return;
            }
            _listenerRefCount = 1;
            _bodyClickHandler = function (e) {
                var target = e.target;
                for (var id in _instances) {
                    if (!_instances.hasOwnProperty(id)) continue;
                    var inst = _instances[id];
                    var inWrapper = inst._wrapper.contains(target);
                    var inCalendar = inst._calendarPanel.contains(target);
                    var inTimeScroll = (inst._hourScroll.contains(target) || inst._minuteScroll.contains(target));
                    if (!inWrapper && !inCalendar && !inTimeScroll) {
                        inst._closeAll();
                    }
                }
            };
            document.addEventListener('click', _bodyClickHandler);
        },

        _uninstallGlobalListener: function () {
            if (_listenerRefCount <= 0) return;
            _listenerRefCount--;
            if (_listenerRefCount === 0 && _bodyClickHandler) {
                document.removeEventListener('click', _bodyClickHandler);
                _bodyClickHandler = null;
            }
        },

        /* ========== 面板显隐 ========== */
        _toggleDropDown: function () {
            if (this._panel.classList.contains('dtp-open')) {
                this._closeAll();
            } else {
                this._openDropDown();
            }
        },

        _openDropDown: function () {
            var panel = this._panel;
            panel.classList.add('dtp-open');
            this._customInput.setAttribute('aria-expanded', 'true');
            this._positionPanel(panel);
            this._initTempDate();
            this._buildHourScroll();
            this._buildMinuteScroll();
            this._calendarPanel.classList.remove('dtp-open');
        },

        _closeAll: function () {
            this._panel.classList.remove('dtp-open');
            this._calendarPanel.classList.remove('dtp-open');
            this._customInput.setAttribute('aria-expanded', 'false');
            this._closeTimeScrolls();
            this._timeMenuOpen = null;
            this._calendarMode = 'day';
        },

        _positionPanel: function (panel) {
            this._smartPosition(panel, 160, 'dtp-panel--fixed');
        },

        _smartPosition: function (el, defaultHeight, fixedClass) {
            var rect = this._wrapper.getBoundingClientRect();
            var elHeight = el.offsetHeight || defaultHeight;
            var spaceBelow = window.innerHeight - rect.bottom;
            var spaceAbove = rect.top;

            el.classList.remove(fixedClass);

            if (spaceBelow < elHeight + 10 && spaceAbove > elHeight + 10) {
                el.style.top = 'auto';
                el.style.bottom = (rect.height + 4) + 'px';
                el.style.left = '';
                el.style.transform = '';
            } else if (spaceBelow < elHeight + 10 && spaceAbove <= elHeight + 10) {
                el.classList.add(fixedClass);
                el.style.top = '50%';
                el.style.left = '50%';
                el.style.transform = 'translate(-50%, -50%)';
                el.style.bottom = 'auto';
            } else {
                el.style.top = '100%';
                el.style.bottom = 'auto';
                el.style.transform = '';
                el.style.left = '';
            }
        },

        _isDisabled: function () {
            return this._options.disabled;
        },

        _isDateInRange: function (d) {
            if (!d) return false;
            if (this._minDate) {
                var minStart = new Date(this._minDate.getFullYear(), this._minDate.getMonth(), this._minDate.getDate());
                if (d < minStart) return false;
            }
            if (this._maxDate) {
                var maxEnd = new Date(this._maxDate.getFullYear(), this._maxDate.getMonth(), this._maxDate.getDate(), 23, 59, 59, 999);
                if (d > maxEnd) return false;
            }
            return true;
        },

        /* ========== 值管理 ========== */
        _initTempDate: function () {
            this._tempDate = this._value ? new Date(this._value.getTime()) : new Date();
            this._updateDisplay();
        },

        _setValue: function (val) {
            var locale = this._options.locale;
            if (val) {
                var d = new Date(val);
                if (!isNaN(d.getTime())) {
                    this._value = d;
                    this._tempDate = new Date(d.getTime());
                    this._customInput.textContent = formatDateTime(d, this._options.format);
                    this._customInput.classList.remove('dtp-placeholder');
                    this._dateDisplay.textContent = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
                    this._hourValue.textContent = pad(d.getHours());
                    this._minuteValue.textContent = pad(d.getMinutes());
                    this._nativeInput.value = formatDateTime(d, 'YYYY-MM-DDTHH:mm');
                    this._calendarYear = d.getFullYear();
                    this._calendarMonth = d.getMonth();
                }
            } else {
                this._value = null;
                this._customInput.textContent = this._options.placeholder || locale.placeholder;
                this._customInput.classList.add('dtp-placeholder');
                this._dateDisplay.textContent = locale.datePlaceholder;
                this._hourValue.textContent = '--';
                this._minuteValue.textContent = '--';
                this._nativeInput.value = '';
            }
        },

        _confirm: function () {
            if (!this._tempDate) return;
            var formatted = formatDateTime(this._tempDate, this._options.format);
            this._nativeInput.value = formatDateTime(this._tempDate, 'YYYY-MM-DDTHH:mm');
            this._setValue(formatted);
            this._closeAll();

            var event;
            if (typeof Event === 'function') {
                event = new Event('change', { bubbles: true });
            } else {
                event = document.createEvent('Event');
                event.initEvent('change', true, true);
            }
            this._nativeInput.dispatchEvent(event);
            if (this._options.onChange) {
                this._options.onChange(this.getValue(), this);
            }
        },

        _cancel: function () {
            this._setValue(this._value ? this._value : '');
            this._closeAll();
        },

        _updateDisplay: function () {
            if (!this._tempDate) return;
            var d = this._tempDate;
            this._dateDisplay.textContent = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
            this._hourValue.textContent = pad(d.getHours());
            this._minuteValue.textContent = pad(d.getMinutes());
        },

        /* ========== 时间滚轮 ========== */
        _closeTimeScrolls: function () {
            var scrolls = [this._hourScroll, this._minuteScroll];
            for (var i = 0; i < scrolls.length; i++) {
                var s = scrolls[i];
                s.style.display = 'none';
                s.classList.remove('dtp-time-scroll--fixed');
            }
            this._timeMenuOpen = null;
        },

        _toggleTimeScroll: function (type) {
            var self = this;
            if (this._timeMenuOpen === type) {
                this._closeTimeScrolls();
                return;
            }
            this._closeTimeScrolls();
            this._timeMenuOpen = type;
            var scroll = type === 'hour' ? this._hourScroll : this._minuteScroll;
            this._buildTimeScroll(type);
            scroll.style.display = 'block';
            this._positionTimeScroll(scroll, type);
            setTimeout(function () {
                self._scrollToSelected(scroll, type);
            }, 0);
        },

        _positionTimeScroll: function (scroll) {
            this._smartPosition(scroll, 160, 'dtp-time-scroll--fixed');
        },

        _buildTimeScroll: function (type) {
            var self = this;
            var scroll = type === 'hour' ? this._hourScroll : this._minuteScroll;
            var max = type === 'hour' ? 24 : 60;
            var step = type === 'hour' ? 1 : this._options.minuteStep || 1;
            scroll.innerHTML = '';

            var selected = type === 'hour'
                ? parseInt(this._hourValue.textContent) || 0
                : parseInt(this._minuteValue.textContent) || 0;

            var nearest = Math.round(selected / step) * step;
            if (nearest >= max) nearest = max - step;

            for (var i = 0; i < max; i += step) {
                var opt = document.createElement('div');
                opt.className = 'dtp-time-option';
                var label = pad(i);
                opt.textContent = label;
                if (i === nearest) {
                    opt.classList.add('dtp-time-option--selected');
                }
                opt.addEventListener('click', (function (val) {
                    return function (e) {
                        e.stopPropagation();
                        if (type === 'hour') {
                            self._setHour(val);
                        } else {
                            self._setMinute(val);
                        }
                        self._closeTimeScrolls();
                    };
                })(i));
                scroll.appendChild(opt);
            }
        },

        _buildHourScroll: function () {
            this._buildTimeScroll('hour');
        },

        _buildMinuteScroll: function () {
            this._buildTimeScroll('minute');
        },

        _scrollToSelected: function (scroll, type) {
            var val = type === 'hour'
                ? parseInt(this._hourValue.textContent) || 0
                : parseInt(this._minuteValue.textContent) || 0;
            var step = type === 'hour' ? 1 : this._options.minuteStep || 1;
            var idx = Math.floor(val / step);
            var children = scroll.children;
            if (children.length > 0 && idx < children.length) {
                var selected = children[idx];
                if (selected) {
                    scroll.scrollTop = selected.offsetTop - scroll.offsetHeight / 2 + selected.offsetHeight / 2;
                }
            }
        },

        _setHour: function (h) {
            if (isNaN(h) || h < 0 || h > 23) return;
            if (!this._tempDate) this._initTempDate();
            this._tempDate.setHours(h);
            this._hourValue.textContent = pad(h);
        },

        _setMinute: function (m) {
            if (isNaN(m) || m < 0 || m > 59) return;
            if (!this._tempDate) this._initTempDate();
            this._tempDate.setMinutes(m);
            this._minuteValue.textContent = pad(m);
        },

        /* ========== 时间键盘编辑 ========== */
        _startTimeEdit: function (type) {
            var self = this;
            var valueEl = type === 'hour' ? this._hourValue : this._minuteValue;
            var inputEl = document.createElement('input');
            inputEl.className = 'dtp-time-edit-input';
            inputEl.value = valueEl.textContent;

            valueEl.textContent = '';
            valueEl.appendChild(inputEl);
            inputEl.focus();
            inputEl.select();

            var commit = function () {
                var val = parseInt(inputEl.value) || 0;
                inputEl.remove();
                if (type === 'hour') {
                    self._setHour(Math.min(23, Math.max(0, val)));
                } else {
                    self._setMinute(Math.min(59, Math.max(0, val)));
                }
                valueEl.textContent = type === 'hour'
                    ? self._hourValue.textContent
                    : self._minuteValue.textContent;
            };

            inputEl.addEventListener('blur', commit);
            inputEl.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    commit();
                } else if (e.key === 'Escape') {
                    inputEl.remove();
                    valueEl.textContent = type === 'hour'
                        ? pad(self._tempDate ? self._tempDate.getHours() : 0)
                        : pad(self._tempDate ? self._tempDate.getMinutes() : 0);
                }
            });
        },

        /* ========== 日历面板 ========== */
        _showCalendar: function () {
            var self = this;
            if (!this._tempDate) this._initTempDate();
            this._calendarYear = this._tempDate.getFullYear();
            this._calendarMonth = this._tempDate.getMonth();
            this._calendarMode = 'day';
            this._closeTimeScrolls();
            this._renderCalendar();
            this._calendarPanel.classList.add('dtp-open');
            this._positionCalendar();
        },

        _positionCalendar: function () {
            this._smartPosition(this._calendarPanel, 300, 'dtp-calendar-panel--fixed');
        },

        _renderCalendar: function () {
            var self = this;
            var locale = self._options.locale;
            var calPanel = this._calendarPanel;
            calPanel.innerHTML = '';

            var header = document.createElement('div');
            header.className = 'dtp-calendar-header';

            var monthNav = document.createElement('div');
            monthNav.className = 'dtp-month-nav';

            var prevBtn = document.createElement('button');
            prevBtn.type = 'button';
            prevBtn.className = 'dtp-today-btn';
            prevBtn.textContent = '<';
            prevBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                self._calendarNav(-1);
            });

            var monthYearDisplay = document.createElement('span');
            monthYearDisplay.className = 'dtp-month-year-display';
            monthYearDisplay.textContent = self._calendarYear + locale.yearSuffix + ' ' + pad(self._calendarMonth + 1) + locale.monthSuffix;
            monthYearDisplay.addEventListener('click', function (e) {
                e.stopPropagation();
                self._calendarMode = 'month';
                self._renderCalendar();
            });

            var nextBtn = document.createElement('button');
            nextBtn.type = 'button';
            nextBtn.className = 'dtp-today-btn';
            nextBtn.textContent = '>';
            nextBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                self._calendarNav(1);
            });

            monthNav.appendChild(prevBtn);
            monthNav.appendChild(monthYearDisplay);
            monthNav.appendChild(nextBtn);

            var todayBtn = document.createElement('button');
            todayBtn.type = 'button';
            todayBtn.className = 'dtp-today-btn';
            todayBtn.textContent = locale.today;
            todayBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                self._gotoToday();
            });

            header.appendChild(monthNav);
            header.appendChild(todayBtn);

            calPanel.appendChild(header);

            /* ---- 根据模式渲染内容 ---- */
            if (this._calendarMode === 'day') {
                this._renderDayView(calPanel);
            } else if (this._calendarMode === 'month') {
                this._renderMonthView(calPanel);
            } else if (this._calendarMode === 'year') {
                this._renderYearView(calPanel);
            }

            var clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.className = 'dtp-clear-btn';
            clearBtn.textContent = locale.clear;
            clearBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                self._clearDate();
            });
            calPanel.appendChild(clearBtn);
        },

        _renderDayView: function (container) {
            var self = this;
            var locale = self._options.locale;
            var weekHeader = document.createElement('div');
            weekHeader.className = 'dtp-week-header';
            for (var i = 0; i < 7; i++) {
                var cell = document.createElement('div');
                cell.className = 'dtp-weekday-cell';
                cell.textContent = locale.weekdays[i];
                weekHeader.appendChild(cell);
            }
            container.appendChild(weekHeader);

            var grid = document.createElement('div');
            grid.classList.add('dtp-calendar-grid');
            grid.classList.remove('dtp-calendar-grid--4col');

            var firstDay = new Date(this._calendarYear, this._calendarMonth, 1).getDay();
            var daysInMonth = new Date(this._calendarYear, this._calendarMonth + 1, 0).getDate();
            var daysInPrevMonth = new Date(this._calendarYear, this._calendarMonth, 0).getDate();
            var today = new Date();
            var selectedDate = this._tempDate ? this._tempDate.getDate() : -1;
            var selectedMonth = this._tempDate ? this._tempDate.getMonth() : -1;
            var selectedYear = this._tempDate ? this._tempDate.getFullYear() : -1;

            for (var d = firstDay - 1; d >= 0; d--) {
                var dayCell = document.createElement('div');
                dayCell.className = 'dtp-day-cell dtp-day-cell--other-month';
                dayCell.textContent = daysInPrevMonth - d;
                grid.appendChild(dayCell);
            }

            for (var day = 1; day <= daysInMonth; day++) {
                var dayCell = document.createElement('div');
                dayCell.className = 'dtp-day-cell';
                dayCell.textContent = day;

                if (today.getFullYear() === this._calendarYear &&
                    today.getMonth() === this._calendarMonth &&
                    today.getDate() === day) {
                    dayCell.classList.add('dtp-day-cell--today');
                }

                if (day === selectedDate &&
                    this._calendarMonth === selectedMonth &&
                    this._calendarYear === selectedYear) {
                    dayCell.classList.add('dtp-day-cell--selected');
                }

                var checkDate = new Date(this._calendarYear, this._calendarMonth, day);
                if (!self._isDateInRange(checkDate)) {
                    dayCell.classList.add('dtp-day-cell--disabled');
                }

                (function (d) {
                    dayCell.addEventListener('click', function (e) {
                        e.stopPropagation();
                        self._selectDay(d);
                    });
                })(day);

                grid.appendChild(dayCell);
            }

            var remaining = 42 - firstDay - daysInMonth;
            if (remaining > 0) {
                for (var nd = 1; nd <= remaining; nd++) {
                    var dayCell = document.createElement('div');
                    dayCell.className = 'dtp-day-cell dtp-day-cell--other-month';
                    dayCell.textContent = nd;
                    grid.appendChild(dayCell);
                }
            }

            container.appendChild(grid);
        },

        _renderMonthView: function (container) {
            var self = this;
            var locale = self._options.locale;
            var grid = document.createElement('div');
            grid.className = 'dtp-calendar-grid dtp-calendar-grid--4col';

            for (var m = 0; m < 12; m++) {
                var cell = document.createElement('div');
                cell.className = 'dtp-month-cell';
                cell.textContent = locale.months[m];
                if (m === this._calendarMonth) {
                    cell.classList.add('dtp-month-cell--selected');
                }
                (function (month) {
                    cell.addEventListener('click', function (e) {
                        e.stopPropagation();
                        self._calendarMonth = month;
                        self._calendarMode = 'day';
                        self._renderCalendar();
                    });
                })(m);
                grid.appendChild(cell);
            }
            container.appendChild(grid);
        },

        _renderYearView: function (container) {
            var self = this;
            var grid = document.createElement('div');
            grid.className = 'dtp-calendar-grid dtp-calendar-grid--4col';

            var baseYear = Math.floor(this._calendarYear / 10) * 10;
            for (var y = baseYear - 1; y < baseYear + 11; y++) {
                var cell = document.createElement('div');
                cell.className = 'dtp-year-cell';
                cell.textContent = y;
                if (y === this._calendarYear) {
                    cell.classList.add('dtp-year-cell--selected');
                }
                (function (year) {
                    cell.addEventListener('click', function (e) {
                        e.stopPropagation();
                        self._calendarYear = year;
                        self._calendarMode = 'month';
                        self._renderCalendar();
                    });
                })(y);
                grid.appendChild(cell);
            }
            container.appendChild(grid);
        },

        _selectDay: function (day) {
            if (!this._tempDate) return;
            var checkDate = new Date(this._calendarYear, this._calendarMonth, day);
            if (!this._isDateInRange(checkDate)) return;
            this._tempDate.setFullYear(this._calendarYear);
            this._tempDate.setMonth(this._calendarMonth);
            this._tempDate.setDate(day);
            this._calendarMode = 'day';
            this._updateDisplay();
            this._calendarPanel.classList.remove('dtp-open');
        },

        _calendarNav: function (delta) {
            if (this._calendarMode === 'day') {
                this._calendarMonth += delta;
                if (this._calendarMonth < 0) {
                    this._calendarMonth = 11;
                    this._calendarYear--;
                } else if (this._calendarMonth > 11) {
                    this._calendarMonth = 0;
                    this._calendarYear++;
                }
            } else if (this._calendarMode === 'month') {
                this._calendarYear += delta;
            } else if (this._calendarMode === 'year') {
                this._calendarYear += delta * 10;
            }
            this._renderCalendar();
        },

        _gotoToday: function () {
            var today = new Date();
            if (!this._tempDate) this._initTempDate();
            this._tempDate.setFullYear(today.getFullYear());
            this._tempDate.setMonth(today.getMonth());
            this._tempDate.setDate(today.getDate());
            this._calendarYear = today.getFullYear();
            this._calendarMonth = today.getMonth();
            this._calendarMode = 'day';
            this._updateDisplay();
            this._renderCalendar();
        },

        _clearDate: function () {
            var locale = this._options.locale;
            this._tempDate = null;
            this._dateDisplay.textContent = locale.datePlaceholder;
            this._hourValue.textContent = '--';
            this._minuteValue.textContent = '--';
            this._renderCalendar();
        },

        /* ========== 公开 API ========== */
        getValue: function () {
            return this._value ? formatDateTime(this._value, this._options.format) : '';
        },

        setValue: function (val) {
            this._setValue(val);
        },

        getDate: function () {
            return this._value ? new Date(this._value.getTime()) : null;
        },

        setDate: function (date) {
            this._setValue(date);
            return this;
        },

        clear: function () {
            this._setValue('');
            return this;
        },

        getElement: function () {
            return this._nativeInput;
        },

        getWrapper: function () {
            return this._wrapper;
        },

        open: function () {
            this._openDropDown();
            return this;
        },

        close: function () {
            this._closeAll();
            return this;
        },

        destroy: function () {
            this._closeAll();
            delete _instances[this._id];
            if (this._wrapper && this._wrapper.parentNode) {
                this._wrapper.parentNode.insertBefore(this._nativeInput, this._wrapper);
                this._wrapper.parentNode.removeChild(this._wrapper);
            }
            this._nativeInput.classList.remove('dtp-native-input');
            this._nativeInput.readOnly = false;

            // 引用计数归零时移除全局监听
            this._uninstallGlobalListener();
        }
    };

    /* ========== 静态方法 ========== */
    DateTimePicker.version = '1.3.0';

    DateTimePicker.initAll = function (options) {
        var inputs = document.querySelectorAll('input[type="datetime-local"]');
        var pickers = [];
        for (var i = 0; i < inputs.length; i++) {
            if (!inputs[i].classList.contains('dtp-native-input')) {
                pickers.push(new DateTimePicker(inputs[i], options));
            }
        }
        return pickers;
    };

    DateTimePicker.getInstances = function () {
        var result = [];
        for (var id in _instances) {
            if (_instances.hasOwnProperty(id)) {
                result.push(_instances[id]);
            }
        }
        return result;
    };

    /* ========== 国际化静态方法 ========== */

    DateTimePicker.getDefaultLocale = function () {
        return extend({}, DEFAULT_LOCALE);
    };

    DateTimePicker.setDefaultLocale = function (localeOverride) {
        if (localeOverride) {
            extend(DEFAULT_LOCALE, localeOverride);
            if (localeOverride.placeholder) {
                DEFAULT_OPTIONS.placeholder = localeOverride.placeholder;
            }
        }
    };

    return DateTimePicker;
}));