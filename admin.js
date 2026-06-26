const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { slugify } = require('../utils/slugify');

const router = express.Router();

function siteTitle() {
  return process.env.SITE_TITLE || 'My Novel Blog';
}

// ---------- Login ----------

router.get('/login', (req, res) => {
  if (req.session && req.session.isAuthor) {
    return res.redirect('/admin');
  }
  res.render('admin/login', { error: null, siteTitle: siteTitle() });
});

router.post('/login', express.urlencoded({ extended: true }), (req, res) => {
  const { username, password } = req.body;
  const admin = db.get('admin').value();

  if (admin && username === admin.username && bcrypt.compareSync(password, admin.passwordHash)) {
    req.session.isAuthor = true;
    return res.redirect('/admin');
  }

  res.render('admin/login', { error: 'Incorrect username or password.', siteTitle: siteTitle() });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

// Everything below this line requires the author to be logged in
router.use(requireAuth);

// ---------- Dashboard ----------

router.get('/', (req, res) => {
  const novels = db.get('novels').value();
  const sorted = [...novels].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.render('admin/dashboard', { novels: sorted, siteTitle: siteTitle() });
});

// ---------- Create ----------

router.get('/novels/new', (req, res) => {
  res.render('admin/form', {
    novel: null,
    error: null,
    siteTitle: siteTitle()
  });
});

router.post('/novels', express.urlencoded({ extended: true }), (req, res) => {
  const { title, genre, description, coverUrl, content } = req.body;

  if (!title || !title.trim()) {
    return res.render('admin/form', {
      novel: req.body,
      error: 'A title is required.',
      siteTitle: siteTitle()
    });
  }

  let slug = slugify(title);
  const existingSlugs = db.get('novels').map('slug').value();
  if (existingSlugs.includes(slug)) {
    slug = `${slug}-${crypto.randomBytes(3).toString('hex')}`;
  }

  const now = new Date().toISOString();
  const novel = {
    id: crypto.randomUUID(),
    title: title.trim(),
    slug,
    genre: (genre || '').trim(),
    description: (description || '').trim(),
    coverUrl: (coverUrl || '').trim(),
    content: content || '',
    likes: 0,
    loves: 0,
    dislikes: 0,
    createdAt: now,
    updatedAt: now
  };

  db.get('novels').push(novel).write();
  res.redirect('/admin');
});

// ---------- Edit ----------

router.get('/novels/:id/edit', (req, res) => {
  const novel = db.get('novels').find({ id: req.params.id }).value();
  if (!novel) return res.redirect('/admin');
  res.render('admin/form', { novel, error: null, siteTitle: siteTitle() });
});

router.post('/novels/:id', express.urlencoded({ extended: true }), (req, res) => {
  const { title, genre, description, coverUrl, content } = req.body;
  const novel = db.get('novels').find({ id: req.params.id }).value();

  if (!novel) return res.redirect('/admin');

  if (!title || !title.trim()) {
    return res.render('admin/form', {
      novel: { ...novel, ...req.body },
      error: 'A title is required.',
      siteTitle: siteTitle()
    });
  }

  db.get('novels')
    .find({ id: req.params.id })
    .assign({
      title: title.trim(),
      genre: (genre || '').trim(),
      description: (description || '').trim(),
      coverUrl: (coverUrl || '').trim(),
      content: content || '',
      updatedAt: new Date().toISOString()
    })
    .write();

  res.redirect('/admin');
});

// ---------- Delete ----------

router.post('/novels/:id/delete', (req, res) => {
  db.get('novels').remove({ id: req.params.id }).write();
  res.redirect('/admin');
});

module.exports = router;
