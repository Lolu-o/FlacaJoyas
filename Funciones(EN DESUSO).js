// Año en footer
document.getElementById('year').textContent = new Date().getFullYear();

// Modal helpers
const openModal = sel => document.querySelector(sel).setAttribute('aria-hidden', 'false');
const closeModal = sel => document.querySelector(sel).setAttribute('aria-hidden', 'true');

document.getElementById('accountOpen').addEventListener('click', () => {
    openModal('#accountModal');
    showTab('login');
});

document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closeModal(b.dataset.close)));

document.querySelector('#accountModal').addEventListener('click', e => {
    if (e.target.id === 'accountModal') closeModal('#accountModal');
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal('#accountModal');
});

// Tabs
const tabs = {
    login: document.getElementById('tab-login'),
    register: document.getElementById('tab-register'),
    forgot: document.getElementById('tab-forgot')
};

/*function showTab(name) {
    Object.values(tabs).forEach(t => t.classList.remove('active'));
    tabs[name].classList.add('active');
}*/

function showTab(name) {
    // 1. Encontrar la pestaña que está activa actualmente.
    const activeTab = document.querySelector('.tab.active');
    const newTab = tabs[name];

    // Si estamos cambiando a una pestaña diferente...
    if (activeTab && activeTab !== newTab) {
        
        // 2. Desactivamos la pestaña actual para que comience su animación de "desaparición".
        activeTab.classList.remove('active');

        // 3. ESPERAMOS a que la animación de salida termine.
        // Usamos un setTimeout que dura lo mismo que tu transición en CSS (0.3s = 300ms).
        setTimeout(() => {
            // 4. Después de la pausa, hacemos aparecer la nueva pestaña.
            newTab.classList.add('active');
        }, 300); // <-- ¡Este número debe coincidir con tu CSS!

    } else {
        // Esto es por si ninguna pestaña está activa al principio.
        newTab.classList.add('active');
    }
}

// Links de navegación entre vistas
document.getElementById('goto-register').onclick = (e) => {
    e.preventDefault();
    showTab('register');
};
document.getElementById('goto-forgot').onclick = (e) => {
    e.preventDefault();
    showTab('forgot');
};
document.getElementById('back-login-1').onclick = (e) => {
    e.preventDefault();
    showTab('login');
};
document.getElementById('back-login-2').onclick = () => showTab('login');

// Botones rápidos en el pie del modal
document.getElementById('tabBtnLogin').onclick = () => showTab('login');
document.getElementById('tabBtnRegister').onclick = () => showTab('register');
document.getElementById('tabBtnForgot').onclick = () => showTab('forgot');

// Mostrar/ocultar contraseñas
const bindEye = (inputId, eyeId) => {
    const i = document.getElementById(inputId),
        e = document.getElementById(eyeId);
    e.addEventListener('click', () => {
        i.type = i.type === 'password' ? 'text' : 'password';
    });
};
bindEye('loginPass', 'eyeLogin');
bindEye('regPass', 'eyeReg');