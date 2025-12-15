// Verificar autenticação ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
  const isGuest = localStorage.getItem("isGuest");
  if (isGuest === "true") {
    // Entrou como convidado, não carregar usuário
    currentUser = null;
    localStorage.removeItem("isGuest");
  } else {
    // Verificar se há usuário salvo
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      currentUser = JSON.parse(savedUser);
    }
  }
  // Permite acesso sem login (modo visitante)
  initializeFeed();
});

let currentUser = null;
let posts = [];
let users = [];
let feedType = "all";
let currentPage = 1;
let isLoading = false;
let hasMorePosts = true;
let currentPostId = null;
let currentMediaData = null;
let currentMediaType = null;
let followingUsers = []; // Array de IDs de usuários que o user atual segue

function initializeFeed() {
  // Criar usuários de exemplo
  createSampleUsers();

  // Carregar lista de seguindo
  if (currentUser) {
    const savedFollowing = localStorage.getItem(`following_${currentUser.id}`);
    followingUsers = savedFollowing ? JSON.parse(savedFollowing) : [];
  }

  // Carregar posts
  const savedPosts = localStorage.getItem("posts");
  if (savedPosts) {
    posts = JSON.parse(savedPosts);

    // Migrar avatares antigos para cachorros (se necessário)
    posts = posts.map((post) => {
      // Encontrar o usuário correspondente
      const user = users.find((u) => u.id === post.author.id);
      if (user && post.author.avatar !== user.avatar) {
        post.author.avatar = user.avatar;
      }
      return post;
    });

    // Salvar posts migrados
    savePosts();
  } else {
    createSamplePosts();
  }

  // Atualizar UI com dados do usuário (se logado)
  if (currentUser) {
    document.getElementById("nav-username").textContent = currentUser.name;
    document.getElementById("nav-avatar").textContent = currentUser.avatar;
    document.getElementById("create-avatar").textContent = currentUser.avatar;
    document.getElementById("modal-avatar").textContent = currentUser.avatar;
    document.getElementById("modal-username").textContent = currentUser.name;
  } else {
    // Modo visitante: mostrar botão de login
    document.querySelector(".user-menu").innerHTML = `
            <button class="btn btn-primary" onclick="window.location.href='index.html'">Entrar</button>
        `;
    document.getElementById("create-avatar").textContent = "👤";
  }

  // Carregar feed
  loadFeed();

  // Carregar sugestões
  loadSuggestions();

  // Infinite Scroll
  window.addEventListener("scroll", handleInfiniteScroll);

  // Contador de caracteres
  const postContent = document.getElementById("post-content");
  if (postContent) {
    postContent.addEventListener("input", updateCharCount);
  }
}

// Criar usuários de exemplo
function createSampleUsers() {
  users = [
    {
      id: 1,
      name: "Natan Mendes",
      handle: "@natanmendes",
      email: "teste@email.com",
      password: "123456",
      avatar: "🐶",
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
      avatar: "🐩",
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
      avatar: "🐕",
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
      commentsList: [
        {
          id: 1,
          author: users[2],
          text: "Ficou incrível! Parabéns pelo trabalho 👏",
          likes: 3,
          likedBy: [],
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        },
      ],
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

// Navegação
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
    filteredPosts = posts.filter((p) => p.author.id !== currentUser.id);
  } else if (feedType === "trending") {
    filteredPosts.sort((a, b) => b.likes + b.comments - (a.likes + a.comments));
  } else if (feedType === "saved") {
    filteredPosts = posts.filter((p) => p.savedBy?.includes(currentUser.id));
  }

  filteredPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
              post.video
                ? `<video src="${post.video}" controls class="post-image"></video>`
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
                    💬 ${post.commentsList?.length || 0}
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
  if (!currentUser) {
    showNotification("Faça login para criar posts!", "info");
    setTimeout(() => (window.location.href = "index.html"), 1500);
    return;
  }
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

  if (!content && !currentMediaData) {
    showNotification(
      "Escreva algo ou adicione uma mídia antes de publicar!",
      "error"
    );
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
    commentsList: [],
    createdAt: new Date().toISOString(),
  };

  // Adicionar mídia se existir
  if (currentMediaData) {
    if (currentMediaType === "image") {
      newPost.image = currentMediaData;
    } else if (currentMediaType === "video") {
      newPost.video = currentMediaData;
    }
  }

  posts.unshift(newPost);
  savePosts();

  closeModal("create-post-modal");
  event.target.reset();
  document.getElementById("char-count").textContent = "0";
  document.getElementById("media-preview").innerHTML = "";
  currentMediaData = null;
  currentMediaType = null;

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
  if (!currentUser) {
    showNotification("Faça login para curtir posts!", "info");
    setTimeout(() => (window.location.href = "index.html"), 1500);
    return;
  }

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
  if (!currentUser) {
    showNotification("Faça login para salvar posts!", "info");
    setTimeout(() => (window.location.href = "index.html"), 1500);
    return;
  }

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
    postCard.outerHTML = renderPost(post);
  }
}

