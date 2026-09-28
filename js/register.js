const REGISTRATION_STORAGE_KEY = "campusHubRegistrations";

function openRegister(eventName) {
    const dialog = document.getElementById("registerDialog");
    const selectedEvent = document.getElementById("selectedEvent");
    const eventSelect = document.getElementById("eventName");

    if (dialog) {
        dialog.classList.remove("hidden");
        document.body.classList.add("overflow-hidden");
    }

    if (selectedEvent) {
        selectedEvent.textContent = "Register for: " + eventName;
    }

    if (eventSelect) {
        eventSelect.value = eventName;
    }
}

function closeRegister() {
    const dialog = document.getElementById("registerDialog");

    if (dialog) {
        dialog.classList.add("hidden");
    }

    if (!document.getElementById("successScreen")) {
        document.body.classList.remove("overflow-hidden");
    }
}

function getRegistrations() {
    try {
        return JSON.parse(localStorage.getItem(REGISTRATION_STORAGE_KEY)) || [];
    } catch (error) {
        console.error("Could not read registrations:", error);
        return [];
    }
}

function saveRegistrations(registrations) {
    localStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify(registrations));
}

function createRegistrationNumber(registrations) {
    let nextNumber = registrations.length + 1;

    const numbers = registrations
        .map((registration) =>
            Number(String(registration.registrationNumber || "").replace("REG-", ""))
        )
        .filter(Number.isFinite);

    if (numbers.length > 0) {
        nextNumber = Math.max(...numbers) + 1;
    }

    return "REG-" + String(nextNumber).padStart(4, "0");
}

function showAlert({
    icon = "info",
    title = "Notice",
    text = "",
    confirmButtonText = "OK"
}) {
    if (typeof Swal !== "undefined" && typeof Swal.fire === "function") {
        return Swal.fire({
            icon,
            title,
            text,
            confirmButtonText,
            confirmButtonColor: "#2563eb"
        });
    }

    alert(title + "\n\n" + text);
    return Promise.resolve();
}

function createSuccessScreen() {
    let successScreen = document.getElementById("successScreen");

    if (successScreen) {
        return successScreen;
    }

    successScreen = document.createElement("div");
    successScreen.id = "successScreen";
    successScreen.className =
        "fixed inset-0 z-[100] hidden overflow-y-auto bg-slate-50";

    successScreen.innerHTML = `
        <div class="flex min-h-screen items-center justify-center p-4 sm:p-6">
            <div class="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl sm:p-10">
                <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                    <svg class="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>

                <div class="mt-6 text-center">
                    <h1 class="text-3xl font-bold text-slate-900 sm:text-4xl">
                        Registration Successful!
                    </h1>
                    <p class="mt-2 text-slate-600">
                        Your registration has been completed successfully.
                    </p>
                </div>

                <div class="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                    <div class="grid gap-5 sm:grid-cols-2">
                        <div>
                            <p class="text-sm font-medium text-slate-500">Registration Number</p>
                            <p id="successRegistrationNumber" class="mt-1 text-lg font-bold text-blue-600"></p>
                        </div>

                        <div>
                            <p class="text-sm font-medium text-slate-500">Student Name</p>
                            <p id="successName" class="mt-1 text-lg font-semibold text-slate-900"></p>
                        </div>

                        <div>
                            <p class="text-sm font-medium text-slate-500">Email</p>
                            <p id="successEmail" class="mt-1 break-words text-lg font-semibold text-slate-900"></p>
                        </div>

                        <div>
                            <p class="text-sm font-medium text-slate-500">Event / Club</p>
                            <p id="successEvent" class="mt-1 text-lg font-semibold text-slate-900"></p>
                        </div>
                    </div>
                </div>

                <div class="mt-8 flex flex-col gap-3 sm:flex-row">
                    <button
                        type="button"
                        onclick="closeSuccessScreen()"
                        class="flex-1 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                    >
                        Back to CampusHub
                    </button>

                    <button
                        type="button"
                        onclick="printRegistration()"
                        class="flex-1 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                        Print Registration
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(successScreen);
    return successScreen;
}

function showSuccessScreen(registration) {
    const successScreen = createSuccessScreen();

    document.getElementById("successRegistrationNumber").textContent =
        registration.registrationNumber;
    document.getElementById("successName").textContent = registration.name;
    document.getElementById("successEvent").textContent = registration.event;
    document.getElementById("successEmail").textContent = registration.email;

    successScreen.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
}

function closeSuccessScreen() {
    const successScreen = document.getElementById("successScreen");

    if (successScreen) {
        successScreen.classList.add("hidden");
    }

    document.body.classList.remove("overflow-hidden");
}

function printRegistration() {
    window.print();
}

function submitRegistration(event) {
    event.preventDefault();

    const form = event.target;
    const nameInput = document.getElementById("studentName");
    const emailInput = document.getElementById("studentEmail");
    const phoneInput = document.getElementById("studentPhone");
    const eventInput = document.getElementById("eventName");

    if (!form || !nameInput || !emailInput || !phoneInput || !eventInput) {
        showAlert({
            icon: "error",
            title: "Error",
            text: "Registration form could not be found."
        });
        return;
    }

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const selectedEvent = eventInput.value.trim();

    if (!name) {
        showAlert({
            icon: "warning",
            title: "Name Required",
            text: "Please enter your full name."
        }).then(() => nameInput.focus());
        return;
    }

    if (!email) {
        showAlert({
            icon: "warning",
            title: "Email Required",
            text: "Please enter your email address."
        }).then(() => emailInput.focus());
        return;
    }

    // Validate the complete email format.
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert({
            icon: "error",
            title: "Invalid Email",
            text: "Please enter a valid email address, for example: student@example.com"
        }).then(() => {
            emailInput.focus();
            emailInput.select();
        });
        return;
    }

    if (!phone) {
        showAlert({
            icon: "warning",
            title: "Phone Required",
            text: "Please enter your phone number."
        }).then(() => phoneInput.focus());
        return;
    }

    if (!selectedEvent) {
        showAlert({
            icon: "error",
            title: "Select an Event",
            text: "Please choose an event before registering."
        }).then(() => eventInput.focus());
        return;
    }

    const registrations = getRegistrations();
    const registrationNumber = createRegistrationNumber(registrations);

    const registration = {
        registrationNumber,
        name,
        email,
        phone,
        event: selectedEvent,
        registeredAt: new Date().toISOString()
    };

    registrations.push(registration);
    saveRegistrations(registrations);

    form.reset();
    closeRegister();
    showSuccessScreen(registration);
}
