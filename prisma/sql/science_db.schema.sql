-- science_db schema, transcribed from printed schema report (img/24.jpg .. img/32-1.jpg)
-- Original collation utf8_korean2007_cs is not available in MySQL 8.4; mapped to utf8mb4_bin (case-sensitive).

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- page 24
CREATE TABLE `basic_data_route` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL COMMENT 'collection path name',
  `langID` int NOT NULL COMMENT 'domestic: 1 abroad: 2',
  `status` int NOT NULL DEFAULT 1,
  `person` int NULL DEFAULT NULL COMMENT 'person',
  `isPrivate` enum('yes','no') NULL DEFAULT NULL COMMENT 'private network',
  `isSite` enum('yes','no') NULL DEFAULT NULL COMMENT 'homepage?',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE `basic_item` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item` varchar(150) NULL DEFAULT NULL,
  `unit` varbinary(100) NULL DEFAULT NULL,
  `writable` tinyint NOT NULL COMMENT '1,0',
  `isDelete` enum('yes','no') NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE `basic_modules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `module_name` varchar(200) NULL DEFAULT NULL,
  `module_path` varchar(255) NULL DEFAULT NULL,
  `treeCode` varchar(200) NULL DEFAULT NULL,
  `parent_id` int NULL DEFAULT NULL,
  `show_flag` enum('yes','no') NULL DEFAULT 'yes',
  `icon` varchar(100) NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE `basic_partdivision` (
  `id` int NOT NULL AUTO_INCREMENT,
  `main_data_part` text NOT NULL,
  `extra_data_part` text NOT NULL,
  `main_forum_part` text NOT NULL,
  `extra_forum_part` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- page 24-25
CREATE TABLE `basic_spread_method` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `method` varchar(256) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'propagation method',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE `basic_view_range` (
  `id` int NOT NULL AUTO_INCREMENT,
  `perm_type` enum('all','depart','special','org') NULL DEFAULT NULL,
  `module_ids` text NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE `bureau_decoration` (
  `id` int NOT NULL AUTO_INCREMENT,
  `depart_id` int NULL DEFAULT NULL,
  `level` int NULL DEFAULT NULL,
  `empCnt` int NULL DEFAULT NULL,
  `indCnt` int NULL DEFAULT NULL,
  `otherCnt` int NULL DEFAULT NULL,
  `square` int NULL DEFAULT NULL,
  `netStatus` int NULL DEFAULT NULL,
  `compCnt` int NULL DEFAULT NULL,
  `projCnt` int NULL DEFAULT NULL,
  `IdcCnt` int NULL DEFAULT NULL,
  `extraCnt` int NULL DEFAULT NULL,
  `bookCnt` int NULL DEFAULT NULL,
  `deskCnt` int NULL DEFAULT NULL,
  `chairCnt` int NULL DEFAULT NULL,
  `smallCnt` int NULL DEFAULT NULL,
  `power` text NULL,
  `heat` text NULL,
  `comment` text NULL,
  `created_at` varchar(200) NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- page 25-26
CREATE TABLE `bureau_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL,
  `perm_type` enum('all','depart','special') NULL DEFAULT NULL,
  `view_depart_ids` text NULL,
  `gender` enum('man','woman') NULL DEFAULT NULL,
  `party` enum('worker','trade','youth') NULL DEFAULT NULL,
  `tec_type` enum('expert','engineer','faculty') NULL DEFAULT NULL,
  `tec_level` int NULL DEFAULT NULL,
  `school` varchar(250) NULL DEFAULT NULL,
  `capacity` enum('official','spreader') NULL DEFAULT NULL,
  `comment` text NULL,
  `flag` enum('appoint','release') NOT NULL,
  `in_date` date NULL DEFAULT NULL,
  `out_date` date NULL DEFAULT NULL,
  `equ_ip` varchar(255) NULL DEFAULT NULL,
  `equ_mac` varchar(255) NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE `notebook_lesson` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` varchar(200) NULL DEFAULT NULL,
  `depart_ids` text NULL,
  `text_cnt` int NULL DEFAULT NULL,
  `lesson_cnt` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE `notebook_scidata` (
  `id` int NOT NULL AUTO_INCREMENT,
  `korean_cnt` int NULL DEFAULT NULL,
  `foreign_cnt` int NULL DEFAULT NULL,
  `program_cnt` int NULL DEFAULT NULL,
  `year_item` int NULL DEFAULT NULL,
  `month_item` int NULL DEFAULT NULL,
  `depart_ids` text NULL,
  `locker` int NULL DEFAULT -1,
  `media_cnt` int NULL DEFAULT NULL,
  `other_cnt` int NULL DEFAULT NULL,
  `article_cnt` int NULL DEFAULT NULL,
  `success_cnt` int NULL DEFAULT NULL,
  `tech_cnt` int NULL DEFAULT NULL,
  `system_name` varchar(255) NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE `reed_student` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL,
  `gender` enum('male','female') NULL DEFAULT NULL,
  `party` enum('labour','worker','youth') NULL DEFAULT NULL,
  `branch` varchar(200) NULL DEFAULT NULL,
  `enter_date` date NULL DEFAULT NULL,
  `leave_date` date NULL DEFAULT NULL,
  `status` enum('running','finish','quit') NULL DEFAULT 'running',
  `note` text NULL,
  `total_terms` int NULL DEFAULT 8 COMMENT 'total semesters',
  `grade` int NULL DEFAULT 1,
  `total_subjects` int NULL DEFAULT 0 COMMENT 'semester total subjects',
  `passed_subjects` int NOT NULL DEFAULT 0 COMMENT 'passsed subjects',
  `univ_id` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- page 27
CREATE TABLE `reed_university` (
  `id` int NOT NULL AUTO_INCREMENT,
  `univ_name` varchar(200) NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE `room_comlist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NULL DEFAULT NULL COMMENT 'equipment name',
  `device_type` varchar(200) NULL DEFAULT NULL COMMENT 'device type',
  `device_num` int NULL DEFAULT NULL COMMENT 'total numbers',
  `reg_date` date NULL DEFAULT '2000-01-01' COMMENT 'registration',
  `manager` varchar(200) NULL DEFAULT NULL COMMENT 'manager',
  `reg_depart` varchar(200) NULL DEFAULT NULL COMMENT 'registration department',
  `comment` text NULL COMMENT 'comment',
  `usable` tinyint(1) NULL DEFAULT 0 COMMENT 'display variable, usable => 1: registered, 2: decommissioned, 3: moved',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE `room_operator` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE `room_person` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_type` enum('nation','private','internet','lesson') NULL DEFAULT NULL,
  `person` int NULL DEFAULT NULL,
  `is_charge` enum('yes','no') NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- page 27-28
CREATE TABLE `room_plan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `year` varchar(200) NULL DEFAULT NULL,
  `week_index` int NULL DEFAULT NULL,
  `content` text NULL,
  `units` text NULL,
  `execution` text NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE `room_review` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL COMMENT 'review date',
  `conference` varchar(255) NOT NULL COMMENT 'conference lead',
  `participant` int NOT NULL COMMENT 'attendees',
  `place` varchar(255) NOT NULL COMMENT 'review place',
  `report` varchar(255) NOT NULL COMMENT 'review content',
  `organize` varchar(255) NOT NULL COMMENT 'organized content',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE `room_rundoc` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `depart_id` bigint NOT NULL COMMENT 'department id',
  `sub_depart_name` varchar(256) COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'department name',
  `created_at` date NOT NULL COMMENT 'date',
  `method_id` bigint NOT NULL COMMENT 'propagation method id',
  `run_content` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'running content',
  `run_period` bigint NOT NULL COMMENT 'running period',
  `comment` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'comment',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE `room_runplan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `year_item` int NULL DEFAULT NULL,
  `month_item` int NULL DEFAULT NULL,
  `depart_id` int NULL DEFAULT NULL,
  `content` text NULL,
  `net_type` text NULL,
  `plan_date` date NULL DEFAULT NULL,
  `user_state` text NULL,
  `plan_state` text NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- page 28-29
CREATE TABLE `room_runstate` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL,
  `date` date NULL DEFAULT NULL COMMENT 'date',
  `route_id` int NULL DEFAULT NULL COMMENT 'route id',
  `use_type` int NULL DEFAULT NULL COMMENT '1: data access, 2: course',
  `cnt` int NULL DEFAULT NULL COMMENT 'count',
  `demand` varchar(255) COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'demand content',
  `pay_type` int NULL DEFAULT 0 COMMENT '1: cash, 2: check',
  `cost` float NULL DEFAULT NULL COMMENT 'cost',
  `view_time` float NULL DEFAULT NULL COMMENT 'view time',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE `session_info` (
  `id` varchar(128) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `timestamp` int unsigned NOT NULL DEFAULT 0,
  `data` blob NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE `state_advanced_construct` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL COMMENT 'user ID',
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'title',
  `origin_id` int NULL DEFAULT NULL COMMENT 'origin',
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'category',
  `data_count` int NULL DEFAULT NULL COMMENT 'data count',
  `data_amount` int NULL DEFAULT NULL COMMENT 'data amount',
  `insert_time` date NULL DEFAULT NULL COMMENT 'insert time',
  `refer_note` varchar(255) COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'refer note',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE `state_collection_abroad` (
  `id` int NOT NULL AUTO_INCREMENT,
  `departID` int NULL DEFAULT NULL,
  `created_at` date NULL DEFAULT NULL,
  `routeID` int NULL DEFAULT NULL,
  `eBookKinds` int NULL DEFAULT NULL,
  `eBookCnt` int NULL DEFAULT NULL,
  `eMagKinds` int NULL DEFAULT NULL,
  `eMagCnt` int NULL DEFAULT NULL,
  `eVideoCnt` int NULL DEFAULT NULL,
  `eProgCnt` int NULL DEFAULT NULL,
  `tBookKinds` int NULL DEFAULT NULL,
  `tBookCnt` int NULL DEFAULT NULL,
  `tMagKinds` int NULL DEFAULT NULL,
  `tMagCnt` int NULL DEFAULT NULL,
  `note` enum('global','local') NULL DEFAULT NULL,
  `routeName` varchar(100) NULL DEFAULT NULL,
  `departName` varchar(100) NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- page 30
CREATE TABLE `state_collection_interior` (
  `id` int NOT NULL AUTO_INCREMENT,
  `departID` int NULL DEFAULT NULL,
  `created_at` date NULL DEFAULT NULL,
  `routeID` int NULL DEFAULT NULL,
  `korEDataCnt` int NULL DEFAULT NULL,
  `korBookletCnt` int NULL DEFAULT NULL,
  `korMagCnt` int NULL DEFAULT NULL,
  `korVideoCnt` int NULL DEFAULT NULL,
  `korProgCnt` int NULL DEFAULT NULL,
  `forEDataCnt` int NULL DEFAULT NULL,
  `forBookletCnt` int NULL DEFAULT NULL,
  `forMagCnt` int NULL DEFAULT NULL,
  `forVideoCnt` int NULL DEFAULT NULL,
  `forProgCnt` int NULL DEFAULT NULL,
  `note` enum('global','local') NULL DEFAULT NULL,
  `departName` varchar(100) NULL DEFAULT NULL,
  `routeName` varbinary(100) NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE `state_exam_mark` (
  `id` int NOT NULL AUTO_INCREMENT,
  `examlist_id` int NULL DEFAULT NULL,
  `user_id` int NULL DEFAULT NULL,
  `mark` varchar(200) NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE `state_examlist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `depart_id` int NULL DEFAULT NULL,
  `exam_name` varchar(255) NULL DEFAULT NULL,
  `user_ids` text NULL,
  `exam_time` date NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- page 30-31
CREATE TABLE `state_extra_construct` (
  `id` int NOT NULL AUTO_INCREMENT,
  `departID` int NULL DEFAULT NULL COMMENT 'department ID',
  `created_at` date NULL DEFAULT NULL COMMENT 'created date',
  `routeID` int NULL DEFAULT NULL COMMENT 'route ID',
  `korEDataCnt` int NULL DEFAULT NULL COMMENT 'korean electronic data count',
  `korBookletCnt` int NULL DEFAULT NULL COMMENT 'korean booklet count',
  `korMagCnt` int NULL DEFAULT NULL COMMENT 'korean magazine count',
  `forEDataCnt` int NULL DEFAULT NULL COMMENT 'foreign magazine count',
  `forBookletCnt` int NULL DEFAULT NULL COMMENT 'foreign booklet count',
  `forMagCnt` int NULL DEFAULT NULL COMMENT 'foreign magazine count',
  `note` enum('global','local') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'global' COMMENT 'note',
  `departName` varchar(100) COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `routeName` varbinary(100) NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE `state_organization` (
  `id` int NOT NULL AUTO_INCREMENT,
  `depart_id` int NULL DEFAULT NULL,
  `created_at` date NULL DEFAULT NULL,
  `content` text NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE `state_spread_dataview` (
  `id` int NOT NULL AUTO_INCREMENT,
  `depart_id` int NULL DEFAULT NULL,
  `site_id` int NULL DEFAULT NULL,
  `in_visitor_cnt` int NULL DEFAULT 0,
  `in_data_cnt` int NULL DEFAULT 0,
  `out_visitor_cnt` int NULL DEFAULT 0,
  `out_data_cnt` int NULL DEFAULT 0,
  `created_at` date NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE `state_spread_presentation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `depart_id` int NULL DEFAULT NULL,
  `name` varchar(255) NULL DEFAULT NULL,
  `created_at` date NULL DEFAULT NULL,
  `place` varchar(255) NULL DEFAULT NULL,
  `in_user_cnt` int NULL DEFAULT NULL,
  `rel_user_cnt` int NULL DEFAULT NULL,
  `product_type_cnt` int NULL DEFAULT NULL,
  `mark` float NULL DEFAULT NULL,
  `pres_cnt` int NULL DEFAULT NULL,
  `comment` text NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- page 31-32
CREATE TABLE `state_spread_publication` (
  `id` int NOT NULL AUTO_INCREMENT,
  `spread_unit` varchar(200) NULL DEFAULT NULL,
  `name` varchar(200) NULL DEFAULT NULL,
  `size` varchar(200) NULL DEFAULT NULL,
  `type` enum('booklet','media','magazine') NULL DEFAULT NULL,
  `less_unit` text NULL,
  `created_at` date NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE `state_spread_siteview` (
  `id` int NOT NULL AUTO_INCREMENT,
  `depart_id` int NULL DEFAULT NULL,
  `site_id` int NULL DEFAULT NULL,
  `forum_cnt` int NULL DEFAULT NULL,
  `exp_cnt` int NULL DEFAULT NULL,
  `product_cnt` int NULL DEFAULT NULL,
  `created_at` date NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE `state_success_problem` (
  `id` int NOT NULL AUTO_INCREMENT,
  `depart_id` int NULL DEFAULT NULL,
  `created_at` date NULL DEFAULT NULL,
  `type` enum('success','failure','problem','science','indbuild','newbuild') NULL DEFAULT NULL,
  `comment` text NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE `techorder_landbook` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL,
  `date` date NULL DEFAULT NULL COMMENT 'date',
  `note` varchar(255) COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'data order note',
  `insert_time` date NULL DEFAULT NULL COMMENT 'insert time',
  `approve_time` date NULL DEFAULT NULL COMMENT 'approved time',
  `refer_note` varchar(255) COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'refer note',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

SET FOREIGN_KEY_CHECKS = 1;
