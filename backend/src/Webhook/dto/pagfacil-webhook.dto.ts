import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class PagFacilDataDto {
  @IsString()
  @IsNotEmpty()
  payment_id!: string;

  @IsString()
  @IsNotEmpty()
  order_reference!: string;

  @IsNotEmpty()
  amount_cents!: number;

  @IsString()
  @IsNotEmpty()
  method!: string;
}

export class PagFacilWebhookDto {
  @IsString()
  @IsNotEmpty()
  event_id!: string;

  @IsString()
  @IsNotEmpty()
  event_type!: string;

  @IsString()
  @IsNotEmpty()
  created_at!: string;

  @IsObject()
  @IsNotEmpty()
  data!: PagFacilDataDto;
}