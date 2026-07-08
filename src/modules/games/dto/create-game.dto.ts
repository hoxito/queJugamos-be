import { Type } from "class-transformer";
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
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
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
  @ApiProperty({
    description: "Material UUID required or optionally used by the game.",
    format: "uuid",
    example: "11111111-1111-1111-1111-111111111111"
  })
  @IsString()
  materialId: string;

  @ApiProperty({
    description: "Whether this material is required or optional.",
    enum: RequirementType,
    example: RequirementType.Required
  })
  @IsEnum(RequirementType)
  requirementType: RequirementType;

  @ApiPropertyOptional({
    description: "Quantity of the material needed.",
    minimum: 1,
    example: 1
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({
    description: "Notes about how the material is used.",
    example: "Use one sheet per player."
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class GameAssetInputDto {
  @ApiProperty({
    description: "Asset category.",
    enum: AssetKind,
    example: AssetKind.Cover
  })
  @IsEnum(AssetKind)
  kind: AssetKind;

  @ApiProperty({
    description: "Where the asset is stored or referenced from.",
    enum: AssetSourceType,
    example: AssetSourceType.ManualUrl
  })
  @IsEnum(AssetSourceType)
  sourceType: AssetSourceType;

  @ApiPropertyOptional({
    description: "Public URL for manually referenced assets.",
    example: "https://example.com/game-cover.jpg"
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  publicUrl?: string;

  @ApiPropertyOptional({
    description: "Original source URL used for attribution.",
    example: "https://commons.wikimedia.org/wiki/File:Example.jpg"
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  sourceUrl?: string;

  @ApiPropertyOptional({
    description: "Credit or attribution text.",
    example: "Wikimedia Commons"
  })
  @IsOptional()
  @IsString()
  credit?: string;

  @ApiPropertyOptional({
    description: "License or usage label.",
    example: "CC BY-SA 4.0"
  })
  @IsOptional()
  @IsString()
  licenseLabel?: string;

  @ApiPropertyOptional({
    description: "Object storage provider when sourceType is object_storage.",
    enum: StorageProvider,
    example: StorageProvider.S3
  })
  @IsOptional()
  @IsEnum(StorageProvider)
  storageProvider?: StorageProvider;

  @ApiPropertyOptional({
    description: "Object storage bucket name.",
    example: "quejugamos-assets"
  })
  @IsOptional()
  @IsString()
  bucket?: string;

  @ApiPropertyOptional({
    description: "Object storage key/path.",
    example: "games/catan/cover.jpg"
  })
  @IsOptional()
  @IsString()
  objectKey?: string;

  @ApiPropertyOptional({
    description: "Asset MIME type.",
    example: "image/jpeg"
  })
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional({
    description: "Accessible alternate text for images.",
    example: "Catan board setup"
  })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({
    description: "Display order among game assets.",
    example: 0
  })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CardMappingInputDto {
  @ApiProperty({
    description: "Source card or component being mapped.",
    example: "Ace of spades"
  })
  @IsString()
  sourceCard: string;

  @ApiProperty({
    description: "Meaning or role assigned to the source card.",
    example: "Bomb card"
  })
  @IsString()
  meaning: string;

  @ApiPropertyOptional({
    description: "How many of this mapped card are needed.",
    minimum: 1,
    example: 4
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class CardAdaptationInputDto {
  @ApiProperty({
    description: "Deck type used by this adaptation.",
    enum: DeckType,
    example: DeckType.Standard52
  })
  @IsEnum(DeckType)
  deckType: DeckType;

  @ApiProperty({
    description: "Number of unique cards needed.",
    minimum: 1,
    example: 12
  })
  @IsInt()
  @Min(1)
  uniqueCardsNeeded: number;

  @ApiProperty({
    description: "Total cards needed, including duplicates.",
    minimum: 1,
    example: 24
  })
  @IsInt()
  @Min(1)
  totalCardsNeeded: number;

  @ApiPropertyOptional({
    description: "Adaptation notes.",
    example: "Remove jokers before playing."
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: "Card-to-meaning mappings used by this adaptation.",
    type: () => [CardMappingInputDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CardMappingInputDto)
  mappings: CardMappingInputDto[];
}

export class CreateGameDto {
  @ApiProperty({
    description: "Public game title.",
    example: "Tateti"
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: "URL-safe slug. If omitted, it is generated from the title.",
    example: "tateti"
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({
    description: "Short Markdown summary.",
    example: "A fast alignment game on a 3 by 3 grid."
  })
  @IsString()
  @IsNotEmpty()
  summaryMd: string;

  @ApiProperty({
    description: "Rules in Markdown.",
    example: "Players alternate marking X or O. The first to complete a row wins."
  })
  @IsString()
  @IsNotEmpty()
  rulesMd: string;

  @ApiPropertyOptional({
    description: "External source for rules or manual reference.",
    example: "https://en.wikipedia.org/wiki/Tic-tac-toe"
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  rulesSourceUrl?: string;

  @ApiPropertyOptional({
    description: "External catalog/source name.",
    example: "boardgamegeek"
  })
  @IsOptional()
  @IsString()
  externalSource?: string;

  @ApiPropertyOptional({
    description: "External catalog/source identifier.",
    example: "12345"
  })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiProperty({ description: "Minimum number of players.", minimum: 1, example: 2 })
  @IsInt()
  @Min(1)
  minPlayers: number;

  @ApiProperty({ description: "Maximum number of players.", minimum: 1, example: 4 })
  @IsInt()
  @Min(1)
  maxPlayers: number;

  @ApiProperty({ description: "Minimum recommended age.", minimum: 0, example: 8 })
  @IsInt()
  @Min(0)
  minAge: number;

  @ApiProperty({ description: "Game difficulty.", enum: Difficulty, example: Difficulty.Easy })
  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @ApiProperty({ description: "Expected duration in minutes.", minimum: 1, maximum: 1440, example: 15 })
  @IsInt()
  @Min(1)
  @Max(1440)
  durationMinutes: number;

  @ApiProperty({ description: "Whether the game can be played indoors.", example: true })
  @IsBoolean()
  indoor: boolean;

  @ApiProperty({ description: "Whether the game can be played outdoors.", example: true })
  @IsBoolean()
  outdoor: boolean;

  @ApiPropertyOptional({ description: "Editorial/publication status.", enum: GameStatus, example: GameStatus.Pending })
  @IsOptional()
  @IsEnum(GameStatus)
  status?: GameStatus;

  @ApiProperty({
    description: "Required and optional materials for the game.",
    type: () => [GameMaterialInputDto],
    maxItems: 40
  })
  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => GameMaterialInputDto)
  materials: GameMaterialInputDto[];

  @ApiPropertyOptional({
    description: "Category UUIDs assigned to the game.",
    type: [String],
    example: ["22222222-2222-2222-2222-222222222222"]
  })
  @IsOptional()
  @IsArray()
  categoryIds?: string[];

  @ApiPropertyOptional({
    description: "Images, manuals, printables or other assets.",
    type: () => [GameAssetInputDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GameAssetInputDto)
  assets?: GameAssetInputDto[];

  @ApiPropertyOptional({
    description: "Card/deck adaptations for playing with common decks.",
    type: () => [CardAdaptationInputDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CardAdaptationInputDto)
  cardAdaptations?: CardAdaptationInputDto[];
}