function openComments(postId) {
  if (!currentUser) {
    showNotification("Faça login para ver comentários!", "info");
    setTimeout(() => (window.location.href = "index.html"), 1500);
    return;
  }

  currentPostId = postId;
  const post = posts.find((p) => p.id === postId);
  if (!post) return;

  // Inicializar lista de comentários se não existir
  if (!post.commentsList) {
    post.commentsList = [];
  }

  // Mostrar post original
  document.getElementById("original-post").innerHTML = renderPost(post);

  // Mostrar comentários
  renderComments(post);

  // Atualizar avatar do usuário
  document.getElementById("comment-avatar").textContent = currentUser.avatar;

  showModal("comments-modal");

  // Adicionar listener para contador de caracteres
  const commentInput = document.getElementById("comment-input");
  commentInput.value = "";
  document.getElementById("comment-char-count").textContent = "0";
  commentInput.addEventListener("input", updateCommentCharCount);
}

function renderComments(post) {
  const commentsList = document.getElementById("comments-list");

  if (!post.commentsList || post.commentsList.length === 0) {
    commentsList.innerHTML =
      '<p style="text-align: center; color: var(--text-tertiary); padding: 20px;">Seja o primeiro a comentar!</p>';
    return;
  }

  commentsList.innerHTML = post.commentsList
    .map((comment) => {
      const isLiked = comment.likedBy?.includes(currentUser?.id);
      const timeAgo = getTimeAgo(new Date(comment.createdAt));

      return `
            <div class="comment-item">
                <div class="user-avatar small">${comment.author.avatar}</div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${
                          comment.author.name
                        }</span>
                        <span class="comment-time">${timeAgo}</span>
                    </div>
                    <div class="comment-text">${comment.text}</div>
                    <div class="comment-actions-bar">
                        <button class="comment-action ${
                          isLiked ? "liked" : ""
                        }" onclick="toggleCommentLike(${comment.id})">
                            ${isLiked ? "❤️" : "🤍"} ${comment.likes || 0}
                        </button>
                    </div>
                </div>
            </div>
        `;
    })
    .join("");
}

function addComment() {
  if (!currentUser) {
    showNotification("Faça login para comentar!", "info");
    return;
  }

  const commentInput = document.getElementById("comment-input");
  const text = commentInput.value.trim();

  if (!text) {
    showNotification("Escreva algo antes de comentar!", "error");
    return;
  }

  const post = posts.find((p) => p.id === currentPostId);
  if (!post) return;

  if (!post.commentsList) {
    post.commentsList = [];
  }

  const newComment = {
    id: Date.now(),
    author: currentUser,
    text,
    likes: 0,
    likedBy: [],
    createdAt: new Date().toISOString(),
  };

  post.commentsList.push(newComment);
  post.comments = post.commentsList.length;

  savePosts();
  renderComments(post);
  updatePostInDOM(post);

  commentInput.value = "";
  document.getElementById("comment-char-count").textContent = "0";

  showNotification("Comentário adicionado!", "success");
}

