# 🎯 Quiz Neon

A full-stack real-time multiplayer quiz application built using the **MERN Stack**. Quiz Neon allows users to create custom quiz rooms, invite participants using a unique room code, and compete in real time with timers, scoring, and live leaderboards.

---

## 🚀 Features

### 🔐 Authentication

- User registration and login
- JWT-based authentication
- Password hashing using bcryptjs
- Protected routes for quiz hosts

### 🎮 Multiplayer Quiz

- Create custom quiz rooms
- Generate unique 6-character room codes
- Join rooms using a room code
- Real-time communication using Socket.io
- Waiting room for participants
- Host-controlled quiz start
- Automatic question transitions
- Live leaderboard after each question
- Final leaderboard with the winner

### ⏱️ Timer & Scoring

- Custom timer for each question
- Question time limits between 10 and 30 seconds
- Time-based scoring system
- Faster correct answers receive more points
- Maximum score of approximately 1000 points per correct answer
- Minimum score of approximately 500 points for correct answers
- Incorrect answers receive 0 points

### 📚 Solo Practice Mode

- Practice quizzes independently
- Choose quiz categories
- No multiplayer room required
- Score breakdown after quiz completion
- Solo leaderboard with top scores

### 🌙 Dark Mode

- Light and dark theme support
- Theme preference saved in the browser

---

## 🛠️ Tech Stack

### Frontend

- React 18
- Vite
- Tailwind CSS
- React Router
- Axios
- Socket.io Client

### Backend

- Node.js
- Express.js
- Socket.io
- JSON Web Token (JWT)
- bcryptjs

### Database

- MongoDB Atlas
- Mongoose

---

## 📁 Project Structure

```text
quiz-adv/
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── seed.js
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── api/
│   │
│   └── public/
│
└── README.md
