// CampusHub data storage.
// Everything is saved in this browser's localStorage, so no server, account or install is needed.
// Limitation: data only exists in the browser and computer where it was entered.
const CampusHubStore = (() => {
    const REGISTRATIONS_KEY = "campusHubRegistrations";
    const ADMINS_KEY = "campusHubAdmins";
    const SESSION_KEY = "campusHubAdminSession";

    function readList(key) {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return Array.isArray(value) ? value : [];
        } catch (error) {
            console.error("Could not read " + key + ":", error);
            return [];
        }
    }

    function writeList(key, list) {
        localStorage.setItem(key, JSON.stringify(list));
    }

    function sameText(a, b) {
        return String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();
    }

    /* ---------- Registrations ---------- */

    function getRegistrations() {
        return readList(REGISTRATIONS_KEY);
    }

    function nextRegistrationNumber(registrations) {
        const numbers = registrations
            .map((registration) =>
                Number(String(registration.registrationNumber || "").replace("REG-", ""))
            )
            .filter(Number.isFinite);

        const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
        return "REG-" + String(nextNumber).padStart(4, "0");
    }

    function addRegistration({ name, email, phone, event }) {
        const registrations = getRegistrations();
        const existing = registrations.find((registration) =>
            registration.event === event && sameText(registration.email, email)
        );

        if (existing) {
            throw Object.assign(new Error("Already registered"), {
                code: "duplicate",
                registrationNumber: existing.registrationNumber
            });
        }

        const registration = {
            registrationNumber: nextRegistrationNumber(registrations),
            name,
            email,
            phone,
            event,
            registeredAt: new Date().toISOString()
        };

        registrations.push(registration);
        writeList(REGISTRATIONS_KEY, registrations);
        return registration;
    }

    function deleteRegistration(registrationNumber) {
        writeList(
            REGISTRATIONS_KEY,
            getRegistrations().filter((registration) => registration.registrationNumber !== registrationNumber)
        );
    }

    /* ---------- Admin accounts ---------- */

    function toHex(buffer) {
        return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    }

    // Passwords are never stored as plain text: each admin gets a random salt and a SHA-256 hash.
    async function hashPassword(password, salt) {
        if (!window.crypto || !crypto.subtle) {
            throw new Error("This browser cannot hash passwords here. Open the site from localhost (Live Server) or https.");
        }

        const bytes = new TextEncoder().encode(salt + ":" + password);
        return toHex(await crypto.subtle.digest("SHA-256", bytes));
    }

    function getAdmins() {
        return readList(ADMINS_KEY);
    }

    function hasAdmins() {
        return getAdmins().length > 0;
    }

    async function addAdmin(email, password) {
        const admins = getAdmins();

        if (admins.some((admin) => sameText(admin.email, email))) {
            throw new Error("An admin with this email already exists.");
        }

        const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));

        admins.push({
            email: email.trim(),
            salt,
            passwordHash: await hashPassword(password, salt),
            createdAt: new Date().toISOString()
        });

        writeList(ADMINS_KEY, admins);
    }

    function removeAdmin(email) {
        writeList(ADMINS_KEY, getAdmins().filter((admin) => !sameText(admin.email, email)));
    }

    async function checkLogin(email, password) {
        const admin = getAdmins().find((item) => sameText(item.email, email));

        if (!admin) {
            return false;
        }

        return (await hashPassword(password, admin.salt)) === admin.passwordHash;
    }

    /* ---------- Admin session (ends when the browser tab is closed) ---------- */

    function startSession(email) {
        const admin = getAdmins().find((item) => sameText(item.email, email));
        sessionStorage.setItem(SESSION_KEY, admin ? admin.email : email);
    }

    function currentAdmin() {
        const email = sessionStorage.getItem(SESSION_KEY);
        return email && getAdmins().some((admin) => sameText(admin.email, email)) ? email : null;
    }

    function endSession() {
        sessionStorage.removeItem(SESSION_KEY);
    }

    return {
        REGISTRATIONS_KEY,
        ADMINS_KEY,
        getRegistrations,
        addRegistration,
        deleteRegistration,
        getAdmins,
        hasAdmins,
        addAdmin,
        removeAdmin,
        checkLogin,
        startSession,
        currentAdmin,
        endSession
    };
})();
