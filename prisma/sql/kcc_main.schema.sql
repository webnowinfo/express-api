-- kcc_main schema, transcribed from printed schema report (img/1.jpg .. img/23.jpg)
-- Original collations: utf8_unicode_ci (table default) / utf8_general_ci (marked per column), upgraded to utf8mb4

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- page 1
CREATE TABLE `apply_privatedata_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userID` int NOT NULL COMMENT 'User ID',
  `data_id` int NOT NULL COMMENT 'Requested Data',
  `status` enum('pending','approved','suspended','finished') NOT NULL DEFAULT 'pending' COMMENT 'Request, Approve, Reject, Complete',
  `sync_status` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Sync Status',
  `insertTime` datetime NOT NULL COMMENT 'Requested Time',
  `processTime` datetime NULL DEFAULT NULL COMMENT 'Processed Time',
  PRIMARY KEY (`id`),
  KEY `userID` (`userID`),
  KEY `data_id` (`data_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `article_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userID` int NOT NULL DEFAULT 2 COMMENT 'User ID',
  `title` varchar(255) NOT NULL COMMENT 'Article Title',
  `note` text NOT NULL COMMENT 'Article Content',
  `classID` enum('public','private','common') NOT NULL DEFAULT 'public' COMMENT 'Public, Non-Public, Open',
  `categoryID` int NOT NULL DEFAULT 0 COMMENT 'Category ID',
  `fileName` varchar(255) NOT NULL COMMENT 'Attachment File',
  `fileSize` int NOT NULL DEFAULT 0 COMMENT 'Attachment Size',
  `insertTime` datetime NOT NULL COMMENT 'Created Time',
  `processTime` datetime NULL DEFAULT NULL COMMENT 'Processed Time',
  `viewCount` smallint unsigned NOT NULL DEFAULT 0 COMMENT 'Views',
  `answerCount` int NOT NULL DEFAULT 0 COMMENT 'Reply Count',
  `likeCount` smallint unsigned NOT NULL DEFAULT 0 COMMENT 'Likes',
  `likerIDs` text NOT NULL COMMENT 'JSON form of liked user IDs',
  `unlikeCount` smallint unsigned NOT NULL DEFAULT 0 COMMENT 'Unlikes',
  `unlikerIDs` text NOT NULL COMMENT 'json form of unlikes',
  `status` enum('pending','approved','suspended','draft','pass') NOT NULL DEFAULT 'pending' COMMENT 'request, approve, reject, draft',
  `parentID` int NOT NULL DEFAULT 0 COMMENT 'Parent ID',
  `serialParentID` int NOT NULL DEFAULT 0,
  `zScore` double NOT NULL DEFAULT 0,
  `isRecomm` tinyint(1) NOT NULL DEFAULT 0,
  `tagIDs` varchar(255) NOT NULL DEFAULT '' COMMENT 'json form of tagID',
  `tags` varchar(255) NOT NULL DEFAULT '' COMMENT 'tags',
  `isESstatus` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `categoryID` (`categoryID`),
  KEY `parentID` (`parentID`),
  KEY `userID` (`userID`),
  KEY `serialParentID` (`serialParentID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `basic_character` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sha512` varchar(255) COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `deletable` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- page 2
CREATE TABLE `basic_data_category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL COMMENT 'Category Name',
  `icon` varchar(50) NOT NULL DEFAULT 'fontello-icon-list-3',
  `usable` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1 Usable, 0 Not Usable',
  `classID` enum('public','private') NOT NULL COMMENT 'Public, Private',
  `treeCode` varchar(32) NOT NULL,
  `privateCount` int NOT NULL COMMENT 'Private Counts',
  `publicCount` int NOT NULL COMMENT 'Public Count',
  `internetFlag` tinyint NOT NULL COMMENT 'Category',
  `CLASS_SYMBOL` varchar(1024) NOT NULL COMMENT 'CLASS_SYMBOL',
  `deletable` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 - Deletable',
  PRIMARY KEY (`id`),
  KEY `classID` (`classID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `basic_department` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(256) COLLATE utf8mb4_general_ci NOT NULL,
  `treeCode` varchar(32) COLLATE utf8mb4_general_ci NOT NULL,
  `usable` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1 Usable, 0 Not Usable',
  `forumPermission` text COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Private forum permission',
  `dataPermission` text COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Private data permission',
  `successPermission` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `classID` enum('public','private') COLLATE utf8mb4_general_ci NOT NULL,
  `posIDs` text COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Private data permission',
  `chdepart` text COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Depart List',
  `isStatis` tinyint(1) NOT NULL DEFAULT 0,
  `isEnableMsg` int NOT NULL DEFAULT 1,
  `unitType` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `treeCode` (`treeCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `basic_evaluation_category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL COMMENT 'Category Name',
  `treeCode` varchar(32) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- page 2-3
CREATE TABLE `basic_forum_category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Category Name',
  `icon` varchar(255) COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'Icon',
  `usable` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1:Usable, 0:Not Usable',
  `serialForum_usable` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1 Usable, 0 Not Usable',
  `article_usable` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1 Usable, 0 Not Usable',
  `classID` enum('public','private') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'public' COMMENT 'Public, Private',
  `privateCount` int NOT NULL COMMENT 'Private Counts',
  `publicCount` int NOT NULL COMMENT 'Public Counts',
  `deletable` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Deletable (0 Impossible 1 Possible)',
  `treeCode` varchar(32) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `isPublic` (`classID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `basic_forum_tag` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(256) NOT NULL COMMENT 'Tag Name',
  `categoryID` int NOT NULL DEFAULT 0 COMMENT 'Category ID',
  `insertTime` datetime NOT NULL COMMENT 'Tag Created Time',
  `processTime` datetime NULL DEFAULT NULL COMMENT 'Tag Process Time',
  `status` enum('pending','approved','suspended','draft','pass') NOT NULL DEFAULT 'pending' COMMENT 'Request, Approve, Reject, Draft',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `categoryID` (`categoryID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `basic_internet_category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL COMMENT 'Category Name',
  `icon` varchar(50) NOT NULL DEFAULT 'fontello-icon-list-3',
  `treeCode` varchar(32) NOT NULL,
  `dataCount` int NOT NULL COMMENT 'Data Count',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `basic_mods_item` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mKey` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `mItem` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `parentID` int NOT NULL,
  `isAttr` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1: Property 0: Value',
  PRIMARY KEY (`id`),
  KEY `mKey` (`mKey`),
  KEY `parentID` (`parentID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- page 3-4
CREATE TABLE `basic_organization` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(256) COLLATE utf8mb4_general_ci NOT NULL,
  `treeCode` varchar(32) COLLATE utf8mb4_general_ci NOT NULL,
  `usable` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1 Usable, 0 Not Usable',
  `departIDs` text COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `treeCode` (`treeCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `basic_politic_category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `icon` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `isShow` tinyint NOT NULL,
  `treeCode` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `sort` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `basic_position` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `workType` enum('officer','engineer','worker') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'officer' COMMENT 'Work Type',
  `sort` int NOT NULL COMMENT 'Order',
  `jobs` text COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Job List',
  PRIMARY KEY (`id`),
  KEY `workType` (`workType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `basic_private_category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL COMMENT 'Category Name',
  `icon` varchar(50) NOT NULL DEFAULT 'fontello-icon-list-3',
  `usable` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1 Usable, 0 Not Usable',
  `treeCode` varchar(32) NOT NULL,
  `dataCount` int NOT NULL COMMENT 'Data Count',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- page 4-5
CREATE TABLE `basic_slide_image` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fileName` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `sha512` varchar(255) COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `usable` tinyint NOT NULL,
  `sort` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `basic_success_category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Category Name',
  `icon` varchar(255) COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'Icon',
  `usable` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1 Usable, 0 Not Usable',
  `classID` enum('public','private') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'public' COMMENT 'Public, Private',
  `privateCount` int NOT NULL COMMENT 'Private Count',
  `publicCount` int NOT NULL COMMENT 'Public Count',
  `deletable` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Deletable (0:Not Usable)',
  `treeCode` varchar(32) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `isPublic` (`classID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `basic_sys_modules` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'Module ID',
  `moduleName` varchar(255) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Module Name',
  `moduleType` enum('ucp','acp','fcp') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'ucp' COMMENT 'User Page, Admin Page',
  `modulePath` varchar(512) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Module Path',
  `treeCode` varchar(16) COLLATE utf8mb4_general_ci NOT NULL,
  `fontIcon` varchar(255) COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'Font Icon',
  `status` enum('show','hide') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'show' COMMENT 'Show, Hide, Not Usable',
  PRIMARY KEY (`id`),
  KEY `treeCode` (`treeCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `basic_theme` (
  `id` int NOT NULL AUTO_INCREMENT,
  `themeName` varchar(256) COLLATE utf8mb4_general_ci NOT NULL,
  `isEnable` tinyint(1) NOT NULL DEFAULT 1,
  `themeCode` char(4) COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `themeKey` varchar(256) COLLATE utf8mb4_general_ci NOT NULL,
  `showItemCount` int NOT NULL COMMENT 'First page data count',
  `updateDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `isLocked` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- page 5-6
CREATE TABLE `book_category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `treeCode` varchar(8) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `book_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bookNum` varchar(20) NOT NULL COMMENT 'Book Number',
  `title` varchar(255) NOT NULL COMMENT 'Book Title',
  `comment` text NOT NULL COMMENT 'Comment',
  `printCompany` varchar(50) NOT NULL COMMENT 'Company ID',
  `printYear` int unsigned NOT NULL COMMENT 'Print Year',
  `pages` int NOT NULL COMMENT 'Pages',
  `categoryID` int NOT NULL COMMENT 'book_category_id',
  `classID` tinyint NOT NULL,
  `langID` enum('ko','cn','en','jp','ru','du') NOT NULL DEFAULT 'ko' COMMENT 'Language ID',
  `price` varchar(20) NOT NULL,
  `saleability` tinyint NOT NULL COMMENT '0: Not Saleable, 1: Saleable',
  `insertTime` datetime NOT NULL COMMENT 'register time=rgst_dt',
  `showFlag` enum('show','hide') NOT NULL DEFAULT 'show' COMMENT 'Status(Show,Hide)',
  `lender` int NOT NULL COMMENT 'Lender ID',
  `lastlendtime` date NOT NULL COMMENT 'Last lend time',
  PRIMARY KEY (`id`),
  KEY `title` (`title`),
  KEY `publishYear` (`printYear`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `book_info_org` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bookNum` varchar(20) NOT NULL COMMENT 'Book Number',
  `title` varchar(255) NOT NULL COMMENT 'Book Title',
  `comment` text NOT NULL COMMENT 'Comment',
  `printCompany` varchar(50) NOT NULL COMMENT 'Print Company ID',
  `printYear` int unsigned NOT NULL COMMENT 'Print Year',
  `pages` int NOT NULL COMMENT 'Page Count',
  `categoryID` int NOT NULL COMMENT 'book_category_id',
  `langID` enum('ko','cn','en','jp','ru','du') NOT NULL DEFAULT 'ko' COMMENT 'Languages',
  `price` varchar(20) NOT NULL,
  `saleability` tinyint NOT NULL COMMENT '0: Not Sale, 1: For Sale',
  `insertTime` datetime NOT NULL COMMENT 'Register Time=rgst_dt',
  `showFlag` enum('show','hide') NOT NULL DEFAULT 'show' COMMENT 'Status(Show,Hide)',
  `lender` int NOT NULL COMMENT 'Lender ID',
  PRIMARY KEY (`id`),
  KEY `title` (`title`),
  KEY `publishYear` (`printYear`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- page 6-7
CREATE TABLE `book_lend_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bookNum` varchar(20) NOT NULL COMMENT 'Book Number',
  `categoryID` int NOT NULL COMMENT 'book_category_id',
  `langID` enum('ko','cn','en','jp','ru','du') NOT NULL DEFAULT 'ko' COMMENT 'Languages',
  `startDate` date NOT NULL COMMENT 'Borrow Date',
  `endDate` date NOT NULL COMMENT 'Return Date',
  `userID` int NOT NULL COMMENT 'Lend ID',
  `departID` int NOT NULL COMMENT 'Department',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cron_access_count` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Created timestamp',
  `accessCount` int NOT NULL COMMENT 'Access Count',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cron_top_keyword` (
  `id` int NOT NULL AUTO_INCREMENT,
  `keyword` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `hrefKeyword` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `searchCount` int NOT NULL,
  `resultCount` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cron_top_user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userID` int NOT NULL,
  `departName` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `posName` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `rankType` enum('data','forum') COLLATE utf8mb4_general_ci NOT NULL,
  `docCount` int NOT NULL,
  `viewCount` int NOT NULL,
  `likeCount` int NOT NULL,
  `characterID` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cron_upload_data_forum` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `departID` int NOT NULL,
  `departName` varchar(25) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Depart Name',
  `data` int NOT NULL COMMENT 'Daily publish',
  `forum` int NOT NULL COMMENT 'Daily article publish count',
  `article` int NOT NULL COMMENT 'Daily regular article count',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- page 8
CREATE TABLE `data_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL COMMENT 'External database title',
  `publisher` varchar(255) NULL DEFAULT NULL,
  `publishYear` int NULL DEFAULT NULL COMMENT 'Print Year=External',
  `note` text NULL COMMENT 'Data comment=External database abs',
  `cencerID` varchar(255) NULL DEFAULT NULL COMMENT 'Publish Number=cencer',
  `author` varchar(255) NULL DEFAULT NULL COMMENT 'Author Name=ath_name',
  `pages` int NULL DEFAULT NULL COMMENT 'Page Count',
  `classID` enum('public','private') NULL DEFAULT 'public' COMMENT 'Public, Private',
  `categoryID` int NULL DEFAULT NULL COMMENT 'Data Category ID',
  `fileName` varchar(255) NULL DEFAULT NULL COMMENT 'File Name',
  `fileType` enum('image','video','audio','document','other') NULL DEFAULT NULL COMMENT 'File Type: Video, Audio, Image, Document, etc',
  `fileSize` int NULL DEFAULT 0 COMMENT 'File',
  `langID` tinyint NULL DEFAULT 1 COMMENT 'Should be used as array when using Languages mods. External',
  `sha512` varchar(255) NULL DEFAULT NULL,
  `insertTime` datetime NULL DEFAULT NULL COMMENT 'Register Time=rgst_dt',
  `processTime` datetime NULL DEFAULT NULL COMMENT 'Data process',
  `likerIDs` text NULL COMMENT 'json format of likers',
  `likeCount` int NULL DEFAULT 0 COMMENT 'Likes',
  `unlikerIDs` text NULL COMMENT 'json form of dislikes',
  `unlikeCount` int NULL DEFAULT 0 COMMENT 'dislikes',
  `viewCount` int NULL DEFAULT 0 COMMENT 'Views',
  `isRecomm` tinyint NULL DEFAULT 0 COMMENT 'Admin recommended?',
  `status` enum('pending','approved','suspended','pass') NULL DEFAULT 'pending' COMMENT 'Request, Approve, Reject',
  `userID` int NULL DEFAULT 2 COMMENT 'User ID',
  `zScore` float NULL DEFAULT NULL COMMENT 'Popularity',
  `keywords` text NULL,
  `orderID` int NULL DEFAULT NULL,
  `dataRoute` tinyint NULL DEFAULT NULL COMMENT 'Data collection route',
  `cost` float NULL DEFAULT NULL,
  `money` varchar(20) NULL DEFAULT NULL,
  `isESstatus` tinyint(1) NULL DEFAULT 0,
  `username` varchar(11) NOT NULL,
  `depart_pos` varchar(11) NOT NULL,
  `unitType` tinyint(1) NOT NULL DEFAULT 0,
  `inout_str` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `categoryID` (`categoryID`),
  KEY `title` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- page 8-9
CREATE TABLE `data_info_kcc` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL COMMENT 'External database title',
  `publisher` varchar(255) NOT NULL,
  `publishYear` int NULL DEFAULT NULL COMMENT 'Print Year=External',
  `note` text NOT NULL COMMENT 'Data comment=External database abs',
  `cencerID` varchar(255) NOT NULL COMMENT 'Publish Number=cencer',
  `author` varchar(255) NOT NULL COMMENT 'Author Name=ath_name',
  `pages` int NOT NULL COMMENT 'Page Count',
  `classID` enum('public','private') NOT NULL DEFAULT 'public' COMMENT 'Public, Private',
  `categoryID` int NOT NULL COMMENT 'Data Category ID',
  `fileName` varchar(255) NOT NULL COMMENT 'File Name',
  `fileType` enum('image','video','audio','document','other') NOT NULL COMMENT 'File Type: Video, Audio, Image, Document, etc',
  `fileSize` bigint NOT NULL DEFAULT 0 COMMENT 'File',
  `langID` tinyint NOT NULL DEFAULT 1 COMMENT 'Language ID',
  `sha512` varchar(255) NULL DEFAULT NULL,
  `insertTime` datetime NOT NULL COMMENT 'Register Time=rgst_dt',
  `processTime` datetime NULL DEFAULT NULL COMMENT 'Data process',
  `likerIDs` text NOT NULL COMMENT 'json format of likers',
  `likeCount` int NOT NULL DEFAULT 0 COMMENT 'Likes',
  `unlikerIDs` text NOT NULL COMMENT 'json form of dislikes',
  `unlikeCount` int NOT NULL DEFAULT 0 COMMENT 'dislikes',
  `viewCount` int NOT NULL DEFAULT 0 COMMENT 'Views',
  `isRecomm` tinyint NOT NULL DEFAULT 0 COMMENT 'Admin recommended?',
  `status` enum('pending','approved','suspended','pass') NOT NULL DEFAULT 'pending' COMMENT 'Request, Approve, Reject',
  `userID` int NOT NULL DEFAULT 2 COMMENT 'User ID',
  `zScore` float NOT NULL COMMENT 'Popularity',
  `keywords` text NOT NULL,
  `orderID` int NOT NULL,
  `dataRoute` tinyint NOT NULL COMMENT 'Data collection route',
  `cost` float NOT NULL,
  `money` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `categoryID` (`categoryID`),
  KEY `title` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `data_order` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `note` varchar(500) COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `userID` int NOT NULL,
  `status` enum('pending','approved','suspended') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending' COMMENT 'Request, Approve, Reject',
  `insertTime` datetime NOT NULL,
  `dataIDs` varchar(255) COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'json format of apply',
  PRIMARY KEY (`id`),
  KEY `userID` (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `data_recording` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userID` int NULL DEFAULT NULL COMMENT 'User Unique ID',
  `para_id` int NULL DEFAULT NULL COMMENT 'Saved wav file format',
  `recording_time` float NULL DEFAULT NULL COMMENT 'Record time',
  `departID` int NULL DEFAULT NULL,
  `userName` varchar(11) COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `regDate` date NULL DEFAULT NULL,
  `state` tinyint(1) NULL DEFAULT 0 COMMENT '0:Pending, 1:Complete, 2:Reject',
  `comment` varchar(255) COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- page 9-10
CREATE TABLE `data_recording_text` (
  `id` int NULL DEFAULT NULL,
  `paragraph` text COLLATE utf8mb4_general_ci NULL,
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `doc_xml` (
  `id` int NOT NULL AUTO_INCREMENT,
  `docID` int NOT NULL,
  `xmlData` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `forum_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `parentID` int NOT NULL DEFAULT 0,
  `title` varchar(255) NOT NULL,
  `note` text NOT NULL,
  `classID` enum('public','private','common') NOT NULL DEFAULT 'public' COMMENT 'Public, Private, Complete Public',
  `categoryID` int NOT NULL DEFAULT 0 COMMENT 'Category ID',
  `fileName` varchar(255) NOT NULL,
  `insertTime` datetime NOT NULL,
  `processTime` datetime NULL DEFAULT NULL,
  `viewCount` smallint unsigned NOT NULL DEFAULT 0 COMMENT 'Views',
  `likerIDs` text NOT NULL COMMENT 'json format of likers',
  `likeCount` smallint unsigned NOT NULL DEFAULT 0,
  `unlikerIDs` text NOT NULL COMMENT 'json form of dislikes',
  `unlikeCount` smallint unsigned NOT NULL DEFAULT 0,
  `fileSize` int NOT NULL DEFAULT 0,
  `answerCount` int NOT NULL DEFAULT 0 COMMENT 'Answers',
  `status` enum('pending','approved','suspended','draft','pass') NOT NULL DEFAULT 'pending' COMMENT 'Request, Approve, Reject',
  `userID` int NOT NULL DEFAULT 2 COMMENT 'User ID',
  `serialParentID` int NOT NULL DEFAULT 0,
  `zScore` double NOT NULL DEFAULT 0,
  `isRecomm` tinyint(1) NOT NULL DEFAULT 0,
  `isCorrectAnswer` tinyint(1) NULL DEFAULT NULL COMMENT 'Correct Answer',
  `answerLimitCount` int NULL DEFAULT NULL COMMENT 'Answer Limits',
  `isOpenForum` tinyint(1) NULL DEFAULT NULL COMMENT 'Is forum open?',
  `forumOpenTime` datetime NULL DEFAULT NULL COMMENT 'Forum Open',
  `forumCloseTime` datetime NULL DEFAULT NULL COMMENT 'Forum Closed',
  `username` varchar(20) NOT NULL,
  `depart_pos` varchar(50) NOT NULL,
  `unitType` tinyint(1) NOT NULL DEFAULT 0,
  `inout_str` varchar(50) NOT NULL,
  `isESstatus` tinyint(1) NULL DEFAULT 0,
  `tagIDs` varchar(255) NOT NULL COMMENT 'json format of tags',
  `tags` varchar(255) NOT NULL COMMENT 'Tags',
  `mentionAnswerID` int NOT NULL DEFAULT 0 COMMENT 'Mentioned answer ID',
  PRIMARY KEY (`id`),
  KEY `categoryID` (`categoryID`),
  KEY `parentID` (`parentID`),
  KEY `userID` (`userID`),
  KEY `serialParentID` (`serialParentID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- page 11
CREATE TABLE `internet_comment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `internetID` int NULL DEFAULT NULL COMMENT 'Internet Data ID',
  `userID` int NULL DEFAULT NULL COMMENT 'Evaluator ID',
  `note` text COLLATE utf8mb4_general_ci NULL COMMENT 'Evaluation',
  `insertTime` datetime NULL DEFAULT NULL COMMENT 'Evaluation Time',
  `status` set('approved','pending','suspended') COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'Approve Status(Approve, Pending, Suspended)',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `internet_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL COMMENT 'External database title',
  `note` text NOT NULL COMMENT 'Data comment=External database abs',
  `categoryID` int NOT NULL COMMENT 'Data Category ID',
  `dataCategoryID` int NOT NULL,
  `fileType` enum('image','video','audio','document','rar','exe','other') NOT NULL COMMENT 'File Type: Video, Audio, Image, Document, etc',
  `fileSize` varchar(11) NOT NULL DEFAULT '0' COMMENT 'File Size=file_size',
  `langID` tinyint NOT NULL DEFAULT 1 COMMENT 'Should used as an array when using languages mods. External',
  `viewCount` int NOT NULL DEFAULT 0 COMMENT 'Views',
  `keywords` text NOT NULL,
  `dataRoute` varchar(255) NOT NULL COMMENT 'Data collection route',
  `cost` varchar(50) NOT NULL,
  `allow` enum('test','crack','allow') NOT NULL,
  `status` enum('pending','approved') NOT NULL,
  `public` enum('public','private') NOT NULL,
  `insertTime` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `categoryID` (`categoryID`),
  KEY `title` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `log_article` (
  `id` int NOT NULL AUTO_INCREMENT,
  `articleID` int NOT NULL COMMENT 'Article ID',
  `userID` int NOT NULL COMMENT 'User ID',
  `lastViewDate` datetime NOT NULL COMMENT 'Last View Date',
  `viewCount` int NOT NULL COMMENT 'Total Views',
  `ip` varchar(20) NOT NULL COMMENT 'Last user IP',
  PRIMARY KEY (`id`),
  KEY `postID` (`articleID`),
  KEY `userID` (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- page 11-12
CREATE TABLE `log_evaluation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT 'User ID',
  `category_id` int NOT NULL COMMENT 'Category ID',
  `value` int NOT NULL COMMENT 'Value',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `log_forum` (
  `id` int NOT NULL AUTO_INCREMENT,
  `forumID` int NOT NULL COMMENT 'Article ID',
  `userID` int NOT NULL COMMENT 'User ID',
  `lastViewDate` datetime NOT NULL COMMENT 'Last View Date',
  `viewCount` int NOT NULL COMMENT 'Total Views',
  `ip` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `postID` (`forumID`),
  KEY `userID` (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `log_inout` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(55) COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'Title',
  `userID` int NULL DEFAULT NULL COMMENT 'User ID',
  `dataCnt` int NOT NULL,
  `forumCnt` int NOT NULL,
  `regDate` datetime NULL DEFAULT NULL,
  `type` tinyint(1) NULL DEFAULT 1 COMMENT '1:Export',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- page 12-13
CREATE TABLE `log_labour` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ip` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `departID` int NOT NULL,
  `posID` int NOT NULL,
  `name` varchar(40) COLLATE utf8mb4_general_ci NOT NULL,
  `date` date NOT NULL,
  `pages` int NOT NULL,
  `p1` tinyint NOT NULL,
  `p2` tinyint NOT NULL,
  `p3` tinyint NOT NULL,
  `p4` tinyint NOT NULL,
  `p5` tinyint NOT NULL,
  `p6` tinyint NOT NULL,
  `p7` tinyint NOT NULL,
  `p8` tinyint NOT NULL,
  `p9` tinyint NOT NULL,
  `p10` tinyint NOT NULL,
  `p11` tinyint NOT NULL,
  `p12` tinyint NOT NULL,
  `p13` tinyint NOT NULL,
  `p14` tinyint NOT NULL,
  `p15` tinyint NOT NULL,
  `p16` tinyint NOT NULL,
  `p17` tinyint NOT NULL,
  `p18` tinyint NOT NULL,
  `p19` tinyint NOT NULL,
  `p20` tinyint NOT NULL,
  `p21` tinyint NOT NULL,
  `p22` tinyint NOT NULL,
  `p23` tinyint NOT NULL,
  `p24` tinyint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `log_login` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `logTime` bigint NOT NULL,
  `logCnt` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `log_message` (
  `id` int NOT NULL AUTO_INCREMENT,
  `senderID` int NOT NULL,
  `receiverID` int NOT NULL,
  `groupName` varchar(50) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Msg Group Info,Usage in msg detail,sorted by id in',
  `message` text COLLATE utf8mb4_general_ci NOT NULL,
  `sendTime` datetime NOT NULL,
  `readTime` datetime NULL DEFAULT NULL,
  `delCheck` tinyint NOT NULL DEFAULT 0 COMMENT '0:Regular Status 1: Delete sender 2: Delete',
  `fileName` varchar(256) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Attachment name',
  `saveName` varchar(256) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Saved file name',
  `fileSize` mediumint NOT NULL COMMENT 'File size',
  PRIMARY KEY (`id`),
  KEY `senderID` (`senderID`),
  KEY `receiverID` (`receiverID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `log_notice` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `noticeID` int NOT NULL COMMENT 'Notice ID',
  `userID` int NOT NULL COMMENT 'User ID',
  `lastViewDate` datetime NULL DEFAULT NULL COMMENT 'Last View Date',
  `ip` varchar(60) NULL DEFAULT NULL COMMENT 'User IP',
  PRIMARY KEY (`id`),
  KEY `userID` (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `log_success` (
  `id` int NOT NULL AUTO_INCREMENT,
  `successID` int NOT NULL COMMENT 'Success ID',
  `userID` int NOT NULL COMMENT 'User ID',
  `lastViewDate` datetime NOT NULL COMMENT 'Last View Date',
  `viewCount` int NOT NULL COMMENT 'Total Views',
  `ip` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `postID` (`successID`),
  KEY `userID` (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- page 14
CREATE TABLE `notice_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(256) NOT NULL,
  `note` text NOT NULL,
  `fileName` varchar(128) NOT NULL,
  `insertTime` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` enum('show','hide','normal') NOT NULL DEFAULT 'normal' COMMENT 'show:Show, hide:Hide, normal:Normal',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `online_exam_answer` (
  `id` int NOT NULL AUTO_INCREMENT,
  `examID` int NOT NULL,
  `answer` text COLLATE utf8mb4_general_ci NOT NULL,
  `grade` decimal(10,0) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `online_exam_category` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `parentID` int NOT NULL DEFAULT 0,
  `examCount` int NOT NULL DEFAULT 10 COMMENT 'Exam count',
  `markingType` int NULL DEFAULT NULL COMMENT 'Score Point(5, 10, 100)',
  `passMark` float NULL DEFAULT NULL COMMENT 'Pass score',
  `isImmeMark` smallint NOT NULL DEFAULT 1 COMMENT 'Immediate check?',
  `sort` int NOT NULL DEFAULT 0,
  `description` text COLLATE utf8mb4_general_ci NOT NULL,
  `reexamdate` smallint NOT NULL DEFAULT 20 COMMENT 'Re-exam',
  `isShow` tinyint NOT NULL DEFAULT 0,
  `managers` text COLLATE utf8mb4_general_ci NOT NULL,
  `markers` text COLLATE utf8mb4_general_ci NULL COMMENT 'Testers(Not used at the moment)',
  `icon` varchar(50) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'fontello-icon-list-3',
  `treeCode` varchar(200) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- page 14-15
CREATE TABLE `online_exam_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `examSTRID` varchar(256) COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `userID` int NOT NULL COMMENT 'User ID',
  `examID` int NOT NULL DEFAULT 0 COMMENT 'Exam ID',
  `startTime` datetime NULL DEFAULT NULL,
  `solvedTime` datetime NULL DEFAULT NULL COMMENT 'Solved time',
  `categoryID` int NOT NULL DEFAULT 0 COMMENT 'Category ID',
  `answerStr` text COLLATE utf8mb4_general_ci NULL,
  `mark` float NULL DEFAULT NULL COMMENT 'gradeValue calculation',
  `marker` varchar(255) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'system' COMMENT 'Checker(Name)',
  PRIMARY KEY (`id`),
  KEY `userID` (`userID`),
  KEY `examID` (`examID`),
  KEY `categoryID` (`categoryID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `online_exam_list` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `categoryID` int NOT NULL,
  `name` text COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Name',
  `question` text COLLATE utf8mb4_general_ci NOT NULL,
  `aCount` tinyint NOT NULL COMMENT 'Solutions',
  `examType` varchar(16) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'MULTICHOICE, TRUEFALSE, SINGLECHOICE, MATCHING, SHORTANSWER, WRITEANSWER',
  `timeLimit` smallint NOT NULL COMMENT '0: No limit',
  `marks` decimal(10,0) NULL DEFAULT NULL COMMENT 'Not used',
  `adminComment` text COLLATE utf8mb4_general_ci NULL,
  `status` int NOT NULL COMMENT '1: Draft 2: Request 3: Reject',
  `insertDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateDate` datetime NULL DEFAULT NULL,
  `creater` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `userID` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `attachedFile` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `attachedFileName` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `categoryID` (`categoryID`),
  KEY `userID` (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `online_exam_mark` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userID` int NULL DEFAULT NULL,
  `examSTRID` varchar(256) COLLATE utf8mb4_general_ci NOT NULL,
  `mark` float NULL DEFAULT NULL COMMENT 'Score',
  `examDate` datetime NULL DEFAULT NULL COMMENT 'Test Time',
  `examEndDate` datetime NULL DEFAULT NULL COMMENT 'Exam end time',
  `categoryID` int NULL DEFAULT NULL COMMENT 'Exam cat id',
  `examIDStr` varchar(255) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Exam id number: 1;12;11',
  `currentEID` int NOT NULL DEFAULT 0 COMMENT 'Current exam ID',
  `examFlag` tinyint NOT NULL DEFAULT 0 COMMENT '0: Testing, 1: Finished',
  `isMarking` smallint NOT NULL DEFAULT 1 COMMENT 'Score Flag 1:Finished, 0:Scoring',
  `ip` varchar(255) COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'Access IP',
  `marker` varchar(255) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'system' COMMENT 'Checker',
  PRIMARY KEY (`id`),
  KEY `userID` (`userID`),
  KEY `categoryID` (`categoryID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- page 15-16
CREATE TABLE `online_exam_match_subquestioin` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `examID` bigint NOT NULL,
  `subQuestion` text COLLATE utf8mb4_general_ci NOT NULL,
  `subAnswer` text COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `opinion_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userName` varchar(255) COLLATE utf8mb4_bin NOT NULL DEFAULT 'Anonymous' COMMENT 'User ID',
  `title` varchar(255) NOT NULL COMMENT 'Title',
  `note` varchar(1024) NOT NULL COMMENT 'Description',
  `insertTime` datetime NOT NULL COMMENT 'Publish date',
  `processTime` datetime NULL DEFAULT NULL COMMENT 'Process Time',
  `answer` varchar(1024) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Answer',
  `status` enum('processed','pending','suspended','inprocess') NOT NULL DEFAULT 'pending',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- page 16-17
CREATE TABLE `overseas_data_order` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `note` varchar(1500) NOT NULL COMMENT 'Note',
  `userID` int NOT NULL COMMENT 'User ID',
  `status` enum('pending','approved','suspended','waiting','passed','end','rejected') NOT NULL DEFAULT 'pending' COMMENT 'Request, Approve, Reject',
  `viewCount` int NOT NULL COMMENT 'Total Views',
  `dataIDs` varchar(765) NOT NULL COMMENT 'Response',
  `category` enum('book','periodicals','standard','source','execution') NOT NULL DEFAULT 'book',
  `title` varchar(100) NOT NULL COMMENT 'Title',
  `taskName` varchar(100) NOT NULL COMMENT 'Task Name',
  `origin` varchar(100) NOT NULL COMMENT 'Origin',
  `price` int NOT NULL COMMENT 'Expected price',
  `monetaryUnit` enum('USD','EUR','GBP','CNY','JPY','RUB') NOT NULL DEFAULT 'USD' COMMENT 'Currency',
  `suspendDepart` enum('science','overseas','spreader') NULL DEFAULT 'science' COMMENT 'Recept Department, Approve Department, Complete Department',
  `comment` varchar(100) NOT NULL COMMENT 'Comment',
  `insertTime` datetime NULL DEFAULT NULL COMMENT 'Last View Date',
  `passTime` datetime NULL DEFAULT NULL COMMENT 'Last accept time',
  `approveTime` datetime NULL DEFAULT NULL COMMENT 'Last approve',
  `waitingTime` datetime NULL DEFAULT NULL COMMENT 'Last waiting time',
  `endTime` datetime NULL DEFAULT NULL COMMENT 'Last complete',
  `suspendTime` datetime NULL DEFAULT NULL COMMENT 'last suspend time',
  `rejectTime` datetime NULL DEFAULT NULL COMMENT 'Last rejection',
  `processTime` datetime NULL DEFAULT NULL COMMENT 'Last process time',
  `feedback` varchar(1500) NULL DEFAULT NULL COMMENT 'Feedback',
  `rating` int NULL DEFAULT NULL COMMENT 'Rating',
  `real_price` int NULL DEFAULT NULL COMMENT 'Real price',
  `real_monetaryUnit` enum('USD','EUR','GBP','CNY','JPY','RUB') NOT NULL DEFAULT 'USD' COMMENT 'Currency',
  `r_statement` varchar(1500) NULL DEFAULT NULL COMMENT 'Reject reason',
  `r_userid` int NULL DEFAULT NULL COMMENT 'Rejector ID',
  PRIMARY KEY (`id`),
  KEY `userID` (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `politic_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `categoryID` int NOT NULL,
  `fileName` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `isShow` tinyint NOT NULL,
  `volume` int NOT NULL,
  `saveName` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `sortID` int NOT NULL,
  `sort` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `private_data_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL COMMENT 'External database title',
  `note` text NOT NULL COMMENT 'Data comment=External database abs',
  `pages` int NOT NULL COMMENT 'Page Count',
  `location` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `categoryID` int NOT NULL COMMENT 'Data Category ID',
  `fileType` varchar(11) NOT NULL COMMENT 'File Type: Video, Audio, Image, Document, etc',
  `langID` tinyint NOT NULL DEFAULT 1 COMMENT 'Should used as an array when using languages mods. External',
  `insertTime` datetime NOT NULL COMMENT 'Register Time=rgst_dt',
  `capacity` varchar(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `private_data_list` (
  `id` int NOT NULL AUTO_INCREMENT,
  `data_id` int NOT NULL DEFAULT 0 COMMENT 'Data ID',
  `title` varchar(255) NOT NULL COMMENT 'Data name',
  `note` text NOT NULL COMMENT 'Data description',
  `categoryID` int NOT NULL DEFAULT 0 COMMENT 'Data Category ID',
  `fileType` enum('image','video','audio','document','other') NOT NULL DEFAULT 'document' COMMENT 'File Type',
  `postTime` datetime NOT NULL COMMENT 'Post time',
  `insertTime` datetime NOT NULL COMMENT 'Created time',
  `dataID` varchar(255) NOT NULL COMMENT 'Data recog. ID',
  PRIMARY KEY (`id`),
  KEY `dataID` (`dataID`),
  KEY `categoryID` (`categoryID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- page 17-18
CREATE TABLE `rating_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userID` int NOT NULL,
  `dataID` int NOT NULL,
  `comment` text COLLATE utf8mb4_general_ci NOT NULL,
  `rating` int NOT NULL,
  `insertDate` date NOT NULL,
  `status` tinyint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `report_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userID` int NOT NULL,
  `insertTime` datetime NOT NULL,
  `managerID` int NOT NULL,
  `report` varchar(1024) COLLATE utf8mb4_general_ci NOT NULL,
  `state` varchar(15) COLLATE utf8mb4_general_ci NOT NULL,
  `signature` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `comment` varchar(1024) COLLATE utf8mb4_general_ci NOT NULL,
  `updateTime` datetime NOT NULL,
  `processTime` datetime NOT NULL,
  `saveFile` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `phone_num` varchar(31) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `science_check` (
  `id` int NOT NULL AUTO_INCREMENT,
  `departID` int NOT NULL COMMENT 'Approved Department ID',
  `checkDate` datetime NOT NULL COMMENT 'Approved Date',
  `checkFlag` varchar(20) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '0' COMMENT 'Approve Flag',
  `checkUser` int NOT NULL COMMENT 'Approved User',
  `empCount` int NOT NULL DEFAULT 0 COMMENT 'Daily employees',
  `publicNetCnt` int NOT NULL DEFAULT 0 COMMENT 'Public Net',
  `privateNetCnt` int NOT NULL DEFAULT 0 COMMENT 'Private Net',
  PRIMARY KEY (`id`),
  KEY `departID` (`departID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `science_item` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'Planned cat ID',
  `name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Planned category',
  `unit` varchar(10) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Unit',
  `deletable` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1:Deletable or',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- page 18-19 (science_plan page 19 is very faint: planVal / permDate names are best-effort)
CREATE TABLE `science_plan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userID` int NULL DEFAULT NULL,
  `date` date NULL DEFAULT NULL,
  `itemID` int NULL DEFAULT NULL,
  `content` varchar(255) COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `planVal` varchar(50) COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `finishFlag` tinyint NOT NULL DEFAULT 0,
  `comment` text COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Comment',
  `details` varchar(500) COLLATE utf8mb4_general_ci NOT NULL,
  `performVal` float NOT NULL DEFAULT 0 COMMENT 'Performed Count',
  `optType` int NOT NULL,
  `attendant` tinyint NOT NULL,
  `permDate` date NOT NULL,
  `audience` enum('bureau','institute','team') COLLATE utf8mb4_general_ci NULL DEFAULT 'team',
  PRIMARY KEY (`id`),
  KEY `userID` (`userID`),
  KEY `itemID` (`itemID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `search_keyword` (
  `id` int NOT NULL AUTO_INCREMENT,
  `keyword` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `insertTime` datetime NOT NULL,
  `userID` int NOT NULL,
  `userIP` char(16) COLLATE utf8mb4_general_ci NOT NULL,
  `resultCount` int NOT NULL COMMENT 'Search Results',
  `searchCount` int NOT NULL,
  `searchType` enum('data','forum','total') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'data' COMMENT 'Article or Data search',
  PRIMARY KEY (`id`),
  KEY `userID` (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `session_info` (
  `id` varchar(128) COLLATE utf8mb4_general_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_general_ci NOT NULL,
  `timestamp` int unsigned NOT NULL DEFAULT 0,
  `data` blob NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- page 19-20
CREATE TABLE `success_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userID` int NULL DEFAULT NULL COMMENT 'User ID',
  `title` text COLLATE utf8mb4_general_ci NULL COMMENT 'Title',
  `description` text COLLATE utf8mb4_general_ci NULL COMMENT 'Description',
  `content` text COLLATE utf8mb4_general_ci NULL COMMENT 'Content',
  `categoryID` int NULL DEFAULT NULL COMMENT 'Category ID',
  `fileName` varchar(127) COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'Attachment Name',
  `fileSize` int NULL DEFAULT NULL COMMENT 'Attachment File Size',
  `viewCount` int NULL DEFAULT NULL COMMENT 'Views',
  `ratingCount` int NULL DEFAULT NULL COMMENT 'Ratings',
  `avgRating` float NULL DEFAULT NULL COMMENT 'Average Rating',
  `status` set('approved','pending','suspended','draft') COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'Approve Status(Request, Approve, Reject',
  `insertTime` datetime NULL DEFAULT NULL COMMENT 'Post Time',
  `processTime` datetime NULL DEFAULT NULL COMMENT 'Process Time',
  `serialParentID` int NULL DEFAULT NULL COMMENT 'Serial Parent ID',
  `keyword` text COLLATE utf8mb4_general_ci NULL COMMENT 'Keyword',
  `isESstatus` tinyint(1) NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `success_rating` (
  `id` int NOT NULL AUTO_INCREMENT,
  `successID` int NULL DEFAULT NULL COMMENT 'Success ID',
  `userID` int NULL DEFAULT NULL COMMENT 'Evaluator ID',
  `rating` float NULL DEFAULT NULL COMMENT 'Rating',
  `note` text COLLATE utf8mb4_general_ci NULL COMMENT 'Feedback',
  `insertTime` datetime NULL DEFAULT NULL COMMENT 'Evaluation Time',
  `status` set('approved','pending','suspended') COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT 'Approve Status',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tbl_captcha` (
  `id` int NOT NULL AUTO_INCREMENT,
  `accessIP` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `captchaCode` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `regDate` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `template_log_access` (
  `id` int NOT NULL AUTO_INCREMENT,
  `accessUrl` text COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Access Information',
  `agent` varchar(255) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'OS, Browser Info',
  `accessIP` varchar(16) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Access IP',
  `accessTime` datetime NOT NULL COMMENT 'Access Time',
  `userName` varchar(20) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Accessed User',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- page 20-21
CREATE TABLE `template_log_data` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dataID` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `langID` tinyint NOT NULL,
  `categoryID` smallint NOT NULL,
  `fileType` enum('image','video','audio','document','other') NOT NULL,
  `userID` int NOT NULL,
  `userName` varchar(10) NOT NULL,
  `userPos` varchar(30) NOT NULL COMMENT 'Position',
  `userDepart` varchar(30) NOT NULL COMMENT 'User Department',
  `tViewTime` int NOT NULL,
  `lastViewTime` datetime NOT NULL COMMENT 'last browse time',
  `accessIP` varchar(20) NOT NULL DEFAULT '0.0.0.0',
  PRIMARY KEY (`id`),
  KEY `dataCategoryID` (`categoryID`),
  KEY `userID` (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `template_log_manager` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `note` varchar(255) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Feedback',
  `userID` int NOT NULL,
  `userName` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `userDepart` varchar(30) COLLATE utf8mb4_general_ci NOT NULL,
  `userPos` varchar(30) COLLATE utf8mb4_general_ci NOT NULL,
  `accessIP` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `accessTime` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userID` (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `template_log_privatedata` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dataID` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `langID` tinyint NOT NULL,
  `categoryID` smallint NOT NULL,
  `fileType` enum('image','video','audio','document','other') NOT NULL,
  `userID` int NOT NULL,
  `userName` varchar(10) NOT NULL,
  `userPos` varchar(30) NOT NULL COMMENT 'Position',
  `userDepart` varchar(30) NOT NULL COMMENT 'User Department',
  `tViewTime` int NOT NULL,
  `lastViewTime` datetime NOT NULL COMMENT 'Last browser',
  `accessIP` varchar(20) NOT NULL DEFAULT '0.0.0.0',
  `classID` enum('private','public') NOT NULL COMMENT 'Public, Private',
  PRIMARY KEY (`id`),
  KEY `dataCategoryID` (`categoryID`),
  KEY `userID` (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- page 21-22
CREATE TABLE `template_log_user` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `note` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `userID` bigint NOT NULL,
  `userName` varchar(30) COLLATE utf8mb4_general_ci NOT NULL,
  `userPos` varchar(30) COLLATE utf8mb4_general_ci NOT NULL,
  `userDepart` varchar(30) COLLATE utf8mb4_general_ci NOT NULL,
  `accessIP` varchar(30) COLLATE utf8mb4_general_ci NOT NULL,
  `accessTime` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userID` (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_info` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'User Unique ID',
  `isAdmin` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1:Admin',
  `isLibrarian` tinyint NOT NULL,
  `userIP` varchar(40) COLLATE utf8mb4_bin NOT NULL DEFAULT '',
  `userName` varchar(255) COLLATE utf8mb4_bin NOT NULL DEFAULT '',
  `cNum` varchar(20) NOT NULL COMMENT 'Citizen ID Number',
  `flag` tinyint NOT NULL DEFAULT 0,
  `phoneNum1` varchar(12) COLLATE utf8mb4_bin NOT NULL,
  `phoneNum2` varchar(12) COLLATE utf8mb4_bin NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_bin NOT NULL DEFAULT '',
  `characterID` int NOT NULL DEFAULT 1,
  `regDate` datetime NOT NULL,
  `departID` int NOT NULL COMMENT 'Department',
  `posID` int NOT NULL COMMENT 'Position',
  `birthday` date NOT NULL,
  `status` enum('pending','approved','suspended','retired') COLLATE utf8mb4_bin NOT NULL DEFAULT 'pending',
  `favIDs` varchar(100) COLLATE utf8mb4_bin NOT NULL COMMENT 'Favorite Data ids',
  `favForumIDs` varchar(255) NOT NULL,
  `favArticleIDs` varchar(255) NOT NULL COMMENT 'Favorite Article',
  `lastAction` datetime NOT NULL,
  `isLogin` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1 Login 0:Not Loggedin Status',
  `pwd_date` date NOT NULL DEFAULT '2020-06-01',
  `theme` set('theme1','theme2','theme3') COLLATE utf8mb4_bin NULL DEFAULT 'theme1' COMMENT 'User chosen theme',
  `internetFlag` tinyint NOT NULL,
  `iasID` varchar(20) NOT NULL COMMENT 'IAS ID',
  `studyGroup` tinyint NOT NULL,
  `OrganizationGroup` tinyint NOT NULL,
  `followCatIDs` varchar(255) NOT NULL COMMENT 'Following category IDs',
  `accessIPs` varchar(255) NULL DEFAULT NULL COMMENT 'Duplicate access IP',
  `followUserIDs` varchar(10000) NOT NULL COMMENT 'Following user ID',
  `textIDs` text NOT NULL,
  `totalMarks` float NULL DEFAULT 0 COMMENT 'Total Score',
  `weekMarks` float NULL DEFAULT 0 COMMENT 'Weekly score',
  `settings` varchar(255) NOT NULL DEFAULT 'show_unread_cnt:1,reply_real_notification:1,message_real_notification:1,publish_favor_cat:0,show_role:0,show_unread_forum:1,show_opened_forum:1,infinite_scroll:0',
  `apply_pdata_ids` text NOT NULL COMMENT 'Requested Data IDs',
  PRIMARY KEY (`id`),
  UNIQUE KEY `userName` (`userName`),
  KEY `userType` (`isAdmin`),
  KEY `departID` (`departID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- page 22-23
CREATE TABLE `user_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userID` int NOT NULL,
  `classID` enum('public','private') NOT NULL DEFAULT 'public' COMMENT 'Private data permission',
  `forumPermission` text NOT NULL COMMENT 'Private forum permission',
  `dataPermission` text NOT NULL COMMENT 'Private data permission',
  `systemPermission` text NOT NULL COMMENT 'System Permission',
  `successPermission` varchar(255) NOT NULL,
  `forumPostPermission` tinyint(1) NULL DEFAULT 0,
  `overseasPermission` varchar(255) NULL DEFAULT 'user:NULL,admin:NULL' COMMENT 'Oversea permission',
  `privatePermission` tinyint(1) NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `userID` (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
