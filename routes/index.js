const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('/catalog');
});

// Новий маршрут для my-page
router.get('/my-page', (req, res) => {
  res.render('my_page', {
    title: 'My route',
    items: ['Element 1', 'Element 2', 'Element 3']
  });
});

module.exports = router;