// routes/authRoutes.js — fichier COMPLET et propre
const express        = require('express');
const router         = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { protect }    = require('../middlewares/authMiddleware');

// ── Debug temporaire ──────────────────────
console.log('authController:', Object.keys(authController));
console.log('userController:', Object.keys(userController));

// ── Routes publiques ──────────────────────
router.post('/register', authController.register);
router.post('/login',    authController.login);

// ── Activation compte éleveur ─────────────
router.get('/verify-invite', userController.verifyInvite);
router.post('/set-password',  userController.setPassword);

// ── Redirection navigateur → deep link ───
router.get('/activate', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('<h2>Lien invalide.</h2>');

  const deepLink = `${process.env.APP_URL}/set-password?token=${token}`;
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="refresh" content="1;url=${deepLink}" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Activation PoulIA</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; flex-direction: column;
                 align-items: center; justify-content: center; height: 100vh; margin: 0;
                 background: #F5F7F5; }
          .card { background: white; border-radius: 16px; padding: 40px;
                  text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 360px; }
          h2 { color: #1B4332; }
          p  { color: #6B7A6E; }
          a  { display: inline-block; margin-top: 16px; padding: 14px 28px;
               background: #FF6B35; color: white; border-radius: 100px;
               text-decoration: none; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>🐔 Activation PoulIA</h2>
          <p>Ouverture de l'application en cours...</p>
          <a href="${deepLink}">Ouvrir l'application</a>
        </div>
      </body>
    </html>
  `);
});

// ── Routes protégées ──────────────────────
router.get('/me',             protect, authController.getProfile);
router.put('/updateprofile',  protect, authController.updateProfile);
router.put('/updatepassword', protect, authController.updatePassword);

module.exports = router;