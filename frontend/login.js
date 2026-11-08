
const form = document.getElementById("loginForm");

const username = document.getElementById("username");
const password = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const message = document.getElementById("message");

form.addEventListener("submit", function(event) {

    event.preventDefault();

    if (loginBtn.disabled) return;

    let user = username.value.trim();
    let pass = password.value;

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

    showMessage("Login Successful!", "success");



    // Redirect to home.html
    setTimeout(function() {
        window.location.href = "./contact.html";
    }, 1500);


    // Enable button again
loginBtn.disabled = false;

});

function showMessage(text, type) {
    message.innerText = text;
    message.className = type;
}
