const SUPABASE_URL = 'https://' + 'jnkpswbieqoprvvkhxvu' + '.supabase.co';
const SUPABASE_KEY = "sb_publishable_q0cxNXSQ7iFRmCOqonhWOw_Xnt0FEnP";

const rememberLogin =
    document.getElementById("rememberLogin");


/* =========================
   ELEMENTS
========================= */

const employeeList = document.getElementById("employeeList");
const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");
const resultCount = document.getElementById("resultCount");
const departmentSection = document.getElementById("departmentSection");
const departmentCards = document.getElementById("departmentCards");
const allDepartmentsButton = document.getElementById("allDepartmentsButton");
const allEmployeesButton = document.getElementById("allEmployeesButton");
const favoriteEmployeesButton = document.getElementById("favoriteEmployeesButton");
const departmentPage = document.getElementById("departmentPage");
const departmentPageTitle = document.getElementById("departmentPageTitle");
const departmentEmployeeList = document.getElementById("departmentEmployeeList");
const departmentBackButton = document.getElementById("departmentBackButton");
const favoritePage = document.getElementById("favoritePage");
const favoriteEmployeeList = document.getElementById("favoriteEmployeeList");
const favoriteBackButton = document.getElementById("favoriteBackButton");
const birthdayButton = document.getElementById("birthdayButton");
const birthdayPage = document.getElementById("birthdayPage");
const birthdayBackButton = document.getElementById("birthdayBackButton");
const birthdayEmployeeList = document.getElementById("birthdayEmployeeList");
const birthdayMonths = document.getElementById("birthdayMonths");
const allEmployeesPage = document.getElementById("allEmployeesPage");
const allEmployeesBackButton = document.getElementById("allEmployeesBackButton");

let favoriteEmployees = JSON.parse(
    localStorage.getItem("favoriteEmployees") || "[]"
);

function isFavorite(employee) {
    return favoriteEmployees.includes(
        String(employee.employee_no)
    );
}

async function toggleFavorite(employee) {
    const employeeNo = String(employee.employee_no);
    const newFavorite = !isFavorite(employee);

    if (newFavorite) {
        if (!favoriteEmployees.includes(employeeNo)) {
            favoriteEmployees.push(employeeNo);
        }
    } else {
        favoriteEmployees = favoriteEmployees.filter(
            id => id !== employeeNo
        );
    }

    localStorage.setItem(
        "favoriteEmployees",
        JSON.stringify(favoriteEmployees)
    );

    // Favorite is device-local; do not update the protected database.
    employee.favorite = newFavorite;
}


departmentBackButton.addEventListener("click", function() {

    detailsPage.style.display = "none";
    allEmployeesPage.style.display = "none";
    favoritePage.style.display = "none";
    birthdayPage.style.display = "none";

    if (departmentEmployeeList.style.display !== "none") {

        departmentEmployeeList.style.display = "none";
        departmentEmployeeList.innerHTML = "";

        departmentCards.style.display = "grid";
        departmentPage.style.display = "block";
        departmentPageTitle.textContent = "🏢 All Departments";

    } else {

        departmentPage.style.display = "none";
        departmentCards.style.display = "none";

        listPage.style.display = "block";
        departmentSection.style.display = "block";
        employeeList.style.display = "block";

    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


const listPage = document.getElementById("listPage");
const detailsPage = document.getElementById("detailsPage");
const employeeDetails = document.getElementById("employeeDetails");
const backButton = document.getElementById("backButton");

const adminButton = document.getElementById("adminButton");

const loginPage = document.getElementById("loginPage");
const loginBackButton = document.getElementById("loginBackButton");
const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const loginButton = document.getElementById("loginButton");
const forgotPasswordButton = document.getElementById("forgotPasswordButton");
const resetPasswordPage = document.getElementById("resetPasswordPage");
const newPassword = document.getElementById("newPassword");
const confirmPassword = document.getElementById("confirmPassword");
const updatePasswordButton = document.getElementById("updatePasswordButton");
const resetStatus = document.getElementById("resetStatus");
const loginStatus = document.getElementById("loginStatus");

const adminPage = document.getElementById("adminPage");
const adminBackButton = document.getElementById("adminBackButton");
const logoutButton = document.getElementById("logoutButton");

const employeeSelect = document.getElementById("employeeSelect");
const photoInput = document.getElementById("photoInput");
const uploadPhotoButton = document.getElementById("uploadPhotoButton");
const uploadStatus = document.getElementById("uploadStatus");


let employees = [];


/* =========================
   SUPABASE AUTH
========================= */

let accessToken = null;

const hashParams = new URLSearchParams(
    window.location.hash.substring(1)
);

if (hashParams.get("access_token")) {

    accessToken = hashParams.get("access_token");

    listPage.style.display = "none";
    detailsPage.style.display = "none";
    loginPage.style.display = "none";
    adminPage.style.display = "none";
    resetPasswordPage.style.display = "block";
}



/* =========================
   DESIGNATION NORMALIZATION
========================= */

const DESIGNATION_ORDER = [
    "Executive Director (ED)",
    "Chief Financial Officer (CFO)",
    "Chief Marketing Officer (CMO)",
    "Head of Operation",
    "Head of Planning",
    "Head of Supply Chain Management",
    "Divisional Head",
    "Deputy General Manager (DGM)",
    "Asst. General Manager (AGM)",
    "Sr. Manager",
    "Manager",
    "In Charge",
    "Deputy Manager",
    "Asst. Manager",
    "CS Team Lead",
    "Team Lead",
    "Sr. Executive",
    "Sr. Designer",
    "Executive",
    "Designer",
    "Graphics Designer",
    "3D Designer",
    "Fashion Designer",
    "Interior Designer",
    "Jr. Executive",
    "Jr. Merchandiser",
    "Data Management Officer (DMO)",
    "Pattern Master",
    "Messenger",
    "Office Assistant",
    "Driver",
    "Delivery Man",
    "Intern"
];

const DESIGNATION_RANK = new Map(
    DESIGNATION_ORDER.map(
        (designation, index) => [designation, index]
    )
);

function normalizeDesignation(designation) {

    const value = String(designation || "").trim();

    const groups = {
        "Executive Director (ED)": [
            "Executive Director",
            "ED"
        ],
        "Chief Financial Officer (CFO)": [
            "Chief Financial Officer",
            "CFO"
        ],
        "Chief Marketing Officer (CMO)": [
            "Chief Marketing Officer",
            "CMO"
        ],
        "Deputy General Manager (DGM)": [
            "Deputy General Manager",
            "DGM"
        ],
        "Asst. General Manager (AGM)": [
            "Asst. General Manager",
            "AGM"
        ],
        "Data Management Officer (DMO)": [
            "Data Management Officer",
            "DMO"
        ]
    };

    for (const [groupName, values] of Object.entries(groups)) {
        if (values.some(item =>
            item.toLowerCase() === value.toLowerCase()
        )) {
            return groupName;
        }
    }

    return value || "Other";
}

function populateDesignationFilter() {

    const filter = document.getElementById("designationFilter");

    if (!filter) return;

    const designations = [...new Set(
        employees.map(employee =>
            normalizeDesignation(employee.designation)
        )
    )].filter(Boolean);

    designations.sort((a, b) => {
        const rankA =
            DESIGNATION_RANK.has(a)
                ? DESIGNATION_RANK.get(a)
                : DESIGNATION_ORDER.length;

        const rankB =
            DESIGNATION_RANK.has(b)
                ? DESIGNATION_RANK.get(b)
                : DESIGNATION_ORDER.length;

        if (rankA !== rankB) {
            return rankA - rankB;
        }

        return a.localeCompare(b);
    });

    filter.innerHTML =
        '<option value="">All Designations</option>';

    designations.forEach(designation => {

        const option = document.createElement("option");

        option.value = designation;
        option.textContent = designation;

        filter.appendChild(option);

    });
}

/* =========================
   LOAD EMPLOYEES
========================= */

async function loadEmployees() {

    employeeList.innerHTML =
        "<p>Loading employees...</p>";

    try {

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/employee_directory?select=*`,
            {
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${SUPABASE_KEY}`
                }
            }
        );


        if (!response.ok) {

            throw new Error(
                "Supabase error: " + response.status
            );

        }


        employees = await response.json();

        // Load favorite status from Supabase
        favoriteEmployees = employees
            .filter(employee => employee.favorite === true)
            .map(employee => String(employee.employee_no));

        localStorage.setItem(
            "favoriteEmployees",
            JSON.stringify(favoriteEmployees)
        );


        showDepartmentCards();

        showEmployees(employees);

        populateDesignationFilter();
        loadEmployeeSelect();


    } catch (error) {

        console.error(error);


        employeeList.innerHTML =
            "<p>Employee data load হয়নি।</p>";


        resultCount.textContent = "";

    }

}


/* =========================
   INITIALS
========================= */

function getInitials(name) {

    if (!name) {

        return "E";

    }


    const words =
        name.trim().split(/\s+/);


    if (words.length === 1) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        words[0].charAt(0) +
        words[1].charAt(0)
    ).toUpperCase();

}


/* =========================
   PHOTO URL
========================= */

function getPhoto(employee) {
    const employeeNo = String(
        employee.employee_no || employee.emp_no || employee.employeeNo || ""
    ).trim();

    if (!employeeNo) {
        return '<div class="employee-photo-placeholder">No Photo</div>';
    }

    const photoUrl =
        "http://192.168.2.205:8766/photos/" +
        encodeURIComponent(employeeNo) + ".jpg";

    return `
        <img
            src="${photoUrl}"
            alt="Employee photo"
            class="employee-photo"
            loading="lazy"
            style="width:64px;height:64px;object-fit:cover;border-radius:50%;"
            onerror="this.outerHTML='<div class=&quot;employee-photo-placeholder&quot;>No Photo</div>'"
        >
    `;
}

