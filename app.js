// --------------------
// Supabase init
// --------------------
const supabase = window.supabase.createClient(
  "https://nppwibcwohfzvxxvtnzb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wcHdpYmN3b2hmenZ4eHZ0bnpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzE2NzYsImV4cCI6MjA4MDA0NzY3Nn0.3oO2qOE5WPwUWZ1Y5UxESo-1HI_JL_DYLebueXwesnc",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

// --------------------
// Elements
// --------------------
const auth = document.getElementById("auth");
const app = document.getElementById("app");

const email = document.getElementById("email");
const password = document.getElementById("password");
const authMsg = document.getElementById("authMsg");

const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const itemName = document.getElementById("itemName");
const itemUrl = document.getElementById("itemUrl");
const addBtn = document.getElementById("addBtn");
const list = document.getElementById("list");

// --------------------
// Session restore
// --------------------
async function restoreSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    auth.classList.add("hidden");
    app.classList.remove("hidden");
    loadItems();
  }
}

restoreSession();

// --------------------
// Signup
// --------------------
signupBtn.onclick = async () => {
  const { error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value
  });

  authMsg.textContent = error
    ? error.message
    : "Check your email to verify your account 🎄";
};

// --------------------
// Login
// --------------------
loginBtn.onclick = async () => {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value
  });

  if (error) {
    authMsg.textContent = error.message;
    return;
  }

  auth.classList.add("hidden");
  app.classList.remove("hidden");
  loadItems();
};

// --------------------
// Logout
// --------------------
logoutBtn.onclick = async () => {
  await supabase.auth.signOut();
  app.classList.add("hidden");
  auth.classList.remove("hidden");
};

// --------------------
// Load items
// --------------------
async function loadItems() {
  list.innerHTML = "";

  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return;

  const { data } = await supabase
    .from("wishlist_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  data.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <strong>${item.name}</strong><br/>
        ${item.url ? `<a href="${item.url}" target="_blank">link</a>` : ""}
      </div>
      <button onclick="deleteItem('${item.id}')">✕</button>
    `;
    list.appendChild(li);
  });
}

// --------------------
// Add item
// --------------------
addBtn.onclick = async () => {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return;

  await supabase.from("wishlist_items").insert({
    user_id: user.id,
    name: itemName.value,
    url: itemUrl.value
  });

  itemName.value = "";
  itemUrl.value = "";
  loadItems();
};

// --------------------
// Delete item
// --------------------
async function deleteItem(id) {
  await supabase.from("wishlist_items").delete().eq("id", id);
  loadItems();
}

window.deleteItem = deleteItem;
