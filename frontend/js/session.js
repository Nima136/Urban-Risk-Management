// ============================================================
// URBANRISK SESSION
// ============================================================

const loggedIn =
    localStorage.getItem(
        "urbanRiskLoggedIn"
    );


if (
    !loggedIn &&
    !window.location.pathname.endsWith(
        "login.html"
    ) &&
    !window.location.pathname.endsWith(
        "register.html"
    )
) {

    window.location.href =
        "login.html";

}


// ============================================================
// GET CURRENT USER
// ============================================================

function getCurrentUser() {

    const storedUser =
        localStorage.getItem(
            "urbanRiskUser"
        );


    if (!storedUser) {
        return null;
    }


    try {

        return JSON.parse(
            storedUser
        );

    } catch {

        return null;

    }

}


// ============================================================
// LOGOUT
// ============================================================

function logoutUrbanRisk() {

    localStorage.removeItem(
        "urbanRiskLoggedIn"
    );


    window.location.href =
        "login.html";

}