function toggleCommentLike(commentId) {
  const post = posts.find((p) => p.id === currentPostId);
  if (!post) return;

  const comment = post.commentsList.find((c) => c.id === commentId);
  if (!comment) return;

  if (!comment.likedBy) comment.likedBy = [];

  const index = comment.likedBy.indexOf(currentUser.id);
  if (index > -1) {
    comment.likedBy.splice(index, 1);
    comment.likes--;
  } else {
    comment.likedBy.push(currentUser.id);
    comment.likes++;
  }

  savePosts();
  renderComments(post);
}

function updateCommentCharCount() {
  const text = document.getElementById("comment-input").value;
  document.getElementById("comment-char-count").textContent = text.length;

  const counter = document.getElementById("comment-char-count");
  if (text.length > 450) {
    counter.style.color = "var(--danger)";
  } else if (text.length > 400) {
    counter.style.color = "var(--warning)";
  } else {
    counter.style.color = "var(--text-tertiary)";
  }
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
  const post = posts.find((p) => p.id === postId);
  if (!post) return;

  // Verificar se o post é do usuário atual
  if (currentUser && post.author.id === currentUser.id) {
    showDeletePostModal(postId);
  } else {
    showNotification("Apenas o autor pode excluir este post!", "info");
  }
}

function showDeletePostModal(postId) {
  const deleteModal = document.createElement("div");
  deleteModal.className = "modal";
  deleteModal.id = "delete-post-modal";
  deleteModal.style.display = "flex";
  deleteModal.innerHTML = `
    <div class="modal-content" style="max-width: 400px;">
      <div class="modal-header">
        <h3>Excluir Post</h3>
        <button class="close-btn" onclick="document.getElementById('delete-post-modal').remove()">&times;</button>
      </div>
      <div class="modal-body" style="padding: 20px; text-align: center;">
        <p style="margin-bottom: 20px; color: var(--text-secondary);">Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.</p>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button class="btn btn-secondary" onclick="document.getElementById('delete-post-modal').remove()">Cancelar</button>
          <button class="btn" style="background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;" onclick="deletePost(${postId}); document.getElementById('delete-post-modal').remove()">Excluir</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(deleteModal);
}

function deletePost(postId) {
  // Remover post do array
  posts = posts.filter((p) => p.id !== postId);

  // Salvar no localStorage
  savePosts();

  // Remover do DOM
  const postCard = document.querySelector(`[data-post-id="${postId}"]`);
  if (postCard) {
    postCard.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => {
      postCard.remove();
      showNotification("Post excluído com sucesso!", "success");
    }, 300);
  }
}

// Filtros e Busca
function filterByTag(tag) {
  document.getElementById("search-input").value = `#${tag}`;
  showNotification(`Filtrando por #${tag}`, "info");
}

// Sugestões
function loadSuggestions() {
  const container = document.getElementById("suggestions-list");
  const suggestions = users.filter((u) => u.id !== currentUser?.id).slice(0, 3);

  container.innerHTML = suggestions
    .map((user) => {
      const isFollowing = followingUsers.includes(user.id);
      return `
            <div class="suggestion-item" id="suggestion-${user.id}">
                <div class="user-avatar small">${user.avatar}</div>
                <div class="suggestion-info">
                    <div class="suggestion-name">${user.name}</div>
                    <div class="suggestion-handle">${user.handle}</div>
                </div>
                <button class="btn-follow ${isFollowing ? "following" : ""}" 
                        onclick="followUser(${user.id})" 
                        id="follow-btn-${user.id}">
                    ${isFollowing ? "Seguindo" : "Seguir"}
                </button>
            </div>
        `;
    })
    .join("");
}

function followUser(userId) {
  if (!currentUser) {
    showNotification("Faça login para seguir usuários!", "info");
    setTimeout(() => (window.location.href = "index.html"), 1500);
    return;
  }

  const btn = document.getElementById(`follow-btn-${userId}`);
  const isFollowing = followingUsers.includes(userId);

  if (isFollowing) {
    // Deixar de seguir
    followingUsers = followingUsers.filter((id) => id !== userId);
    btn.textContent = "Seguir";
    btn.classList.remove("following");
    showNotification("Você deixou de seguir este usuário!", "info");
  } else {
    // Seguir
    followingUsers.push(userId);
    btn.textContent = "Seguindo";
    btn.classList.add("following");
    showNotification("Agora você está seguindo este usuário!", "success");
  }

  // Salvar no localStorage
  localStorage.setItem(
    `following_${currentUser.id}`,
    JSON.stringify(followingUsers)
  );
}

