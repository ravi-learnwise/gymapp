import { Module } from '@nestjs/common';
import { EnrollmentController } from './enrollment.controller';
import { EnrollmentService } from './enrollment.service';
import { PaymentModule } from '../payment/payment.module';
import { AssessmentModule } from '../assessment/assessment.module';

@Module({
  imports: [PaymentModule, AssessmentModule],
  controllers: [EnrollmentController],
  providers: [EnrollmentService],
})
export class EnrollmentModule {}