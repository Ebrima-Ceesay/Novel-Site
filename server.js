require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'insecure_dev_secret_change_me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
  })
);

app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).render('404', { siteTitle: process.env.SITE_TITLE || 'My Novel Blog' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Novel blog running at http://localhost:${PORT}`);
  console.log(`Admin dashboard at http://localhost:${PORT}/admin/login`);
});