// Perfil e Configurações
function showProfile() {
  if (!currentUser) {
    showNotification("Faça login para ver seu perfil!", "info");
    return;
  }

  const profileContent = document.getElementById("profile-content");

  profileContent.innerHTML = `
        <div class="profile-section">
            <div class="profile-header">
                <div class="profile-avatar-large">${currentUser.avatar}</div>
                <div class="profile-info">
                    <h2>${currentUser.name}</h2>
                    <p class="profile-handle">${currentUser.handle}</p>
                    <p class="profile-bio">${
                      currentUser.bio || "Sem biografia"
                    }</p>
                    <div class="profile-stats">
                        <div class="stat">
                            <span class="stat-number">${
                              posts.filter(
                                (p) => p.author.id === currentUser.id
                              ).length
                            }</span>
                            <span class="stat-label">Posts</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">${
                              currentUser.followers
                            }</span>
                            <span class="stat-label">Seguidores</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">${
                              currentUser.following
                            }</span>
                            <span class="stat-label">Seguindo</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="profile-actions">
                <button class="btn btn-primary" onclick="editProfile()">Editar Perfil</button>
            </div>
        </div>
    `;

  showModal("profile-modal");
}

function editProfile() {
  const profileContent = document.getElementById("profile-content");

  profileContent.innerHTML = `
        <div class="profile-section edit-mode">
            <h3>Editar Perfil</h3>
            <form onsubmit="saveProfile(event)">
                <div class="form-group">
                    <label>Nome</label>
                    <input type="text" id="edit-name" value="${
                      currentUser.name
                    }" required maxlength="50">
                </div>
                <div class="form-group">
                    <label>Avatar (Emoji)</label>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="text" id="edit-avatar" value="${
                          currentUser.avatar
                        }" maxlength="2" style="width: 60px; font-size: 24px; text-align: center;">
                        <button type="button" class="btn" onclick="openEmojiPickerForProfile()" style="padding: 8px 12px;">Escolher</button>
                    </div>
                </div>
                <div class="form-group">
                    <label>Biografia</label>
                    <textarea id="edit-bio" maxlength="150" placeholder="Escreva algo sobre você">${
                      currentUser.bio || ""
                    }</textarea>
                    <small><span id="bio-char-count">0</span>/150</small>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button type="submit" class="btn btn-primary">Salvar Alterações</button>
                    <button type="button" class="btn btn-secondary" onclick="showProfile()">Cancelar</button>
                </div>
            </form>
        </div>
    `;

  // Contador de caracteres para bio
  document.getElementById("edit-bio").addEventListener("input", (e) => {
    document.getElementById("bio-char-count").textContent =
      e.target.value.length;
  });
}

function saveProfile(event) {
  event.preventDefault();

  const name = document.getElementById("edit-name").value.trim();
  const avatar = document.getElementById("edit-avatar").value.trim();
  const bio = document.getElementById("edit-bio").value.trim();

  if (!name) {
    showNotification("O nome não pode estar vazio!", "error");
    return;
  }

  if (!avatar) {
    showNotification("Escolha um avatar!", "error");
    return;
  }

  // Atualizar currentUser
  currentUser.name = name;
  currentUser.avatar = avatar;
  currentUser.bio = bio;

  // Atualizar também na lista de usuários
  const userIndex = users.findIndex((u) => u.id === currentUser.id);
  if (userIndex !== -1) {
    users[userIndex] = currentUser;
  }

  // Atualizar posts do usuário com o novo avatar
  posts.forEach((post) => {
    if (post.author.id === currentUser.id) {
      post.author = currentUser;
    }
  });

  // Salvar no localStorage
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  savePosts();

  // Atualizar UI do feed
  document.getElementById("nav-username").textContent = currentUser.name;
  document.getElementById("nav-avatar").textContent = currentUser.avatar;
  document.getElementById("create-avatar").textContent = currentUser.avatar;
  document.getElementById("modal-avatar").textContent = currentUser.avatar;
  document.getElementById("modal-username").textContent = currentUser.name;

  showNotification("Perfil atualizado com sucesso!", "success");
  showProfile();
}

