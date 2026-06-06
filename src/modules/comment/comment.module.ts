import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { AuthModule } from '../auth/auth.module';
import { DrizzleModule } from 'src/database/drizzle.module';
import { KeyTokenModule } from '../keytoken/keytoken.module';
import { ProductModule } from '../product/product.module';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports:[DrizzleModule, AuthModule, KeyTokenModule, ProductModule, JwtModule],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
