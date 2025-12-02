// ---- Supabase connection ----
const supabaseUrl = "https://nppwibcowhfzvvxvtnzb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wcHdpYmN3b2hmenZ4eHZ0bnpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzE2NzYsImV4cCI6MjA4MDA0NzY3Nn0.3oO2qOE5WPwUWZ1Y5UxESo-1HI_JL_DYLebueXwesnc";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// DOM elements
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");

const signupBtn = document.getElementById("signupBtn");
const loginBtn  = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const authMessage = document.getElementById("authMessage");

const addItemBtn = document.getElementById("addItemBtn");
const wishlistEl = document.getElementById("wishlist");

// ---- Signup ----
signupBtn.onclick = async () => {
  let { error } = await supabaseClient.auth.signUp({
    email: document.getElementById("email").value,
    password: document.getElementById("password").value
  });

  authMessage.textContent = error
    ? error.message
    : "Signup successful! Please verify your email before logging in.";
};

// ---- Login ----
loginBtn.onclick = async () => {
  let { data, error } = await supabaseClient.auth.signInWithPassword({
    email: document.getElementById("email").value,
    password: document.getElementById("password").value
  });

  if (error) return authMessage.textContent = error.message;

  authSection.classList.add("hidden");
  appSection.classList.remove("hidden");

  loadWishlist();
};

// ---- Logout ----
logoutBtn.onclick = async () => {
  await supabaseClient.auth.signOut();
  appSection.classList.add("hidden");
  authSection.classList.remove("hidden");
};

// ---- Load wishlist ----
async function loadWishlist() {
  wishlistEl.innerHTML = "";

  let { data: user } = await supabaseClient.auth.getUser();
  if (!user.user) return;

  let { data: items } = await supabaseClient
    .from("wishlist_items")
    .select("*")
    .eq("user_id", user.user.id);

  items.forEach(item => {
    let li = document.createElement("li");
    li.className = "list-item";
    li.innerHTML = `
      <div class="item-title">${item.name}</div>
      <a class="item-url" href="${item.url}" target="_blank">${item.url || ""}</a>
      <div class="item-notes">${item.notes || ""}</div>

      <button class="delete-btn" onclick="deleteItem('${item.id}')">Delete</button>
    `;
    wishlistEl.appendChild(li);
  });
}

// ---- Delete item ----
async function deleteItem(id) {
  await supabaseClient.from("wishlist_items").delete().eq("id", id);
  loadWishlist();
}

// ---- Add item ----
addItemBtn.onclick = async () => {
  let { data: user } = await supabaseClient.auth.getUser();
  if (!user.user) return;

  let name = document.getElementById("itemName").value;
  let url = document.getElementById("itemUrl").value;
  let notes = document.getElementById("itemNotes").value;

  if (!name.trim()) return;

  await supabaseClient.from("wishlist_items").insert({
    user_id: user.user.id,
    name,
    url,
    notes
  });

  document.getElementById("itemName").value = "";
  document.getElementById("itemUrl").value = "";
  document.getElementById("itemNotes").value = "";

  loadWishlist();
};
