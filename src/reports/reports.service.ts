import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './report.entity';
import { CreateReportDto } from './dtos/create-report.dto';
import { User } from '../users/user.entity';
import { GetEstimateDto } from './dtos/get-estimate.dto';

@Injectable()
export class ReportsService {
  constructor(@InjectRepository(Report) private repo: Repository<Report>) {}

  create(reportDto: CreateReportDto, user: User) {
    const report = this.repo.create(reportDto);

    report.user = user;

    return this.repo.save(report);
  }

  async changeApproval(id: string, approved: boolean) {
    const report = await this.repo.findOne({ where: { id: parseInt(id) } });

    if (!report) {
      throw new NotFoundException('Report Not Found');
    }

    report.approved = approved;

    return this.repo.save(report);
  }

  createEstimate(estimateDTO: GetEstimateDto) {
    return this.repo
      .createQueryBuilder()
      .select('AVG(price)', 'price')
      .where('make = :make', { make: estimateDTO.make })
      .andWhere('model =:model', { model: estimateDTO.model })
      .andWhere('lng - :lng BETWEEN -5 AND 5', { lng: estimateDTO.lng })
      .andWhere('lat - :lat BETWEEN -5 AND 5', { lat: estimateDTO.lat })
      .orderBy('ABS(mileage - :mileage)', 'DESC')
      .setParameters({ mileage: estimateDTO.mileage })
      .limit(3)
      .getRawOne();
  }
}
