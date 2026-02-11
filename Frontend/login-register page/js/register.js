'use strict'

//Automatically fill in email address
window.addEventListener('DOMContentLoaded', function () {
    let email = sessionStorage.getItem('unregisteredEmail');
    if (email) {
        document.getElementById('email').value = email;
        sessionStorage.removeItem('unregisteredEmail');
        document.getElementById('username').focus();
    }
});

document.getElementById('registerForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    //Get content of fields
    let email = document.getElementById('email').value.trim();
    let username = document.getElementById('username').value.trim();
    let password = document.getElementById('password').value.trim();
    let confirmPassword = document.getElementById('confirm_password').value.trim();
    let lastPortugalStay = document.getElementById('last_visit').value;

    //Get error divs and empty them
    let email_error = document.getElementById('error_email');
    email_error.textContent = '';
    let user_error = document.getElementById('error_user');
    user_error.textContent = '';
    let password_error = document.getElementById('error_pass');
    password_error.textContent = '';
    let conf_password_error = document.getElementById('error_conf_pass');
    conf_password_error.textContent = '';
    let last_visit_error = document.getElementById('error_last_visit');
    last_visit_error.textContent = '';
    let backend_error = document.getElementById('error_backend');
    backend_error.textContent = '';

    // --- Error Handling Helper ---
    function showBackend_error(message) {
        if (backend_error) {
            if (message) {
                backend_error.textContent = message;
                backend_error.classList.add('visible');
            } else {
                backend_error.textContent = '';
                backend_error.classList.remove('visible');
            }
        }
    }

    // Validation Flag
    let hasError = false;

    //Check for empty fields
    if (!email) {
        email_error.textContent = 'Email is required!';
        hasError = true;
    }
    if (!username) {
        user_error.textContent = 'Username is required!';
        hasError = true;
    }
    if (!password) {
        password_error.textContent = 'Password is required!';
        hasError = true;
    }
    if (!confirmPassword) {
        conf_password_error.textContent = 'Password confirmation is required!';
        hasError = true;
    }

    //Validates fields
    if (password && password.length < 6) {
        password_error.textContent = 'Password must be at least 6 characters!';
        hasError = true;
    }
    if (password && confirmPassword && password !== confirmPassword) {
        conf_password_error.textContent = 'Passwords do not match!';
        hasError = true;
    }
    if (lastPortugalStay) {
        let today = new Date();
        let inputDate = new Date(lastPortugalStay);
        // Remove time part for accurate comparison
        today.setHours(0,0,0,0);
        inputDate.setHours(0,0,0,0);
        if (inputDate > today) {
            last_visit_error.textContent = 'Last visit can not be in the future!';
            hasError = true;
        }
    }

    // --- STOP if there are errors ---
    if (hasError) {
        return;
    }

    //Sending information to backend
    try {
        let response = await fetch('/api/Authentication/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                userName: username,
                password: password,
                lastVisitToPortugal: lastPortugalStay || null
            })
        });

        let result = {};
        let text = await response.text();

        if (text) {
            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error("Failed to parse JSON:", e);
                showBackend_error('Invalid server response!');
                return;
            }
        }

        if (!response.ok) {
            showBackend_error(result.message || 'Something went wrong!');
        } else {
            //Save email for login page and redirect
            sessionStorage.setItem('registeredEmail', email);
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Login error: ', error);
        showBackend_error('Could not connect to the server!');
    }
});


document.getElementById('loginLink').addEventListener('click', function(event) {
    // Get the current value of the email field
    let email = document.getElementById('email').value.trim();
    if (email) {
        sessionStorage.setItem('registeredEmail', email);
    }
});