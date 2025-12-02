document.addEventListener("DOMContentLoaded", () => {
  // -------------------- Supabase --------------------
  const SUPABASE_URL = "https://nppwibcwohfzvxxvtnzb.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wcHdpYmN3b2hmenZ4eHZ0bnpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzE2NzYsImV4cCI6MjA4MDA0NzY3Nn0.3oO2qOE5WPwUWZ1Y5UxESo-1HI_JL_DYLebueXwesnc";

  // Ensure the Supabase library has loaded
  if (!window.supabase || !window.supabase.createClient) {
    console.error("Supabase library not available. Make sure CDN <script> is above app.js");
    return;
  }

  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // -------------------- DOM elements --------------------
  const authSection = document.getElementById("auth-section");
  const appSection = document.getElementById("app-section");

  const signupBtn = document.getElementById("signupBtn");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  const authMessage = document.getElementById("authMessage");

  const addItemBtn = document.getElementById("addItemBtn");
  const wishlistEl = document.getElementById("wishlist");

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const itemNameInput = document.getElementById("itemName");
  const itemUrlInput = document.getElementById("itemUrl");
  const itemNotesInput = document.getElementById("itemNotes");

  const themeToggleBtn = document.getElementById("themeToggle");

  // -------------------- Helpers --------------------
  function setMessage(msg, isError = false) {
    if (!authMessage) return;
    authMessage.textContent = msg;
    authMessage.style.color = isError ? "#e04848" : "";
  }

  function resetInputs() {
    if (itemNameInput) itemNameInput.value = "";
    if (itemUrlInput) itemUrlInput.value = "";
    if (itemNotesInput) itemNotesInput.value = "";
  }

  // -------------------- Theme handling --------------------
  function readSavedTheme() {
    return localStorage.getItem("wn_theme");
  }
  function applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      if (themeToggleBtn) { themeToggleBtn.textContent = "Light"; themeToggleBtn.setAttribute("aria-pressed", "true"); }
    } else {
      document.documentElement.removeAttribute("data-theme");
      if (themeToggleBtn) { themeToggleBtn.textContent = "Dark"; themeToggleBtn.setAttribute("aria-pressed", "false"); }
    }
  }
  // load saved or system preference
  (function initTheme() {
    const saved = readSavedTheme();
    if (saved) return applyTheme(saved);
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      applyTheme("dark");
    } else {
      applyTheme("light");
    }
  })();

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem("wn_theme", next);
      applyTheme(next);
    });
  }

  // -------------------- Auth state on load --------------------
  (async function boot() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error) {
      console.warn("Error getting user:", error);
    }
    if (user) {
      authSection?.classList.add("hidden");
      appSection?.classList.remove("hidden");
      loadWishlist();
    } else {
      authSection?.classList.remove("hidden");
      appSection?.classList.add("hidden");
    }
  })();

  // -------------------- SIGNUP --------------------
  signupBtn?.addEventListener("click", async () => {
    setMessage("");
    const email = emailInput?.value?.trim();
    const password = passwordInput?.value;

    if (!email || !password) {
      setMessage("Please enter email and password.", true);
      return;
    }

    console.log("Signup attempt:", email);
    const { data, error } = await supabaseClient.auth.signUp({ email, password });

    if (error) {
      console.error("Signup error:", error);
      setMessage(error.message || "Signup failed", true);
      return;
    }

    console.log("Signup success:", data);
    setMessage("Signup successful — check your email to verify the account.");
  });

  // -------------------- LOGIN --------------------
  loginBtn?.addEventListener("click", async () => {
    setMessage("");
    const email = emailInput?.value?.trim();
    const password = passwordInput?.value;

    if (!email || !password) {
      setMessage("Please enter email and password.", true);
      return;
    }

    console.log("Login attempt:", email);
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
      console.error("Login error:", error);
      setMessage(error.message || "Login failed", true);
      return;
    }

    console.log("Login success:", data);
    authSection?.classList.add("hidden");
    appSection?.classList.remove("hidden");
    loadWishlist();
  });

  // -------------------- LOGOUT --------------------
  logoutBtn?.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    authSection?.classList.remove("hidden");
    appSection?.classList.add("hidden");
    setMessage("Signed out");
  });

  // -------------------- LOAD WISHLIST --------------------
  async function loadWishlist() {
    wishlistEl.innerHTML = "";
    setMessage("Loading wishlist...");

    const { data: { user }, error: userErr } = await supabaseClient.auth.getUser();
    if (userErr) {
      console.error("getUser error:", userErr);
      setMessage("Unable to get user", true);
      return;
    }
    if (!user) {
      setMessage("Please log in.", true);
      return;
    }

    const { data, error } = await supabaseClient
      .from("wishlist_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load wishlist error:", error);
      setMessage("Could not load wishlist.", true);
      return;
    }

    setMessage("");
    if (!data || data.length === 0) {
      wishlistEl.innerHTML = `<li class="empty">No items yet — add your first item.</li>`;
      return;
    }

    wishlistEl.innerHTML = data.map(item => renderListItem(item)).join("");
    // attach delete handlers
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        await deleteItem(id);
      });
    });
  }

  // -------------------- RENDER ITEM --------------------
  function renderListItem(item) {
    const safeUrl = item.url ? item.url : "";
    const notesHtml = item.notes ? `<div class="item-meta">${escapeHtml(item.notes)}</div>` : "";
    return `
      <li>
        <div class="item-left">
          <div class="item-icon" aria-hidden="true">🎁</div>
          <div>
            <div class="item-title">${escapeHtml(item.name || item.title || "Untitled")}</div>
            ${safeUrl ? `<a class="item-meta" href="${escapeAttr(safeUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(safeUrl)}</a>` : ""}
            ${notesHtml}
          </div>
        </div>

        <div class="item-actions">
          <button class="delete-btn" data-id="${escapeAttr(item.id)}">Delete</button>
        </div>
      </li>
    `;
  }

  // -------------------- ADD ITEM --------------------
  addItemBtn?.addEventListener("click", async () => {
    setMessage("");
    const name = itemNameInput?.value?.trim();
    const url = itemUrlInput?.value?.trim();
    const notes = itemNotesInput?.value?.trim();

    if (!name) {
      setMessage("Please enter an item name.", true);
      return;
    }

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      setMessage("You must be logged in to add items.", true);
      return;
    }

    const { error } = await supabaseClient
      .from("wishlist_items")
      .insert([{ user_id: user.id, name, url, notes }]);

    if (error) {
      console.error("Insert error:", error);
      setMessage("Could not add item.", true);
      return;
    }

    resetInputs();
    loadWishlist();
  });

  // -------------------- DELETE ITEM --------------------
  async function deleteItem(id) {
    if (!confirm("Delete this item?")) return;

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      setMessage("You must be logged in.", true);
      return;
    }

    const { error } = await supabaseClient
      .from("wishlist_items")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Delete error:", error);
      setMessage("Could not delete item.", true);
      return;
    }

    loadWishlist();
  }

  // -------------------- UTIL --------------------
  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, (s) => {
      const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
      return map[s];
    });
  }
  function escapeAttr(str) {
    if (!str) return "";
    return str.replace(/"/g, "&quot;");
  }

});
