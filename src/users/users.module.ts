import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtStrategy } from 'src/auth/strategies';
import { JwtModule } from '@nestjs/jwt';
import { CRUDService } from 'src/common/providers';

@Module({
  imports: [JwtModule],
  controllers: [UsersController],
  providers: [UsersService, JwtStrategy, CRUDService],
})
export class UsersModule {}
