'use strict'

//Automatically fill in email address
window.addEventListener('DOMContentLoaded', function () {
    let email = sessionStorage.getItem('registeredEmail');
    if (email) {
        document.getElementById('email').value = email;
        sessionStorage.removeItem('registeredEmail');
        document.getElementById('password').focus();
    }
});

document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    //Get content of fields
    let email = document.getElementById('email').value.trim();
    let password = document.getElementById('password').value.trim();

    //Get error divs and empty them
    let email_error = document.getElementById('error_email');
    email_error.textContent = '';
    let password_error = document.getElementById('error_pass');
    password_error.textContent = '';
    let backend_error = document.getElementById('error_backend');
    backend_error.textContent = '';

    //Error Handling Helper
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

    //Check for empty fields
    if (!email) {
        email_error.textContent = 'Email is required!';
    }
    if (!password) {
        password_error.textContent = 'Password is required!';
    }

    try {
        let response = await fetch('/api/Authentication/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password,
            })
        });

        let result = {};
        const text = await response.text();

        if (text) {
            try {
                result = JSON.parse(text);
            } catch (errormessage) {
                console.error("Failed to parse JSON:", errormessage);
                showBackend_error('Invalid server response!');
                return;
            }
        }
        if (!response.ok) {
            //Show error message of backend
            showBackend_error(result.message || 'Incorrect email or password! Try again!');
        } else {
            //Correct login information

            //Store token in localStorage
            localStorage.setItem('authToken', result.token);

            //Store user information when they get send back
            if (result.user) {
                localStorage.setItem('currentUser', JSON.stringify(result.user));
            }

            //Send to lobby page
            window.location.href = '../lobby page/lobby.html';
        }
    } catch (error) {
        backend_error.textContent = 'Could not connect to the server!';
        console.error('Login error: ', error);
    }
});

document.getElementById('registerLink').addEventListener('click', function(event) {
    // Get the current value of the email field
    let email = document.getElementById('email').value.trim();
    if (email) {
        sessionStorage.setItem('unregisteredEmail', email);
    }
});