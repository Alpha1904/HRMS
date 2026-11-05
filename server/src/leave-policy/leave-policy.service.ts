import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeavePolicyDto } from './dto/create-leave-policy.dto';
import { UpdateLeavePolicyDto } from './dto/update-leave-policy.dto';
import { LeavePolicy } from '@prisma/client';

@Injectable()
export class LeavePolicyService {
  constructor(private prisma: PrismaService) {}

  /**
   * CREATE: Creates a new leave rule/policy.
   * This is critical for setting up the system.
   */
  async create(dto: CreateLeavePolicyDto): Promise<LeavePolicy> {
    // You might add checks here to ensure no two policies have the exact same
    // combination of criteria (e.g., uniqueness based on criteria).
    return this.prisma.leavePolicy.create({
      data: dto,
    });
  }

  /**
   * READ ALL: Retrieves all defined leave policies.
   */
  async findAll(): Promise<LeavePolicy[]> {
    return this.prisma.leavePolicy.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * READ ONE: Retrieves a single policy by its ID.
   */
  async findOne(id: number): Promise<LeavePolicy> {
    const policy = await this.prisma.leavePolicy.findUnique({
      where: { id },
    });
    if (!policy) {
      throw new NotFoundException(`Leave Policy with ID ${id} not found.`);
    }
    return policy;
  }

  /**
   * UPDATE: Modifies an existing policy.
   * ⚠️ Intellectual Note: Updating a policy (e.g., reducing vacation days from 20 to 15)
   * does NOT automatically update existing LeaveBalance records. A separate, complex
   * background process would be needed to handle that retroactive calculation (or you
   * could just apply the change starting next year).
   */
  async update(id: number, dto: UpdateLeavePolicyDto): Promise<LeavePolicy> {
    // Check if the policy exists first
    await this.findOne(id); 

    return this.prisma.leavePolicy.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * DELETE: Removes a policy from the system.
   * ⚠️ Critical Safety Check: Deleting a policy must be done carefully, as it
   * could prevent employees matching those criteria from requesting leave (due to
   * the JIT logic failing to find a policy).
   */
  async remove(id: number): Promise<void> {
    await this.findOne(id); // Check existence

    await this.prisma.leavePolicy.delete({
      where: { id },
    });
  }
}