function openEmojiPickerForProfile() {
  const emojis = [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "🤣",
    "😂",
    "🙂",
    "🙃",
    "😉",
    "😊",
    "😇",
    "🥰",
    "😍",
    "🤩",
    "😘",
    "😗",
    "😚",
    "😙",
    "🥲",
    "😋",
    "😛",
    "😜",
    "🤪",
    "😌",
    "😔",
    "😑",
    "😐",
    "😏",
    "😒",
    "🐶",
    "🐱",
    "🐭",
    "🐹",
    "🐰",
    "🦊",
    "🐻",
    "🐼",
    "🐨",
    "🐯",
    "🦁",
    "🐮",
    "🐷",
    "🐸",
    "🐵",
    "🙈",
    "🙉",
    "🙊",
    "🐒",
    "🐔",
    "🐧",
    "🐦",
    "🐤",
    "🦆",
    "🦅",
    "🦉",
    "🦇",
    "🐺",
    "🐗",
    "🐴",
    "🦄",
    "🐝",
    "🐛",
    "🦋",
    "🐌",
    "🐞",
    "🐜",
    "🪰",
    "🪲",
    "🦟",
    "🦗",
    "🕷",
    "🕸",
    "🐢",
    "🐍",
    "🐙",
    "🦑",
    "🦐",
    "🦞",
    "🦀",
    "🐡",
    "🐠",
    "🐟",
    "🐬",
    "🐳",
    "🐋",
    "🦈",
    "⭐",
    "🌟",
    "✨",
    "⚡",
    "☄️",
    "💥",
    "🔥",
    "🌪️",
    "🌈",
    "☀️",
    "🌤️",
    "⛅",
    "🌥️",
    "☁️",
  ];

  const emojiContainer = document.createElement("div");
  emojiContainer.style.cssText =
    "display: grid; grid-template-columns: repeat(8, 1fr); gap: 8px; margin-top: 10px; max-height: 300px; overflow-y: auto;";

  emojis.forEach((emoji) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = emoji;
    btn.style.cssText =
      "font-size: 24px; padding: 8px; border: 1px solid #e1e8ed; border-radius: 4px; cursor: pointer; background: white;";
    btn.onclick = (e) => {
      e.preventDefault();
      document.getElementById("edit-avatar").value = emoji;
    };
    btn.onmouseover = () => (btn.style.backgroundColor = "#f0f0f0");
    btn.onmouseout = () => (btn.style.backgroundColor = "white");
    emojiContainer.appendChild(btn);
  });

  const avatarInput = document.getElementById("edit-avatar").parentElement;
  const existingPicker = avatarInput.querySelector('[style*="grid"]');
  if (existingPicker) {
    existingPicker.remove();
  }
  avatarInput.appendChild(emojiContainer);
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

// Upload de Mídia
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showNotification(
      "Por favor, selecione um arquivo de imagem válido!",
      "error"
    );
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    // 5MB limite
    showNotification("A imagem deve ter no máximo 5MB!", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    currentMediaData = e.target.result;
    currentMediaType = "image";
    showMediaPreview(e.target.result, "image");
    showNotification("Imagem adicionada!", "success");
  };
  reader.readAsDataURL(file);
}

function handleVideoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("video/")) {
    showNotification(
      "Por favor, selecione um arquivo de vídeo válido!",
      "error"
    );
    return;
  }

  if (file.size > 50 * 1024 * 1024) {
    // 50MB limite
    showNotification("O vídeo deve ter no máximo 50MB!", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    currentMediaData = e.target.result;
    currentMediaType = "video";
    showMediaPreview(e.target.result, "video");
    showNotification("Vídeo adicionado!", "success");
  };
  reader.readAsDataURL(file);
}

