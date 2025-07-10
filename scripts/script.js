document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://try-api-five.vercel.app'
    function displayMessage(elementId, message, isSuccess = true) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.style.color = isSuccess ? 'green' : 'red';
            setTimeout(() => {
                element.textContent = '';
            }, 5000);
        }
    }

    // --- Authentication & Navbar Elements ---
    const authBtns = document.getElementById('AuthBtns');
    const logoutBtnContainer = document.getElementById('LogoutBtnContainer');
    const logoutButton = document.getElementById('logoutButton');

    // Function to update navbar buttons based on login status
    function updateNavbarAuthButtons() {
        const userId = localStorage.getItem('userId');
        if (authBtns && logoutBtnContainer) {
            if (userId) {
                console.log("User is logged in. Hiding AuthBtns, showing LogoutBtn.");
                // User is logged in: Hide AuthBtns, show LogoutBtn
                authBtns.classList.add('d-none'); // Add d-none to AuthBtns
                authBtns.classList.remove('d-flex'); // Remove d-flex from AuthBtns

                logoutBtnContainer.classList.remove('d-none'); // Remove d-none from LogoutBtnContainer
                logoutBtnContainer.classList.add('d-flex'); // Add d-flex to LogoutBtnContainer
            } else {
                console.log("User is NOT logged in. Showing AuthBtns, hiding LogoutBtn.");
                // User is not logged in: Show AuthBtns, hide LogoutBtn
                authBtns.classList.remove('d-none'); // Remove d-none from AuthBtns
                authBtns.classList.add('d-flex'); // Add d-flex to AuthBtns

                logoutBtnContainer.classList.add('d-none'); // Add d-none to LogoutBtnContainer
                logoutBtnContainer.classList.remove('d-flex'); // Remove d-flex from LogoutBtnContainer
            }
        } else {
            console.warn("AuthBtns or LogoutBtnContainer not found in the DOM.");
        }
    }

    // Add event listener for the logout button
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('userId'); // Remove user ID from localStorage
            alert('You have been logged out.');
            updateNavbarAuthButtons(); // Crucial: Update buttons immediately after logout
            window.location.href = '/index.html'; // Redirect to home page or login page
        });
    }

    // Call this function on initial load
    updateNavbarAuthButtons();

    // --- Sign Up Page Logic ---
    const signUpForm = document.getElementById('signUpForm');
    const successMsg = document.getElementById('success-msg');
    const errorMsg = document.getElementById('error-msg');

    if (signUpForm) {
        signUpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const firstName = document.getElementById('inputFirstName').value;
            const lastName = document.getElementById('inputLastName').value;
            const email = document.getElementById('inputEmail').value;
            const password = document.getElementById('inputPassword').value;

            try {
                const res = await fetch(`${API_URL}/signup`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        first_name: firstName,
                        last_name: lastName,
                        email: email,
                        password: password
                    })
                });

                const data = await res.json();
                if (res.ok) {
                    localStorage.setItem('userId', data.userId);
                    errorMsg.textContent = '';
                    successMsg.textContent = data.message;
                    // It's important to call updateNavbarAuthButtons BEFORE redirecting
                    // if you want the visual change to happen momentarily before the new page loads.
                    // However, since you're redirecting, the new page's DOMContentLoaded will handle it.
                    updateNavbarAuthButtons(); // Update buttons after signup
                    window.location.href = '/pages/tasks/tasks.html';
                } else {
                    successMsg.textContent = '';
                    errorMsg.textContent = data.message;
                }
            } catch (err) {
                console.error('Network error during signup:', err);
                errorMsg.textContent = 'A network error occurred. Please try again.';
            }
        });
    }

    // --- Login Page Logic ---
    const LoginForm = document.getElementById('LoginForm');
    if (LoginForm) {
        LoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('inputEmail').value;
            const password = document.getElementById('inputPassword').value;

            try {
                const res = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                });

                const data = await res.json();

                if (res.ok) {
                    localStorage.setItem('userId', data.user.id);
                    errorMsg.textContent = '';
                    successMsg.textContent = data.message;
                    // Similar to signup, call updateNavbarAuthButtons before redirect
                    updateNavbarAuthButtons(); // Update buttons after login
                    window.location.href = '/pages/tasks/tasks.html';
                } else {
                    successMsg.textContent = '';
                    errorMsg.textContent = data.message;
                }
            } catch (err) {
                console.error('Network error during login:', err);
                errorMsg.textContent = 'A network error occurred. Please try again.';
            }
        });
    }

    // --- Task Management Elements (rest of your code, unchanged) ---
    const createTaskForm = document.getElementById('createTaskForm');
    const taskNameInput = document.getElementById('taskNameInput');
    const tasksContainer = document.getElementById('tasksContainer');

    function createTaskCard(task) {
        const card = document.createElement('div');
        card.className = 'card col-8 col-md-6 col-lg-4';
        card.style.width = '18rem';

        card.innerHTML = `
            <div class="card-body text-center">
            <img class="mb-2" style="width: 4rem;" src=${task.status === 'pending' ? '../../assets/icons/sleep.png' : task.status === 'completed' ? '../../assets/icons/compeleted.png' : '../../assets/icons/work-in-progress.png'} />
                <h5 class="card-title">${task.task_name}</h5>
                <h6 class="card-subtitle mb-2 text-body-secondary">Status: ${task.status || 'N/A'}</h6>
                <div class="d-flex justify-content-between mt-3">
                    <select class="form-select w-50" onchange="updateTaskStatus('${task._id}', this.value)">
                        <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                        <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
                    </select>
                    <button class="btn btn-danger btn-sm ms-2" onclick="deleteTask('${task._id}')">Delete</button>
                </div>
            </div>
        `;
        return card;
    }

    async function fetchAndDisplayTasks() {
        const loggedInUserId = localStorage.getItem('userId');

        if (tasksContainer) tasksContainer.innerHTML = ''; // Always clear first

        if (!loggedInUserId) {
            if (tasksContainer) tasksContainer.innerHTML = '<p class="col-12 text-center">Please log in to view your tasks.</p>';
            if (createTaskForm) createTaskForm.style.display = 'none';
            return;
        }

        if (tasksContainer) tasksContainer.innerHTML = '<p class="col-12 text-center">Loading tasks...</p>';

        try {
            const res = await fetch(`${API_URL}/tasks?user_id=${loggedInUserId}`);
            const data = await res.json();

            if (tasksContainer) tasksContainer.innerHTML = '';

            if (res.ok) {
                if (data.tasks && data.tasks.length > 0) {
                    data.tasks.forEach(task => {
                        const card = createTaskCard(task);
                        tasksContainer.appendChild(card);
                    });
                } else {
                    const noTasksMessageElement = document.createElement('p');
                    noTasksMessageElement.id = 'noTasksMessage';
                    noTasksMessageElement.className = 'col-12 text-center fs-5 fw-bold';
                    noTasksMessageElement.textContent = 'No tasks found.';
                    tasksContainer.appendChild(noTasksMessageElement);

                    const emptyImgElement = document.createElement('img');
                    emptyImgElement.src = '../../assets/imgs/empty.png';
                    emptyImgElement.style.width = '75%';
                    emptyImgElement.alt = 'empty';
                    tasksContainer.appendChild(emptyImgElement);
                }
            } else {
                console.error('Failed to fetch tasks:', data.message);
                if (tasksContainer) tasksContainer.innerHTML = `<p class="col-12 text-center" style="color:red;">Error fetching tasks: ${data.message}</p>`;
            }
        } catch (err) {
            console.error('Network error fetching tasks:', err);
            if (tasksContainer) tasksContainer.innerHTML = '<p class="col-12 text-center" style="color:red;">Could not load tasks. Network error.</p>';
        }
    }

    if (createTaskForm) {
        createTaskForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const taskName = taskNameInput.value.trim();
            const loggedInUserId = localStorage.getItem('userId');

            if (!taskName) {
                displayMessage('taskMessage', 'Task name cannot be empty.', false);
                return;
            }
            if (!loggedInUserId) {
                displayMessage('taskMessage', 'Please log in to create a task.', false);
                return;
            }

            try {
                const res = await fetch(`${API_URL}/tasks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        task_name: taskName,
                        user_id: loggedInUserId,
                        status: "pending"
                    })
                });

                const data = await res.json();

                if (res.ok) {
                    displayMessage('taskMessage', 'Task added successfully!', true);
                    taskNameInput.value = '';
                    fetchAndDisplayTasks();
                } else {
                    displayMessage('taskMessage', `Error adding task: ${data.message}`, false);
                }
            } catch (err) {
                console.error('Network error creating task:', err);
                displayMessage('taskMessage', 'A network error occurred while creating the task.', false);
            }
        });
    }

    window.updateTaskStatus = async (taskId, newStatus) => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            alert('Please log in to update task status.');
            return;
        }
        try {
            const res = await fetch(`${API_URL}/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, user_id: userId }),
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                fetchAndDisplayTasks();
            } else {
                alert(`Failed to update task status: ${data.message}`);
            }
        } catch (error) {
            console.error('Error updating task status:', error);
            alert('An error occurred while updating task status. Please try again.');
        }
    };

    window.deleteTask = async (taskId) => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            alert('Please log in to delete tasks.');
            return;
        }
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }
        try {
            const res = await fetch(`${API_URL}/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                fetchAndDisplayTasks();
            } else {
                alert(`Failed to delete task: ${data.message}`);
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('An error occurred while deleting task. Please try again.');
        }
    };

    if (tasksContainer) {
        fetchAndDisplayTasks();
        
    }

});