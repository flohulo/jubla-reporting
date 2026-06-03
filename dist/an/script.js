/******************************
 STEP 1: STUDENTS DATA
******************************/
let students = [
  { roll: "1023", name: "Rahul Kumar" },
  { roll: "1045", name: "Ankita Sharma" },
  { roll: "1056", name: "Vivek Singh" },
  { roll: "1074", name: "Priya Mishra" }
];

/******************************
 STEP 2: LOGIN FUNCTION
******************************/
function login() {
  let role = document.getElementById("role").value;
  let roll = document.getElementById("roll").value;

  if (role === "student") {
    if (!roll) {
      alert("Please enter roll number");
      return;
    }
    localStorage.setItem("currentRoll", roll);
    window.location.href = "student.html";
  } else {
    window.location.href = "admin.html";
  }
}

/******************************
 STEP 3: MARK ATTENDANCE (ADMIN)
******************************/
function markAttendance() {
  let roll = prompt("Enter Student Roll Number");
  if (!roll) return;

  let attendance = JSON.parse(localStorage.getItem("attendance")) || [];
  let today = new Date().toDateString();

  // duplicate entry avoid
  let alreadyMarked = attendance.some(
    a => a.roll === roll && a.date === today
  );

  if (alreadyMarked) {
    alert("Attendance already marked for today");
    return;
  }

  attendance.push({
    roll: roll,
    date: today,
    status: "present"
  });

  localStorage.setItem("attendance", JSON.stringify(attendance));
  alert("Attendance marked for roll " + roll);

  generateAdminTable();
}

/******************************
 STEP 4: STUDENT CALENDAR
******************************/
function generateCalendar() {
  let calendar = document.getElementById("calendar");
  let percentEl = document.getElementById("percent");
  let rollEl = document.getElementById("roll");

  if (!calendar) return;

  let attendance = JSON.parse(localStorage.getItem("attendance")) || [];
  let roll = localStorage.getItem("currentRoll");

  if (rollEl) rollEl.innerText = roll;

  calendar.innerHTML = "";

  let totalDays = 30;
  let presentDays = attendance.filter(a => a.roll === roll).length;

  for (let day = 1; day <= totalDays; day++) {
    let div = document.createElement("div");
    div.className = "day";

    let isPresent = attendance.some(a => {
      return (
        a.roll === roll &&
        new Date(a.date).getDate() === day
      );
    });

    div.innerText = isPresent ? "✔️" : day;
    div.style.backgroundColor = isPresent ? "#28a745" : "#e9ecef";
    div.style.color = isPresent ? "#fff" : "#000";

    calendar.appendChild(div);
  }

  let percent = Math.round((presentDays / totalDays) * 100);
  if (percentEl) percentEl.innerText = percent;
}

/******************************
 STEP 5: ADMIN TABLE
******************************/
function generateAdminTable() {
  let tableBody = document.getElementById("tableBody");
  if (!tableBody) return;

  let attendance = JSON.parse(localStorage.getItem("attendance")) || [];
  tableBody.innerHTML = "";

  students.forEach(student => {
    let present = attendance.filter(
      a => a.roll === student.roll
    ).length;

    let percent = Math.round((present / 30) * 100);

    let tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + student.roll + "</td>" +
      "<td>" + student.name + "</td>" +
      "<td>" + present + "</td>" +
      "<td>" + percent + "%</td>";

    tableBody.appendChild(tr);
  });
}

