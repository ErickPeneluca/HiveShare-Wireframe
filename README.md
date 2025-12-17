# 🐝 HiveShare - Rede Social

Uma rede social moderna e responsiva desenvolvida com HTML5, CSS3 e JavaScript puro.

## 📋 Sobre o Projeto

HiveShare é uma plataforma de rede social que permite aos usuários compartilhar posts, interagir com conteúdo através de curtidas e comentários, seguir outros usuários e muito mais.

## 🚀 Deploy

- https://erickpeneluca.github.io/HiveShare-Wireframe/

## ✨ Funcionalidades

### 🔐 Autenticação

- Sistema de login e registro
- Persistência de sessão com localStorage
- Avatares personalizados com emojis de cachorros 🐶

### 📝 Posts

- Criar posts com até 3000 caracteres
- Upload de imagens (até 5MB)
- Upload de vídeos (até 300MB)
- Sistema de tags/hashtags
- Excluir seus próprios posts

### 💬 Interações

- Curtir posts
- Comentar em posts (até 500 caracteres)
- Salvar posts favoritos
- Compartilhar posts
- Seguir/deixar de seguir usuários

### 🎨 Interface

- Design moderno e responsivo
- Scroll infinito no feed
- Seletor de emojis integrado
- Notificações em tempo real
- Preview de mídias
- Três colunas: navegação, feed e sugestões

### 📊 Feeds Especializados

- **Início**: Todos os posts
- **Seguindo**: Posts de usuários que você segue
- **Em Alta**: Posts mais populares
- **Salvos**: Posts que você salvou

## 🚀 Como Executar

### Opção 1: Executar Localmente

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/hiveshare.git
cd hiveshare
```

2. Abra o arquivo `index.html` em seu navegador preferido

### Opção 2: Servidor Local

Com Python 3:

```bash
python -m http.server 8000
```

Com Node.js (http-server):

```bash
npx http-server
```

Depois acesse: `http://localhost:8000`

## 👤 Credenciais de Teste

Existem 3 usuários pré-cadastrados para teste:

| Nome         | Email           | Senha  | Avatar |
| ------------ | --------------- | ------ | ------ |
| Natan Mendes | teste@email.com | 123456 | 🐶     |
| Maria Silva  | maria@email.com | 123456 | 🐩     |
| João Santos  | joao@email.com  | 123456 | 🐕     |

## 📁 Estrutura do Projeto

```
hiveshare/
├── css/
│   └── styles.css          # Estilos da aplicação
├── js/
│   ├── auth.js            # Autenticação e login
│   └── feed.js            # Lógica do feed e interações
├── index.html             # Página de login/registro
├── feed.html              # Página principal do feed
├── .gitignore             # Arquivos ignorados pelo Git
├── LICENSE                # Licença MIT
└── README.md              # Este arquivo
```

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Estilização moderna com variáveis CSS e grid
- **JavaScript (ES6+)**: Lógica da aplicação
- **localStorage**: Persistência de dados no navegador

### Recursos CSS

- CSS Grid e Flexbox
- Variáveis CSS (Custom Properties)
- Animações e transições
- Design responsivo com media queries

### Recursos JavaScript

- ES6+ (Arrow functions, template literals, etc.)
- Manipulação do DOM
- FileReader API para upload de arquivos
- localStorage API para persistência

## 🎯 Funcionalidades Técnicas

### Armazenamento de Dados

Todos os dados são armazenados no localStorage do navegador:

- `currentUser`: Usuário logado
- `posts`: Todos os posts
- `following_{userId}`: Lista de usuários seguidos

### Sistema de Comentários

- Estrutura aninhada de comentários
- Curtidas em comentários
- Timestamp em cada comentário

### Upload de Mídia

- Validação de tipo de arquivo
- Limite de tamanho
- Preview antes de publicar
- Conversão para base64 para armazenamento

### Scroll Infinito

- Carregamento progressivo de posts
- Indicador de loading
- Detecção automática do fim do feed

## 🎨 Paleta de Cores

```css
--primary: #7c3aed (Roxo)
--primary-hover: #6d28d9
--bg-primary: #ffffff
--bg-secondary: #f9fafb
--text-primary: #111827
--text-secondary: #6b7280
--border: #e5e7eb
--danger: #ef4444
--success: #10b981
```

## 📱 Responsividade

O HiveShare é totalmente responsivo e se adapta a diferentes tamanhos de tela:

- **Desktop**: Layout de 3 colunas
- **Tablet**: Layout simplificado
- **Mobile**: Layout de coluna única

## 🔜 Próximas Funcionalidades

- [ ] Notificações em tempo real
- [ ] Mensagens diretas entre usuários
- [ ] Página de perfil completa
- [ ] Edição de posts
- [ ] Stories temporários
- [ ] Modo escuro
- [ ] Backend com API REST
- [ ] Banco de dados real

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer um fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abrir um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

Desenvolvido por Erick Peneluca, Gabriel Cury e Natan Mendes.

---

⭐ Se você gostou deste projeto, deixe uma estrela!
