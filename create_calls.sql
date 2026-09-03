CREATE TABLE `calls` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `thread_id` int(11) NOT NULL,
  `caller_id` int(11) NOT NULL,
  `room_name` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL,
  `started_at` datetime DEFAULT NULL,
  `ended_at` datetime DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_room` (`room_name`),
  KEY `thread_id` (`thread_id`),
  CONSTRAINT `calls_ibfk_1` FOREIGN KEY (`thread_id`) REFERENCES `chat_threads` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
