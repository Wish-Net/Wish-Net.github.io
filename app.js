// ---- Supabase connection ----
const supabaseUrl = "https://nppwibcwohfzvxxvtnzb.supabase.co";
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

// Utility: show message
function showMessage(msg, isError = false) {
  authMessage.textContent = msg;
  authMessage.style.color = isError ? "red" : "green";
}

// ---- Signup ----
signupBtn.onclick = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  console.log("Signup attempt:", email);

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) {
    console.error("Signup error:", error);
    showMessage(error.message, true);
    return;
  }

  console.log("Signup success:", data);
  showMessage("Signup successful! Check your email to confirm your account.");
};

// ---- Login ----
loginBtn.onclick = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  console.log("Login attempt:", email);

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error("Login error:", error);
    showMessage(error.message, true);
    return;
  }

  console.log("Login success:", data);

  authSection.classList.add("hidden");
  appSection.classList.remove("hidden");

  loadWishlist();
};

// ---- Logout ----
logoutBtn.onclick = async () => {
  await supabaseClient.auth.signOut();
  appSection.classList.add("hidden");
  authSection.classList.remove("hidden");
  showMessage("");
};

// ---- Load wishlist ----
async function loadWishlist() {
  wishlistEl.innerHTML = "";

  const { data: userData } = await supabaseClient.auth.getUser();
  const user = userData?.user;
  if (!user) {
    console.warn("No logged-in user found");
    return;
  }

  console.log("Loading wishlist for user:", user.id);

  const { data: items, error } = await supabaseClient
    .from("wishlist_items")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error loading wishlist:", error);
    return;
  }

  items.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${item.name}</strong><br>
      <a href="${item.url}" target="_blank">${item.url}</a><br>
      <em>${item.notes}</em>
    `;
    wishlistEl.appendChild(li);
  });

  console.log("Wishlist loaded:", items);
}

// ---- Add item ----
addItemBtn.onclick = async () => {
  const { data: userData } = await supabaseClient.auth.getUser();
  const user = userData?.user;
  if (!user) return;

  const name = document.getElementById("itemName").value;
  const url = document.getElementById("itemUrl").value;
  const notes = document.getElementById("itemNotes").value;

  console.log("Adding item:", { name, url, notes });

  await supabaseClient.from("wishlist_items").insert({
    user_id: user.id,
    name,
    url,
    notes
  });

  loadWishlist();
};
