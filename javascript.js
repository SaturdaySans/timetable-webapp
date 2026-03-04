function myFunction() {
  var element = document.body;
  element.classList.toggle("light-mode");
} 

function csvToArray(csvText) {
  if (!csvText || !csvText.trim()) return [];
  const lines = csvText.trim().split("\n").filter(l => l.trim() !== "");
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim());
    const obj = {};
    headers.forEach((header, i) => obj[header] = values[i] ?? "");
    return obj;
  });
}

//Load the csvfile
async function loadTimetable() {
  try {
    const response = await fetch("/timetable.csv");

    if (!response.ok) {
      throw new Error("CSV failed to load");
    }

    const csvText = await response.text();
    return csvToArray(csvText);
  } catch (err) {
    const el = document.getElementById("current-period");
    if (el) el.innerText = "Error loading";
    console.error(err);
    return [];
  }
}

//Find current-period
function getCurrentPeriod(timetable) {
  if (!Array.isArray(timetable) || timetable.length === 0) return null;

  const now = new Date();
  const days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  const currentDay = days[now.getDay()];

  const currentTime = now.getHours().toString().padStart(2,'0') + ":" +
                      now.getMinutes().toString().padStart(2,'0');

  const todaySchedule = timetable.filter(p => {
    const dayValue = (p.Day ?? p.day ?? "").toString().trim().toLowerCase();
    return dayValue === currentDay;
  });

  return todaySchedule.find(p => {
    const start = (p.Start ?? "").toString().padStart(5, "0");
    const end = (p.End ?? "").toString().padStart(5, "0");
    return start <= currentTime && currentTime < end;
  }) || null;
}

//Displays period on da page
async function showPeriod() {
  const timetable = await loadTimetable();
  const period = getCurrentPeriod(timetable);
  const display = document.getElementById("current-period");
  if (!display) return; // guard if element missing

  if(period) {
    display.innerHTML = `${period.Subject} (${period.Start} - ${period.End})<br>` +
                        `Location: ${period.Location}<br>` +
                        `Type: ${period.Type}`;
  } else {
    display.innerHTML = "No lessons right now";
  }
}

// Find the next non-break period (today or upcoming day)
function getNextPeriod(timetable) {
  if (!Array.isArray(timetable) || timetable.length === 0) return null;

  const days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  const now = new Date();
  const currentDayIndex = now.getDay();
  const currentTime = now.getHours().toString().padStart(2,'0') + ":" +
                      now.getMinutes().toString().padStart(2,'0');

  // helper to normalize day field
  const normalizeDay = p => ((p.Day ?? p.day ?? "") + "").toString().trim().toLowerCase();
  const isBreak = p => {
    const type = ((p.Type ?? p.type ?? "") + "").toString().trim().toLowerCase();
    const subj = ((p.Subject ?? p.subject ?? "") + "").toString().trim().toLowerCase();
    const breakLabels = ["break", "recess", "interval", "lunch"];
    return breakLabels.includes(type) || breakLabels.includes(subj);
  };

  // iterate over today + next 6 days
  for (let offset = 0; offset < 7; offset++) {
    const dayIndex = (currentDayIndex + offset) % 7;
    const dayName = days[dayIndex];

    // collect periods for this day
    const dayPeriods = timetable
      .filter(p => normalizeDay(p) === dayName)
      .filter(p => !isBreak(p))
      .map(p => {
        const start = ((p.Start ?? "").toString()).padStart(5, "0");
        return { ...p, _start: start };
      });

    if (dayPeriods.length === 0) continue;

    // for today, only consider periods starting after current time
    const candidates = dayPeriods.filter(p => {
      if (offset === 0) return p._start > currentTime;
      return true;
    });

    if (candidates.length === 0) continue;

    // pick earliest start time
    candidates.sort((a,b) => a._start.localeCompare(b._start));
    // annotate day offset if needed
    const next = { ...candidates[0], _dayOffset: offset, _dayName: dayName };
    return next;
  }

  return null;
}

//Displays next non-break period
async function showNextPeriod() {
  const timetable = await loadTimetable();
  const next = getNextPeriod(timetable);
  const display = document.getElementById("next-period");

  if (!display) return;

  if (next) {
    // if next._dayOffset > 0, show day name
    const dayLabel = next._dayOffset > 0 ? ` (${next._dayName})` : "";
    display.innerHTML = `${next.Subject} (${next.Start} - ${next.End})${dayLabel}<br>` +
                        `Location: ${next.Location}<br>` +
                        `Type: ${next.Type}`;
  } else {
    display.innerHTML = "No upcoming lessons";
  }
}

//Refvesh
showPeriod();
showNextPeriod();
setInterval(showPeriod, 60000);
setInterval(showNextPeriod, 60000);