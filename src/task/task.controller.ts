import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UsePipes,
} from '@nestjs/common';
import { TaskService } from './task.service.js';
import { CreateTaskDTO, UpdateTaskDTO } from './models/task.js';
import { TaskModel } from '../generated/prisma/models/Task.js';
import { CreateSubtaskDTO } from './models/subtask.js';
import { ObservePipe } from '../core/pipes/observe/observe.pipe.js';

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get('all')
  getAll(): Promise<TaskModel[]> {
    return this.taskService.getAll();
  }

  @Get(':id')
  getOne(@Param('id') id: string): Promise<TaskModel | never> {
    return this.taskService.getOneById(id);
  }

  @Post()
  createOne(@Body() task: CreateTaskDTO): Promise<TaskModel | never> {
    return this.taskService.addOne(task);
  }

  @Put(':id')
  updateTask(
    @Body() updateDTO: UpdateTaskDTO,
    @Param('id') taskId: string,
  ): Promise<TaskModel | never> {
    return this.taskService.updateById(taskId, updateDTO);
  }

  @UsePipes(ObservePipe)
  @Post(':id/create-subtask')
  addSubtask(@Param('id') taskId: string, @Body() subtask: CreateSubtaskDTO) {
    return this.taskService.createSubtask(taskId, subtask);
  }
}
