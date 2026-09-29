// Admin dashboard. Needs js/store.js loaded first.
(() => {
     const signedInAs = CampusHubStore.currentAdmin();

     // Not logged in: go to the login page before anything is shown.
     if (!signedInAs) {
          location.replace("login.html");
          return;
     }

     const elements = {
          app: document.getElementById("app"),
          adminEmail: document.getElementById("adminEmail"),
          logoutButton: document.getElementById("logoutButton"),
          exportButton: document.getElementById("exportButton"),
          total: document.getElementById("total"),
          today: document.getElementById("today"),
          latest: document.getElementById("latest"),
          eventCounts: document.getElementById("eventCounts"),
          search: document.getElementById("search"),
          eventFilter: document.getElementById("eventFilter"),
          table: document.getElementById("registrationTable"),
          empty: document.getElementById("empty"),
          showing: document.getElementById("showing"),
          adminList: document.getElementById("adminList"),
          addAdminForm: document.getElementById("addAdminForm"),
          newAdminEmail: document.getElementById("newAdminEmail"),
          newAdminPassword: document.getElementById("newAdminPassword"),
          adminMessage: document.getElementById("adminMessage")
     };

     let registrations = [];

     /*
      * Escape user-provided text before inserting into HTML.
      */
     function escapeHTML(value) {
          return String(value ?? "").replace(/[&<>'"]/g, character => ({
               "&": "&amp;",
               "<": "&lt;",
               ">": "&gt;",
               "'": "&#039;",
               '"': "&quot;"
          })[character]);
     }

     function toDate(value) {
          const date = value ? new Date(value) : null;
          return date && !Number.isNaN(date.getTime()) ? date : null;
     }

     function isToday(date) {
          return Boolean(date) && date.toDateString() === new Date().toDateString();
     }

     function loadRegistrations() {
          // Newest first.
          registrations = CampusHubStore.getRegistrations()
               .map(registration => ({
                    registrationNumber: registration.registrationNumber || "-",
                    name: registration.name || "-",
                    email: registration.email || "-",
                    phone: registration.phone || "-",
                    event: registration.event || "-",
                    date: toDate(registration.registeredAt)
               }))
               .reverse();
     }

     function filteredRegistrations() {
          const search = elements.search.value.trim().toLowerCase();
          const eventName = elements.eventFilter.value;

          return registrations.filter(registration => {
               if (eventName && registration.event !== eventName) {
                    return false;
               }

               if (!search) {
                    return true;
               }

               return [registration.registrationNumber, registration.name, registration.email, registration.phone]
                    .some(value => String(value).toLowerCase().includes(search));
          });
     }

     function renderEventOptions(counts) {
          const selected = elements.eventFilter.value;
          const names = [...counts.keys()].sort();

          elements.eventFilter.innerHTML = '<option value="">All events and clubs</option>' +
               names.map(name => `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`).join("");

          // Keep the admin's current filter if that event still has registrations.
          elements.eventFilter.value = names.includes(selected) ? selected : "";
     }

     function renderSummary() {
          const counts = new Map();

          registrations.forEach(registration => {
               counts.set(registration.event, (counts.get(registration.event) || 0) + 1);
          });

          elements.total.textContent = registrations.length;
          elements.today.textContent = registrations.filter(registration => isToday(registration.date)).length;
          elements.latest.textContent = registrations.length ? registrations[0].registrationNumber : "-";

          elements.eventCounts.innerHTML = counts.size
               ? [...counts.entries()]
                    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
                    .map(([name, count]) => `
                         <span class="rounded-full bg-mainLight px-3 py-1 font-semibold text-main">
                              ${escapeHTML(name)}: ${count}
                         </span>`)
                    .join("")
               : '<span class="text-secondText">No registrations yet.</span>';

          renderEventOptions(counts);
     }

     function renderTable() {
          const rows = filteredRegistrations();

          elements.table.innerHTML = rows.map(registration => `
               <tr class="border-t border-slate-200 hover:bg-slate-50">
                    <td class="px-4 py-3 font-semibold text-main">${escapeHTML(registration.registrationNumber)}</td>
                    <td class="px-4 py-3">${escapeHTML(registration.name)}</td>
                    <td class="px-4 py-3">${escapeHTML(registration.email)}</td>
                    <td class="px-4 py-3">${escapeHTML(registration.phone)}</td>
                    <td class="px-4 py-3">${escapeHTML(registration.event)}</td>
                    <td class="whitespace-nowrap px-4 py-3">${escapeHTML(registration.date ? registration.date.toLocaleString() : "-")}</td>
                    <td class="px-4 py-3 text-right">
                         <button type="button" data-delete="${escapeHTML(registration.registrationNumber)}"
                              class="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-error hover:bg-red-50">
                              Delete
                         </button>
                    </td>
               </tr>`).join("");

          elements.empty.textContent = registrations.length ? "No registrations match your search." : "No registrations yet.";
          elements.empty.classList.toggle("hidden", rows.length !== 0);
          elements.showing.textContent = registrations.length
               ? `Showing ${rows.length} of ${registrations.length} registrations.`
               : "";
     }

     function refresh() {
          loadRegistrations();
          renderSummary();
          renderTable();
     }

     function deleteRegistration(registrationNumber) {
          const registration = registrations.find(item => item.registrationNumber === registrationNumber);

          if (!registration) {
               return;
          }

          const confirmed = confirm(
               `Delete registration ${registration.registrationNumber} (${registration.name}, ${registration.event})?\n\nThis cannot be undone.`
          );

          if (confirmed) {
               CampusHubStore.deleteRegistration(registrationNumber);
               refresh();
          }
     }

     /*
      * Escape a CSV value.
      */
     function csvValue(value) {
          return `"${String(value ?? "").replace(/"/g, '""')}"`;
     }

     function exportRegistrations() {
          const rows = filteredRegistrations();

          if (rows.length === 0) {
               alert("There are no registrations to export.");
               return;
          }

          const headers = ["Registration Number", "Name", "Email", "Phone", "Event / Club", "Registered At"];
          const csv = [
               headers,
               ...rows.map(registration => [
                    registration.registrationNumber,
                    registration.name,
                    registration.email,
                    registration.phone,
                    registration.event,
                    registration.date ? registration.date.toLocaleString() : ""
               ])
          ]
               .map(row => row.map(csvValue).join(","))
               .join("\r\n");

          // BOM helps Excel correctly recognize UTF-8.
          const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");

          link.href = url;
          link.download = "campushub-registrations.csv";
          document.body.appendChild(link);
          link.click();
          link.remove();

          setTimeout(() => URL.revokeObjectURL(url), 1000);
     }

     /* ---------- Admin accounts ---------- */

     function showAdminMessage(text, type = "error") {
          elements.adminMessage.textContent = text;
          elements.adminMessage.className = "mt-3 text-sm " + (type === "error" ? "text-error" : "text-succes");
     }

     function renderAdmins() {
          elements.adminList.innerHTML = CampusHubStore.getAdmins().map(admin => {
               const isMe = admin.email.toLowerCase() === signedInAs.toLowerCase();

               return `
                    <li class="flex items-center justify-between gap-3 py-3">
                         <span class="break-all">${escapeHTML(admin.email)}${isMe ? ' <span class="text-secondText">(you)</span>' : ""}</span>
                         ${isMe ? "" : `
                              <button type="button" data-remove-admin="${escapeHTML(admin.email)}"
                                   class="shrink-0 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-error hover:bg-red-50">
                                   Remove
                              </button>`}
                    </li>`;
          }).join("");
     }

     async function addAdmin(event) {
          event.preventDefault();

          const email = elements.newAdminEmail.value.trim();
          const password = elements.newAdminPassword.value;

          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
               showAdminMessage("Please enter a valid email address.");
               return;
          }

          if (password.length < 6) {
               showAdminMessage("Password must be at least 6 characters.");
               return;
          }

          try {
               await CampusHubStore.addAdmin(email, password);
               elements.addAdminForm.reset();
               renderAdmins();
               showAdminMessage(`${email} can now log in as an admin.`, "success");
          } catch (error) {
               showAdminMessage(error.message);
          }
     }

     function removeAdmin(email) {
          if (confirm(`Remove admin access for ${email}?`)) {
               CampusHubStore.removeAdmin(email);
               renderAdmins();
               showAdminMessage(`${email} was removed.`, "success");
          }
     }

     /* ---------- Start ---------- */

     elements.adminEmail.textContent = signedInAs;
     elements.app.classList.remove("hidden");
     refresh();
     renderAdmins();

     elements.logoutButton.addEventListener("click", () => {
          CampusHubStore.endSession();
          location.replace("login.html");
     });
     elements.exportButton.addEventListener("click", exportRegistrations);
     elements.search.addEventListener("input", renderTable);
     elements.eventFilter.addEventListener("change", renderTable);
     elements.addAdminForm.addEventListener("submit", addAdmin);

     elements.table.addEventListener("click", event => {
          const button = event.target.closest("[data-delete]");

          if (button) {
               deleteRegistration(button.dataset.delete);
          }
     });

     elements.adminList.addEventListener("click", event => {
          const button = event.target.closest("[data-remove-admin]");

          if (button) {
               removeAdmin(button.dataset.removeAdmin);
          }
     });

     // Update automatically when a student registers in another tab of this browser.
     window.addEventListener("storage", event => {
          if (event.key === CampusHubStore.REGISTRATIONS_KEY) {
               refresh();
          }

          if (event.key === CampusHubStore.ADMINS_KEY) {
               if (!CampusHubStore.currentAdmin()) {
                    location.replace("login.html");
                    return;
               }

               renderAdmins();
          }
     });
})();
