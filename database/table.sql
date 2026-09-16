CREATE DATABASE `movie_schedule` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;

-- movie_schedule.projects definition

CREATE TABLE `projects` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='プロジェクト名・説明';


-- movie_schedule.candidate_dates definition

CREATE TABLE `candidate_dates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` char(36) NOT NULL,
  `target_date` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_id` (`project_id`,`target_date`),
  CONSTRAINT `fk_candidate_dates_project_id` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='撮影候補日';


-- movie_schedule.casts definition

CREATE TABLE `casts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL DEFAULT '',
  `role_name` varchar(100) NOT NULL DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_casts_project_id` (`project_id`),
  CONSTRAINT `fk_casts_project_id` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='役者情報';


-- movie_schedule.scenes definition

CREATE TABLE `scenes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` char(36) NOT NULL,
  `scene_name` varchar(20) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_scenes_project_id` (`project_id`),
  CONSTRAINT `fk_scenes_project_id` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='シーン情報';


-- movie_schedule.time_slots_def definition

CREATE TABLE `time_slots_def` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` char(36) NOT NULL,
  `slot_name` varchar(50) NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_time_slots_def_project_id` (`project_id`),
  CONSTRAINT `fk_time_slots_def_project_id` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='制作者が定義する時間枠';


-- movie_schedule.cast_availabilities definition

CREATE TABLE `cast_availabilities` (
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
) ENGINE=InnoDB AUTO_INCREMENT=1232 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='役者出演可能日時';


-- movie_schedule.scene_allowed_time_slots definition

CREATE TABLE `scene_allowed_time_slots` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `scene_id` int(11) NOT NULL,
  `time_slot_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `scene_id` (`scene_id`,`time_slot_id`),
  KEY `fk_scene_allowed_time_slots_time_slot_id` (`time_slot_id`),
  CONSTRAINT `fk_scene_allowed_time_slots_scene_id` FOREIGN KEY (`scene_id`) REFERENCES `scenes` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `fk_scene_allowed_time_slots_time_slot_id` FOREIGN KEY (`time_slot_id`) REFERENCES `time_slots_def` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=214 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='各シーン撮影可能日時';


-- movie_schedule.scene_required_casts definition

CREATE TABLE `scene_required_casts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `scene_id` int(11) NOT NULL,
  `cast_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `scene_id` (`scene_id`,`cast_id`),
  KEY `fk_scene_required_casts_cast_id` (`cast_id`),
  CONSTRAINT `fk_scene_required_casts_cast_id` FOREIGN KEY (`cast_id`) REFERENCES `casts` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `fk_scene_required_casts_scene_id` FOREIGN KEY (`scene_id`) REFERENCES `scenes` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=181 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='各シーンに必要な役者情報';