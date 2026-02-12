import { Injectable } from '@nestjs/common';
import { CreateCrawlDto } from './dto/create-crawl.dto';
import { UpdateCrawlDto } from './dto/update-crawl.dto';

@Injectable()
export class CrawlService {
  create(createCrawlDto: CreateCrawlDto) {
    return 'This action adds a new crawl';
  }

  findAll() {
    return `This action returns all crawl`;
  }

  findOne(id: number) {
    return `This action returns a #${id} crawl`;
  }

  update(id: number, updateCrawlDto: UpdateCrawlDto) {
    return `This action updates a #${id} crawl`;
  }

  remove(id: number) {
    return `This action removes a #${id} crawl`;
  }
}
