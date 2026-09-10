# Quiz Website — MERN Stack (React + Tailwind, Node/Express, MongoDB Atlas, JWT + bcrypt)

Ye ek fully working full-stack quiz website hai. Neeche step-by-step setup diya hai — dono
folders (`backend` aur `frontend`) ko alag-alag terminal me chalana hoga.

## Folder Structure
```
quiz-app/
├── backend/     -> Node.js + Express API + MongoDB models
└── frontend/    -> React + Tailwind CSS (Vite)
```

---

## STEP 1: MongoDB Atlas Setup (Database)

1. https://www.mongodb.com/cloud/atlas/register par free account banao.
2. "Build a Database" -> Free tier (M0) select karo -> Create.
3. Database Access me ek user banao (username/password yaad rakho).
4. Network Access me "Allow access from anywhere" (0.0.0.0/0) add karo — testing ke liye.
5. "Connect" -> "Drivers" -> connection string copy karo. Ye kuch aisa dikhega:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/quizapp?retryWrites=true&w=majority
   ```

---

## STEP 2: Backend Setup

```bash
cd backend
npm install
```

`.env.example` file ko `.env` naam se copy karo aur values bharo:
```bash
cp .env.example .env
```

`.env` file me:
```
MONGO_URI=<apna Atlas connection string yaha daalo>
JWT_SECRET=<koi bhi lamba random secret string>
PORT=5000
```

Sample quiz questions database me daalne ke liye (ek baar chalao):
```bash
npm run seed
```

Server start karo:
```bash
npm run dev
```
Backend `http://localhost:5000` par chalega. Browser me `http://localhost:5000` khol ke check
kar sakte ho — "Quiz App Backend is running" dikhna chahiye.

---

## STEP 3: Frontend Setup

Naye terminal me:
```bash
cd frontend
npm install
```

`.env.example` ko `.env` banao:
```bash
cp .env.example .env
```

Agar backend `localhost:5000` par hi chal raha hai to `.env` change karne ki zarurat nahi.

Frontend start karo:
```bash
npm run dev
```
Browser me `http://localhost:5173` khol lo — website chalu ho jayegi!

---

## Kaise Use Kare

Login karne ke baad tumhe 3 options milenge:

### 1. Create Room (Multiplayer — Kahoot jaisa)
- Apne khud ke sawal banao (question text, 4 options, correct answer select karo, aur har
  question ka time limit 10-30 second ke beech set karo).
- "Create Room & Get Code" dabao — ek unique 6-character room code milega (e.g. `AB12CD`).
- Ye code apne dosto ko share karo (max 50 log join kar sakte hain), ya kisi ko share na karo
  aur khud akela practice karo (single-player room).
- Jab sab join kar lein, "Start Quiz" dabao.
- Har question ke saath timer chalega (jo tumne set kiya tha).
- Timer khatam hote hi (ya sab answer de dein to turant) — leaderboard 5 second ke liye dikhega,
  fir automatically agla question shuru ho jayega.
- **Scoring**: sahi jawab par points milte hain, aur jitni jaldi answer doge utne zyada points
  milenge (max ~1000, min 500 sahi jawab ke liye; galat jawab par 0).
- Last question ke baad final leaderboard dikhega winner ke saath.

### 2. Join Room
- Kisi host ka room code aur apna naam daalo (login ki zarurat nahi).
- Waiting room me dikhega jab tak host quiz start nahi karta.
- Quiz shuru hote hi automatically live question screen pe chale jaoge.

### 3. Practice Solo (purana wala mode)
- Category choose karo, apni speed se quiz do — bina timer/multiplayer ke.
- Result page pe score aur breakdown dikhega.
- **Leaderboard** page pe top 10 solo scores dikhenge.

### Dark Mode
- Navbar me top-right "🌙 Dark" / "☀️ Light" button se theme switch kar sakte ho — preference
  browser me save rehti hai.

---

## Naye Questions Add Karna

`backend/seed.js` file khol ke `sampleQuestions` array me naye questions add karo, phir dubara
chalao:
```bash
npm run seed
```
(Ye purane questions delete karke naye daal dega.)

Ya phir Postman se `POST http://localhost:5000/api/questions` pe (login token ke saath) bhi
naya question add kar sakte ho:
```json
{
  "category": "History",
  "questionText": "Who was the first Prime Minister of India?",
  "options": ["Mahatma Gandhi", "Jawaharlal Nehru", "Sardar Patel", "Rajendra Prasad"],
  "correctAnswerIndex": 1,
  "difficulty": "easy"
}
```

---

## Security Notes (Important)

- Passwords kabhi bhi plain text me store nahi hote — bcrypt se hash hoke jate hain.
- Correct answers frontend ko kabhi nahi bheje jate quiz ke waqt — sirf submit hone ke baad
  server khud check karta hai. Isse devtools se cheat nahi kiya ja sakta.
- JWT token 7 din ke liye valid hai, login ke time milta hai aur har request ke Authorization
  header me jata hai.

---

## Deployment (Jab Website Live Karni Ho)

| Part      | Recommended Free Hosting        |
|-----------|----------------------------------|
| Frontend  | Vercel / Netlify                 |
| Backend   | Render / Railway                 |
| Database  | MongoDB Atlas (already cloud)    |

Deployment ke time:
- Backend ke environment variables (`MONGO_URI`, `JWT_SECRET`) host ki dashboard me daalo.
- Frontend ke `VITE_API_URL` ko apne live backend URL se update karo (e.g.
  `https://your-backend.onrender.com/api`).
- Backend ke `cors()` config me apne live frontend URL ko allow karna better hoga
  (`cors({ origin: "https://your-frontend.vercel.app" })`).

---

## Tech Stack Summary

- **Frontend**: React 18 + Vite + Tailwind CSS (dark mode) + React Router + Axios + Socket.io-client
- **Backend**: Node.js + Express.js + Socket.io (real-time multiplayer rooms)
- **Database**: MongoDB (Atlas) via Mongoose
- **Auth**: JWT (jsonwebtoken) + bcrypt (bcryptjs) password hashing — hosts need login,
  room participants only need a name
