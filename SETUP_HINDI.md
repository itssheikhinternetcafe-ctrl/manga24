# Manga24 - Local setup (VS Code)

1. `npm install --legacy-peer-deps`
2. `.env.example` ko copy karke `.env` banao aur keys bharo (`.env` GitHub par kabhi upload mat karo).
3. `npm run dev` -> http://localhost:3000
4. Firebase Console -> Firestore -> Rules -> `firestore.rules` ka poora content paste -> Publish.
5. Site par signup karo -> Firestore -> users -> apna document -> `role` = `admin`.
6. `/admin` khol kar pehli series aur chapter banao.
