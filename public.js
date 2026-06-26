const express = require('express');
const { marked } = require('marked');
const db = require('../db');

const router = express.Router();

// Home page — the "card catalog" of all published novels
router.get('/', (req, res) => {
  const novels = db.get('novels').value();
  const sorted = [...novels].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.render('index', {
    novels: sorted,
    siteTitle: process.env.SITE_TITLE || 'My Novel Blog'
  });
});

// Single novel page
router.get('/novel/:slug', (req, res) => {
  const novel = db.get('novels').find({ slug: req.params.slug }).value();
  if (!novel) {
    return res.status(404).render('404', { siteTitle: process.env.SITE_TITLE || 'My Novel Blog' });
  }
  const contentHtml = marked.parse(novel.content || '');
  res.render('novel', {
    novel,
    contentHtml,
    siteTitle: process.env.SITE_TITLE || 'My Novel Blog'
  });
});

// React to a novel: like / love / dislike
// Body: { type: 'likes' | 'loves' | 'dislikes', previousType: 'likes' | 'loves' | 'dislikes' | null }
// The client tracks what the reader already picked (in localStorage) and sends
// the previous choice so we can move the count rather than just stack it up.
router.post('/api/novels/:id/react', express.json(), (req, res) => {
  const { type, previousType } = req.body;
  const validTypes = ['likes', 'loves', 'dislikes'];

  if (!validTypes.includes(type) && type !== null) {
    return res.status(400).json({ error: 'Invalid reaction type' });
  }

  const novel = db.get('novels').find({ id: req.params.id }).value();
  if (!novel) {
    return res.status(404).json({ error: 'Novel not found' });
  }

  // Remove the previous reaction count, if any
  if (previousType && validTypes.includes(previousType)) {
    db.get('novels')
      .find({ id: req.params.id })
      .update(previousType, (n) => Math.max(0, (n || 0) - 1))
      .write();
  }

  // Add the new reaction count, unless the reader is un-reacting (type === null)
  if (type) {
    db.get('novels')
      .find({ id: req.params.id })
      .update(type, (n) => (n || 0) + 1)
      .write();
  }

  const updated = db.get('novels').find({ id: req.params.id }).value();
  res.json({
    likes: updated.likes || 0,
    loves: updated.loves || 0,
    dislikes: updated.dislikes || 0
  });
});

module.exports = router;
