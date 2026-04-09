import { Injectable } from '@nestjs/common';

@Injectable()
export class CrawlService {
  create(/*_createCrawlDto: CreateCrawlDto*/) {
    return 'This action adds a new crawl';
  }

  findAll() {
    return `This action returns all crawl`;
  }

  findOne(id: number) {
    return `This action returns a #${id} crawl`;
  }

  update(id: number /*updateCrawlDto: UpdateCrawlDto*/) {
    return `This action updates a #${id} crawl`;
  }

  remove(id: number) {
    return `This action removes a #${id} crawl`;
  }
}
