// Initialize Supabase
const supabaseUrl = "https://nppwibcowhfzvvxvtnzb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wcHdpYmN3b2hmenZ4eHZ0bnpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzE2NzYsImV4cCI6MjA4MDA0NzY3Nn0.3oO2qOE5WPwUWZ1Y5UxESo-1HI_JL_DYLebueXwesnc";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
// UI elements
const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");
const signupBtn = document.getElementById("signupBtn");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");

const addTitle = document.getElementById("itemTitle");
const addUrl = document.getElementById("itemUrl");
const addItemBtn = document.getElementById("addItemBtn");
const wishlistContainer = document.getElementById("wishlist");


// -----------------------
// SIGNUP
// -----------------------
signupBtn.onclick = async () => {
  console.log("Signup attempt:", signupEmail.value);

  const { data, error } = await supabase.auth.signUp({
    email: signupEmail.value,
    password: signupPassword.value
  });

  if (error) {
    console.error("Signup error:", error);
    alert("Signup failed: " + error.message);
    return;
  }

  console.log("Signup success:", data);

  alert("Account created. Please verify your email before logging in.");
};


// -----------------------
// LOGIN
// -----------------------
loginBtn.onclick = async () => {
  console.log("Login attempt:", loginEmail.value);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: loginEmail.value,
    password: loginPassword.value
  });

  if (error) {
    console.error("Login error:", error);
    alert("Login failed: " + error.message);
    return;
  }

  console.log("Login successful:", data);
  loadWishlist();
};


// -----------------------
// ADD ITEM
// -----------------------
addItemBtn.onclick = async () => {
  const title = addTitle.value.trim();
  const url = addUrl.value.trim();

  if (!title || !url) {
    alert("Please fill out all fields.");
    return;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    alert("You must be logged in.");
    return;
  }

  const { error } = await supabase
    .from("wishlist_items")
    .insert({
      title: title,
      url: url,
      user_id: user.id
    });

  if (error) {
    console.error("Error inserting item:", error);
    alert("Could not add item.");
    return;
  }

  addTitle.value = "";
  addUrl.value = "";

  loadWishlist();
};


// -----------------------
// DELETE ITEM
// -----------------------
async function deleteItem(id) {
  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete error:", error);
    alert("Failed to delete item.");
    return;
  }

  loadWishlist();
}


// -----------------------
// LOAD WISHLIST
// -----------------------
async function loadWishlist() {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    wishlistContainer.innerHTML = "<p>Please log in.</p>";
    return;
  }

  const { data, error } = await supabase
    .from("wishlist_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load wishlist error:", error);
    return;
  }

  if (data.length === 0) {
    wishlistContainer.innerHTML = "<p>No items yet.</p>";
    return;
  }

  wishlistContainer.innerHTML = data
    .map(
      (item) => `
      <div class="item">
        <p><strong>${item.title}</strong></p>
        <a href="${item.url}" target="_blank">${item.url}</a><br>
        <button class="deleteBtn" data-id="${item.id}">
          Delete
        </button>
      </div>
    `
    )
    .join("");

  document.querySelectorAll(".deleteBtn").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.getAttribute("data-id");
      deleteItem(id);
    };
  });
}
