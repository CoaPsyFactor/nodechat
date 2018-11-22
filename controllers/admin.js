exports.init = function (app, db, users) {
	var getHash = function (password) {
	    	var crypto = require('crypto');
	    	return crypto.createHash('sha256').update(password).digest('hex');
  		};

	app.get('/api/admin/users/list', function(req, res) {
		if (req.session._admin) {
			db.query('SELECT * FROM `users`;', function(error, results) {
				if (error) {
					return res.status(500).send({error: error});
				}

				res.send({users: results});
			});
		} else {
			res.status(403).send({message: 'Morate biti ulogovani kao administrator.'});
		}
	});

	app.post('/api/admin/user/add', function(req, res) {
		if (req.session._admin) {
			var username = req.body.username || null, password = req.body.password || null;

			if (null === username || null === password) {
				return res.status(400).send({message: 'Morate proslediti informacije.'});
			}

			password = getHash(password);

			db.query('SELECT * FROM `users` WHERE `username` = ?;', username, function(err, results) {
				if (err) {
					return res.status(500).send({error: err});
				}

				if (results.length) {
					return res.status(400).send({message: 'Korisnicko ime je vec u upotrebi.'});
				}

				var uuid = require('node-uuid'), id = uuid.v1(), params = [id, username, password];


				db.query('INSERT INTO `users` (`id`, `username`, `password`) VALUES (?,?,?);', params, function(err, results) {
					if (err) {
						return res.status(500).send({error: err});
					}

					if (0 == results.affectedRows) {
						return res.status(400).send({message: 'Doslo je do greske, pokusaj ponovo.'});
					}

					res.send({username: username, id: id});
				});
			});
		} else {
			res.status(401).send({message: 'Morate biti ulogovani kao administrator.'});
		}
	});

	app.delete('/api/admin/user', function(req, res) {
		if (req.session._admin) {
			var id = req.body.user || null;

			if (null == id) {
				return res.status(400).send({message: 'Morate proslediti validne podatke.'});
			}

			db.query('DELETE FROM `users` WHERE `id` = ?;', id, function(err, result) {
				if (err) {
					return res.status(500).send({error: err});
				}

				if (result.affectedRows) {
					res.send({message: 'Korisnik je obrisan.', id: id});
				} else {
					res.status(400).send({message: 'Brisanje Korisnika nije uspesno.', id: id});
				}
			});
		} else {
			res.status(403).send({message: 'Morate biti ulogovani kao administrator.'});
		}
	});

	app.post('/api/admin/login', function(req, res) {
		if (req.session._admin) {
			return res.send({message: 'Vec ste ulogovani kao administrator.'});
		}

		var user = req.body.user || null, password = req.body.password || null;

		if (null === user || null === password) {
			return res.status(400).send({message: 'Morate proslediti informacije.'});
		}

		password = getHash(password);

		db.query('SELECT * FROM `admin` WHERE `username` = ? AND `password` = ?;', [user, password], function(err, result) {
			if (err) {
				return res.status(500).send({error: err});
			}

			if (0 === result.length) {
				return res.status(404).send({message: 'Korisnik nije pronadjen.'});
			}

			req.session._admin = result[0].id;
			res.send({message: 'Logovanje uspesno.'});
		});
	});

	app.get('/L9J5m9HUDjNsv5vhDm1Th2Zr1we6ZhcmQkTtXJ2z0FMATn2VvV2AiMtAze9JCzy/admin', function(req, res) {
		var fs = require('fs'), html = fs.readFileSync('web/view/index.html', {encoding: 'utf-8'}), content;

		if (req.session._admin) {
			// show admin panel content
		} else {
			content = fs.readFileSync('web/view/admin/login.html', {encoding: 'utf-8'});
		}

		html = html.replace('{{ content }}', content);
		res.send(html);
	});
}; 