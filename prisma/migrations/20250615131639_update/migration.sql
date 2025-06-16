-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('OFFLINE', 'ONLINE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('QRIS_MIDTRANS', 'QRIS_OFFLINE', 'CASH');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'EXPIRE', 'FAILURE', 'SUCCESS');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'WAITING_DEPOSIT', 'DEPOSIT_PAID', 'PAYMENT_PENDING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(20) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "cost" DECIMAL(10,2) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Addon" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cost" DECIMAL(10,2) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Addon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "min_quantity" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" SERIAL NOT NULL,
    "inventory_id" INTEGER NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(12,2),
    "purchase_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductRecipe" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "inventory_id" INTEGER NOT NULL,
    "quantity_used" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ProductRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddonRecipe" (
    "id" SERIAL NOT NULL,
    "addon_id" INTEGER NOT NULL,
    "inventory_id" INTEGER NOT NULL,
    "quantity_used" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "AddonRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order_type" "OrderType" NOT NULL DEFAULT 'OFFLINE',
    "order_status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "total_amount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderProductItem" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "OrderProductItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderAddonItem" (
    "id" SERIAL NOT NULL,
    "order_product_item_id" INTEGER NOT NULL,
    "addon_id" INTEGER NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "OrderAddonItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "payment_type" "PaymentType" NOT NULL,
    "trx_status" "TransactionStatus" NOT NULL,
    "trx_time" TIMESTAMP(3),
    "paid_amount" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CateringPackage" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "free_cup" INTEGER,
    "size_unit" TEXT NOT NULL,
    "size_volume" INTEGER NOT NULL,
    "quantity_cup" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "CateringPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "event_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "is_use_cart" BOOLEAN NOT NULL DEFAULT false,
    "total_price" DECIMAL(12,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderCatering" (
    "id" SERIAL NOT NULL,
    "reservation_id" INTEGER NOT NULL,
    "catering_package_id" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "free_cup" INTEGER,
    "size_unit" TEXT NOT NULL,
    "size_volume" INTEGER NOT NULL,
    "quantity_cup" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "OrderCatering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryUsage" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "inventory_id" INTEGER NOT NULL,
    "quantity_used" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "InventoryUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" SERIAL NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "openTime" VARCHAR(5),
    "closeTime" VARCHAR(5),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_number_key" ON "User"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_order_id_key" ON "Payment"("order_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRecipe" ADD CONSTRAINT "ProductRecipe_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRecipe" ADD CONSTRAINT "ProductRecipe_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddonRecipe" ADD CONSTRAINT "AddonRecipe_addon_id_fkey" FOREIGN KEY ("addon_id") REFERENCES "Addon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddonRecipe" ADD CONSTRAINT "AddonRecipe_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderProductItem" ADD CONSTRAINT "OrderProductItem_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderProductItem" ADD CONSTRAINT "OrderProductItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderAddonItem" ADD CONSTRAINT "OrderAddonItem_order_product_item_id_fkey" FOREIGN KEY ("order_product_item_id") REFERENCES "OrderProductItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderAddonItem" ADD CONSTRAINT "OrderAddonItem_addon_id_fkey" FOREIGN KEY ("addon_id") REFERENCES "Addon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCatering" ADD CONSTRAINT "OrderCatering_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCatering" ADD CONSTRAINT "OrderCatering_catering_package_id_fkey" FOREIGN KEY ("catering_package_id") REFERENCES "CateringPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryUsage" ADD CONSTRAINT "InventoryUsage_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryUsage" ADD CONSTRAINT "InventoryUsage_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
