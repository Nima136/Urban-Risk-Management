// ============================================================
// URBANRISK AUTHENTICATION
// ============================================================

console.log("UrbanRisk authentication loaded.");


// ============================================================
// REGISTER
// ============================================================

const registerForm =
    document.getElementById("registerForm");


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const name =
                document.getElementById("name")
                    .value
                    .trim();


            const email =
                document.getElementById("email")
                    .value
                    .trim()
                    .toLowerCase();


            const password =
                document.getElementById("password")
                    .value;


            const error =
                document.getElementById(
                    "registerError"
                );


            error.textContent = "";


            if (password.length < 6) {

                error.textContent =
                    "Password must be at least 6 characters.";

                return;

            }


            const existingUser =
                localStorage.getItem(
                    "urbanRiskUser"
                );


            if (existingUser) {

                const user =
                    JSON.parse(
                        existingUser
                    );


                if (
                    user.email === email
                ) {

                    error.textContent =
                        "An account with this email already exists.";

                    return;

                }

            }


            const user = {

                name,

                email,

                password

            };


            localStorage.setItem(
                "urbanRiskUser",
                JSON.stringify(user)
            );


            localStorage.setItem(
                "urbanRiskLoggedIn",
                "true"
            );


            window.location.href =
                "index.html";

        }
    );

}


// ============================================================
// LOGIN
// ============================================================

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const email =
                document.getElementById("email")
                    .value
                    .trim()
                    .toLowerCase();


            const password =
                document.getElementById("password")
                    .value;


            const error =
                document.getElementById(
                    "loginError"
                );


            error.textContent = "";


            const storedUser =
                localStorage.getItem(
                    "urbanRiskUser"
                );


            if (!storedUser) {

                error.textContent =
                    "No account found. Please register first.";

                return;

            }


            const user =
                JSON.parse(
                    storedUser
                );


            if (
                user.email !== email ||
                user.password !== password
            ) {

                error.textContent =
                    "Incorrect email or password.";

                return;

            }


            localStorage.setItem(
                "urbanRiskLoggedIn",
                "true"
            );


            window.location.href =
                "index.html";

        }
    );

}