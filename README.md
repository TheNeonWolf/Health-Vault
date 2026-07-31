# 🩺 Health Vault

Health Vault is a secure web application that helps families organize and manage important medical records in one place. It allows users to create an account, add family members, upload medical documents, and securely access health information whenever needed.

---

## ✨ Features

### 🔐 Authentication
- User registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Email verification
- Forgot password & password reset
- Protected routes

### 👨‍👩‍👧 Family Management
- Add family members
- View all family members
- Delete family members
- Store relationship, age, and notes

### 📄 Medical Records
- Upload medical records
- Associate records with family members
- Store title, description, record date, and uploaded files
- View all uploaded records
- Delete records

### 🔒 Security
- JWT authentication
- Password hashing
- Protected API routes
- Email verification
- Secure password reset tokens

---

## 🛠 Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript

### Backend
- Node.js
- Express.js

### Database
- MongoDB Atlas
- Mongoose

### Authentication
- JSON Web Tokens (JWT)
- bcryptjs

### Other Packages
- Multer
- Nodemailer
- dotenv
- cookie-parser
- cors

---


## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/Health-Vault.git
```

### 2. Navigate into the project

```bash
cd Health-Vault
```

### 3. Install backend dependencies

```bash
cd Backend
npm install
```

### 4. Create a `.env` file

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key

FRONTEND_URL=http://127.0.0.1:5500

MAILTRAP_HOST=...

MAILTRAP_PORT=...

MAILTRAP_USER=...

MAILTRAP_PASS=...
```

### 5. Start the backend

```bash
npm run dev
```

### 6. Open the frontend

Open `Frontend/index.html` using Live Server or any local web server.

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/verify-email/:token | Verify email |
| POST | /api/auth/forgot-password | Send password reset email |
| POST | /api/auth/reset-password/:token | Reset password |

### Family Members

| Method | Endpoint |
|---------|----------|
| POST | /api/family |
| GET | /api/family |
| DELETE | /api/family/:id |

### Medical Records

| Method | Endpoint |
|---------|----------|
| POST | /api/records |
| GET | /api/records |
| DELETE | /api/records/:id |

---

## 🎯 Future Improvements

- Medical reminders
- OCR for uploaded documents
- Responsive mobile interface
- Dynamic file and profile syncing

---

## 👨‍💻 Author

**Mohan Krishna Ghanta**

GitHub: https://github.com/TheNeonWolf

---

## 📄 License

This project is licensed under the MIT License.