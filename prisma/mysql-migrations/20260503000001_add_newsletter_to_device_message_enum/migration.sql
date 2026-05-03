-- AlterEnum
ALTER TABLE `Message` MODIFY COLUMN `source` ENUM('ios', 'android', 'web', 'unknown', 'desktop', 'newsletter') NOT NULL;
