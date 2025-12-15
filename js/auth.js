// Estado da Aplicação
let currentUser = null;
let posts = [];
let users = [];
let feedType = "all";
let currentPage = 1;
let isLoading = false;
let hasMorePosts = true;

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showApp();
  }

  // Criar usuários de exemplo
  createSampleUsers();

  // Criar posts de exemplo
  const savedPosts = localStorage.getItem("posts");
  if (savedPosts) {
    posts = JSON.parse(savedPosts);
  } else {
    createSamplePosts();
  }

  // Infinite Scroll
  window.addEventListener("scroll", handleInfiniteScroll);

  // Contador de caracteres
  const postContent = document.getElementById("post-content");
  if (postContent) {
    postContent.addEventListener("input", updateCharCount);
  }
});

// Criar usuários de exemplo
function createSampleUsers() {
  users = [
    {
      id: 1,
      name: "Natan Mendes",
      handle: "@natanmendes",
      email: "teste@email.com",
      password: "123456",
      avatar: "U",
      bio: "Desenvolvedor Full Stack",
      followers: 120,
      following: 89,
    },
    {
      id: 2,
      name: "Maria Silva",
      handle: "@mariadev",
      email: "maria@email.com",
      password: "123456",
      avatar: "M",
      bio: "Designer UI/UX",
      followers: 250,
      following: 145,
    },
    {
      id: 3,
      name: "João Santos",
      handle: "@joaotech",
      email: "joao@email.com",
      password: "123456",
      avatar: "J",
      bio: "Tech Enthusiast",
      followers: 180,
      following: 95,
    },
  ];
}

// Criar posts de exemplo
function createSamplePosts() {
  posts = [
    {
      id: Date.now() + 1,
      author: users[1],
      content:
        "Acabei de finalizar um novo projeto de UI/UX! Quem mais está trabalhando em projetos pessoais hoje? 🎨✨",
      tags: ["design", "uiux", "projeto"],
      likes: 24,
      comments: 5,
      shares: 3,
      likedBy: [],
      savedBy: [],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: Date.now() + 2,
      author: users[2],
      content:
        "Descobri uma biblioteca incrível para animações em React! Alguém já usou Framer Motion? Vale muito a pena conferir.",
      tags: ["react", "javascript", "frontend"],
      image: "https://picsum.photos/seed/tech1/800/450",
      likes: 45,
      comments: 12,
      shares: 8,
      likedBy: [],
      savedBy: [],
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: Date.now() + 3,
      author: users[1],
      content:
        "Dica do dia: sempre valide suas ideias com usuários reais antes de investir muito tempo no desenvolvimento. Feedback cedo = menos retrabalho! 💡",
      tags: ["dica", "produto", "startup"],
      likes: 67,
      comments: 18,
      shares: 15,
      likedBy: [],
      savedBy: [],
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: Date.now() + 4,
      author: users[2],
      content:
        "Estudando IA generativa e as possibilidades são infinitas! Quem mais está explorando esse universo?",
      tags: ["ia", "tecnologia", "futuro"],
      likes: 89,
      comments: 23,
      shares: 20,
      likedBy: [],
      savedBy: [],
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
  ];
  savePosts();
}

// Autenticação
function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  const user = users.find((u) => u.email === email && u.password === password);

  if (user) {
    currentUser = user;
    localStorage.setItem("currentUser", JSON.stringify(user));
    // Redirecionar para a página do feed
    window.location.href = "feed.html";
  } else {
    showNotification("Email ou senha incorretos!", "error");
  }
}

function handleRegister(event) {
  event.preventDefault();
  const name = document.getElementById("register-name").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;

  if (users.find((u) => u.email === email)) {
    showNotification("Este email já está cadastrado!", "error");
    return;
  }

  // Array de cachorros fofos para avatares
  const dogAvatars = ["🐶", "🐕", "🦮", "🐕‍🦺", "🐩", "🐾"];
  const randomDog = dogAvatars[Math.floor(Math.random() * dogAvatars.length)];

  const newUser = {
    id: users.length + 1,
    name,
    handle: `@${name.toLowerCase().replace(/\s+/g, "")}`,
    email,
    password,
    avatar: randomDog,
    bio: "",
    followers: 0,
    following: 0,
  };

  users.push(newUser);
  currentUser = newUser;
  localStorage.setItem("currentUser", JSON.stringify(newUser));
  // Redirecionar para a página do feed
  window.location.href = "feed.html";
}

function logout() {
  currentUser = null;
  localStorage.removeItem("currentUser");

  // Verificar se está na página index ou feed
  if (document.getElementById("login-screen")) {
    // Está na página index.html
    document.getElementById("app-screen").classList.remove("active");
    document.getElementById("login-screen").classList.add("active");
  } else {
    // Está na página feed.html, redirecionar para index
    window.location.href = "index.html";
  }

  showNotification("Logout realizado!", "success");
}

