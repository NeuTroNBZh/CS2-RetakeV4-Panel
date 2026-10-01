-- Run as a MySQL administrator. Replace the password.
CREATE DATABASE IF NOT EXISTS retake_panel;
CREATE USER IF NOT EXISTS 'retake_panel'@'%' IDENTIFIED BY 'change-me';
GRANT ALL PRIVILEGES ON retake_panel.* TO 'retake_panel'@'%';
-- retakev4 = the database of the plugin (allocation.json, Database.MySqlConnectionString)
GRANT SELECT, INSERT, UPDATE ON retakev4.player_loadout TO 'retake_panel'@'%';
GRANT SELECT ON retakev4.retake_catalog TO 'retake_panel'@'%';
FLUSH PRIVILEGES;
