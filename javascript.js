function csvToArray(csvText) {
  const lines = csvText.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map(line => {
    const values = line.split(",");
    const obj = {};
    headers.forEach((header, i) => obj[header] = values[i]);
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
    document.getElementById("current-period").innerText =
      "Error loading timetable";
    console.error(err);
  }
}

//Find current-period
function getCurrentPeriod(timetable) {
  const now = new Date();
  const days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  const currentDay = days[now.getDay()];

  const currentTime = now.getHours().toString().padStart(2,'0') + ":" +
                      now.getMinutes().toString().padStart(2,'0');

  const todaySchedule = timetable.filter(p => p.Day === currentDay);

  return todaySchedule.find(p => p.Start <= currentTime && currentTime < p.End);
}

//Displays period on da page
async function showPeriod() {
  const timetable = await loadTimetable();
  const period = getCurrentPeriod(timetable);
  const display = document.getElementById("current-period");

  if(period) {
    display.innerHTML = `${period.Subject} (${period.Start} - ${period.End})<br>` +
                        `Location: ${period.Location}<br>` +
                        `Type: ${period.Type}`;
  } else {
    display.innerHTML = "No lessons right now";
  }
}

//Refvesh
showPeriod();
setInterval(showPeriod, 60000);