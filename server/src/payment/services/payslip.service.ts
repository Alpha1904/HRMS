import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import {
  CompensationComponent,
  CompensationType,
  Frequency,
  Prisma,
  Role,
} from '@prisma/client';
import * as fs from 'fs';
import { Response } from 'express';
import { dirname, isAbsolute, join } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUserInterface } from '../../common/interfaces/current-user.interface';
import { GeneratePayslipDto } from '../dto/generate-payslip.dto';
import { AuditContext, PaymentAuditService } from './payment-audit.service';

import PDFDocument = require('pdfkit');

type BreakdownItem = Record<string, any>;

@Injectable()
export class PayslipService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private audit: PaymentAuditService,
  ) {}

  private normalizeMonth(d: Date): Date {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
  }

  private getMonthEnd(monthStart: Date): Date {
    return new Date(
      Date.UTC(
        monthStart.getUTCFullYear(),
        monthStart.getUTCMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      ),
    );
  }

  private round2(d: Prisma.Decimal): Prisma.Decimal {
    return new Prisma.Decimal(d.toFixed(2));
  }

  private fmtMonth(monthStart: Date): string {
    const y = monthStart.getUTCFullYear();
    const m = String(monthStart.getUTCMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  private async assertCanAccessProfile(
    profileId: number,
    user: CurrentUserInterface,
  ) {
    if (user.role === Role.HR_ADMIN || user.role === Role.SYSTEM_ADMIN) {
      return;
    }

    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { userId: true },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    if (profile.userId !== user.id) {
      throw new ForbiddenException('You can only access your own payslips');
    }
  }

  private getPayslipUploadDirAbs(): string {
    const configured = this.config.get<string>('PAYSLIP_UPLOAD_DIR') || 'uploads/payslips';
    return isAbsolute(configured) ? configured : join(process.cwd(), configured);
  }

  private ensureDirExists(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private frequencyAmount(
    component: CompensationComponent,
    monthStart: Date,
    monthEnd: Date,
  ): Prisma.Decimal {
    const freq = component.frequency ?? Frequency.MONTHLY;

    if (freq === Frequency.ONE_TIME) {
      const start = new Date(component.startDate);
      if (start >= monthStart && start <= monthEnd) {
        return component.amount as unknown as Prisma.Decimal;
      }
      return new Prisma.Decimal(0);
    }

    if (freq === Frequency.ANNUAL) {
      return (component.amount as unknown as Prisma.Decimal).div(12);
    }

    if (freq === Frequency.QUARTERLY) {
      const startQuarter = Math.floor(new Date(component.startDate).getUTCMonth() / 3);
      const monthQuarter = Math.floor(monthStart.getUTCMonth() / 3);
      if (startQuarter !== monthQuarter) {
        return new Prisma.Decimal(0);
      }
      return (component.amount as unknown as Prisma.Decimal).div(3);
    }

    return component.amount as unknown as Prisma.Decimal;
  }

  private async calculatePayslip(profileId: number, monthStart: Date) {
    const monthEnd = this.getMonthEnd(monthStart);

    const profile = await this.prisma.profile.findFirst({
      where: { id: profileId, deletedAt: null },
      select: {
        id: true,
        userId: true,
        fullName: true,
        department: true,
        position: true,
        site: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const components = await this.prisma.compensationComponent.findMany({
      where: {
        profileId,
        active: true,
        deletedAt: null,
        startDate: { lte: monthEnd },
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: monthStart } }] }],
      },
      orderBy: { startDate: 'asc' },
    });

    const adjustments = await this.prisma.salaryAdjustment.findMany({
      where: {
        profileId,
        effectiveDate: { lte: monthEnd },
      },
      orderBy: [{ effectiveDate: 'asc' }, { createdAt: 'asc' }],
    });

    const componentAmounts = new Map<number, Prisma.Decimal>();
    const breakdown: BreakdownItem[] = [];

    for (const c of components) {
      const amt = this.frequencyAmount(c, monthStart, monthEnd);
      if (amt.gt(0)) {
        componentAmounts.set(c.id, amt);
        breakdown.push({
          kind: 'COMPONENT',
          componentId: c.id,
          type: c.type,
          frequency: c.frequency ?? Frequency.MONTHLY,
          description: c.description,
          amount: this.round2(amt).toString(),
        });
      }
    }

    const baseSalaryTotal = components
      .filter((c) => c.type === CompensationType.BASE_SALARY)
      .reduce((sum, c) => {
        const val = componentAmounts.get(c.id) ?? new Prisma.Decimal(0);
        return sum.plus(val);
      }, new Prisma.Decimal(0));

    let adjustmentsTotal = new Prisma.Decimal(0);

    for (const a of adjustments) {
      let target = new Prisma.Decimal(0);

      if (a.componentId) {
        target = componentAmounts.get(a.componentId) ?? new Prisma.Decimal(0);
      } else {
        target = baseSalaryTotal.gt(0)
          ? baseSalaryTotal
          : Array.from(componentAmounts.values()).reduce(
              (sum, v) => sum.plus(v),
              new Prisma.Decimal(0),
            );
      }

      const percentDelta = a.percentage
        ? target.mul(new Prisma.Decimal(a.percentage)).div(100)
        : new Prisma.Decimal(0);

      const amountDelta = a.amount as unknown as Prisma.Decimal;
      const totalDelta = amountDelta.plus(percentDelta);

      if (totalDelta.eq(0)) {
        continue;
      }

      adjustmentsTotal = adjustmentsTotal.plus(totalDelta);

      breakdown.push({
        kind: 'ADJUSTMENT',
        adjustmentId: a.id,
        componentId: a.componentId,
        adjustmentType: a.adjustmentType,
        amount: this.round2(amountDelta).toString(),
        percentage: a.percentage,
        percentDelta: this.round2(percentDelta).toString(),
        totalDelta: this.round2(totalDelta).toString(),
        effectiveDate: a.effectiveDate.toISOString(),
        reason: a.reason,
      });
    }

    const componentsTotal = Array.from(componentAmounts.values()).reduce(
      (sum, v) => sum.plus(v),
      new Prisma.Decimal(0),
    );

    const gross = componentsTotal.plus(adjustmentsTotal);

    const deductionPercent = Number(this.config.get('DEDUCTION_PERCENT') ?? 10);
    const deductions = gross.mul(deductionPercent).div(100);
    const net = gross.minus(deductions);

    breakdown.push({
      kind: 'DEDUCTION',
      label: `Deductions (${deductionPercent}%)`,
      amount: this.round2(deductions).toString(),
    });

    return {
      profile,
      monthStart,
      monthEnd,
      gross: this.round2(gross),
      deductions: this.round2(deductions),
      net: this.round2(net),
      breakdown,
    };
  }

  private async renderPdf(params: {
    profile: any;
    monthStart: Date;
    gross: Prisma.Decimal;
    deductions: Prisma.Decimal;
    net: Prisma.Decimal;
    breakdown: BreakdownItem[];
    filePath: string;
  }) {
    this.ensureDirExists(dirname(params.filePath));

    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(params.filePath);

      doc.pipe(stream);

      doc.fontSize(18).text('Payslip', { align: 'center' });
      doc.moveDown(1);

      doc.fontSize(11);
      doc.text(`Employee: ${params.profile.fullName}`);
      doc.text(`Department: ${params.profile.department ?? '-'}`);
      doc.text(`Position: ${params.profile.position ?? '-'}`);
      doc.text(`Site: ${params.profile.site ?? '-'}`);
      doc.text(`Period: ${this.fmtMonth(params.monthStart)}`);

      doc.moveDown(1);

      const startX = doc.x;
      let y = doc.y;
      const col1 = startX;
      const col2 = startX + 360;

      doc.fontSize(12).text('Breakdown');
      doc.moveDown(0.5);

      y = doc.y;
      doc
        .moveTo(startX, y)
        .lineTo(startX + 495, y)
        .stroke();

      y += 8;
      doc.fontSize(10).text('Item', col1, y);
      doc.fontSize(10).text('Amount', col2, y, { width: 120, align: 'right' });

      y += 14;
      doc
        .moveTo(startX, y)
        .lineTo(startX + 495, y)
        .stroke();

      y += 8;

      const lines = params.breakdown
        .filter((b) => b.kind !== 'DEDUCTION')
        .map((b) => {
          if (b.kind === 'COMPONENT') {
            const label = b.description
              ? `${b.type} - ${b.description}`
              : `${b.type}`;
            return { label, amount: b.amount };
          }
          if (b.kind === 'ADJUSTMENT') {
            const label = b.componentId
              ? `ADJUSTMENT (${b.adjustmentType}) on component #${b.componentId}`
              : `ADJUSTMENT (${b.adjustmentType})`;
            return { label, amount: b.totalDelta };
          }
          return { label: String(b.kind), amount: String(b.amount ?? '') };
        });

      for (const line of lines) {
        if (y > 720) {
          doc.addPage();
          y = 60;
        }
        doc.fontSize(10).text(line.label, col1, y, { width: 340 });
        doc.fontSize(10).text(String(line.amount), col2, y, {
          width: 120,
          align: 'right',
        });
        y += 16;
      }

      y += 8;
      doc
        .moveTo(startX, y)
        .lineTo(startX + 495, y)
        .stroke();

      y += 10;
      doc.fontSize(11).text('Gross', col1, y);
      doc.fontSize(11).text(params.gross.toString(), col2, y, {
        width: 120,
        align: 'right',
      });

      y += 16;
      doc.fontSize(11).text('Deductions', col1, y);
      doc.fontSize(11).text(params.deductions.toString(), col2, y, {
        width: 120,
        align: 'right',
      });

      y += 16;
      doc.fontSize(12).text('Net', col1, y);
      doc.fontSize(12).text(params.net.toString(), col2, y, {
        width: 120,
        align: 'right',
      });

      doc.end();

      stream.on('finish', () => resolve());
      stream.on('error', (e) => reject(e));
    });
  }

  async generate(dto: GeneratePayslipDto, ctx?: AuditContext) {
    const monthStart = this.normalizeMonth(new Date(dto.month));
    if (Number.isNaN(monthStart.getTime())) {
      throw new BadRequestException('Invalid month');
    }

    const existing = await this.prisma.payslip.findUnique({
      where: { profileId_month: { profileId: dto.profileId, month: monthStart } },
    });

    if (existing) {
      throw new ConflictException('Payslip already exists for this profile and month');
    }

    const calc = await this.calculatePayslip(dto.profileId, monthStart);

    const uploadDir = this.getPayslipUploadDirAbs();
    this.ensureDirExists(uploadDir);

    const fileName = `${dto.profileId}-${this.fmtMonth(monthStart)}.pdf`;
    const filePath = join(uploadDir, fileName);

    await this.renderPdf({
      profile: calc.profile,
      monthStart,
      gross: calc.gross,
      deductions: calc.deductions,
      net: calc.net,
      breakdown: calc.breakdown,
      filePath,
    });

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.payslip.create({
        data: {
          profile: { connect: { id: dto.profileId } },
          month: monthStart,
          grossAmount: calc.gross,
          deductions: calc.deductions,
          netAmount: calc.net,
          breakdown: calc.breakdown as any,
          filePath,
        },
      });

      if (ctx) {
        await this.audit.log(
          ctx,
          'GENERATE_PAYSLIP',
          'Payslip',
          created.id,
          undefined,
          created,
        );
      }

      return created;
    });
  }

  async getPayslip(profileId: number, month: string, user: CurrentUserInterface) {
    await this.assertCanAccessProfile(profileId, user);

    const monthStart = this.normalizeMonth(new Date(month));
    if (Number.isNaN(monthStart.getTime())) {
      throw new BadRequestException('Invalid month');
    }

    const payslip = await this.prisma.payslip.findUnique({
      where: { profileId_month: { profileId, month: monthStart } },
    });

    if (!payslip) {
      throw new NotFoundException('Payslip not found');
    }

    return payslip;
  }

  async downloadPayslip(
    profileId: number,
    month: Date,
    user: CurrentUserInterface,
    res: Response,
  ) {
    await this.assertCanAccessProfile(profileId, user);

    const monthStart = this.normalizeMonth(month);

    const payslip = await this.prisma.payslip.findUnique({
      where: { profileId_month: { profileId, month: monthStart } },
    });

    if (!payslip) {
      throw new NotFoundException('Payslip not found');
    }

    if (!payslip.filePath || !fs.existsSync(payslip.filePath)) {
      throw new NotFoundException('Payslip PDF file not found on server');
    }

    await this.prisma.payslip.update({
      where: { id: payslip.id },
      data: { viewedAt: new Date() },
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=\"${profileId}-${this.fmtMonth(monthStart)}.pdf\"`,
    });

    const stream = fs.createReadStream(payslip.filePath);
    return new StreamableFile(stream);
  }

  @Cron('0 0 1 * *')
  async generatePreviousMonthCron() {
    const now = new Date();
    const currentMonth = this.normalizeMonth(now);
    const previousMonth = new Date(
      Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() - 1, 1),
    );

    const systemUser = await this.prisma.user.findFirst({
      where: { role: Role.SYSTEM_ADMIN, deletedAt: null },
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    const ctx = systemUser
      ? ({ performedById: systemUser.id } as AuditContext)
      : undefined;

    const batchSize = 100;
    let skip = 0;

    while (true) {
      const profiles = await this.prisma.profile.findMany({
        where: { deletedAt: null, isTerminated: false },
        select: { id: true },
        skip,
        take: batchSize,
        orderBy: { id: 'asc' },
      });

      if (profiles.length === 0) {
        break;
      }

      for (const p of profiles) {
        const exists = await this.prisma.payslip.findUnique({
          where: { profileId_month: { profileId: p.id, month: previousMonth } },
          select: { id: true },
        });

        if (exists) {
          continue;
        }

        try {
          await this.generate(
            { profileId: p.id, month: previousMonth.toISOString() },
            ctx,
          );
        } catch (e) {
          continue;
        }
      }

      skip += profiles.length;
    }

    return { month: previousMonth.toISOString(), status: 'done' };
  }
}
