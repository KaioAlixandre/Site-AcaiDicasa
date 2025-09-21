-- AlterTable
ALTER TABLE `order` MODIFY `status` ENUM('pending_payment', 'being_prepared', 'ready_for_pickup', 'on_the_way', 'delivered', 'canceled') NOT NULL DEFAULT 'being_prepared';
