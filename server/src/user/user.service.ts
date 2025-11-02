import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import {
  Prisma,
  Role,
  User,
  ContractType,
  Employee,
  HR_Admin,
} from '@prisma/client';
import { UpdateEmployeeDetailsDto } from './dto/update-employee-details.dto';
import { UpdateHRAdminSitesDto } from './dto/update-hr-admin-sites.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService,
  ) {}

  async getAll() {
    return await this.prisma.user.findMany();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const existUser = await this.prisma.user.findFirst({
        where: { contactInfo: createUserDto.contactInfo },
      });

      if (existUser) {
        throw new ConflictException(
          'User with this contact info already exists',
        );
      }

      // If managerId is provided, validate it exists
      if (createUserDto.managerId) {
        const managerExists = await this.prisma.manager.findUnique({
          where: { id: createUserDto.managerId },
        });
        if (!managerExists) {
          throw new NotFoundException('Manager not found');
        }
      }
      //hash password
      const hashedPassword = await this.hashPassword(createUserDto.password);

      return await this.prisma.$transaction(async (tx) => {
        // Create the user first
        const user = await tx.user.create({
          data: {
            name: createUserDto.name,
            password: hashedPassword,
            contactInfo: createUserDto.contactInfo,
            site: createUserDto.site,
            role: createUserDto.role,
          },
        });

        // Create the role-specific record with provided details
        await this.createRoleSpecificRecord(
          tx,
          user.id,
          user.role,
          createUserDto,
        );

        const { password, ...result } = user; // Exclude password from returned user
        return result as User;
      });
    } catch (error) {
    console.error('User creation error:', error); 
    if (
      error instanceof ConflictException ||
      error instanceof NotFoundException
    ) {
      throw error;
    }
    throw new ConflictException('Failed to create user');
    }
  }

  // get user by id
  async getById(id: number): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { password, ...result } = user;
    return result;
  }

  // Find user by contact info (for authentication)
  async findByContactInfo(contactInfo: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findFirst({
        where: { contactInfo },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      throw new ConflictException('Failed to find user by contact info');
    }
  }

  // Method to get user with all relations (separate from create)
  async findUserWithRelations(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: this.getUserInclude(),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;

  }

  private getUserInclude() {
    return {
      employee:
       {
        include: {
          documents: true,
          leaves: true,
          schedule: true,
          evaluations: true,
          trainings: true,
          payments: true,
          departure: true,
          manager: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  contactInfo: true,
                },
              },
            },
          },
        },
      },
      manager: {
        include: {
          team: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  contactInfo: true,
                },
              },
            },
          },
        },
      },
      hrAdmin: true,
      recruiter: {
        include: {
          jobPostings: true,
          applications: true,
        },
      },
      sentMessages: {
        take: 5,
        orderBy: { timestamp: Prisma.SortOrder.desc },
      },
      receivedMessages: {
        take: 5,
        orderBy: { timestamp: Prisma.SortOrder.desc },
      },
    };
  }

  private async createRoleSpecificRecord(
    tx: any,
    userId: number,
    role: Role,
    createUserDto: CreateUserDto,
  ) {
    switch (role) {
      case Role.EMPLOYEE:
        const position = createUserDto.position;
        const department = createUserDto.department;
        const managerId = createUserDto.managerId;
        if (!managerId) {
          throw new ConflictException('Manager ID is required for employee');
        }
        if (!position || !department) {
          throw new ConflictException('Position and department are required for employee');
        }
        await tx.employee.create({
          data: {
            userId,
            position,
            department,
            seniority: createUserDto.seniority || 0,
            contractStart: createUserDto.contractStart
              ? new Date(createUserDto.contractStart)
              : new Date(),
            contractEnd: createUserDto.contractEnd
              ? new Date(createUserDto.contractEnd)
              : null,
            contractType: createUserDto.contractType || ContractType.FullTime,
            managerId: createUserDto.managerId,
          },
        });
        break;

      case Role.MANAGER:
        await tx.manager.create({
          data: {
            userId,
          },
        });
        break;

      case Role.HR_ADMIN:
        await tx.hR_Admin.create({
          data: {
            userId,
            sitesManaged: createUserDto.sitesManaged || [],
          },
        });
        break;

      case Role.RECRUITER:
        await tx.recruiter.create({
          data: {
            userId,
          },
        });
        break;

      default:
        throw new Error(`Unknown role: ${role}`);
    }
  }

  // Additional helper methods for managing relationships

  //-- hashpassword
 private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  async assignEmployeeToManager(
    employeeId: number,
    managerId: number,
  ): Promise<void> {
    try {
      // Validate manager exists
      const manager = await this.prisma.manager.findUnique({
        where: { id: managerId },
      });

      if (!manager) {
        throw new NotFoundException('Manager not found');
      }

      // Validate employee exists
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      await this.prisma.employee.update({
        where: { id: employeeId },
        data: { managerId },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ConflictException('Failed to assign employee to manager');
    }
  }

  async updateEmployeeDetails(
    employeeId: number,
    details: UpdateEmployeeDetailsDto,
  ): Promise<Employee> {
    try {
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      // If managerId is being updated, validate it exists
      if (details.managerId) {
        const manager = await this.prisma.manager.findUnique({
          where: { id: details.managerId },
        });
        if (!manager) {
          throw new NotFoundException('Manager not found');
        }
      }

      await this.prisma.employee.update({
        where: { id: employeeId },
        data: details,
      });

      return employee;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ConflictException('Failed to update employee details');
    }
  }

  async updateHRAdminSites(
    hrAdminId: number,
    sites?: UpdateHRAdminSitesDto['sitesManaged'],
  ): Promise<HR_Admin> {
    try {
      const hrAdmin = await this.prisma.hR_Admin.findUnique({
        where: { id: hrAdminId },
      });

      if (!hrAdmin) {
        throw new NotFoundException('HR Admin not found');
      }

      await this.prisma.hR_Admin.update({
        where: { id: hrAdminId },
        data: { sitesManaged: sites },
      });

      return hrAdmin;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ConflictException('Failed to update HR admin sites');
    }
  }

  // New method to get all employees by manager
  async getEmployeesByManager(managerId: number) {
    const manager = await this.prisma.manager.findUnique({
      where: { id: managerId },
      include: {
        team: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    return manager.team;
  }

  // New method to get all users by role
  async getUsersByRole(role: Role) {
    return await this.prisma.user.findMany({
      where: { role },
      include: this.getUserInclude(),
    });
  }

  // delete user
  async deleteUser(userId: number): Promise<{ message: string; }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      await this.prisma.user.delete({
        where: { id: userId },
      });
      return {
        message: `User with ID ${userId} deleted successfully`,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ConflictException('Failed to delete user');
    }
  }

    // Get all employees with comprehensive data
  async getAllEmployees() {
    try {
      const employees = await this.prisma.employee.findMany({
        include: {
          // Include user data (contains userId and basic user info)
          user: {
            select: {
              id: true, // This is the userId
              name: true,
              contactInfo: true,
              site: true,
              role: true,
            },
          },
          // Include manager data
          manager: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  contactInfo: true,
                },
              },
            },
          },
          // Include counts for related data (for performance)
          documents: {
            select: {
              id: true,
              fileName: true,
              type: true,
              uploadDate: true,
            },
            orderBy: {
              uploadDate: Prisma.SortOrder.desc,
            },
            take: 5, // Latest 5 documents only
          },
          leaves: {
            select: {
              id: true,
              type: true,
              startDate: true,
              endDate: true,
              status: true,
            },
            orderBy: {
              startDate: Prisma.SortOrder.desc,
            },
            take: 5, // Latest 5 leaves only
          },
          schedule: true,
          evaluations: {
            select: {
              id: true,
              period: true,
              scores: true,
              selfEval: true,
            },
            orderBy: {
              period: Prisma.SortOrder.desc,
            },
            take: 3, // Latest 3 evaluations only
          },
          trainings: {
            select: {
              id: true,
              title: true,
              type: true,
              completionDate: true,
              certification: true,
            },
            orderBy: {
              completionDate: Prisma.SortOrder.desc,
            },
            take: 5, // Latest 5 trainings only
          },
          payments: {
            select: {
              id: true,
              baseSalary: true,
              bonuses: true,
              primes: true,
              payslipDate: true,
            },
            orderBy: {
              payslipDate: Prisma.SortOrder.desc,
            },
            take: 3, // Latest 3 payments only
          },
          departure: {
            select: {
              id: true,
              reason: true,
              exitDate: true,
              indemnity: true,
            },
          },
        },
        orderBy: [
          { user: { name: Prisma.SortOrder.asc } }, // Order by employee name
          { id: Prisma.SortOrder.asc },
        ],
      });

      // Transform the response to include both employeeId and userId at the top level
      return employees.map(employee => ({
        employeeId: employee.id, // This is the employee ID
        userId: employee.user.id, // This is the user ID
        // Basic employee info
        position: employee.position,
        department: employee.department,
        seniority: employee.seniority,
        contractStart: employee.contractStart,
        contractEnd: employee.contractEnd,
        contractType: employee.contractType,
        managerId: employee.managerId,
        // User details
        userDetails: {
          name: employee.user.name,
          contactInfo: employee.user.contactInfo,
          site: employee.user.site,
          role: employee.user.role,
        },
        // Manager details
        manager: employee.manager ? {
          id: employee.manager.id,
          name: employee.manager.user.name,
          contactInfo: employee.manager.user.contactInfo,
        } : null,
        // Related data (limited for performance)
        recentDocuments: employee.documents,
        recentLeaves: employee.leaves,
        schedule: employee.schedule,
        recentEvaluations: employee.evaluations,
        recentTrainings: employee.trainings,
        recentPayments: employee.payments,
        departure: employee.departure,
        // Summary statistics
        summary: {
          totalDocuments: employee.documents.length,
          totalLeaves: employee.leaves.length,
          pendingLeaves: employee.leaves.filter(leave => leave.status === 'Pending').length,
          approvedLeaves: employee.leaves.filter(leave => leave.status === 'Approved').length,
          totalTrainings: employee.trainings.length,
          completedTrainings: employee.trainings.filter(training => training.completionDate !== null).length,
          totalPayments: employee.payments.length,
          hasSchedule: !!employee.schedule,
          hasDeparture: !!employee.departure,
          isActive: !employee.departure, // Employee is active if no departure record
        },
      }));
    } catch (error) {
      throw new ConflictException('Failed to retrieve employees');
    }
  }


  // get employee by id
  async getEmployeeById(employeeId: number) {
    try {
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
          // Include user data (contains userId and basic user info)
          user: {
            select: {
              id: true, // This is the userId
              name: true,
              contactInfo: true,
              site: true,
              role: true,
            },
          },
          // Include manager data
          manager: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  contactInfo: true,
                },
              },
            },
          },
          // Include all employee-related data
          documents: {
            orderBy: {
              uploadDate: Prisma.SortOrder.desc,
            },
          },
          leaves: {
            include: {
              manager: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              hrAdmin: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              startDate: Prisma.SortOrder.desc,
            },
          },
          schedule: true,
          evaluations: {
            include: {
              manager: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              period: Prisma.SortOrder.desc,
            },
          },
          trainings: {
            include: {
              manager: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              completionDate: Prisma.SortOrder.desc,
            },
          },
          payments: {
            include: {
              hrAdmin: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              payslipDate: Prisma.SortOrder.desc,
            },
          },
          departure: {
            include: {
              hrAdmin: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!employee) {
        throw new NotFoundException(`Employee with ID ${employeeId} not found`);
      }

      // Transform the response to include both employeeId and userId at the top level
      return {
        employeeId: employee.id, // This is the employee ID
        userId: employee.user.id, // This is the user ID
        // Basic employee info
        position: employee.position,
        department: employee.department,
        seniority: employee.seniority,
        contractStart: employee.contractStart,
        contractEnd: employee.contractEnd,
        contractType: employee.contractType,
        managerId: employee.managerId,
        // User details
        userDetails: {
          name: employee.user.name,
          contactInfo: employee.user.contactInfo,
          site: employee.user.site,
          role: employee.user.role,
        },
        // Manager details
        manager: employee.manager ? {
          id: employee.manager.id,
          name: employee.manager.user.name,
          contactInfo: employee.manager.user.contactInfo,
        } : null,
        // All related data
        documents: employee.documents,
        leaves: employee.leaves,
        schedule: employee.schedule,
        evaluations: employee.evaluations,
        trainings: employee.trainings,
        payments: employee.payments,
        departure: employee.departure,
        // Summary statistics
        summary: {
          totalDocuments: employee.documents.length,
          totalLeaves: employee.leaves.length,
          pendingLeaves: employee.leaves.filter(leave => leave.status === 'Pending').length,
          approvedLeaves: employee.leaves.filter(leave => leave.status === 'Approved').length,
          totalTrainings: employee.trainings.length,
          completedTrainings: employee.trainings.filter(training => training.completionDate !== null).length,
          totalPayments: employee.payments.length,
          hasSchedule: !!employee.schedule,
          hasDeparture: !!employee.departure,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ConflictException(`Failed to retrieve employee with ID ${employeeId}`);
    }
  }

   // Get all managers with comprehensive data
  async getAllManagers() {
    try {
      const managers = await this.prisma.manager.findMany({
        include: {
          // Include user data (contains userId and basic user info)
          user: {
            select: {
              id: true, // This is the userId
              name: true,
              contactInfo: true,
              site: true,
              role: true,
            },
          },
          // Include team members with basic info
          team: {
            select: {
              id: true,
              position: true,
              department: true,
              seniority: true,
              contractType: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  contactInfo: true,
                  site: true,
                },
              },
            },
            orderBy: {
              user: { name: Prisma.SortOrder.asc },
            },
            take: 10, // Latest 10 team members for performance
          },
          // Include recent leave approvals
          leaves: {
            select: {
              id: true,
              type: true,
              startDate: true,
              endDate: true,
              status: true,
              employee: {
                select: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              startDate: Prisma.SortOrder.desc,
            },
            take: 5, // Latest 5 leave approvals
          },
          // Include recent evaluations
          evaluations: {
            select: {
              id: true,
              period: true,
              scores: true,
              achievements: true,
              employee: {
                select: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              period: Prisma.SortOrder.desc,
            },
            take: 5, // Latest 5 evaluations
          },
          // Include recent training assignments
          trainings: {
            select: {
              id: true,
              title: true,
              type: true,
              completionDate: true,
              employee: {
                select: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              completionDate: Prisma.SortOrder.desc,
            },
            take: 5, // Latest 5 training assignments
          },
        },
        orderBy: [
          { user: { name: Prisma.SortOrder.asc } }, // Order by manager name
          { id: Prisma.SortOrder.asc },
        ],
      });

      // Transform the response to include both managerId and userId at the top level
      return managers.map(manager => ({
        managerId: manager.id, // This is the manager ID
        userId: manager.user.id, // This is the user ID
        // User details
        userDetails: {
          name: manager.user.name,
          contactInfo: manager.user.contactInfo,
          site: manager.user.site,
          role: manager.user.role,
        },
        // Team information
        teamMembers: manager.team.map(employee => ({
          employeeId: employee.id,
          userId: employee.user.id,
          name: employee.user.name,
          position: employee.position,
          department: employee.department,
          seniority: employee.seniority,
          contractType: employee.contractType,
          contactInfo: employee.user.contactInfo,
          site: employee.user.site,
        })),
        // Recent management activities
        recentLeaveApprovals: manager.leaves,
        recentEvaluations: manager.evaluations,
        recentTrainingAssignments: manager.trainings,
        // Summary statistics
        summary: {
          totalTeamMembers: manager.team.length,
          totalLeaveApprovals: manager.leaves.length,
          pendingLeaveApprovals: manager.leaves.filter(leave => leave.status === 'Pending').length,
          approvedLeaves: manager.leaves.filter(leave => leave.status === 'Approved').length,
          totalEvaluations: manager.evaluations.length,
          totalTrainingAssignments: manager.trainings.length,
          completedTrainings: manager.trainings.filter(training => training.completionDate !== null).length,
          teamDepartments: [...new Set(manager.team.map(emp => emp.department))], // Unique departments managed
          teamSites: [...new Set(manager.team.map(emp => emp.user.site))], // Unique sites managed
        },
      }));
    } catch (error) {
      throw new ConflictException('Failed to retrieve managers');
    }
  }

  //Get manager by manager ID with all related data
  async getManagerById(managerId: number) {
    try {
      const manager = await this.prisma.manager.findUnique({
        where: { id: managerId },
        include: {
          // Include user data (contains userId and basic user info)
          user: {
            select: {
              id: true, // This is the userId
              name: true,
              contactInfo: true,
              site: true,
              role: true,
            },
          },
          // Include complete team information
          team: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  contactInfo: true,
                  site: true,
                },
              },
              documents: {
                select: {
                  id: true,
                  fileName: true,
                  type: true,
                  uploadDate: true,
                },
                take: 3, // Latest 3 documents per employee
              },
              leaves: {
                select: {
                  id: true,
                  type: true,
                  startDate: true,
                  endDate: true,
                  status: true,
                },
                take: 3, // Latest 3 leaves per employee
              },
              departure: {
                select: {
                  id: true,
                  reason: true,
                  exitDate: true,
                },
              },
            },
            orderBy: {
              user: { name: Prisma.SortOrder.asc },
            },
          },
          // Include all leave approvals
          leaves: {
            include: {
              employee: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      contactInfo: true,
                    },
                  },
                },
              },
              hrAdmin: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              startDate: Prisma.SortOrder.desc,
            },
          },
          // Include all evaluations
          evaluations: {
            include: {
              employee: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      contactInfo: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              period: Prisma.SortOrder.desc,
            },
          },
          // Include all training assignments
          trainings: {
            include: {
              employee: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      contactInfo: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              completionDate: Prisma.SortOrder.desc,
            },
          },
        },
      });

      if (!manager) {
        throw new NotFoundException(`Manager with ID ${managerId} not found`);
      }

      // Transform the response to include both managerId and userId at the top level
      return {
        managerId: manager.id, // This is the manager ID
        userId: manager.user.id, // This is the user ID
        // User details
        userDetails: {
          name: manager.user.name,
          contactInfo: manager.user.contactInfo,
          site: manager.user.site,
          role: manager.user.role,
        },
        // Complete team information
        teamMembers: manager.team.map(employee => ({
          employeeId: employee.id,
          userId: employee.user.id,
          name: employee.user.name,
          position: employee.position,
          department: employee.department,
          seniority: employee.seniority,
          contractStart: employee.contractStart,
          contractEnd: employee.contractEnd,
          contractType: employee.contractType,
          contactInfo: employee.user.contactInfo,
          site: employee.user.site,
          isActive: !employee.departure,
          recentDocuments: employee.documents,
          recentLeaves: employee.leaves,
          departure: employee.departure,
        })),
        // All management activities
        leaveApprovals: manager.leaves,
        evaluations: manager.evaluations,
        trainingAssignments: manager.trainings,
        // Comprehensive summary statistics
        summary: {
          totalTeamMembers: manager.team.length,
          activeTeamMembers: manager.team.filter(emp => !emp.departure).length,
          departedTeamMembers: manager.team.filter(emp => emp.departure).length,
          totalLeaveApprovals: manager.leaves.length,
          pendingLeaveApprovals: manager.leaves.filter(leave => leave.status === 'Pending').length,
          approvedLeaves: manager.leaves.filter(leave => leave.status === 'Approved').length,
          rejectedLeaves: manager.leaves.filter(leave => leave.status === 'Rejected').length,
          totalEvaluations: manager.evaluations.length,
          totalTrainingAssignments: manager.trainings.length,
          completedTrainings: manager.trainings.filter(training => training.completionDate !== null).length,
          pendingTrainings: manager.trainings.filter(training => training.completionDate === null).length,
          teamDepartments: [...new Set(manager.team.map(emp => emp.department))],
          teamSites: [...new Set(manager.team.map(emp => emp.user.site))],
          teamContractTypes: [...new Set(manager.team.map(emp => emp.contractType))],
          averageTeamSeniority: manager.team.length > 0 
            ? Math.round(manager.team.reduce((sum, emp) => sum + emp.seniority, 0) / manager.team.length * 10) / 10 
            : 0,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ConflictException(`Failed to retrieve manager with ID ${managerId}`);
    }
  }


  //  Get all HR Admins with comprehensive data
  async getAllHrAdmins() {
    try {
      const hrAdmins = await this.prisma.hR_Admin.findMany({
        include: {
          // Include user data (contains userId and basic user info)
          user: {
            select: {
              id: true, // This is the userId
              name: true,
              contactInfo: true,
              site: true,
              role: true,
            },
          },
          // Include recent reports (for performance)
          reports: {
            select: {
              id: true,
              type: true,
              generatedDate: true,
            },
            orderBy: {
              generatedDate: Prisma.SortOrder.desc,
            },
            take: 5, // Latest 5 reports only
          },
          // Include recent payments processed
          payments: {
            select: {
              id: true,
              baseSalary: true,
              bonuses: true,
              primes: true,
              payslipDate: true,
              employee: {
                select: {
                  id: true,
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              payslipDate: Prisma.SortOrder.desc,
            },
            take: 5, // Latest 5 payments only
          },
          // Include recent announcements
          announcements: {
            select: {
              id: true,
              title: true,
              publishDate: true,
            },
            orderBy: {
              publishDate: Prisma.SortOrder.desc,
            },
            take: 5, // Latest 5 announcements only
          },
          // Include recent departures handled
          departures: {
            select: {
              id: true,
              reason: true,
              exitDate: true,
              indemnity: true,
              employee: {
                select: {
                  id: true,
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              exitDate: Prisma.SortOrder.desc,
            },
            take: 5, // Latest 5 departures only
          },
          // Include recent leave overrides
          leaves: {
            select: {
              id: true,
              type: true,
              status: true,
              startDate: true,
              endDate: true,
              employee: {
                select: {
                  id: true,
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              startDate: Prisma.SortOrder.desc,
            },
            take: 5, // Latest 5 leave overrides only
          },
        },
        orderBy: [
          { user: { name: Prisma.SortOrder.asc } }, // Order by HR admin name
          { id: Prisma.SortOrder.asc },
        ],
      });

      // Transform the response to include both hrAdminId and userId at the top level
      return hrAdmins.map(hrAdmin => ({
        hrAdminId: hrAdmin.id, // This is the HR admin ID
        userId: hrAdmin.user.id, // This is the user ID
        // Basic HR admin info
        sitesManaged: hrAdmin.sitesManaged,
        // User details
        userDetails: {
          name: hrAdmin.user.name,
          contactInfo: hrAdmin.user.contactInfo,
          site: hrAdmin.user.site,
          role: hrAdmin.user.role,
        },
        // Related data (limited for performance)
        recentReports: hrAdmin.reports,
        recentPayments: hrAdmin.payments,
        recentAnnouncements: hrAdmin.announcements,
        recentDepartures: hrAdmin.departures,
        recentLeaveOverrides: hrAdmin.leaves,
        // Summary statistics
        summary: {
          totalSitesManaged: hrAdmin.sitesManaged.length,
          totalReports: hrAdmin.reports.length,
          totalPayments: hrAdmin.payments.length,
          totalAnnouncements: hrAdmin.announcements.length,
          totalDepartures: hrAdmin.departures.length,
          totalLeaveOverrides: hrAdmin.leaves.length,
          // Report type breakdown
          reportTypes: hrAdmin.reports.reduce((acc, report) => {
            acc[report.type] = (acc[report.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          // Recent activity indicator
          hasRecentActivity: hrAdmin.reports.length > 0 || hrAdmin.announcements.length > 0,
        },
      }));
    } catch (error) {
      throw new ConflictException('Failed to retrieve HR admins');
    }
  }

  //  Get HR admin by HR admin ID with all related data
  async getHrAdminById(hrAdminId: number) {
    try {
      const hrAdmin = await this.prisma.hR_Admin.findUnique({
        where: { id: hrAdminId },
        include: {
          // Include user data (contains userId and basic user info)
          user: {
            select: {
              id: true, // This is the userId
              name: true,
              contactInfo: true,
              site: true,
              role: true,
            },
          },
          // Include all reports with full details
          reports: {
            orderBy: {
              generatedDate: Prisma.SortOrder.desc,
            },
          },
          // Include all payments processed with employee details
          payments: {
            include: {
              employee: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      contactInfo: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              payslipDate: Prisma.SortOrder.desc,
            },
          },
          // Include all announcements with full content
          announcements: {
            orderBy: {
              publishDate: Prisma.SortOrder.desc,
            },
          },
          // Include all departures handled with full details
          departures: {
            include: {
              employee: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      contactInfo: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              exitDate: Prisma.SortOrder.desc,
            },
          },
          // Include all leave overrides with full details
          leaves: {
            include: {
              employee: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      contactInfo: true,
                    },
                  },
                },
              },
              manager: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              startDate: Prisma.SortOrder.desc,
            },
          },
        },
      });

      if (!hrAdmin) {
        throw new NotFoundException(`HR Admin with ID ${hrAdminId} not found`);
      }

      // Transform the response to include both hrAdminId and userId at the top level
      return {
        hrAdminId: hrAdmin.id, // This is the HR admin ID
        userId: hrAdmin.user.id, // This is the user ID
        // Basic HR admin info
        sitesManaged: hrAdmin.sitesManaged,
        // User details
        userDetails: {
          name: hrAdmin.user.name,
          contactInfo: hrAdmin.user.contactInfo,
          site: hrAdmin.user.site,
          role: hrAdmin.user.role,
        },
        // All related data
        reports: hrAdmin.reports,
        payments: hrAdmin.payments,
        announcements: hrAdmin.announcements,
        departures: hrAdmin.departures,
        leaveOverrides: hrAdmin.leaves,
        // Summary statistics
        summary: {
          totalSitesManaged: hrAdmin.sitesManaged.length,
          totalReports: hrAdmin.reports.length,
          totalPayments: hrAdmin.payments.length,
          totalAnnouncements: hrAdmin.announcements.length,
          totalDepartures: hrAdmin.departures.length,
          totalLeaveOverrides: hrAdmin.leaves.length,
          // Report type breakdown
          reportTypes: hrAdmin.reports.reduce((acc, report) => {
            acc[report.type] = (acc[report.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          // Payment statistics
          totalPaymentsProcessed: hrAdmin.payments.reduce((sum, payment) => sum + payment.baseSalary + (payment.bonuses || 0) + (payment.primes || 0), 0),
          // Departure statistics
          departureReasons: hrAdmin.departures.reduce((acc, departure) => {
            acc[departure.reason] = (acc[departure.reason] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          // Leave override statistics
          leaveOverrideTypes: hrAdmin.leaves.reduce((acc, leave) => {
            acc[leave.type] = (acc[leave.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          leaveOverrideStatuses: hrAdmin.leaves.reduce((acc, leave) => {
            acc[leave.status] = (acc[leave.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ConflictException(`Failed to retrieve HR admin with ID ${hrAdminId}`);
    }
  }


}
