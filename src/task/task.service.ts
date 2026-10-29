import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTaskDTO, UpdateTaskDTO } from './models/task.js';
import { PrismaService } from '../core/config/prisma/prisma.service.js';
import { TaskModel } from '../generated/prisma/models/Task.js';
import { CreateSubtaskDTO } from './models/subtask.js';

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(): Promise<TaskModel[]> {
    return this.prisma.task.findMany();
  }

  async addOne(task: CreateTaskDTO): Promise<TaskModel | never> {
    try {
      return await this.prisma.task.create({
        data: {
          ...task,
        },
      });
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async getOneById(id: string): Promise<TaskModel | never> {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async updateById(
    taskId: string,
    updateDTO: UpdateTaskDTO,
  ): Promise<TaskModel | never> {
    return this.prisma.task.update({
      where: { id: taskId },
      data: { ...updateDTO },
    });
  }

  async createSubtask(taskId: string, subtask: CreateSubtaskDTO) {
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        subTasks: {
          create: subtask,
        },
      },
      select: {
        name: true,
        subTasks: true,
      },
    });
  }
}
