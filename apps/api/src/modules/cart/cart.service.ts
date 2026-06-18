import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'prisma/generated/prisma';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateProductDTO } from './dto/create-cart.dto';
import { UpdateCartDTO } from './dto/update-cart.dto';

type TxClient = Prisma.TransactionClient;
type ShopOrderIds = UpdateCartDTO['shopOrderIds'];

type ServerCartProduct = {
  productId: string;
  shopId: string;
  quantity: number;
  name: string;
  price: number;
};

@Injectable()
export class CartService {
  constructor(private readonly prismaService: PrismaService) {}

  private async getCartByUserId(userId: string, tx: TxClient | PrismaService = this.prismaService) {
    return tx.cart.findUnique({
      where: { userId },
    });
  }

  private async getOrCreateCart(userId: string, tx: TxClient) {
    const cart = await this.getCartByUserId(userId, tx);
    if (cart) return cart;

    return tx.cart.create({
      data: {
        userId,
        countProduct: 0,
      },
    });
  }

  private async getServerCartProduct(
    product: CreateProductDTO,
  ): Promise<ServerCartProduct> {
    if (product.quantity < 1) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const sku = await this.prismaService.sku.findFirst({
      where: {
        id: product.productId,
        status: 1,
      },
      include: {
        spu: {
          select: {
            name: true,
            shopBusinessId: true,
            isMarketable: true,
            status: true,
          },
        },
      },
    });

    if (!sku || !sku.spu || !sku.spu.isMarketable || sku.spu.status !== 1) {
      throw new NotFoundException('Product is not available');
    }

    return {
      productId: sku.id,
      shopId: sku.spu.shopBusinessId,
      quantity: product.quantity,
      name: sku.name || sku.spu.name,
      price: sku.price,
    };
  }

  private async syncCartCount(tx: TxClient, cartId: string) {
    const countProduct = await tx.cartProduct.count({
      where: {
        cartId,
        isActive: true,
      },
    });

    await tx.cart.update({
      where: { id: cartId },
      data: { countProduct },
    });

    return countProduct;
  }

  private async reactivateCartProduct(
    tx: TxClient,
    cartProductId: string,
    product: ServerCartProduct,
  ) {
    await tx.$executeRaw`
      UPDATE cart_products
      SET
        "cart_product_shopId" = ${product.shopId},
        cart_product_name = ${product.name},
        cart_product_price = ${product.price},
        cart_product_quantity = ${product.quantity},
        is_active = true,
        updated_at = ${BigInt(Date.now())}
      WHERE id = ${cartProductId}
    `;

    return tx.cartProduct.findUnique({
      where: { id: cartProductId },
    });
  }

  async addToCart(userId: string, product: CreateProductDTO) {
    const serverProduct = await this.getServerCartProduct(product);

    return this.prismaService.$transaction(async (tx) => {
      const cart = await this.getOrCreateCart(userId, tx);

      const existingItem = await tx.cartProduct.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: serverProduct.productId,
          },
        },
      });

      const cartProduct = existingItem
        ? existingItem.isActive
          ? await tx.cartProduct.update({
            where: { id: existingItem.id },
            data: {
              shopId: serverProduct.shopId,
              name: serverProduct.name,
              price: serverProduct.price,
              quantity: existingItem.isActive
                ? { increment: serverProduct.quantity }
                : serverProduct.quantity,
              isActive: true,
            },
          })
          : await this.reactivateCartProduct(tx, existingItem.id, serverProduct)
        : await tx.cartProduct.create({
            data: {
              productId: serverProduct.productId,
              shopId: serverProduct.shopId,
              quantity: serverProduct.quantity,
              name: serverProduct.name,
              price: serverProduct.price,
              cartId: cart.id,
              isActive: true,
            },
          });

      await this.syncCartCount(tx, cart.id);
      return cartProduct;
    });
  }

  async update(userId: string, shopOrderIds: ShopOrderIds) {
    return this.prismaService.$transaction(async (tx) => {
      const cart = await this.getCartByUserId(userId, tx);
      if (!cart) {
        throw new NotFoundException('Cart not found for user');
      }

      for (const element of shopOrderIds) {
        for (const item of element.itemProducts) {
          const existingItem = await tx.cartProduct.findUnique({
            where: {
              cartId_productId: {
                cartId: cart.id,
                productId: item.productId,
              },
            },
          });

          if (!existingItem || !existingItem.isActive) {
            throw new NotFoundException('Cart item not found');
          }

          if (item.quantity === 0) {
            await tx.cartProduct.delete({
              where: { id: existingItem.id },
            });
            continue;
          }

          const serverProduct = await this.getServerCartProduct({
            productId: item.productId,
            quantity: item.quantity,
          });

          await tx.cartProduct.update({
            where: { id: existingItem.id },
            data: {
              shopId: serverProduct.shopId,
              name: serverProduct.name,
              price: serverProduct.price,
              quantity: item.quantity,
              isActive: true,
            },
          });
        }
      }

      await this.syncCartCount(tx, cart.id);

      return tx.cartProduct.findMany({
        where: {
          cartId: cart.id,
          isActive: true,
        },
      });
    });
  }

  async deleteUserCart(userId: string, productId: string) {
    return this.prismaService.$transaction(async (tx) => {
      const cart = await this.getCartByUserId(userId, tx);
      if (!cart) throw new NotFoundException('Cart not found for user');

      const cartProduct = await tx.cartProduct.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
      });

      if (!cartProduct || !cartProduct.isActive) {
        throw new NotFoundException('Cart item not found');
      }

      await tx.cartProduct.delete({
        where: { id: cartProduct.id },
      });

      const countProduct = await this.syncCartCount(tx, cart.id);

      return {
        deleted: true,
        countProduct,
      };
    });
  }

  async getListUserCart(userId: string) {
    const cart = await this.getCartByUserId(userId);
    if (!cart) return [];

    return this.prismaService.cartProduct.findMany({
      where: {
        cartId: cart.id,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async clearCart(cartId: string) {
    await this.prismaService.cartProduct.deleteMany({
      where: {
        cartId,
      },
    });

    await this.prismaService.cart.update({
      where: {
        id: cartId,
      },
      data: {
        countProduct: 0,
      },
    });
  }
}