function showApp() {
  document.getElementById("login-screen").classList.remove("active");
  document.getElementById("app-screen").classList.add("active");

  // Atualizar UI com dados do usuário
  document.getElementById("nav-username").textContent = currentUser.name;
  document.getElementById("nav-avatar").textContent = currentUser.avatar;
  document.getElementById("create-avatar").textContent = currentUser.avatar;
  document.getElementById("modal-avatar").textContent = currentUser.avatar;
  document.getElementById("modal-username").textContent = currentUser.name;

  // Carregar feed
  loadFeed();

  // Carregar sugestões
  loadSuggestions();
}

// Navegação
function switchTab(tab) {
  document
    .querySelectorAll(".tab-btn")
    .forEach((btn) => btn.classList.remove("active"));
  event.target.classList.add("active");

  document
    .querySelectorAll(".form-container")
    .forEach((form) => form.classList.remove("active"));
  document.getElementById(`${tab}-form`).classList.add("active");
}

function toggleUserMenu() {
  document.getElementById("user-dropdown").classList.toggle("active");
}

function showFeed(type) {
  feedType = type;
  currentPage = 1;
  hasMorePosts = true;

  document
    .querySelectorAll(".sidebar-btn")
    .forEach((btn) => btn.classList.remove("active"));
  event.target.classList.add("active");

  loadFeed();
}

// Feed
function loadFeed() {
  const container = document.getElementById("posts-feed");

  if (currentPage === 1) {
    container.innerHTML = "";
  }

  let filteredPosts = [...posts];

  // Filtrar por tipo de feed
  if (feedType === "following") {
    // Aqui você implementaria a lógica de seguir
    filteredPosts = posts.filter((p) => p.author.id !== currentUser.id);
  } else if (feedType === "trending") {
    filteredPosts.sort((a, b) => b.likes + b.comments - (a.likes + a.comments));
  } else if (feedType === "saved") {
    filteredPosts = posts.filter((p) => p.savedBy?.includes(currentUser.id));
  }

  // Ordenar por data
  filteredPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Paginação
  const postsPerPage = 5;
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

  if (paginatedPosts.length === 0) {
    if (currentPage === 1) {
      container.innerHTML =
        '<div class="empty-state">Nenhum post para exibir</div>';
    }
    hasMorePosts = false;
    document.getElementById("feed-end").style.display = "block";
    return;
  }

  paginatedPosts.forEach((post) => {
    container.innerHTML += renderPost(post);
  });
}

function renderPost(post) {
  const isLiked = post.likedBy?.includes(currentUser?.id);
  const isSaved = post.savedBy?.includes(currentUser?.id);
  const timeAgo = getTimeAgo(new Date(post.createdAt));

  return `
        <div class="post-card" data-post-id="${post.id}">
            <div class="post-header">
                <div class="user-avatar small">${post.author.avatar}</div>
                <div class="post-author">
                    <div class="post-author-name">${post.author.name}</div>
                    <div class="post-author-handle">${
                      post.author.handle
                    } · <span class="post-time">${timeAgo}</span></div>
                </div>
                <button class="post-menu-btn" onclick="showPostMenu(${
                  post.id
                })">⋯</button>
            </div>
            
            <div class="post-content">${post.content}</div>
            
            ${
              post.image
                ? `<img src="${post.image}" alt="Post image" class="post-image">`
                : ""
            }
            
            ${
              post.tags && post.tags.length > 0
                ? `
                <div class="post-tags">
                    ${post.tags
                      .map(
                        (tag) =>
                          `<a href="#" class="post-tag" onclick="filterByTag('${tag}'); return false;">#${tag}</a>`
                      )
                      .join("")}
                </div>
            `
                : ""
            }
            
            <div class="post-actions">
                <button class="post-action ${
                  isLiked ? "liked" : ""
                }" onclick="toggleLike(${post.id})">
                    ${isLiked ? "❤️" : "🤍"} ${post.likes}
                </button>
                <button class="post-action" onclick="openComments(${post.id})">
                    💬 ${post.comments}
                </button>
                <button class="post-action" onclick="sharePost(${post.id})">
                    🔄 ${post.shares}
                </button>
                <button class="post-action ${
                  isSaved ? "saved" : ""
                }" onclick="toggleSave(${post.id})">
                    ${isSaved ? "🔖" : "📋"}
                </button>
            </div>
        </div>
    `;
}

// Infinite Scroll
function handleInfiniteScroll() {
  if (isLoading || !hasMorePosts) return;

  const scrollPosition = window.innerHeight + window.scrollY;
  const threshold = document.documentElement.scrollHeight - 500;

  if (scrollPosition >= threshold) {
    loadMorePosts();
  }
}

function loadMorePosts() {
  if (isLoading) return;

  isLoading = true;
  document.getElementById("feed-loading").style.display = "block";

  setTimeout(() => {
    currentPage++;
    loadFeed();
    isLoading = false;
    document.getElementById("feed-loading").style.display = "none";
  }, 1000);
}

// Criar Post
function openCreatePostModal() {
  showModal("create-post-modal");
  document.getElementById("post-content").focus();
}

