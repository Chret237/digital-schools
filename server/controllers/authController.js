// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { query } = require("../config/db");

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: "Données invalides.", errors: errors.array() });
    }

    const { nom, email, mot_de_passe } = req.body;

    // Vérifier email unique
    const existing = await query(
      "SELECT id FROM utilisateurs WHERE email = $1",
      [email],
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Cet email est déjà utilisé." });
    }

    const hash = await bcrypt.hash(mot_de_passe, 10);
    const result = await query(
      "INSERT INTO utilisateurs (nom, email, mot_de_passe) VALUES ($1, $2, $3) RETURNING id, nom, email, role, date_inscription",
      [nom.trim(), email.toLowerCase(), hash],
    );

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({ message: "Compte créé avec succès.", token, user });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: "Données invalides.", errors: errors.array() });
    }

    const { email, mot_de_passe } = req.body;

    const result = await query(
      "SELECT id, nom, email, mot_de_passe, role FROM utilisateurs WHERE email = $1",
      [email.toLowerCase()],
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(mot_de_passe, user.mot_de_passe))) {
      return res
        .status(401)
        .json({ message: "Email ou mot de passe incorrect." });
    }

    const { mot_de_passe: _, ...userSafe } = user;
    const token = generateToken(userSafe);

    res.json({ message: "Connexion réussie.", token, user: userSafe });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const me = async (req, res, next) => {
  try {
    const result = await query(
      "SELECT id, nom, email, role, avatar, date_inscription FROM utilisateurs WHERE id = $1",
      [req.user.id],
    );
    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: "Données invalides.", errors: errors.array() });
    }

    const { nom, avatar } = req.body;
    const result = await query(
      "UPDATE utilisateurs SET nom = $1, avatar = $2, updated_at = NOW() WHERE id = $3 RETURNING id, nom, email, role, avatar",
      [nom.trim(), avatar || null, req.user.id],
    );
    res.json({ message: "Profil mis à jour.", user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// PUT /api/auth/password
const changePassword = async (req, res, next) => {
  try {
    const { ancien_mot_de_passe, nouveau_mot_de_passe } = req.body;
    if (!ancien_mot_de_passe || !nouveau_mot_de_passe) {
      return res
        .status(400)
        .json({ message: "Les deux mots de passe sont requis." });
    }

    const result = await query(
      "SELECT mot_de_passe FROM utilisateurs WHERE id = $1",
      [req.user.id],
    );
    const valid = await bcrypt.compare(
      ancien_mot_de_passe,
      result.rows[0].mot_de_passe,
    );
    if (!valid)
      return res
        .status(401)
        .json({ message: "Ancien mot de passe incorrect." });

    const hash = await bcrypt.hash(nouveau_mot_de_passe, 10);
    await query(
      "UPDATE utilisateurs SET mot_de_passe = $1, updated_at = NOW() WHERE id = $2",
      [hash, req.user.id],
    );
    res.json({ message: "Mot de passe modifié avec succès." });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, me, updateProfile, changePassword };
