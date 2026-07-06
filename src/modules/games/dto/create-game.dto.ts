import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  ValidateNested
} from "class-validator";
import { Type } from "class-transformer";
import {
  AssetKind,
  AssetSourceType,
  DeckType,
  Difficulty,
  GameStatus,
  RequirementType,
  StorageProvider
} from "../domain/game.enums";

export class GameMaterialInputDto {
  @IsString()
  materialId: string;

  @IsEnum(RequirementType)
  requirementType: RequirementType;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class GameAssetInputDto {
  @IsEnum(AssetKind)
  kind: AssetKind;

  @IsEnum(AssetSourceType)
  sourceType: AssetSourceType;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  publicUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  credit?: string;

  @IsOptional()
  @IsString()
  licenseLabel?: string;

  @IsOptional()
  @IsEnum(StorageProvider)
  storageProvider?: StorageProvider;

  @IsOptional()
  @IsString()
  bucket?: string;

  @IsOptional()
  @IsString()
  objectKey?: string;

  @IsOptional()
  @IsString()
  contentType?: string;

  @IsOptional()
  @IsString()
  altText?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CardMappingInputDto {
  @IsString()
  sourceCard: string;

  @IsString()
  meaning: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class CardAdaptationInputDto {
  @IsEnum(DeckType)
  deckType: DeckType;

  @IsInt()
  @Min(1)
  uniqueCardsNeeded: number;

  @IsInt()
  @Min(1)
  totalCardsNeeded: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CardMappingInputDto)
  mappings: CardMappingInputDto[];
}

export class CreateGameDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  @IsNotEmpty()
  summaryMd: string;

  @IsString()
  @IsNotEmpty()
  rulesMd: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  rulesSourceUrl?: string;

  @IsOptional()
  @IsString()
  externalSource?: string;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsInt()
  @Min(1)
  minPlayers: number;

  @IsInt()
  @Min(1)
  maxPlayers: number;

  @IsInt()
  @Min(0)
  minAge: number;

  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsInt()
  @Min(1)
  @Max(1440)
  durationMinutes: number;

  @IsBoolean()
  indoor: boolean;

  @IsBoolean()
  outdoor: boolean;

  @IsOptional()
  @IsEnum(GameStatus)
  status?: GameStatus;

  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => GameMaterialInputDto)
  materials: GameMaterialInputDto[];

  @IsOptional()
  @IsArray()
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GameAssetInputDto)
  assets?: GameAssetInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CardAdaptationInputDto)
  cardAdaptations?: CardAdaptationInputDto[];
}