/******************************
 STEP 6: AUTO CALL ON PAGE LOAD
******************************/
document.addEventListener("DOMContentLoaded", function () {
  generateCalendar();
  generateAdminTable();
});function generateCalendar() {
  let calendar = document.getElementById("calendar");
  let percentEl = document.getElementById("percent");
  let rollEl = document.getElementById("roll");
  let monthSelect = document.getElementById("monthSelect");

  if (!calendar) return;

  let attendance = JSON.parse(localStorage.getItem("attendance")) || [];
  let roll = localStorage.getItem("currentRoll");

  if (rollEl) rollEl.innerText = roll;

  let month = monthSelect ? parseInt(monthSelect.value) : new Date().getMonth();
  let year = new Date().getFullYear();

  calendar.innerHTML = "";

  // days in selected month
  let totalDays = new Date(year, month + 1, 0).getDate();

  let presentDays = attendance.filter(a => {
    let d = new Date(a.date);
    return a.roll === roll && d.getMonth() === month;
  }).length;

  for (let day = 1; day <= totalDays; day++) {
    let div = document.createElement("div");
    div.className = "day";

    let isPresent = attendance.some(a => {
      let d = new Date(a.date);
      return (
        a.roll === roll &&
        d.getDate() === day &&
        d.getMonth() === month
      );
    });

    div.innerText = isPresent ? "✔️" : day;
    div.style.backgroundColor = isPresent ? "#28a745" : "#e9ecef";
    div.style.color = isPresent ? "#fff" : "#000";

    calendar.appendChild(div);
  }

  let percent = Math.round((presentDays / totalDays) * 100);
  if (percentEl) percentEl.innerText = percent;
}function generateCalendar() {
  let calendar = document.getElementById("calendar");
  let percentEl = document.getElementById("percent");
  let rollEl = document.getElementById("roll");
  let monthSelect = document.getElementById("monthSelect");

  if (!calendar) return;

  let attendance = JSON.parse(localStorage.getItem("attendance")) || [];
  let roll = localStorage.getItem("currentRoll");

  if (rollEl) rollEl.innerText = roll;

  let month = monthSelect ? parseInt(monthSelect.value) : new Date().getMonth();
  let year = new Date().getFullYear();

  calendar.innerHTML = "";

  let totalDays = new Date(year, month + 1, 0).getDate();

  let presentDays = attendance.filter(a => {
    let d = new Date(a.date);
    return a.roll === roll && d.getMonth() === month && a.status === "present";
  }).length;

  for (let day = 1; day <= totalDays; day++) {
    let div = document.createElement("div");
    div.className = "day";

    let record = attendance.find(a => {
      let d = new Date(a.date);
      return a.roll === roll && d.getDate() === day && d.getMonth() === month;
    });

    if (record && record.status === "present") {
      div.innerText = "✔️";
      div.style.backgroundColor = "#28a745";
      div.style.color = "#fff";
    } else if (record && record.status === "absent") {
      div.innerText = "❌";
      div.style.backgroundColor = "#dc3545";
      div.style.color = "#fff";
    } else {
      div.innerText = day;
      div.style.backgroundColor = "#e9ecef";
      div.style.color = "#000";
    }

    calendar.appendChild(div);
  }

  let percent = Math.round((presentDays / totalDays) * 100);
  if (percentEl) percentEl.innerText = percent;
}function generateAdminTable() {
  let tableBody = document.getElementById("tableBody");
  let monthSelect = document.getElementById("adminMonthSelect");

  if (!tableBody) return;

  let attendance = JSON.parse(localStorage.getItem("attendance")) || [];
  let month = monthSelect ? parseInt(monthSelect.value) : new Date().getMonth();

  tableBody.innerHTML = "";

  students.forEach(student => {
    let records = attendance.filter(a => {
      let d = new Date(a.date);
      return a.roll === student.roll && d.getMonth() === month;
    });

    let present = records.filter(r => r.status === "present").length;
    let absent = records.filter(r => r.status === "absent").length;
    let total = records.length;

    let percent = total > 0
      ? Math.round((present / total) * 100)
      : 0;

    let tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + student.roll + "</td>" +
      "<td>" + student.name + "</td>" +
      "<td>" + present + "</td>" +
      "<td>" + absent + "</td>" +
      "<td>" + percent + "%</td>";

    tableBody.appendChild(tr);
  });
}