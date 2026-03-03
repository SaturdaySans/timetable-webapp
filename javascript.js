function csvToArray(csvText) {
  const lines = csvText.trim().split("\n").filter(l => l.trim() !== "");
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

  if (period) {
    display.innerHTML = `${period.Subject ?? ""} (${period.Start ?? ""} - ${period.End ?? ""})<br>` +
                        `Location: ${period.Location ?? "TBA"}<br>` +
                        `Type: ${period.Type ?? "TBA"}`;
  } else {
    display.innerHTML = "No lessons right now";
  }
}

//Refvesh
showPeriod();
setInterval(showPeriod, 60000);