function showDepartmentCards() {

    departmentCards.innerHTML = "";

    const departments = {};

    employees.forEach((employee) => {

        const department =
            (employee.department || "Other").trim();

        if (!departments[department]) {
            departments[department] = [];
        }

        departments[department].push(employee);
    });

    const departmentNames =
        Object.keys(departments).sort((a, b) =>
            a.localeCompare(b)
        );

    departmentNames.forEach((department, index) => {

        const card =
            document.createElement("button");

        card.type = "button";
        card.className =
            "department-card department-color-" +
            ((index % 30) + 1);

        card.innerHTML = `
            <span class="department-name">
                ${department}
            </span>
            <span class="department-count">
                ${departments[department].length} Employees
            </span>
        `;

        card.onclick = function(event) {
            event.preventDefault();
            event.stopPropagation();

            searchInput.value = "";

            departmentPageTitle.textContent = department;

            departmentCards.style.display = "none";
            departmentEmployeeList.innerHTML = "";
            departmentEmployeeList.style.display = "flex";

            const selectedEmployees = departments[department];

            selectedEmployees.forEach((employee) => {
                const div = document.createElement("div");
                div.className = "employee-card";

                div.innerHTML = `
                    <div class="employee-card-top">
                        ${getPhoto(employee)}
                        <div class="employee-card-info">
                            <h3>${employee.employee_name || "-"}</h3>
                            <p>${employee.designation || "-"}</p>
                            <span>${employee.employee_no || "-"}</span>
                        </div>
                    </div>
                    <div class="employee-card-actions">

                        <button class="favorite-button" type="button">
                            ${isFavorite(employee) ? "❤️" : "♡"}
                        </button>

                        <button class="view-button" type="button">
                            View Details
                        </button>

                    </div>
                `;

                div.querySelector(".view-button").addEventListener(
                    "click",
                    function() {
                        showDetails(employee, "department");
                    }
                );

                div.querySelector(".favorite-button")
                    .addEventListener(
                        "click",
                        function() {
                            toggleFavorite(employee);
                            this.textContent =
                                isFavorite(employee) ? "❤️" : "♡";
                        }
                    );

                departmentEmployeeList.appendChild(div);
            });

            listPage.style.display = "none";
            departmentPage.style.display = "block";

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        };

        departmentCards.appendChild(card);
    });

    departmentSection.style.display =
        departmentNames.length ? "block" : "none";
}

function showFavoriteEmployees() {

    favoriteEmployeeList.innerHTML = "";

    const favorites = employees.filter(function(employee) {
        return isFavorite(employee);
    });

    if (favorites.length === 0) {
        favoriteEmployeeList.innerHTML =
            "<p>No favorite employees found.</p>";
        return;
    }

    favorites.forEach(function(employee) {

        const div = document.createElement("div");

        div.className = "employee-card";

        div.innerHTML = `
            <div class="employee-card-top">
                ${getPhoto(employee)}
                <div class="employee-card-info">
                    <h3>${employee.employee_name || "-"}</h3>
                    <p>${employee.designation || "-"}</p>
                    <span>${employee.employee_no || "-"}</span>
                </div>
            </div>

            <div class="employee-card-actions">

                <button class="favorite-button" type="button">
                    ❤️
                </button>

                <button class="view-button" type="button">
                    View Details
                </button>

            </div>
        `;

        div.querySelector(".favorite-button")
            .addEventListener(
                "click",
                function() {
                    toggleFavorite(employee);
                    showFavoriteEmployees();
                }
            );

        div.querySelector(".view-button")
            .addEventListener(
                "click",
                function() {
                    showDetails(employee, "favorite");
                }
            );

        favoriteEmployeeList.appendChild(div);
    });
}


function showEmployees(list, targetList = employeeList) {

    const sortedList = [...list].sort((a, b) => {

        const rankA =
            DESIGNATION_RANK.has(
                normalizeDesignation(a.designation)
            )
                ? DESIGNATION_RANK.get(
                    normalizeDesignation(a.designation)
                )
                : DESIGNATION_ORDER.length;

        const rankB =
            DESIGNATION_RANK.has(
                normalizeDesignation(b.designation)
            )
                ? DESIGNATION_RANK.get(
                    normalizeDesignation(b.designation)
                )
                : DESIGNATION_ORDER.length;

        if (rankA !== rankB) {
            return rankA - rankB;
        }

        return String(a.employee_name || "")
            .localeCompare(
                String(b.employee_name || "")
            );
    });

    targetList.innerHTML = "";


    if (targetList === employeeList) {
        resultCount.textContent =
            `${list.length} employee${list.length === 1 ? "" : "s"} found`;
    }


    if (list.length === 0) {

        targetList.innerHTML =
            "<p>No employees found.</p>";

        return;

    }


    sortedList.forEach((employee) => {

        const div =
            document.createElement("div");


        div.className =
            "employee-card";


        div.innerHTML = `

            <div class="employee-card-top">

                ${getPhoto(employee)}

                <div class="employee-card-info">

                    <h3>
                        ${employee.employee_name || "-"}
                    </h3>

                    <p>
                        ${employee.designation || "-"}
                    </p>

                    <span>
                        ${employee.employee_no || "-"}
                    </span>

                </div>

            </div>


            <div class="employee-card-actions">

                <button class="favorite-button" type="button">

                    ${isFavorite(employee) ? "❤️" : "♡"}

                </button>

                <button class="view-button" type="button">

                    View Details

                </button>

            </div>

        `;


        div.querySelector(".view-button")
            .addEventListener(
                "click",
                function() {

                    showDetails(employee, "allEmployees");

                }
            );


        div.querySelector(".favorite-button")
            .addEventListener(
                "click",
                function() {
                    toggleFavorite(employee);
                    this.textContent =
                        isFavorite(employee) ? "❤️" : "♡";
                }
            );

        targetList.appendChild(div);

    });

}


/* =========================
   EMPLOYEE DETAILS
========================= */

let detailsPreviousPage = "list";

function showDetails(employee, previousPage = "list") {

    detailsPreviousPage = previousPage;

    listPage.style.display =
        "none";

    allEmployeesPage.style.display =
        "none";

    departmentPage.style.display =
        "none";

    favoritePage.style.display =
        "none";


    detailsPage.style.display =
        "block";


    employeeDetails.innerHTML = `

        <div class="profile-card">

            <div class="profile-photo">

                ${getPhoto(employee)}

            </div>


            <h2>

                ${employee.employee_name || "-"}

            </h2>


            <p class="profile-designation">

                ${employee.designation || "-"}

            </p>


            <p class="profile-company">

                ${employee.company || "-"}

            </p>

        </div>


        <div class="details-card">

            <div class="detail-row">
                <span>Employee ID</span>
                <strong>${employee.employee_no || "-"}</strong>
            </div>

            <div class="detail-row">
                <span>Department</span>
                <strong>${employee.department || "-"}</strong>
            </div>

            <div class="detail-row">
                <span>Official No.</span>
                <strong>${employee.phone_official || "-"}</strong>
            </div>

            <div class="detail-row">
                <span>Personal No.</span>
                <strong>${employee.personal_no || "-"}</strong>
            </div>

            <div class="detail-row">
                <span>Email Address</span>
                <strong>${employee.email_official || "-"}</strong>
            </div>

            <div class="detail-row">
                <span>PABX No.</span>
                <strong>${employee.pabx_number || "-"}</strong>
            </div>

            <div class="detail-row">
                <span>Blood Group</span>
                <strong>${employee.blood_group || "-"}</strong>
            </div>

            <div class="detail-row">
                <span>Joining Date</span>
                <strong>${employee.joining_date || "-"}</strong>
            </div>

            <div class="detail-row">
                <span>Service Duration</span>
                <strong>${(() => {
                    const raw = employee.joining_date;
                    if (!raw) return "-";

                    const parts = String(raw).slice(0, 10).split("-").map(Number);
                    if (parts.length !== 3 || parts.some(n => !n)) return "-";

                    const start = new Date(parts[0], parts[1] - 1, parts[2]);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    if (start > today) return "-";

                    let years = today.getFullYear() - start.getFullYear();
                    let months = today.getMonth() - start.getMonth();
                    let days = today.getDate() - start.getDate();

                    if (days < 0) {
                        months--;
                        days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
                    }

                    if (months < 0) {
                        years--;
                        months += 12;
                    }

                    return years + " Years, " + months + " Months, " + days + " Days";
                })()}</strong>
            </div>

            <div class="detail-row">
                <span>Date of Birth</span>
                <strong>${employee.birthday || "-"}</strong>
            </div>

            <div class="detail-row">
                <span>NID No.</span>
                <strong>${employee.nid || "-"}</strong>
            </div>

            <div class="detail-row">
                <span>TIN No.</span>
                <strong>${employee.tin_no || "-"}</strong>
            </div>

            <div class="detail-row qr-code-row">
                <span>QR Code</span>
                <div id="employeeQRCode"></div>
            </div>

        </div>

    `;


    const qrContainer = document.getElementById("employeeQRCode");

    if (qrContainer && employee.employee_no) {
        const qrUrl =
            "https://www.dekkolegacy.com/employees/" +
            encodeURIComponent(employee.employee_no);

        const img = document.createElement("img");
        img.src =
            "https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=" +
            encodeURIComponent(qrUrl);
        img.width = 130;
        img.height = 130;
        img.alt = "QR Code";

        qrContainer.innerHTML = "";
        qrContainer.appendChild(img);
    }
}


/* =========================
   EMPLOYEE SELECT
========================= */

function loadEmployeeSelect() {

    employeeSelect.innerHTML = `
        <option value="">
            Select employee
        </option>
    `;


    employees.forEach((employee) => {

        const option =
            document.createElement("option");


        option.value =
            employee.employee_no;


        option.textContent =
            `${employee.employee_no} - ${employee.employee_name}`;


        employeeSelect.appendChild(option);

    });

}


/* =========================
   ADMIN BUTTON
========================= */

if (adminButton) {
    adminButton.addEventListener(
        "click",
        function() {

            listPage.style.display = "none";
            detailsPage.style.display = "none";
            loginPage.style.display = "block";
            loginStatus.textContent = "";

        }
    );
}


/* =========================
   LOGIN BACK
========================= */

loginBackButton.addEventListener(
    "click",
    function() {

        loginPage.style.display =
            "none";


        listPage.style.display =
            "block";

    }
);


/* =========================
   RESET PASSWORD
========================= */

