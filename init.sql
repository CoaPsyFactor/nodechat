SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

CREATE TABLE IF NOT EXISTS `admin` (
  `id` int(11) NOT NULL,
  `username` varchar(64) COLLATE utf8_unicode_ci NOT NULL,
  `password` varchar(64) COLLATE utf8_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `uq_username` (`username`);

ALTER TABLE `admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

CREATE TABLE IF NOT EXISTS `friend_request` (
  `id` int(11) NOT NULL,
  `user` varchar(128) COLLATE utf8_unicode_ci NOT NULL,
  `sender` varchar(128) COLLATE utf8_unicode_ci NOT NULL,
  `sender_alias` varchar(64) COLLATE utf8_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

ALTER TABLE `friend_request`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `friend_request`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

CREATE TABLE IF NOT EXISTS `relations` (
  `id` int(11) NOT NULL,
  `user` varchar(128) COLLATE utf8_unicode_ci NOT NULL,
  `friend` varchar(128) COLLATE utf8_unicode_ci NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

ALTER TABLE `relations`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `relations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(128) COLLATE utf8_unicode_ci NOT NULL,
  `username` varchar(64) COLLATE utf8_unicode_ci NOT NULL,
  `password` varchar(64) COLLATE utf8_unicode_ci NOT NULL,
  `avatar` varchar(64) COLLATE utf8_unicode_ci NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

ALTER TABLE `users`
  ADD UNIQUE KEY `id` (`id`,`username`);

INSERT INTO `users` (`id`, `username`, `password`) VALUES
('7d5a2afa-f950-11e4-a322-1697f925ec7b', 'coa', 'eb12c7945d8acb572d201f2d9a0527fcb923c430fd018e0441e158a55b0347e9'),
('7d5a2d48-f950-11e4-a322-1697f925ec7b', 'pinkman', 'd9b5f58f0b38198293971865a14074f59eba3e82595becbe86ae51f1d9f1f65e');