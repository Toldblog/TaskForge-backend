import { Module } from '@nestjs/common';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { JwtModule } from '@nestjs/jwt';
import { CRUDService } from 'src/common/providers';

@Module({
  imports: [JwtModule],
  controllers: [BoardsController],
  providers: [BoardsService, CRUDService],
})
export class BoardsModule {}
