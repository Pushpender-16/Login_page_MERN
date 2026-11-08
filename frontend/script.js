
const contactForm = document.getElementById("contactForm");

const submitBtn = document.getElementById("submitBtn");

const statusMessage = document.getElementById("status");

contactForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    // Get form values
    const formData = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        subject: document.getElementById("subject").value,
        message: document.getElementById("message").value
    };

    try {

        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";

        statusMessage.textContent = "";

        // Send data to backend
        const response = await fetch("/api/contact", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Submission failed");
        }

        statusMessage.textContent = result.message;
        statusMessage.style.color = "green";

        // Clear form after successful submission
        contactForm.reset();

    } catch (error) {

        statusMessage.textContent = error.message;
        statusMessage.style.color = "red";

    } finally {

        submitBtn.disabled = false;
        submitBtn.textContent = "Send Message";

    }

});

