import { Address } from 'nodemailer/lib/mailer';

export class SendEmailDto {
  from?: Address;
  to: string;
  subject: string;
  text: string;
}
