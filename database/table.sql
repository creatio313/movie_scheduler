-- --------------------------------------------------------
-- ホスト:                          127.0.0.1
-- サーバーのバージョン:             10.11-MariaDB - MariaDB Server
-- サーバー OS:                     Win64
-- HeidiSQL バージョン:             12.14.0.7165
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- movie_schedule のデータベース構造をダンプしています
CREATE DATABASE IF NOT EXISTS `movie_schedule` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci */;
USE `movie_schedule`;

--  テーブル movie_schedule.projects の構造をダンプしています
CREATE TABLE IF NOT EXISTS `projects` (
  `id` char(36) NOT NULL DEFAULT (UUID()),
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='プロジェクト名・説明';

-- エクスポートするデータが選択されていません

--  テーブル movie_schedule.candidate_dates の構造をダンプしています
CREATE TABLE IF NOT EXISTS `candidate_dates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` char(36) NOT NULL,
  `target_date` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_id` (`project_id`,`target_date`),
  CONSTRAINT `fk_candidate_dates_project_id` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='撮影候補日';

-- エクスポートするデータが選択されていません

--  テーブル movie_schedule.casts の構造をダンプしています
CREATE TABLE IF NOT EXISTS `casts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL DEFAULT '',
  `role_name` varchar(100) NOT NULL DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_casts_project_id` (`project_id`),
  CONSTRAINT `fk_casts_project_id` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='役者情報';

-- エクスポートするデータが選択されていません

--  テーブル movie_schedule.time_slots_def の構造をダンプしています
CREATE TABLE IF NOT EXISTS `time_slots_def` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` char(36) NOT NULL,
  `slot_name` varchar(50) NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_time_slots_def_project_id` (`project_id`),
  CONSTRAINT `fk_time_slots_def_project_id` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='制作者が定義する時間枠';

-- エクスポートするデータが選択されていません

--  テーブル movie_schedule.scenes の構造をダンプしています
CREATE TABLE IF NOT EXISTS `scenes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` char(36) NOT NULL,
  `scene_name` varchar(20) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_scenes_project_id` (`project_id`),
  CONSTRAINT `fk_scenes_project_id` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='シーン情報';

-- エクスポートするデータが選択されていません

--  テーブル movie_schedule.cast_availabilities の構造をダンプしています
CREATE TABLE IF NOT EXISTS `cast_availabilities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `candidate_date_id` int(11) NOT NULL,
  `time_slot_id` int(11) NOT NULL,
  `cast_id` int(11) NOT NULL,
  `is_available` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `candidate_date_id` (`candidate_date_id`,`time_slot_id`,`cast_id`),
  KEY `fk_cast_availabilities_cast_id` (`cast_id`),
  KEY `fk_cast_availabilities_slot_id` (`time_slot_id`),
  CONSTRAINT `fk_cast_availabilities_cast_id` FOREIGN KEY (`cast_id`) REFERENCES `casts` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `fk_cast_availabilities_date_id` FOREIGN KEY (`candidate_date_id`) REFERENCES `candidate_dates` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `fk_cast_availabilities_slot_id` FOREIGN KEY (`time_slot_id`) REFERENCES `time_slots_def` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='役者出演可能日時';

-- エクスポートするデータが選択されていません

--  テーブル movie_schedule.scene_allowed_time_slots の構造をダンプしています
CREATE TABLE IF NOT EXISTS `scene_allowed_time_slots` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `scene_id` int(11) NOT NULL,
  `time_slot_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `scene_id` (`scene_id`,`time_slot_id`),
  KEY `fk_scene_allowed_time_slots_time_slot_id` (`time_slot_id`),
  CONSTRAINT `fk_scene_allowed_time_slots_scene_id` FOREIGN KEY (`scene_id`) REFERENCES `scenes` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `fk_scene_allowed_time_slots_time_slot_id` FOREIGN KEY (`time_slot_id`) REFERENCES `time_slots_def` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='各シーン撮影可能日時';

-- エクスポートするデータが選択されていません

--  テーブル movie_schedule.scene_required_casts の構造をダンプしています
CREATE TABLE IF NOT EXISTS `scene_required_casts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `scene_id` int(11) NOT NULL,
  `cast_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `scene_id` (`scene_id`,`cast_id`),
  KEY `fk_scene_required_casts_cast_id` (`cast_id`),
  CONSTRAINT `fk_scene_required_casts_cast_id` FOREIGN KEY (`cast_id`) REFERENCES `casts` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `fk_scene_required_casts_scene_id` FOREIGN KEY (`scene_id`) REFERENCES `scenes` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='各シーンに必要な役者情報';

-- エクスポートするデータが選択されていません

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
