const form = document.getElementById("signupForm");

const username = document.getElementById("username");
const email = document.getElementById("email");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const signupBtn = document.getElementById("signupBtn");
const message = document.getElementById("message");

form.addEventListener("submit", async function (event) {

    event.preventDefault();

    if (signupBtn.disabled) return;

    const user = username.value.trim();
    const mail = email.value.trim().toLowerCase();
    const pass = password.value;
    const confirmPass = confirmPassword.value;

    // Username validation
    if (user.length < 3 || user.length > 30) {
        showMessage("Username must be 3-30 characters!", "failed");
        return;
    }

    // Gmail validation
    if (!/^[^\s@]+@gmail\.com$/.test(mail)) {
        showMessage("Please enter a valid Gmail address!", "failed");
        return;
    }

    // Password validation
    if (pass.length < 6 || pass.length > 16) {
        showMessage("Password must be 6-16 characters!", "failed");
        return;
    }

    // Special character validation
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) {
        showMessage("At least one special character required!", "failed");
        return;
    }

    // Confirm password validation
    if (pass !== confirmPass) {
        showMessage("Passwords do not match!", "failed");
        return;
    }

    signupBtn.disabled = true;
    signupBtn.innerText = "Creating account...";

    try {
        const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: user,
                email: mail,
                password: pass,
                confirmPassword: confirmPass
            })
        });

        const data = await res.json();

        if (data.success) {
            showMessage("Account created! Redirecting to login...", "success");

            setTimeout(function () {
                window.location.href = "./index.html";
            }, 1500);
            return;
        }

        showMessage(data.message || "Sign up failed!", "failed");

    } catch (error) {
        showMessage("Server error. Please try again.", "failed");
    }

    signupBtn.disabled = false;
    signupBtn.innerText = "Sign Up";
});

// Back button se wapas aane par form reset
window.addEventListener("pageshow", function () {
    form.reset();
    signupBtn.disabled = false;
    signupBtn.innerText = "Sign Up";
    message.innerText = "";
    message.className = "";
});

function showMessage(text, type) {
    message.innerText = text;
    message.className = type;
}