function handleCreatePost(event) {
  event.preventDefault();

  const content = document.getElementById("post-content").value.trim();
  const tagsInput = document.getElementById("post-tags").value.trim();
  const tags = tagsInput
    ? tagsInput.split(",").map((t) => t.trim().replace("#", ""))
    : [];

  if (!content) {
    showNotification("Escreva algo antes de publicar!", "error");
    return;
  }

  const newPost = {
    id: Date.now(),
    author: currentUser,
    content,
    tags,
    likes: 0,
    comments: 0,
    shares: 0,
    likedBy: [],
    savedBy: [],
    createdAt: new Date().toISOString(),
  };

  posts.unshift(newPost);
  savePosts();

  closeModal("create-post-modal");
  event.target.reset();
  document.getElementById("char-count").textContent = "0";

  // Recarregar feed
  currentPage = 1;
  loadFeed();

  showNotification("Post publicado com sucesso!", "success");
}

function updateCharCount() {
  const content = document.getElementById("post-content").value;
  document.getElementById("char-count").textContent = content.length;

  const counter = document.getElementById("char-count");
  if (content.length > 2700) {
    counter.style.color = "var(--danger)";
  } else if (content.length > 2400) {
    counter.style.color = "var(--warning)";
  } else {
    counter.style.color = "var(--text-tertiary)";
  }
}

// Interações
function toggleLike(postId) {
  const post = posts.find((p) => p.id === postId);
  if (!post) return;

  if (!post.likedBy) post.likedBy = [];

  const index = post.likedBy.indexOf(currentUser.id);
  if (index > -1) {
    post.likedBy.splice(index, 1);
    post.likes--;
  } else {
    post.likedBy.push(currentUser.id);
    post.likes++;
  }

  savePosts();
  updatePostInDOM(post);
}

function toggleSave(postId) {
  const post = posts.find((p) => p.id === postId);
  if (!post) return;

  if (!post.savedBy) post.savedBy = [];

  const index = post.savedBy.indexOf(currentUser.id);
  if (index > -1) {
    post.savedBy.splice(index, 1);
    showNotification("Post removido dos salvos", "info");
  } else {
    post.savedBy.push(currentUser.id);
    showNotification("Post salvo!", "success");
  }

  savePosts();
  updatePostInDOM(post);
}

function updatePostInDOM(post) {
  const postCard = document.querySelector(`[data-post-id="${post.id}"]`);
  if (postCard) {
    const parent = postCard.parentElement;
    postCard.outerHTML = renderPost(post);
  }
}

function openComments(postId) {
  showNotification("Funcionalidade de comentários em desenvolvimento!", "info");
}

function sharePost(postId) {
  const post = posts.find((p) => p.id === postId);
  if (post) {
    post.shares++;
    savePosts();
    updatePostInDOM(post);
    showNotification("Post compartilhado!", "success");
  }
}

function showPostMenu(postId) {
  showNotification("Menu do post em desenvolvimento!", "info");
}

// Filtros e Busca
function filterByTag(tag) {
  document.getElementById("search-input").value = `#${tag}`;
  showNotification(`Filtrando por #${tag}`, "info");
  // Aqui você implementaria a lógica de filtro
}

// Sugestões
function loadSuggestions() {
  const container = document.getElementById("suggestions-list");
  const suggestions = users.filter((u) => u.id !== currentUser.id).slice(0, 3);

  container.innerHTML = suggestions
    .map(
      (user) => `
        <div class="suggestion-item">
            <div class="user-avatar small">${user.avatar}</div>
            <div class="suggestion-info">
                <div class="suggestion-name">${user.name}</div>
                <div class="suggestion-handle">${user.handle}</div>
            </div>
            <button class="btn-follow" onclick="followUser(${user.id})">Seguir</button>
        </div>
    `
    )
    .join("");
}

function followUser(userId) {
  showNotification("Agora você está seguindo este usuário!", "success");
  // Aqui você implementaria a lógica de seguir
}

// Perfil e Configurações
function showProfile() {
  showNotification("Página de perfil em desenvolvimento!", "info");
}

function showSettings() {
  showNotification("Configurações em desenvolvimento!", "info");
}

// Utilitários
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  const intervals = {
    ano: 31536000,
    mês: 2592000,
    semana: 604800,
    dia: 86400,
    hora: 3600,
    minuto: 60,
  };

  for (const [name, secondsInInterval] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInInterval);
    if (interval >= 1) {
      return `${interval} ${name}${interval > 1 ? "s" : ""} atrás`;
    }
  }

  return "agora mesmo";
}

function savePosts() {
  localStorage.setItem("posts", JSON.stringify(posts));
}

// Modais
function showModal(modalId) {
  document.getElementById(modalId).classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("active");
  document.body.style.overflow = "auto";
}

window.onclick = function (event) {
  if (event.target.classList.contains("modal")) {
    event.target.classList.remove("active");
    document.body.style.overflow = "auto";
  }
};

// Notificações
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 16px 24px;
        background: ${
          type === "success"
            ? "#10b981"
            : type === "error"
            ? "#ef4444"
            : "#3b82f6"
        };
        color: white;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        font-weight: 600;
        max-width: 350px;
    `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Animações
const style = document.createElement("style");
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