updatePasswordButton.addEventListener(
    "click",
    async function() {

        const password = newPassword.value;
        const confirm = confirmPassword.value;

        if (!password || !confirm) {
            resetStatus.textContent =
                "Please enter both password fields.";
            return;
        }

        if (password !== confirm) {
            resetStatus.textContent =
                "Passwords do not match.";
            return;
        }

        resetStatus.textContent =
            "Updating password...";

        try {

            const response = await fetch(
                `${SUPABASE_URL}/auth/v1/user`,
                {
                    method: "PUT",

                    headers: {
                        "apikey": SUPABASE_KEY,
                        "Authorization":
                            "Bearer " + accessToken,
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        password: password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.msg ||
                    data.error_description ||
                    "Password update failed."
                );
            }

            resetStatus.textContent =
                "Password updated successfully.";

            newPassword.value = "";
            confirmPassword.value = "";

        } catch (error) {

            console.error(error);

            resetStatus.textContent =
                error.message;
        }
    }
);


/* =========================
   FORGOT PASSWORD
========================= */

forgotPasswordButton.addEventListener(
    "click",
    async function() {

        const email = adminEmail.value.trim();

        if (!email) {
            loginStatus.textContent =
                "Please enter your admin email first.";
            return;
        }

        loginStatus.textContent =
            "Sending password reset email...";

        try {

            const response = await fetch(
                `${SUPABASE_URL}/auth/v1/recover`,
                {
                    method: "POST",

                    headers: {
                        "apikey": SUPABASE_KEY,
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email: email,
                        redirect_to: window.location.origin +
                            window.location.pathname
                    })
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(
                    data.msg ||
                    data.error_description ||
                    "Password reset failed."
                );
            }

            loginStatus.textContent =
                "Password reset email sent. Check your email.";

        } catch (error) {

            console.error(error);

            loginStatus.textContent =
                error.message;
        }
    }
);


/* =========================
   RESTORE SAVED ADMIN SESSION
========================= */

async function restoreSavedAdminSession() {

    const savedSession =
        localStorage.getItem(
            "dekko_admin_session"
        );

    if (!savedSession) return;

    try {

        const session =
            JSON.parse(savedSession);

        if (!session.access_token) {
            localStorage.removeItem(
                "dekko_admin_session"
            );
            return;
        }

        const response =
            await fetch(
                `${SUPABASE_URL}/auth/v1/user`,
                {
                    headers: {
                        "apikey": SUPABASE_KEY,
                        "Authorization":
                            "Bearer " +
                            session.access_token
                    }
                }
            );

        if (!response.ok) {
            localStorage.removeItem(
                "dekko_admin_session"
            );
            return;
        }

        accessToken =
            session.access_token;

        loginPage.style.display =
            "none";

        adminPage.style.display =
            "block";

        uploadStatus.textContent = "";

        console.log(
            "Saved admin session restored."
        );

    } catch (error) {

        console.error(
            "Session restore failed:",
            error
        );

        localStorage.removeItem(
            "dekko_admin_session"
        );
    }
}

restoreSavedAdminSession();


/* =========================
   ADMIN LOGIN
========================= */

loginButton.addEventListener(
    "click",
    async function() {

        const email =
            adminEmail.value.trim();


        const password =
            adminPassword.value;


        if (!email) {

            loginStatus.textContent =
                "Please enter email.";

            return;

        }


        if (!password) {

            loginStatus.textContent =
                "Please enter password.";

            return;

        }


        loginStatus.textContent =
            "Logging in...";


        try {

            const response =
                await fetch(
                    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
                    {
                        method: "POST",

                        headers: {
                            "apikey": SUPABASE_KEY,
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            email: email,
                            password: password
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error_description ||
                    data.msg ||
                    "Login failed."
                );

            }


            accessToken =
                data.access_token;

            if (rememberLogin && rememberLogin.checked) {

                localStorage.setItem(
                    "dekko_admin_session",
                    JSON.stringify({
                        access_token: data.access_token,
                        refresh_token: data.refresh_token || null
                    })
                );

            } else {

                localStorage.removeItem(
                    "dekko_admin_session"
                );
            }


            loginStatus.textContent =
                "Login successful!";


            adminEmail.value = "";

            adminPassword.value = "";


            loginPage.style.display =
                "none";


            adminPage.style.display =
                "block";


            uploadStatus.textContent = "";

            if (window.__openSalaryAfterLogin) {
                window.__openSalaryAfterLogin = false;

                const salaryBtn =
                    document.getElementById("salaryButton");

                if (salaryBtn) salaryBtn.click();
            }


        } catch (error) {

            console.error(error);


            loginStatus.textContent =
                "Login failed: " +
                error.message;

        }

    }
);


/* =========================
   ADMIN BACK
========================= */

adminBackButton.addEventListener(
    "click",
    function() {

        adminPage.style.display =
            "none";


        listPage.style.display =
            "block";


        uploadStatus.textContent =
            "";

    }
);


/* =========================
   LOGOUT
========================= */

logoutButton.addEventListener(
    "click",
    function() {

        accessToken = null;

        localStorage.removeItem(
            "dekko_admin_session"
        );


        adminPage.style.display =
            "none";


        listPage.style.display =
            "block";


        uploadStatus.textContent =
            "";

    }
);


/* =========================
   PHOTO UPLOAD
========================= */

uploadPhotoButton.addEventListener(
    "click",
    async function() {

        if (!accessToken) {

            uploadStatus.textContent =
                "Please login first.";

            return;

        }


        const employeeNo =
            employeeSelect.value;


        const file =
            photoInput.files[0];


        if (!employeeNo) {

            uploadStatus.textContent =
                "Please select an employee.";

            return;

        }


        if (!file) {

            uploadStatus.textContent =
                "Please select a photo.";

            return;

        }


        const employee =
            employees.find(
                e =>
                    e.employee_no === employeeNo
            );


        if (!employee) {

            uploadStatus.textContent =
                "Employee not found.";

            return;

        }


        uploadStatus.textContent =
            "Uploading photo...";


        try {

            const extension =
                file.name
                    .split(".")
                    .pop()
                    .toLowerCase();


            const fileName =
                `${employeeNo}.${extension}`;


            const uploadResponse =
                await fetch(
                    `${SUPABASE_URL}/storage/v1/object/employee-photos/${fileName}`,
                    {
                        method: "POST",

                        headers: {
                            "apikey": SUPABASE_KEY,
                            "Authorization": `Bearer ${accessToken}`,
                            "Content-Type": file.type
                        },

                        body: file
                    }
                );


            if (!uploadResponse.ok) {

                const errorText =
                    await uploadResponse.text();


                throw new Error(
                    errorText
                );

            }


            const updateResponse =
                await fetch(
                    `${SUPABASE_URL}/rest/v1/employee_dekko_v2?employee_no=eq.${encodeURIComponent(employeeNo)}`,
                    {
                        method: "PATCH",

                        headers: {
                            "apikey": SUPABASE_KEY,
                            "Authorization": `Bearer ${accessToken}`,
                            "Content-Type": "application/json",
                            "Prefer": "return=minimal"
                        },

                        body: JSON.stringify({
                            photo_path: fileName
                        })
                    }
                );


            if (!updateResponse.ok) {

                throw new Error(
                    "Photo uploaded but database update failed."
                );

            }


            uploadStatus.textContent =
                "Photo uploaded successfully!";


            photoInput.value = "";


            await loadEmployees();


        } catch (error) {

            console.error(error);


            uploadStatus.textContent =
                "Upload failed: " +
                error.message;

        }

    }
);


/* =========================
   BACK BUTTON
========================= */

backButton.addEventListener(

    "click",

    function() {

        detailsPage.style.display =
            "none";

        if (detailsPreviousPage === "favorite") {

            listPage.style.display =
                "none";

            departmentPage.style.display =
                "none";

            favoritePage.style.display =
                "block";

            showFavoriteEmployees();

        } else if (detailsPreviousPage === "department") {

            listPage.style.display =
                "none";

            allEmployeesPage.style.display =
                "none";

            favoritePage.style.display =
                "none";

            departmentPage.style.display =
                "block";

            departmentCards.style.display =
                "none";

        } else if (detailsPreviousPage === "allEmployees") {

            departmentPage.style.display =
                "none";

            favoritePage.style.display =
                "none";

            listPage.style.display =
                "none";

            allEmployeesPage.style.display =
                "block";

            showEmployees(employees);

        } else {

            favoritePage.style.display =
                "none";

            departmentPage.style.display =
                "none";

            listPage.style.display =
                "block";

            departmentSection.style.display =
                "block";

            employeeList.style.display =
                "block";
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }

);


/* =========================
   ALL DEPARTMENTS
========================= */

allDepartmentsButton.addEventListener(
    "click",
    function() {

        listPage.style.display = "none";
        allEmployeesPage.style.display = "none";
        favoritePage.style.display = "none";
        birthdayPage.style.display = "none";
        detailsPage.style.display = "none";

        departmentCards.style.display = "grid";
        departmentEmployeeList.innerHTML = "";

        departmentPage.style.display = "block";

        departmentPageTitle.textContent = "🏢 All Departments";
        departmentEmployeeList.innerHTML = "";

        showDepartmentCards();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
);


/* =========================
   FAVORITE EMPLOYEES
========================= */

favoriteEmployeesButton.addEventListener(
    "click",
    function() {

        showFavoriteEmployees();

        listPage.style.display = "none";
        departmentPage.style.display = "none";
        favoritePage.style.display = "block";

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
);


favoriteBackButton.addEventListener(
    "click",
    function() {

        favoritePage.style.display = "none";
        listPage.style.display = "block";

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
);


/* =========================
   DEPARTMENT / ALL EMPLOYEES
========================= */

allEmployeesButton.addEventListener(
    "click",
    function() {

        searchInput.value = "";

        listPage.style.display = "none";
        departmentPage.style.display = "none";
        favoritePage.style.display = "none";
        birthdayPage.style.display = "none";

        allEmployeesPage.style.display = "block";

        showEmployees(employees);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
);

if (allEmployeesBackButton) {
    allEmployeesBackButton.addEventListener(
        "click",
        function() {

            allEmployeesPage.style.display = "none";
            listPage.style.display = "block";

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }
    );
}


/* =========================
   SEARCH
========================= */

searchInput.addEventListener(
    "input",
    function() {

        const searchText =
            searchInput.value
                .toLowerCase()
                .trim();

        const selectedDesignation =
            designationFilter
                ? designationFilter.value
                : "";

        const selectedBloodGroup = bloodGroupFilter ? bloodGroupFilter.value : "";

        const filtered =
            employees.filter(employee => {

                const matchesDesignation =
                    !selectedDesignation ||
                    normalizeDesignation(
                        employee.designation
                    ) === selectedDesignation;

                const text =
                    `${employee.employee_name || ""} ` +
                    `${employee.employee_no || ""} ` +
                    `${employee.company || ""} ` +
                    `${employee.department || ""} ` +
                    `${employee.designation || ""}`;

                const matchesSearch =
                    !searchText ||
                    text.toLowerCase()
                        .includes(searchText);

                const matchesBloodGroup =
                    !selectedBloodGroup ||
                    String(employee.blood_group || "").trim().toUpperCase() === selectedBloodGroup;

                return matchesDesignation && matchesBloodGroup && matchesSearch;
            });

        showEmployees(filtered);

    }
);



/* =========================
   CLEAR SEARCH
========================= */

clearSearch.addEventListener(
    "click",
    function() {

        searchInput.value = "";

        if (designationFilter) {
            designationFilter.value = "";
        }

        if (bloodGroupFilter) {
            bloodGroupFilter.value = "";
        }

        showEmployees(employees);


        searchInput.focus();

    }
);


/* =========================
   START APP
========================= */

loadEmployees();


/* =========================
   CREATE NEW USER
========================= */

document.addEventListener("DOMContentLoaded", function () {

    const createUserButton = document.getElementById("createUserButton");

    if (!createUserButton) return;

    createUserButton.addEventListener("click", async function () {

        const email = prompt("Enter new user email:");

        if (!email) return;

        const password = prompt("Enter password (minimum 6 characters):");

        if (!password) return;

        if (password.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }

        createUserButton.disabled = true;
        createUserButton.textContent = "Creating...";

        try {

            const response = await fetch(
                `${SUPABASE_URL}/auth/v1/signup`,
                {
                    method: "POST",
                    headers: {
                        "apikey": SUPABASE_KEY,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );

            const data = await response.json();

            console.log("Create User Response:", data);

            if (!response.ok) {
                throw new Error(
                    data.msg ||
                    data.message ||
                    data.error_description ||
                    "User creation failed"
                );
            }

            alert(
                "User created successfully!\n\n" +
                "Email: " + email
            );

        } catch (error) {

            console.error("Create User Error:", error);

            alert(
                "User creation failed:\n\n" +
                error.message
            );

        } finally {

            createUserButton.disabled = false;
            createUserButton.textContent = "Create New User";

        }

    });

});

/* =========================
   BIRTHDAY FEATURE
========================= */

function showBirthdayEmployees(month) {
    if (!birthdayEmployeeList) return;

    const monthNumber = String(month).padStart(2, "0");

    const birthdayEmployees = employees
        .filter(employee => {
            const birthday = String(employee.birthday || "").trim();
            return /^\d{1,2}-\d{1,2}$/.test(birthday) &&
                   birthday.split("-")[1].padStart(2, "0") === monthNumber;
        })
        .sort((a, b) => {
            const dayA = parseInt(String(a.birthday).split("-")[0], 10);
            const dayB = parseInt(String(b.birthday).split("-")[0], 10);
            return dayA - dayB;
        });

    if (birthdayEmployees.length === 0) {
        birthdayEmployeeList.innerHTML =
            '<p class="no-birthday">No birthdays in this month.</p>';
        return;
    }

    birthdayEmployeeList.innerHTML = `
        <div class="birthday-table-wrapper">
            <table class="birthday-table">
                <thead>
                    <tr>
                        <th>Sl.</th>
                        <th>Employee Name</th>
                        <th>Designation</th>
                        <th>Department</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${birthdayEmployees.map((employee, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${employee.name || employee.employee_name || ""}</td>
                            <td>${employee.designation || ""}</td>
                            <td>${employee.department || ""}</td>
                            <td>${(() => {
                                const parts = String(employee.birthday || "").split("-");
                                const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
                                if (parts.length === 2) {
                                    const day = parts[0].padStart(2, "0");
                                    const month = months[parseInt(parts[1], 10) - 1];
                                    return month ? `${day} ${month}` : employee.birthday || "";
                                }
                                return employee.birthday || "";
                            })()}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

function openBirthdayPage() {
    listPage.style.display = "none";
    adminButton.style.setProperty("display", "none", "important");
    document.getElementById("appTitle").style.display = "none";
    departmentSection.style.display = "none";
    employeeList.style.display = "none";
    departmentPage.style.display = "none";
    favoritePage.style.display = "none";
    detailsPage.style.display = "none";
    birthdayPage.style.display = "block";

    birthdayEmployeeList.innerHTML =
        '<p class="birthday-instruction">Select a month to view birthdays.</p>';
}

if (birthdayButton) {
    birthdayButton.addEventListener("click", openBirthdayPage);
}

if (birthdayBackButton) {
    birthdayBackButton.addEventListener("click", () => {
        birthdayPage.style.display = "none";
        listPage.style.display = "block";
        adminButton.style.removeProperty("display");
        document.getElementById("appTitle").style.display = "";
        departmentSection.style.display = "block";
        employeeList.style.display = "block";
    });
}

if (birthdayMonths) {
    birthdayMonths.querySelectorAll("button").forEach(button => {
        button.addEventListener("click", () => {
            birthdayMonths.querySelectorAll("button").forEach(btn => {
                btn.classList.remove("active");
            });

            button.classList.add("active");
            showBirthdayEmployees(button.dataset.month);
        });
    });
}

/* =========================
   DESIGNATION FILTER
========================= */

const designationFilter =
    document.getElementById("designationFilter");

const bloodGroupFilter = document.getElementById("bloodGroupFilter");

if (designationFilter) {

    designationFilter.addEventListener(
        "change",
        function() {

            const selectedDesignation =
                this.value;
            const selectedBloodGroup = bloodGroupFilter ? bloodGroupFilter.value : "";

            const searchText =
                searchInput.value
                    .toLowerCase()
                    .trim();

            const filtered =
                employees.filter(employee => {

                    const matchesDesignation =
                        !selectedDesignation ||
                        normalizeDesignation(
                            employee.designation
                        ) === selectedDesignation;

                    const text =
                        `${employee.employee_name || ""} ` +
                        `${employee.employee_no || ""} ` +
                        `${employee.company || ""} ` +
                        `${employee.department || ""} ` +
                        `${employee.designation || ""}`;

                    const matchesSearch =
                        !searchText ||
                        text.toLowerCase()
                            .includes(searchText);

                    const matchesBloodGroup =
                        !selectedBloodGroup ||
                        String(employee.blood_group || "").trim().toUpperCase() === selectedBloodGroup;

                    return matchesDesignation && matchesBloodGroup && matchesSearch;
                });

            showEmployees(filtered);

        }
    );

}

/* =========================
   ADD NEW EMPLOYEE
========================= */

const showAddEmployeeButton =
    document.getElementById("showAddEmployeeButton");

const addEmployeeForm =
    document.getElementById("addEmployeeForm");

const saveNewEmployeeButton =
    document.getElementById("saveNewEmployeeButton");

const addEmployeeStatus =
    document.getElementById("addEmployeeStatus");

if (showAddEmployeeButton && addEmployeeForm) {

    showAddEmployeeButton.addEventListener(
        "click",
        function() {

            if (addEmployeeForm.style.display === "none") {

                addEmployeeForm.style.display = "block";

                showAddEmployeeButton.textContent =
                    "− Close Add Employee";

            } else {

                addEmployeeForm.style.display = "none";

                showAddEmployeeButton.textContent =
                    "+ Add New Employee";
            }

        }
    );
}

if (saveNewEmployeeButton) {

    saveNewEmployeeButton.addEventListener(
        "click",
        async function() {

            const employeeName =
                document.getElementById("newEmployeeName").value.trim();

            const designation =
                document.getElementById("newEmployeeDesignation").value.trim();

            const company =
                document.getElementById("newEmployeeCompany").value.trim();

            const employeeNo =
                document.getElementById("newEmployeeNo").value.trim();

            const department =
                document.getElementById("newEmployeeDepartment").value.trim();

            const officialNo =
                document.getElementById("newEmployeeOfficialNo").value.trim();

            const personalNo =
                document.getElementById("newEmployeePersonalNo").value.trim();

            const emailOfficial =
                document.getElementById("newEmployeeEmail").value.trim();

            const pabxNumber =
                document.getElementById("newEmployeePabx").value.trim();

            const bloodGroup =
                document.getElementById("newEmployeeBloodGroup").value.trim();

            const joiningDate =
                document.getElementById("newEmployeeJoiningDate").value;

            const birthday =
                document.getElementById("newEmployeeBirthday").value.trim();

            const nid =
                document.getElementById("newEmployeeNid").value.trim();

            const tinNo =
                document.getElementById("newEmployeeTin").value.trim();

            const bankName =
                document.getElementById("newEmployeeBankName").value.trim();

            const accountNo =
                document.getElementById("newEmployeeAccountNo").value.trim();

            if (!employeeName) {
                alert("Employee Name is required.");
                return;
            }

            if (!employeeNo) {
                alert("Employee ID is required.");
                return;
            }

            if (!accessToken) {
                alert("Please login first.");
                return;
            }

            saveNewEmployeeButton.disabled = true;
            saveNewEmployeeButton.textContent = "Saving...";

            addEmployeeStatus.textContent =
                "Saving employee...";

            try {

                const response = await fetch(
                    `${SUPABASE_URL}/rest/v1/employee_dekko_v2`,
                    {
                        method: "POST",

                        headers: {
                            "apikey": SUPABASE_KEY,
                            "Authorization":
                                `Bearer ${accessToken}`,
                            "Content-Type":
                                "application/json",
                            "Prefer":
                                "return=representation"
                        },

                        body: JSON.stringify({
                            employee_name: employeeName,
                            designation: designation,
                            company: company,
                            employee_no: employeeNo,
                            department: department,
                            phone_official: officialNo,
                            personal_no: personalNo,
                            email_official: emailOfficial,
                            pabx_number: pabxNumber,
                            blood_group: bloodGroup,
                            joining_date: joiningDate || null,
                            birthday: birthday,
                            nid: nid,
                            tin_no: tinNo,
                            bank_name: bankName,
                            account_no: accountNo
                        })
                    }
                );

                const data = await response.json();

                console.log(
                    "Add Employee Response:",
                    data
                );

                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        data.details ||
                        data.hint ||
                        data.error ||
                        "Employee could not be added."
                    );
                }

                addEmployeeStatus.textContent =
                    "Employee added successfully.";

                alert(
                    "Employee added successfully!"
                );

                document.getElementById(
                    "newEmployeeName"
                ).value = "";

                document.getElementById(
                    "newEmployeeDesignation"
                ).value = "";

                document.getElementById(
                    "newEmployeeCompany"
                ).value = "";

                document.getElementById(
                    "newEmployeeNo"
                ).value = "";

                document.getElementById(
                    "newEmployeeDepartment"
                ).value = "";

                document.getElementById(
                    "newEmployeeOfficialNo"
                ).value = "";

                document.getElementById(
                    "newEmployeePersonalNo"
                ).value = "";

                document.getElementById(
                    "newEmployeeEmail"
                ).value = "";

                document.getElementById(
                    "newEmployeePabx"
                ).value = "";

                document.getElementById(
                    "newEmployeeBloodGroup"
                ).value = "";

                document.getElementById(
                    "newEmployeeJoiningDate"
                ).value = "";

                document.getElementById(
                    "newEmployeeBirthday"
                ).value = "";

                document.getElementById(
                    "newEmployeeNid"
                ).value = "";

                document.getElementById(
                    "newEmployeeTin"
                ).value = "";

                document.getElementById("newEmployeeBankName").value = "";
                document.getElementById("newEmployeeAccountNo").value = "";

                await loadEmployees();

            } catch (error) {

                console.error(
                    "Add Employee Error:",
                    error
                );

                addEmployeeStatus.textContent =
                    "Error: " + error.message;

                alert(
                    "Employee could not be added:\n\n" +
                    error.message
                );

            } finally {

                saveNewEmployeeButton.disabled = false;

                saveNewEmployeeButton.textContent =
                    "Save Employee";
            }

        }
    );

}





/* ORGANOGRAM PAGE - BLANK WHITE PAGE */
(function () {
    const button = document.getElementById("organogramButton");
    const page = document.getElementById("organogramPage");
    const backButton = document.getElementById("organogramBackButton");
    const dashboard = document.getElementById("departmentSection");
    const appTitle = document.getElementById("appTitle");
    const bottomLogo = document.getElementById("homeBottomLogo");
    const employeeList = document.getElementById("employeeList");

    if (!button || !page || !backButton) return;

    button.addEventListener("click", function () {
        if (dashboard) dashboard.style.display = "none";
        if (appTitle) appTitle.style.display = "none";
        if (bottomLogo) bottomLogo.style.display = "none";
        if (employeeList) employeeList.style.display = "none";
        page.style.display = "block";
        page.style.background = "#fff";
        page.style.minHeight = "100vh";
    });

    backButton.addEventListener("click", function () {
        page.style.display = "none";
        if (dashboard) dashboard.style.display = "";
        if (appTitle) appTitle.style.display = "";
        if (bottomLogo) bottomLogo.style.display = "";
        if (employeeList) employeeList.style.display = "";
    });
})();

/* SALARY MANAGEMENT - ADMIN ONLY */
(function () {
    "use strict";

    const ADMIN_UID = "f0fcbd2e-003e-4fc2-bc2e-51b13c5f0814";

    document.addEventListener("DOMContentLoaded", function () {
        const $ = id => document.getElementById(id);
        const salaryButton = $("salaryButton");
        const salaryPage = $("salaryPage");
        const salaryStatus = $("salaryStatus");
        const management = $("salaryManagement");
        const loginButton = $("salaryLoginButton");
        const employeeSelect = $("salaryEmployee");
        const slipEmployee = $("paySlipEmployee");
        const monthInput = $("salaryMonth");
        const slipMonth = $("paySlipMonth");
        const saveStatus = $("salarySaveStatus");
        const slipResult = $("paySlipResult");
        const slipSearchInput = $("paySlipEmployeeSearch");
        const salarySearchInput = $("salaryEmployeeSearch");
        const salarySuggestions = $("salaryEmployeeSuggestions");

        if (salarySearchInput && employeeSelect && salarySuggestions) {
            function hideSalarySuggestions() {
                salarySuggestions.replaceChildren();
                salarySuggestions.hidden = true;
            }

            salarySearchInput.addEventListener("input", function () {
                const query = salarySearchInput.value.trim().toLowerCase();
                employeeSelect.value = "";
                hideSalarySuggestions();

                if (!query) return;

                const matches = Array.from(employeeSelect.options)
                    .filter(option => {
                        if (!option.value) return false;
                        const employee = employeeInfo.get(option.value);
                        const name = String(employee?.employee_name || "Unnamed");
                        const no = String(option.value);
                        return name.toLowerCase().includes(query) ||
                               no.toLowerCase().includes(query);
                    })
                    .slice(0, 12);

                matches.forEach(option => {
                    const button = document.createElement("button");
                    button.type = "button";
                    button.className = "salary-employee-suggestion";
                    button.setAttribute("role", "option");
                    const employee = employeeInfo.get(option.value);
                    const employeeName = String(employee?.employee_name || "Unnamed");
                    button.textContent = `${option.value} (${employeeName})`;

                    button.addEventListener("click", function () {
                        salarySearchInput.value = option.textContent;
                        employeeSelect.value = option.value;
                        hideSalarySuggestions();
                        employeeSelect.dispatchEvent(new Event("change", {
                            bubbles: true
                        }));
                    });

                    salarySuggestions.appendChild(button);
                });

                salarySuggestions.hidden = matches.length === 0;
            });

            salarySearchInput.addEventListener("keydown", function (event) {
                if (event.key === "Escape") hideSalarySuggestions();
            });

            document.addEventListener("click", function (event) {
                if (!salarySearchInput.contains(event.target) &&
                    !salarySuggestions.contains(event.target)) {
                    hideSalarySuggestions();
                }
            });
        }

        if (slipSearchInput && slipEmployee) {
            const slipSuggestions = $("paySlipEmployeeSuggestions");

            function hideSlipSuggestions() {
                if (!slipSuggestions) return;
                slipSuggestions.replaceChildren();
                slipSuggestions.hidden = true;
            }

            slipSearchInput.addEventListener("input", function () {
                const query = slipSearchInput.value.trim().toLowerCase();
                slipEmployee.value = "";
                hideSlipSuggestions();

                if (!query || !slipSuggestions) return;

                const matches = Array.from(slipEmployee.options)
                    .filter(option => {
                        if (!option.value) return false;
                        const employee = employeeInfo.get(String(option.value));
                        const no = String(option.value).toLowerCase();
                        const name = String(employee?.employee_name || "Unnamed").toLowerCase();

                        return no.includes(query) || name.includes(query);
                    })
                    .slice(0, 12);

                matches.forEach(option => {
                    const employee = employeeInfo.get(String(option.value));
                    const name = String(employee?.employee_name || "Unnamed");
                    const button = document.createElement("button");

                    button.type = "button";
                    button.className = "salary-employee-suggestion";
                    button.setAttribute("role", "option");
                    button.textContent = `${option.value} (${name})`;

                    button.addEventListener("click", function () {
                        slipSearchInput.value = button.textContent;
                        slipEmployee.value = option.value;
                        hideSlipSuggestions();
                        slipEmployee.dispatchEvent(new Event("change", {
                            bubbles: true
                        }));
                    });

                    slipSuggestions.appendChild(button);
                });

                slipSuggestions.hidden = matches.length === 0;
            });

            slipSearchInput.addEventListener("keydown", function (event) {
                if (event.key === "Escape") hideSlipSuggestions();
            });

            document.addEventListener("click", function (event) {
                if (!slipSearchInput.contains(event.target) &&
                    (!slipSuggestions || !slipSuggestions.contains(event.target))) {
                    hideSlipSuggestions();
                }
            });
        }

        if (!salaryButton || !salaryPage || !management) {
            console.error("Salary HTML elements not found.");
            return;
        }

        const currentMonth = new Date().toISOString().slice(0, 7);
        if (monthInput) monthInput.value = currentMonth;
        if (slipMonth) slipMonth.value = currentMonth;

        let employeeNumbers = new Set();
        let employeeInfo = new Map();

        async function checkAdmin() {
            if (!accessToken) throw new Error("Please log in first.");

            const response = await fetch(SUPABASE_URL + "/auth/v1/user", {
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization: "Bearer " + accessToken
                }
            });

            if (!response.ok) throw new Error("Session expired. Please log in again.");

            const user = await response.json();
            if (user.id !== ADMIN_UID) {
                throw new Error("This account is not authorized for Salary Management.");
            }
        }

        function apiHeaders() {
            return {
                apikey: SUPABASE_KEY,
                Authorization: "Bearer " + accessToken,
                "Content-Type": "application/json"
            };
        }

        async function loadEmployees() {
            const response = await fetch(
                SUPABASE_URL +
                "/rest/v1/employee_dekko_v2?select=employee_no,employee_name,department,designation,joining_date,bank_name,account_no&order=employee_name.asc",
                { headers: apiHeaders() }
            );

            if (!response.ok) {
                throw new Error("Employee list error: " + await response.text());
            }

            const employees = await response.json();
            employeeNumbers = new Set();
            employeeInfo = new Map();

            const slipSearch = $("paySlipEmployeeSearch");
            const slipOptions = $("paySlipEmployeeOptions");
            const salarySearch = $("salaryEmployeeSearch");

            [employeeSelect, slipEmployee].forEach(select => {
                if (select) select.replaceChildren(new Option("Select employee", ""));
            });
            if (slipOptions) slipOptions.replaceChildren();
            if (slipSearch) slipSearch.value = "";
            if (salarySearch) salarySearch.value = "";

            employees.sort((a, b) =>
                String(a.employee_no || "").localeCompare(
                    String(b.employee_no || ""),
                    undefined,
                    { numeric: true, sensitivity: "base" }
                )
            );

            employees.forEach(employee => {
                if (!employee.employee_no) return;

                const no = String(employee.employee_no);
                const name = employee.employee_name || "Unnamed";
                employeeNumbers.add(no);
                employeeInfo.set(no, employee);

                const salaryLabel = [
                    name,
                    no,
                    employee.department || ""
                ].filter(Boolean).join(" — ");

                const slipLabel = `${no} (${name})`;

                if (employeeSelect) {
                    employeeSelect.add(new Option(salaryLabel, no));
                }
if (slipEmployee) {
                    slipEmployee.add(new Option(slipLabel, no));
                }
                if (slipOptions) {
                    slipOptions.appendChild(new Option(slipLabel, slipLabel));
                }
            });

            if (!employeeNumbers.size) throw new Error("No employees found.");
        }

        async function initializeSalary() {
            management.style.display = "none";
            if (loginButton) loginButton.style.display = "none";
            salaryStatus.textContent = "Checking Admin access...";

            try {
                await checkAdmin();
                await loadEmployees();
                management.style.display = "block";
                salaryStatus.textContent = "Admin verified. Salary Management is ready.";
            } catch (error) {
                salaryStatus.textContent = error.message;
                if (loginButton) loginButton.style.display = "inline-block";
            }
        }

        salaryButton.addEventListener("click", async function () {
            try {
                await checkAdmin();
            } catch (error) {
                if (!accessToken) {
                    window.__openSalaryAfterLogin = true;

                    if (listPage) listPage.style.display = "none";
                    if (detailsPage) detailsPage.style.display = "none";
                    if (loginPage) loginPage.style.display = "block";

                    if (loginStatus) {
                        loginStatus.textContent =
                            "Please log in to access Salary Management.";
                    }
                    return;
                }

                window.alert(error.message || "Access denied.");
                return;
            }

            const idsToHide = [
                "listPage", "allEmployeesPage", "favoritePage",
                "birthdayPage", "departmentPage", "detailsPage",
                "adminPage", "loginPage"
            ];

            idsToHide.forEach(id => {
                const page = $(id);
                if (page) page.style.display = "none";
            });

            const departmentSection = $("departmentSection");
            const employeeList = $("employeeList");
            const appTitle = $("appTitle");

            if (departmentSection) departmentSection.style.display = "none";
            if (employeeList) employeeList.style.display = "none";
            if (appTitle) appTitle.style.display = "none";

            salaryPage.style.display = "block";
            window.scrollTo({ top: 0, behavior: "smooth" });
            initializeSalary();
        });

        const salaryBackButton = $("salaryBackButton");
        if (salaryBackButton) {
            salaryBackButton.addEventListener("click", function () {
                salaryPage.style.display = "none";

                const homePage = $("listPage");
                const adminButton = $("adminButton");
                const appTitle = $("appTitle");
                const departmentSection = $("departmentSection");
                const employeeList = $("employeeList");

                if (homePage) homePage.style.display = "block";
                if (adminButton) adminButton.style.removeProperty("display");
                if (appTitle) appTitle.style.display = "";
                if (departmentSection) departmentSection.style.display = "block";
                if (employeeList) employeeList.style.display = "block";

                window.scrollTo({ top: 0, behavior: "smooth" });
            });
        }

        if (loginButton) {
            loginButton.addEventListener("click", function () {
                salaryPage.style.display = "none";
                const adminButton = $("adminButton");
                if (adminButton) adminButton.click();
            });
        }

        function getAmount(id) {
            const n = Number($(id).value);
            if (!Number.isFinite(n) || n < 0) {
                throw new Error("Enter valid non-negative salary amounts.");
            }
            return Math.round(n * 100) / 100;
        }

        const deductionIds = [
            "absentAmount",
            "incomeTax",
            "lunchBill",
            "excessMobileBill",
            "loanRepayment",
            "otherDeductions"
        ];

        function roundedAmount(value) {
            return Math.round((value + Number.EPSILON) * 100) / 100;
        }

        function updateNet() {
            try {
                const payable = getAmount("payableSalary");
                const basic = roundedAmount(payable * 0.60);
                const houseRent = roundedAmount(payable * 0.30);
                const medical = roundedAmount(payable * 0.05);
                const conveyance = roundedAmount(payable * 0.05);
                const others = getAmount("othersAllowance");
                const deductions = deductionIds.reduce(
                    (sum, id) => sum + getAmount(id), 0
                );

                $("basicSalary").value = basic.toFixed(2);
                $("houseRentAllowance").value = houseRent.toFixed(2);
                $("medicalAllowance").value = medical.toFixed(2);
                $("conveyanceAllowance").value = conveyance.toFixed(2);

                $("salaryAllowances").value =
                    (houseRent + medical + conveyance + others).toFixed(2);
                $("salaryDeductions").value = deductions.toFixed(2);
                $("salaryNetPreview").textContent =
                    (payable + others - deductions).toFixed(2);
            } catch (_) {
                $("salaryNetPreview").textContent = "Invalid amount";
            }
        }

        ["payableSalary", "othersAllowance", ...deductionIds].forEach(id => {
            if ($(id)) $(id).addEventListener("input", updateNet);
        });

        function updatePresentDays() {
            const workingInput = $("salaryWorkingDays");
            const presentInput = $("salaryPresentDays");
            const leaveInput = $("salaryLeaveDays");
            const absentInput = $("salaryAbsentDays");

            if (!workingInput || !presentInput || !leaveInput || !absentInput) return;

            const workingText = workingInput.value.trim();
            const leaveText = leaveInput.value.trim();
            const absentText = absentInput.value.trim();

            if (workingText === "") {
                presentInput.value = "";
                return;
            }

            const working = Number(workingText);
            const leave = leaveText === "" ? 0 : Number(leaveText);
            const absent = absentText === "" ? 0 : Number(absentText);

            if (![working, leave, absent].every(Number.isInteger) ||
                working < 0 || leave < 0 || absent < 0 ||
                leave + absent > working) {
                presentInput.value = "";
                return;
            }

            presentInput.value = String(working - leave - absent);
        }

        ["salaryWorkingDays", "salaryLeaveDays", "salaryAbsentDays"].forEach(id => {
            const input = $(id);
            if (input) {
                input.addEventListener("input", updatePresentDays);
                input.addEventListener("change", updatePresentDays);
            }
        });
        updatePresentDays();

        async function saveRecords(records) {
            const response = await fetch(
                SUPABASE_URL +
                "/rest/v1/salary_records?on_conflict=employee_no,salary_month",
                {
                    method: "POST",
                    headers: {
                        ...apiHeaders(),
                        Prefer: "resolution=merge-duplicates,return=minimal"
                    },
                    body: JSON.stringify(records)
                }
            );

            if (!response.ok) {
                throw new Error("Database error (" + response.status + "): " +
                    await response.text());
            }
        }


        let isEditingSalary = false;
        let editingEmployeeNo = "";
        let editingMonth = "";
        let originalSalaryFormValues = null;

        const editSalaryButton = $("editSalaryButton");
        const cancelSalaryEditButton = $("cancelSalaryEditButton");
        const saveSalaryButton = $("saveSalaryButton");

        function setSalaryEditMode(enabled) {
            isEditingSalary = enabled;
            if (saveSalaryButton) {
                saveSalaryButton.textContent =
                    enabled ? "Update Salary" : "Save Salary";
            }
            if (cancelSalaryEditButton) {
                cancelSalaryEditButton.hidden = !enabled;
            }
            if (editSalaryButton) {
                editSalaryButton.disabled = enabled;
            }
        }

        if (editSalaryButton) {
            editSalaryButton.addEventListener("click", async function () {
                saveStatus.textContent = "Loading saved salary...";

                try {
                    await checkAdmin();

                    const employeeNo = employeeSelect.value;
                    const month = monthInput.value;

                    if (!employeeNumbers.has(employeeNo)) {
                        throw new Error("Select an employee first.");
                    }
                    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
                        throw new Error("Select a valid salary month.");
                    }

                    const query = new URLSearchParams({
                        select: "employee_no,salary_month,payable_salary,others_allowance,absent_amount,income_tax,lunch_bill,excess_mobile_bill,loan_repayment,other_deductions,working_days,present_days,leave_days,absent_days,payment_method",
                        employee_no: "eq." + employeeNo,
                        salary_month: "eq." + month,
                        limit: "1"
                    });

                    const response = await fetch(
                        SUPABASE_URL + "/rest/v1/salary_records?" + query,
                        { headers: apiHeaders() }
                    );

                    if (!response.ok) {
                        throw new Error(
                            "Could not load salary: " + await response.text()
                        );
                    }

                    const rows = await response.json();
                    if (!rows.length) {
                        throw new Error(
                            "No saved salary found for this employee and month."
                        );
                    }

                    const record = rows[0];
                    const setValue = (id, value) => {
                        const field = $(id);
                        if (field) {
                            field.value = value == null ? "" : String(value);
                        }
                    };

                    setValue("salaryWorkingDays", record.working_days);
                    setValue("salaryPresentDays", record.present_days);
                    setValue("salaryLeaveDays", record.leave_days);
                    setValue("salaryAbsentDays", record.absent_days);
                    updatePresentDays();
                    setValue("payableSalary", record.payable_salary ?? 0);
                    setValue("othersAllowance", record.others_allowance ?? 0);
                    setValue("absentAmount", record.absent_amount ?? 0);
                    setValue("incomeTax", record.income_tax ?? 0);
                    setValue("lunchBill", record.lunch_bill ?? 0);
                    setValue("excessMobileBill", record.excess_mobile_bill ?? 0);
                    setValue("loanRepayment", record.loan_repayment ?? 0);
                    setValue("otherDeductions", record.other_deductions ?? 0);
                    setValue("salaryPublishStatus", record.payment_method || "BANK");

                    editingEmployeeNo = record.employee_no;
                    editingMonth = record.salary_month;
                    updateNet();

                    const salaryForm = $("salaryEntryForm");
                    originalSalaryFormValues = Array.from(
                        salaryForm.querySelectorAll("input, select, textarea")
                    ).map(field => [field.id, field.value]);

                    setSalaryEditMode(true);
                    saveStatus.textContent =
                        "Salary loaded. Make changes and click Update Salary.";
                } catch (error) {
                    saveStatus.textContent = error.message;
                }
            });
        }

        if (cancelSalaryEditButton) {
            cancelSalaryEditButton.addEventListener("click", function () {
                if (originalSalaryFormValues) {
                    originalSalaryFormValues.forEach(([id, value]) => {
                        const field = $(id);
                        if (field) field.value = value;
                    });
                    updateNet();
                }

                originalSalaryFormValues = null;
                setSalaryEditMode(false);
                editingEmployeeNo = "";
                editingMonth = "";
                saveStatus.textContent =
                    "Edit cancelled. Original saved salary restored.";
            });
        }

        const form = $("salaryEntryForm");
        if (form) {
            form.addEventListener("submit", async function (event) {
                event.preventDefault();
                saveStatus.textContent = "Saving...";

                try {
                    await checkAdmin();

                    const employeeNo = employeeSelect.value;
                    const month = monthInput.value;

                    if (isEditingSalary &&
                        (employeeNo !== editingEmployeeNo || month !== editingMonth)) {
                        throw new Error(
                            "Employee or month changed during editing. Cancel edit and load the correct salary again."
                        );
                    }
                    const readOptionalDays = (id) => {
                        const value = $(id).value.trim();
                        if (value === "") return null;
                        const number = Number(value);
                        return Number.isFinite(number) && Number.isInteger(number) && number >= 0
                            ? number
                            : NaN;
                    };

                    const workingDays = readOptionalDays("salaryWorkingDays");
                    const leaveDays = readOptionalDays("salaryLeaveDays");
                    const absentDays = readOptionalDays("salaryAbsentDays");

                    const presentDays = workingDays === null ? null : workingDays - ((leaveDays ?? 0) + (absentDays ?? 0));
                    if ([workingDays, leaveDays, absentDays].some(Number.isNaN) || (presentDays !== null && presentDays < 0)) {
                        alert("Attendance days must be whole numbers, and Present Days cannot be negative.");
                        return;
                    }

                    const payableSalary = getAmount("payableSalary");
                    const basic = Math.round((payableSalary * 0.60 + Number.EPSILON) * 100) / 100;
                    const houseRent = Math.round((payableSalary * 0.30 + Number.EPSILON) * 100) / 100;
                    const medical = Math.round((payableSalary * 0.05 + Number.EPSILON) * 100) / 100;
                    const conveyance = Math.round((payableSalary * 0.05 + Number.EPSILON) * 100) / 100;
                    const othersAllowance = getAmount("othersAllowance");

                    const absentAmount = getAmount("absentAmount");
                    const incomeTaxAmount = getAmount("incomeTax");
                    const lunchBill = getAmount("lunchBill");
                    const excessMobileBill = getAmount("excessMobileBill");
                    const loanRepayment = getAmount("loanRepayment");
                    const otherDeductionsAmount = getAmount("otherDeductions");

                    const allowances = houseRent + medical + conveyance + othersAllowance;
                    const deductions = absentAmount + incomeTaxAmount + lunchBill +
                        excessMobileBill + loanRepayment + otherDeductionsAmount;
                    const totalEarnings = payableSalary + othersAllowance;
                    const netPay = totalEarnings - deductions;

                    const attendance = [workingDays, presentDays, leaveDays, absentDays];
                    if (!attendance.every(n => n === null || (Number.isInteger(n) && n >= 0))) {
                        throw new Error("Attendance days must be non-negative whole numbers, or left blank.");
                    }

                    if (!employeeNumbers.has(employeeNo)) {
                        throw new Error("Select a valid employee.");
                    }
                    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
                        throw new Error("Select a valid salary month.");
                    }
                    if (deductions > totalEarnings) {
                        throw new Error("Deductions cannot exceed total earnings.");
                    }

                    await saveRecords([{
                        employee_no: employeeNo,
                        salary_month: month,
                        working_days: workingDays,
                        present_days: presentDays,
                        leave_days: leaveDays,
                        absent_days: absentDays,
                        payable_salary: payableSalary,
                        basic_salary: basic,
                        house_rent_allowance: houseRent,
                        medical_allowance: medical,
                        conveyance_allowance: conveyance,
                        special_allowance: 0,
                        others_allowance: othersAllowance,
                        employee_provident_fund: 0,
                        income_tax: incomeTaxAmount,
                        health_insurance: 0,
                        absent_amount: absentAmount,
                        lunch_bill: lunchBill,
                        excess_mobile_bill: excessMobileBill,
                        loan_repayment: loanRepayment,
                        other_deductions: otherDeductionsAmount,
                        allowances: allowances,
                        deductions: deductions,
                        payment_method: $("salaryPublishStatus").value,
                        status: "Published"
                    }]);

                    saveStatus.textContent = isEditingSalary
                        ? "Salary updated successfully."
                        : "Salary saved successfully.";
                    setSalaryEditMode(false);
                    originalSalaryFormValues = null;
                    editingEmployeeNo = "";
                    editingMonth = "";
                } catch (error) {
                    saveStatus.textContent = error.message;
                }
            });
        }

        function parseCsvLine(line) {
            const fields = [];
            let value = "";
            let quoted = false;

            for (let i = 0; i < line.length; i++) {
                const ch = line[i];

                if (ch === '"' && quoted && line[i + 1] === '"') {
                    value += '"';
                    i++;
                } else if (ch === '"') {
                    quoted = !quoted;
                } else if (ch === "," && !quoted) {
                    fields.push(value.trim());
                    value = "";
                } else {
                    value += ch;
                }
            }

            fields.push(value.trim());
            return fields;
        }

        const viewButton = $("viewPaySlipButton");
        if (viewButton) {
            viewButton.addEventListener("click", async function () {
                slipResult.replaceChildren();
                slipResult.textContent = "Loading Pay Slip...";

                try {
                    await checkAdmin();

                    const employeeNo = slipEmployee.value;
                    const month = slipMonth.value;

                    if (!employeeNumbers.has(employeeNo)) throw new Error("Select an employee.");
                    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
                        throw new Error("Select a valid month.");
                    }

                    const query = new URLSearchParams({
                        select: "employee_no,salary_month,payable_salary,basic_salary,allowances,deductions,net_pay,status,payment_method,house_rent_allowance,medical_allowance,conveyance_allowance,special_allowance,others_allowance,employee_provident_fund,income_tax,health_insurance,absent_amount,lunch_bill,excess_mobile_bill,loan_repayment,other_deductions,working_days,present_days,leave_days,absent_days",
                        employee_no: "eq." + employeeNo,
                        salary_month: "eq." + month
                    });

                    const response = await fetch(
                        SUPABASE_URL + "/rest/v1/salary_records?" + query,
                        { headers: apiHeaders() }
                    );

                    if (!response.ok) {
                        throw new Error("Pay Slip request failed: " + await response.text());
                    }

                    const rows = await response.json();
                    slipResult.replaceChildren();

                    if (!rows.length) {
                        slipResult.textContent = "No salary record found for this employee/month.";
                        return;
                    }

                    const record = rows[0];
                    const employee = employeeInfo.get(employeeNo) || {};

                    const safe = value => String(value ?? "—").replace(
                        /[&<>"']/g,
                        char => ({
                            "&": "&amp;",
                            "<": "&lt;",
                            ">": "&gt;",
                            '"': "&quot;",
                            "'": "&#39;"
                        })[char]
                    );

                    const amount = value =>
                        Number(value || 0).toLocaleString("en-BD", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        });

                    const getEmployeeValue = (...keys) => {
                        for (const key of keys) {
                            const value = employee[key];
                            if (value !== undefined && value !== null && value !== "") {
                                return value;
                            }
                        }
                        return "—";
                    };

                    const monthDate = new Date(record.salary_month + "-01T12:00:00");
                    const monthName = Number.isNaN(monthDate.getTime())
                        ? record.salary_month
                        : monthDate.toLocaleDateString("en-GB", {
                            month: "long",
                            year: "numeric"
                        });

                    const year = Number(String(record.salary_month).slice(0, 4));
                    const monthNumber = Number(String(record.salary_month).slice(5, 7));
                    const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();

                    const period = Number.isNaN(monthDate.getTime())
                        ? record.salary_month
                        : "01 " + monthDate.toLocaleDateString("en-GB", {
                            month: "short",
                            year: "numeric"
                        }) + " – " + lastDay + " " +
                        monthDate.toLocaleDateString("en-GB", {
                            month: "short",
                            year: "numeric"
                        });

                    const payableSalary = Number(record.payable_salary || 0);
                    const basic = Number(record.basic_salary || 0);
                    const houseRent = Number(record.house_rent_allowance || 0);
                    const medical = Number(record.medical_allowance || 0);
                    const conveyance = Number(record.conveyance_allowance || 0);
                    const othersAllowance = Number(record.others_allowance || 0);

                    const providentFund = Number(record.employee_provident_fund || 0);
                    const incomeTax = Number(record.income_tax || 0);
                    const healthInsurance = Number(record.health_insurance || 0);
                    const absentAmount = Number(record.absent_amount || 0);
                    const lunchBill = Number(record.lunch_bill || 0);
                    const excessMobileBill = Number(record.excess_mobile_bill || 0);
                    const loanRepayment = Number(record.loan_repayment || 0);
                    const otherDeductions = Number(record.other_deductions || 0);

                    const storedAllowances = Number(record.allowances || 0);
                    const storedDeductions = Number(record.deductions || 0);

                    const hasEarningComponents =
                        houseRent !== 0 || medical !== 0 ||
                        conveyance !== 0 || othersAllowance !== 0;

                    const hasDeductionComponents =
                        providentFund !== 0 || incomeTax !== 0 ||
                        healthInsurance !== 0 || absentAmount !== 0 ||
                        lunchBill !== 0 || excessMobileBill !== 0 ||
                        loanRepayment !== 0 || otherDeductions !== 0;

                    const legacyAllowances = payableSalary > 0
                        ? 0
                        : (!hasEarningComponents ? storedAllowances : 0);

                    const legacyDeductions =
                        !hasDeductionComponents ? storedDeductions : 0;

                    const allowances =
                        houseRent + medical + conveyance + othersAllowance;
                    const deductions = providentFund + incomeTax + healthInsurance +
                        absentAmount + lunchBill + excessMobileBill +
                        loanRepayment + otherDeductions;

                    const totalEarnings = payableSalary > 0
                        ? payableSalary + othersAllowance
                        : basic + allowances + legacyAllowances;
                    const totalDeductions = deductions + legacyDeductions;
                    const savedNetPay = Number(record.net_pay || 0);
                    const netPay = savedNetPay !== 0
                        ? savedNetPay
                        : totalEarnings - totalDeductions;

                    function wordsUnderThousand(number) {
                        const ones = [
                            "Zero", "One", "Two", "Three", "Four", "Five",
                            "Six", "Seven", "Eight", "Nine", "Ten", "Eleven",
                            "Twelve", "Thirteen", "Fourteen", "Fifteen",
                            "Sixteen", "Seventeen", "Eighteen", "Nineteen"
                        ];
                        const tens = [
                            "", "", "Twenty", "Thirty", "Forty", "Fifty",
                            "Sixty", "Seventy", "Eighty", "Ninety"
                        ];
                        let result = "";

                        if (number >= 100) {
                            result += ones[Math.floor(number / 100)] + " Hundred";
                            number %= 100;
                            if (number) result += " ";
                        }

                        if (number >= 20) {
                            result += tens[Math.floor(number / 10)];
                            number %= 10;
                            if (number) result += "-" + ones[number];
                        } else if (number > 0 || !result) {
                            result += ones[number];
                        }

                        return result;
                    }

                    function amountInWords(value) {
                        let number = Math.floor(Math.abs(value));
                        if (number === 0) return "Zero Taka Only";

                        const groups = [
                            [10000000, "Crore"],
                            [100000, "Lakh"],
                            [1000, "Thousand"],
                            [1, ""]
                        ];
                        const parts = [];

                        for (const [size, label] of groups) {
                            if (number >= size) {
                                const count = Math.floor(number / size);
                                number %= size;
                                parts.push(
                                    wordsUnderThousand(count) +
                                    (label ? " " + label : "")
                                );
                            }
                        }

                        return parts.join(" ") + " Taka Only";
                    }

                    const optionalDetails = [
                        ["Designation", getEmployeeValue("designation", "job_title")],
                        ["Joining Date", getEmployeeValue("joining_date", "date_of_joining", "date_joined")],
                        ["Working Days", record.working_days ?? "-"],
                        ["Present Days", record.present_days ?? "-"],
                        ["Leave Days", record.leave_days ?? "-"],
                        ["Absent Days", record.absent_days ?? "-"]
                    ];

                    const detail = (label, value, showEmpty = false) => {
                        if (!showEmpty && (value === undefined || value === null || value === "" || value === "—")) return "";
                        return `<div class="payslip-detail">
                            <span>${safe(label)}</span>
                            <strong>${safe(value)}</strong>
                        </div>`;
                    };

                    const infoTable = (rows) => `
                        <table class="payslip-info-table">
                            <tbody>
                                ${rows.map(([label, value, showEmpty = false]) => {
                                    if (!showEmpty && (value === undefined || value === null || value === "" || value === "—")) return "";
                                    return `<tr>
                                        <th>${safe(label)}</th>
                                        <td>${safe(value)}</td>
                                    </tr>`;
                                }).join("")}
                            </tbody>
                        </table>
                    `;

                    slipResult.innerHTML = `
                        <article class="professional-payslip">
                            <header class="payslip-company">
                                <img src="assets/logo/Dekko%20logo.jpg" alt="Dekko Logo" class="payslip-company-logo">
                                <div class="payslip-company-text">
                                    <h2>Dekko Accessories Ltd.</h2>


                                    <p>Head Office: Shimanto Shambhar (8th Floor),</p>
                                    <p>Road No. 2, Dhanmondi, Dhaka-1205</p>
                                    <p>Phone: +880 9666774400</p>
                                    <p>www.dekkolegacy.com</p>
                                </div>
                            </header>

                            <div class="payslip-heading">
                                <h3>Pay Slip</h3>
                                <p>For the Month of ${safe(monthName)}</p>
                                <span class="payslip-status">${safe(record.payment_method || "BANK")}</span>
                            </div>

                            <section class="payslip-section payslip-employee-section">
                                <h4><span aria-hidden="true">👤</span> Employee Information</h4>
                                <div class="payslip-info-tables-grid">
                                    ${infoTable([
                                        ["Employee ID", record.employee_no || employee.employee_no || "—"],
                                        ["Employee Name", employee.employee_name || "—"],
                                        ["Designation", optionalDetails[0][1]],
                                        ["Department", employee.department || "—"],
                                        ["Joining Date", optionalDetails[1][1]],
                                        ["Pay Period", period]
                                    ])}
                                    ${infoTable([
                                        ["Bank Name", getEmployeeValue("bank_name"), true],
                                        ["Account No.", getEmployeeValue("account_no"), true],
                                        ["Working Days", optionalDetails[2][1]],
                                        ["Present Days", optionalDetails[3][1]],
                                        ["Leave Days", optionalDetails[4][1]],
                                        ["Absent Days", optionalDetails[5][1]]
                                    ])}
                                </div>
                            </section>

                            <div class="payslip-components-grid">
<section class="payslip-section">
                                <h4><span aria-hidden="true">💰</span> Earning</h4>
                                <table class="payslip-table">
                                    <thead>
                                        <tr><th>Particulars</th><th>Amount</th></tr>
                                    </thead>
                                    <tbody>
                                        <tr><td>Basic Salary</td><td>${amount(basic)}</td></tr>
                                        <tr><td>House Rent Allowance</td><td>${amount(houseRent)}</td></tr>
                                        <tr><td>Medical Allowance</td><td>${amount(medical)}</td></tr>
                                        <tr><td>Conveyance Allowance</td><td>${Number(conveyance) ? amount(conveyance) : "-"}</td></tr>
                                        <tr><td>Payable Salary</td><td>${Number(payableSalary) ? amount(payableSalary) : "-"}</td></tr>
                                        <tr><td>Others Allowance</td><td>${Number(othersAllowance) ? amount(othersAllowance) : "-"}</td></tr>
                                        ${legacyAllowances ? `<tr><td>Allowances (legacy record)</td><td>${amount(legacyAllowances)}</td></tr>` : ""}
                                        <tr class="payslip-total-row"><td>Total Earnings</td><td>${Number(totalEarnings) ? amount(totalEarnings) : "-"}</td></tr>
                                    </tbody>
                                </table>
                            </section>

                            <section class="payslip-section">
                                <h4><span aria-hidden="true">➖</span> Deduct</h4>
                                <table class="payslip-table">
                                    <thead>
                                        <tr><th>Particulars</th><th>Amount</th></tr>
                                    </thead>
                                    <tbody>
                                        <tr><td>Absent Amount</td><td>${Number(absentAmount) ? amount(absentAmount) : "-"}</td></tr>
                                        <tr><td>Advance Income Tax (AIT)</td><td>${Number(incomeTax) ? amount(incomeTax) : "-"}</td></tr>
                                        <tr><td>Lunch Bill</td><td>${Number(lunchBill) ? amount(lunchBill) : "-"}</td></tr>
                                        <tr><td>Excess Mobile Bill</td><td>${Number(excessMobileBill) ? amount(excessMobileBill) : "-"}</td></tr>
                                        ${providentFund ? `<tr><td>Employee Provident Fund (legacy)</td><td>${amount(providentFund)}</td></tr>` : ""}
                                        ${healthInsurance ? `<tr><td>Health Insurance (legacy)</td><td>${amount(healthInsurance)}</td></tr>` : ""}
                                        <tr><td>Loan Repayment</td><td>${Number(loanRepayment) ? amount(loanRepayment) : "-"}</td></tr>
                                        <tr><td>Other Deductions</td><td>${Number(otherDeductions) ? amount(otherDeductions) : "-"}</td></tr>
                                        ${legacyDeductions ? `<tr><td>Deductions (legacy record)</td><td>${amount(legacyDeductions)}</td></tr>` : ""}
                                        <tr class="payslip-total-row"><td>Total Deductions</td><td>${Number(totalDeductions) ? amount(totalDeductions) : "-"}</td></tr>
                                    </tbody>
                                </table>
                            </section>

                                                        </div>

                            <section class="payslip-net">
                                <span>NET PAY (BDT)</span>
                                <strong>${Number(netPay) ? amount(netPay) : "-"}</strong>
                            </section>

                            <section class="payslip-words">
                                <p><strong>Net Pay (in Words):</strong> ${Number(netPay) ? safe(amountInWords(netPay)) : "-"}</p>
                            </section>

                            <footer class="payslip-footer">
                                <p>This is a system-generated payslip. For any query, please contact the HR Department.</p>
                                <div class="payslip-signature">
                                    <div class="payslip-signature-line"></div>
                                    <strong>Authorized Signature</strong>
                                    <span>HR Department</span>
                                </div>
                            </footer>
                        </article>
                    `;

                    const page = $("paySlipPage");
                    const pageContent = $("paySlipPageContent");
                    const salaryPage = $("salaryPage");

                    if (!page || !pageContent || !salaryPage) {
                        throw new Error("Pay Slip page could not be opened.");
                    }

                    pageContent.innerHTML = slipResult.innerHTML;
                    page.style.display = "block";
                    salaryPage.style.display = "none";
                    window.scrollTo(0, 0);

                    const printButton = $("printPaySlipButton");
                    if (printButton) printButton.style.display = "inline-block";
                } catch (error) {
                    slipResult.textContent = error.message;
                }
            });
        }

        const printButton = $("printPaySlipButton");
        if (printButton) {
            printButton.addEventListener("click", function () {
                window.print();
            });
        }

        const paySlipPageBackButton = $("paySlipPageBackButton");
        if (paySlipPageBackButton) {
            paySlipPageBackButton.addEventListener("click", function () {
                const page = $("paySlipPage");
                const salaryPage = $("salaryPage");
                if (page) page.style.display = "none";
                if (salaryPage) salaryPage.style.display = "block";
            });
        }

        const paySlipPagePrintButton = $("paySlipPagePrintButton");
        if (paySlipPagePrintButton) {
            paySlipPagePrintButton.addEventListener("click", function () {
                if (window.AndroidPaySlipPdf &&
                    typeof window.AndroidPaySlipPdf.downloadPaySlipPdf === "function") {
                    window.AndroidPaySlipPdf.downloadPaySlipPdf();
                } else {
                    window.print();
                }
            });
        }
    });
})();


if (bloodGroupFilter) {
    bloodGroupFilter.addEventListener("change", function () {
        const selectedBloodGroup = this.value;
        const selectedDesignation = designationFilter ? designationFilter.value : "";
        const searchText = searchInput.value.toLowerCase().trim();

        const filtered = employees.filter(employee => {
            const matchesDesignation = !selectedDesignation ||
                normalizeDesignation(employee.designation) === selectedDesignation;
            const matchesBloodGroup = !selectedBloodGroup ||
                String(employee.blood_group || "").trim().toUpperCase() === selectedBloodGroup;
            const text = `${employee.employee_name || ""} ${employee.employee_no || ""} ${employee.company || ""} ${employee.department || ""} ${employee.designation || ""}`;
            const matchesSearch = !searchText || text.toLowerCase().includes(searchText);
            return matchesDesignation && matchesBloodGroup && matchesSearch;
        });

        showEmployees(filtered);
    });
}
