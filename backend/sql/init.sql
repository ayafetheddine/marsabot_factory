-- =============================================
-- MarsaBot Factory - Initialisation de la BDD
-- =============================================

CREATE DATABASE IF NOT EXISTS marsabot_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE marsabot_db;

-- -----------------------------------------
-- Table : bots
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS bots (
  id                        INT           AUTO_INCREMENT PRIMARY KEY,
  nom                       VARCHAR(255)  NOT NULL,
  description               TEXT,
  specialite_domaine        VARCHAR(255),
  numero_telephone          VARCHAR(20),
  statut                    ENUM('actif', 'inactif') NOT NULL DEFAULT 'inactif',
  allow_general_knowledge   BOOLEAN       NOT NULL DEFAULT FALSE,
  date_creation             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------
-- Table : whatsapp_sessions
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id              INT           AUTO_INCREMENT PRIMARY KEY,
  bot_id          INT           NOT NULL,
  session_status  VARCHAR(50)   NOT NULL DEFAULT 'disconnected',
  qr_code_data    TEXT,
  last_connected  DATETIME,

  CONSTRAINT fk_session_bot
    FOREIGN KEY (bot_id) REFERENCES bots(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------
-- Table : bot_documents  (pour le RAG)
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS bot_documents (
  id            INT           AUTO_INCREMENT PRIMARY KEY,
  bot_id        INT           NOT NULL,
  nom_fichier   VARCHAR(255)  NOT NULL,
  chemin_fichier VARCHAR(500) NOT NULL,
  type_fichier  ENUM('pdf', 'txt') NOT NULL,

  CONSTRAINT fk_document_bot
    FOREIGN KEY (bot_id) REFERENCES bots(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;


-- -----------------------------------------
-- Table : documents  (remplace bot_documents)
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id                    INT           AUTO_INCREMENT PRIMARY KEY,
  bot_id                INT           NOT NULL,
  nom_original          VARCHAR(255)  NOT NULL,
  nom_fichier_genere    VARCHAR(255)  NOT NULL,
  chemin                VARCHAR(500)  NOT NULL,
  taille                INT           NOT NULL,
  date_ajout            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_doc_bot
    FOREIGN KEY (bot_id) REFERENCES bots(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------
-- Table : api_sources
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS api_sources (
  id         INT            AUTO_INCREMENT PRIMARY KEY,
  bot_id     INT            NOT NULL,
  url        VARCHAR(2048)  NOT NULL,
  date_ajout TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_apisource_bot
    FOREIGN KEY (bot_id) REFERENCES bots(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------
-- Table : admins
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  id            INT           AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255)  UNIQUE NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  nom           VARCHAR(100)
) ENGINE=InnoDB;
