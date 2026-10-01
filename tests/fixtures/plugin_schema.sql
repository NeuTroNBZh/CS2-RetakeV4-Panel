CREATE TABLE IF NOT EXISTS player_loadout (
    steam_id BIGINT UNSIGNED NOT NULL,
    team TINYINT NOT NULL,
    round_type VARCHAR(64) NOT NULL,
    primary_weapon VARCHAR(64) NULL,
    secondary_weapon VARCHAR(64) NULL,
    awp_opt_in TINYINT(1) NOT NULL DEFAULT 0,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (steam_id, team, round_type));
CREATE TABLE IF NOT EXISTS retake_catalog (
    server_key VARCHAR(64) NOT NULL PRIMARY KEY,
    format_version INT NOT NULL,
    catalog MEDIUMTEXT NOT NULL,
    updated_at DATETIME(6) NOT NULL);
