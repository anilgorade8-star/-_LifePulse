const SUPABASE_URL = 'https://rqqqekkmoroavhogqvjk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_WnpKFtg8k_CPl7mMRALvrg_7TSQHqru';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function toggleAuth() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const subtitle = document.getElementById('authSubtitle');
    const toggleText = document.getElementById('toggleText');

    if (loginForm.classList.contains('hidden')) {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        subtitle.textContent = 'Welcome back! Please login to your account.';
        toggleText.innerHTML = `Don't have an account? <button onclick="toggleAuth()" class="text-purple-600 font-bold hover:underline">Sign Up</button>`;
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        subtitle.textContent = 'Join LifePulse to start your healthcare journey.';
        toggleText.innerHTML = `Already have an account? <button onclick="toggleAuth()" class="text-blue-600 font-bold hover:underline">Sign In</button>`;
    }
}

function showMessage(text, type = 'error') {
    const msgDiv = document.getElementById('message');
    msgDiv.textContent = text;
    msgDiv.className = `mt-4 p-3 rounded-xl text-center ${type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`;
    msgDiv.classList.remove('hidden');
    setTimeout(() => msgDiv.classList.add('hidden'), 5000);
}

// Login Handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const { data, error } = await _supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        showMessage(error.message);
    } else {
        window.location.href = 'index.html';
    }
});

// Signup Handler
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const fullName = document.getElementById('signupName').value;

    const { data, error } = await _supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            }
        }
    });

    if (error) {
        showMessage(error.message);
    } else if (data.user && data.session) {
        window.location.href = 'index.html';
    } else {
        showMessage('Verification email sent! Please check your inbox.', 'success');
    }
});
