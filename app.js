// ---- Supabase connection ----
const supabaseUrl = "https://nppwibcwohfzvxxvtnzb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wcHdpYmN3b2hmenZ4eHZ0bnpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzE2NzYsImV4cCI6MjA4MDA0NzY3Nn0.3oO2qOE5WPwUWZ1Y5UxESo-1HI_JL_DYLebueXwesnc";
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

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
  let { error } = await supabase.auth.signUp({
    email: document.getElementById("email").value,
    password: document.getElementById("password").value
  });

  authMessage.textContent = error ? error.message : "Signup successful!";
};

// ---- Login ----
loginBtn.onclick = async () => {
  let { data, error } = await supabase.auth.signInWithPassword({
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
  await supabase.auth.signOut();
  appSection.classList.add("hidden");
  authSection.classList.remove("hidden");
};

// ---- Load wishlist ----
async function loadWishlist() {
  wishlistEl.innerHTML = "";

  let { data: user } = await supabase.auth.getUser();
  if (!user.user) return;

  // Fetch user's wishlist
  let { data: items } = await supabase
    .from("wishlist_items")
    .select("*")
    .eq("user_id", user.user.id);

  items.forEach(item => {
    let li = document.createElement("li");
    li.innerHTML = `
      <strong>${item.name}</strong><br>
      <a href="${item.url}" target="_blank">${item.url}</a><br>
      <em>${item.notes}</em>
    `;
    wishlistEl.appendChild(li);
  });
}

// ---- Add item ----
addItemBtn.onclick = async () => {
  let { data: user } = await supabase.auth.getUser();
  if (!user.user) return;

  let name = document.getElementById("itemName").value;
  let url = document.getElementById("itemUrl").value;
  let notes = document.getElementById("itemNotes").value;

  await supabase.from("wishlist_items").insert({
    user_id: user.user.id,
    name,
    url,
    notes
  });

  loadWishlist();
};
