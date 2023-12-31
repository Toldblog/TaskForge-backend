import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards';
import { BoardGuard, ListGuard, Role, Roles, RolesGuard } from 'src/common/guards';
import { ResponseInterceptor } from 'src/common/interceptors';
import { CRUDService } from 'src/common/providers';
import { CreateListDto, ExchangeListOrdersDto } from './dtos';
import { ListsService } from './lists.service';

@Controller('lists')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class ListsController {
    constructor(
        private listsService: ListsService,
        private crudService: CRUDService
    ) { }

    @Get()
    @Roles(Role.ADMIN)
    async getAllLists(@Query() options: any): Promise<any> {
        try {
            const result = await this.crudService.getAll("list", options, {
                cards: true
            });

            return result;
        } catch (error) {
            throw error;
        }
    }

    @Get('in-board/:boardId')
    @UseGuards(BoardGuard)
    async getListsOfBoard(@Param('boardId', ParseIntPipe) boardId: number): Promise<any> {
        try {
            const result = await this.crudService.getAll("list", { boardId }, { cards: true });
            return result;
        } catch (error) {
            throw error;
        }
    }

    @Get(':id')
    @UseGuards(ListGuard)
    async getList(@Param('id', ParseIntPipe) id: number): Promise<any> {
        try {
            const result = await this.crudService.getOne("list", id, { 
                cards: {
                    include: {
                        cardAttachments: true,
                        cardAssignees: true,
                        comments: true
                    }
                } 
            });
            return result
        } catch (error) {
            throw error;
        }
    }

    @Post()
    @UseGuards(BoardGuard)
    async createList(@Body() body: CreateListDto): Promise<any> {
        try {
            const result = await this.crudService.createOne('list', body);

            // update listsOrder of the board
            const listId = result["list"].id;
            const { board } = await this.crudService.getOne('board', body.boardId);
            await this.crudService.updateOne('board', body.boardId, {
                listsOrder: [...board.listsOrder, listId]
            });

            return result;
        } catch (error) {
            throw error;
        }
    }

    @Patch('move-list')
    @UseGuards(BoardGuard)
    moveList(@Body() body: ExchangeListOrdersDto): any {
        return this.listsService.moveList(body.boardId, body.listId, body.newIndex);
    }

    @Patch(':id')
    @UseGuards(ListGuard)
    async updateList(@Param('id', ParseIntPipe) id: number, @Body() body: { name: string }): Promise<any> {
        try {
            const result = await this.crudService.updateOne("list", id, body);
            return result;
        } catch (error) {
            throw error;
        }
    }

    @Delete(':id')
    @UseGuards(ListGuard)
    deleteList(@Param('id', ParseIntPipe) id: number): any {
        return this.listsService.deleteList(id);
    }

    @Post('copy-list/:id')
    @UseGuards(ListGuard)
    copyList(@Param('id', ParseIntPipe) id: number, @Body() body: { name: string }): any {
        return this.listsService.copyList(id, body.name);
    }

    @Patch('move-all-cards/:id')
    @UseGuards(ListGuard)
    moveAllCardsInList(@Param('id', ParseIntPipe) id: number, @Body() body: { destinationListId: number }): any {
        return this.listsService.moveAllCardsInList(id, body.destinationListId);
    }

    @Delete('all-cards/:id')
    @UseGuards(ListGuard)
    deleteAllCardsInList(@Param('id', ParseIntPipe) id: number): any {
        return this.listsService.deleteAllCardsInList(id);
    }
}
