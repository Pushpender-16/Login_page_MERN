const form = document.getElementById("loginForm");

const username = document.getElementById("username");
const password = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const message = document.getElementById("message");

form.addEventListener("submit", async function (event) {

    event.preventDefault();

    if (loginBtn.disabled) return;

    const user = username.value.trim();
    const pass = password.value;

    // Username validation
    if (user === "") {
        showMessage("Username is required!", "failed");
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

    // Disable button
    loginBtn.disabled = true;
    loginBtn.innerText = "Submitting...";

    try {
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass })
        });

        const data = await res.json();

        if (data.success) {
            showMessage("Login Successful!", "success");

            // Redirect to contact page
            setTimeout(function () {
                window.location.href = "./contact.html";
            }, 1500);
            return; // button disabled hi rahega jab tak redirect na ho
        }

        // Server ne error diya (wrong password, too many attempts, etc.)
        showMessage(data.message || "Login failed!", "failed");

    } catch (error) {
        showMessage("Server error. Please try again.", "failed");
    }

    // Sirf failure par button wapas enable karo
    loginBtn.disabled = false;
    loginBtn.innerText = "Login";
});

function showMessage(text, type) {
    message.innerText = text;
    message.className = type;
}



// Back button se wapas aane par form reset karo
window.addEventListener("pageshow", function (event) {
    form.reset();
    loginBtn.disabled = false;
    loginBtn.innerText = "Login";
    message.innerText = "";
    message.className = "";
});