function showMediaPreview(data, type) {
  const preview = document.getElementById("media-preview");

  if (type === "image") {
    preview.innerHTML = `
            <img src="${data}" alt="Preview">
            <button class="remove-media" onclick="removeMedia()">&times;</button>
        `;
  } else if (type === "video") {
    preview.innerHTML = `
            <video src="${data}" controls></video>
            <button class="remove-media" onclick="removeMedia()">&times;</button>
        `;
  }
}

function removeMedia() {
  currentMediaData = null;
  currentMediaType = null;
  document.getElementById("media-preview").innerHTML = "";
  document.getElementById("image-upload").value = "";
  document.getElementById("video-upload").value = "";
  showNotification("Mídia removida!", "info");
}

// Emoji Picker
const emojis = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😅",
  "🤣",
  "😂",
  "🙂",
  "🙃",
  "😉",
  "😊",
  "😇",
  "🥰",
  "😍",
  "🤩",
  "😘",
  "😗",
  "😚",
  "😙",
  "😋",
  "😛",
  "😜",
  "🤪",
  "😝",
  "🤑",
  "🤗",
  "🤭",
  "🤫",
  "🤔",
  "🤐",
  "🤨",
  "😐",
  "😑",
  "😶",
  "😏",
  "😒",
  "🙄",
  "😬",
  "🤥",
  "😌",
  "😔",
  "😪",
  "🤤",
  "😴",
  "😷",
  "🤒",
  "🤕",
  "🤢",
  "🤮",
  "🤧",
  "🥵",
  "🥶",
  "😶‍🌫️",
  "🥴",
  "😵",
  "🤯",
  "🤠",
  "🥳",
  "😎",
  "🤓",
  "🧐",
  "😕",
  "😟",
  "🙁",
  "☹️",
  "😮",
  "😯",
  "😲",
  "😳",
  "🥺",
  "😦",
  "😧",
  "😨",
  "😰",
  "😥",
  "😢",
  "😭",
  "😱",
  "😖",
  "💪",
  "👍",
  "👎",
  "👏",
  "🙌",
  "👋",
  "🤝",
  "🙏",
  "✨",
  "⭐",
  "🌟",
  "💫",
  "✅",
  "❌",
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🖤",
  "🤍",
  "🤎",
  "💔",
  "❣️",
  "💕",
  "💞",
  "💓",
  "💗",
  "💖",
  "💘",
  "💝",
  "🔥",
  "💯",
  "💢",
  "💥",
  "💦",
  "💨",
  "🎉",
  "🎊",
];

function openEmojiPicker() {
  const picker = document.getElementById("emoji-picker");
  const grid = document.getElementById("emoji-grid");

  if (picker.style.display === "flex") {
    closeEmojiPicker();
    return;
  }

  grid.innerHTML = emojis
    .map(
      (emoji) =>
        `<div class="emoji-item" onclick="insertEmoji('${emoji}')">${emoji}</div>`
    )
    .join("");

  picker.style.display = "flex";
}

function closeEmojiPicker() {
  document.getElementById("emoji-picker").style.display = "none";
}

function insertEmoji(emoji) {
  const textarea = document.getElementById("post-content");
  const cursorPos = textarea.selectionStart;
  const textBefore = textarea.value.substring(0, cursorPos);
  const textAfter = textarea.value.substring(cursorPos);

  textarea.value = textBefore + emoji + textAfter;
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = cursorPos + emoji.length;

  updateCharCount();
  closeEmojiPicker();
}

// Modo Convidado - Desabilitar ações
function disableGuestActions() {
  // Desabilitar botão de criar post
  const createPostBox = document.querySelector(".create-post-box");
  if (createPostBox) {
    createPostBox.style.opacity = "0.5";
    createPostBox.style.pointerEvents = "none";
  }

  // Desabilitar botão de seguir
  document.querySelectorAll(".btn-follow").forEach((btn) => {
    btn.style.opacity = "0.5";
    btn.style.pointerEvents = "none";
  });
}

// Função de logout que funciona no feed.html
function logout() {
  currentUser = null;
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}
