import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('organizations') // 실제 DB 테이블 이름
export class Organization {
  @PrimaryGeneratedColumn('uuid') // 'uuid'라고 명시해줘야 함!
  org_id: string; // 타입은 string으로!

  @Column()
  org_name: string;

  @Column()
  business_number: string;

  @Column({ nullable: true }) // URL은 없을 수도 있으니까 nullable 처리
  base_url: string; //

  @Column({ default: 'N' })
  delete_yn: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
