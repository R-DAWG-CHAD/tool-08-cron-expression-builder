document.addEventListener('DOMContentLoaded', () => {
  const frequencyPreset = document.getElementById('frequencyPreset');
  const fieldMinute = document.getElementById('fieldMinute');
  const fieldHour = document.getElementById('fieldHour');
  const fieldDayMonth = document.getElementById('fieldDayMonth');
  const fieldMonth = document.getElementById('fieldMonth');
  const fieldDayWeek = document.getElementById('fieldDayWeek');
  const commandInput = document.getElementById('commandInput');

  const cronExpressionDisplay = document.getElementById('cronExpressionDisplay');
  const humanTranslation = document.getElementById('humanTranslation');
  const crontabLine = document.getElementById('crontabLine');
  const executionList = document.getElementById('executionList');
  const btnCopyCron = document.getElementById('btnCopyCron');
  const btnCopyLine = document.getElementById('btnCopyLine');

  function updateCron() {
    const min = fieldMinute.value.trim() || '*';
    const hr = fieldHour.value.trim() || '*';
    const dom = fieldDayMonth.value.trim() || '*';
    const mon = fieldMonth.value.trim() || '*';
    const dow = fieldDayWeek.value.trim() || '*';

    const cronExpr = `${min} ${hr} ${dom} ${mon} ${dow}`;
    cronExpressionDisplay.textContent = cronExpr;

    const command = commandInput.value.trim();
    crontabLine.value = `${cronExpr} ${command}`;

    // Translate to Human Readable English
    humanTranslation.textContent = translateCronToEnglish(min, hr, dom, mon, dow);

    // Calculate upcoming execution dates
    calculateUpcomingTimes(min, hr, dom, mon, dow);
  }

  function translateCronToEnglish(min, hr, dom, mon, dow) {
    let parts = [];

    // Minute / Hour
    if (min === '*' && hr === '*') {
      parts.push('Every minute');
    } else if (min.startsWith('*/')) {
      parts.push(`Every ${min.slice(2)} minutes`);
    } else if (hr === '*') {
      parts.push(`At minute ${min} of every hour`);
    } else {
      const formattedTime = formatTime(hr, min);
      parts.push(`At ${formattedTime}`);
    }

    // Day of Month / Month
    if (dom !== '*') {
      parts.push(`on day ${dom} of the month`);
    }
    if (mon !== '*') {
      parts.push(`in month ${mon}`);
    }

    // Day of Week
    if (dow !== '*') {
      const daysMap = {
        '0': 'Sunday', '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday',
        '4': 'Thursday', '5': 'Friday', '6': 'Saturday', '7': 'Sunday',
        '1-5': 'Monday through Friday', '0,6': 'Saturday and Sunday'
      };
      parts.push(daysMap[dow] ? `on ${daysMap[dow]}` : `on day-of-week ${dow}`);
    }

    return parts.join(', ');
  }

  function formatTime(hStr, mStr) {
    let h = parseInt(hStr, 10);
    let m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m)) return `${hStr}:${mStr}`;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const mPadded = m.toString().padStart(2, '0');
    return `${h.toString().padStart(2, '0')}:${mPadded} ${ampm}`;
  }

  function calculateUpcomingTimes(minStr, hrStr, domStr, monStr, dowStr) {
    executionList.innerHTML = '';
    const dates = [];
    const now = new Date();
    let iter = new Date(now.getTime());

    // Search future minutes (up to 5 matches)
    for (let i = 0; i < 50000 && dates.length < 5; i++) {
      iter.setMinutes(iter.getMinutes() + 1);
      iter.setSeconds(0);

      const m = iter.getMinutes();
      const h = iter.getHours();
      const dom = iter.getDate();
      const mon = iter.getMonth() + 1;
      const dow = iter.getDay();

      if (matchField(minStr, m) &&
          matchField(hrStr, h) &&
          matchField(domStr, dom) &&
          matchField(monStr, mon) &&
          matchField(dowStr, dow)) {
        dates.push(new Date(iter));
      }
    }

    if (dates.length === 0) {
      executionList.innerHTML = '<li>No upcoming executions found within range.</li>';
    } else {
      dates.forEach(d => {
        const li = document.createElement('li');
        li.textContent = `▶ ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00 (${getDayName(d.getDay())})`;
        executionList.appendChild(li);
      });
    }
  }

  function matchField(pattern, val) {
    if (pattern === '*') return true;
    if (pattern.startsWith('*/')) {
      const step = parseInt(pattern.slice(2), 10);
      return val % step === 0;
    }
    if (pattern.includes('-')) {
      const [start, end] = pattern.split('-').map(Number);
      return val >= start && val <= end;
    }
    if (pattern.includes(',')) {
      const list = pattern.split(',').map(Number);
      return list.includes(val);
    }
    return parseInt(pattern, 10) === val;
  }

  function pad(n) { return n.toString().padStart(2, '0'); }
  function getDayName(d) { return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]; }

  frequencyPreset.addEventListener('change', (e) => {
    const parts = e.target.value.split(' ');
    if (parts.length === 5) {
      fieldMinute.value = parts[0];
      fieldHour.value = parts[1];
      fieldDayMonth.value = parts[2];
      fieldMonth.value = parts[3];
      fieldDayWeek.value = parts[4];
      updateCron();
    }
  });

  btnCopyCron.addEventListener('click', () => {
    navigator.clipboard.writeText(cronExpressionDisplay.textContent).then(() => {
      btnCopyCron.textContent = '✓ Copied!';
      setTimeout(() => btnCopyCron.textContent = '📋 Copy Cron Expression', 2000);
    });
  });

  btnCopyLine.addEventListener('click', () => {
    navigator.clipboard.writeText(crontabLine.value).then(() => {
      btnCopyLine.textContent = '✓ Copied!';
      setTimeout(() => btnCopyLine.textContent = 'Copy Line', 2000);
    });
  });

  const allInputs = [fieldMinute, fieldHour, fieldDayMonth, fieldMonth, fieldDayWeek, commandInput];
  allInputs.forEach(el => {
    el.addEventListener('input', updateCron);
    el.addEventListener('change', updateCron);
  });

  updateCron();
});

// Global Toast Notification Helper
window.showToast = function(message) {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:rgba(16,185,129,0.95);color:#000;padding:12px 20px;border-radius:10px;font-weight:700;box-shadow:0 10px 30px rgba(0,0,0,0.5);z-index:9999;transition:all 0.3s ease;transform:translateY(100px);opacity:0;backdrop-filter:blur(10px);';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.transform = 'translateY(0)';
  toast.style.opacity = '1';
  setTimeout(() => {
    toast.style.transform = 'translateY(100px)';
    toast.style.opacity = '0';
  }, 3000);
};
