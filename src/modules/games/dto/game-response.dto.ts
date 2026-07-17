import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { GameStatus } from "../domain/game.enums";

export class PublicAssetDto {
  @ApiProperty({ example: "cover" })
  kind: string;

  @ApiProperty({ example: "manual_url" })
  sourceType: string;

  @ApiProperty({ example: "https://images.example/game.jpg" })
  url: string;

  @ApiPropertyOptional({ example: "https://example.com/source" })
  sourceUrl?: string | null;

  @ApiPropertyOptional({ example: "Photo credit" })
  credit?: string | null;

  @ApiPropertyOptional({ example: "CC BY-SA 4.0" })
  licenseLabel?: string | null;

  @ApiPropertyOptional({ example: "Game table setup" })
  altText?: string | null;
}

export class PublicMaterialDto {
  @ApiProperty({ example: "cards" })
  slug: string;

  @ApiProperty({ example: "Cards" })
  name: string;

  @ApiProperty({ example: "cards" })
  kind: string;

  @ApiProperty({ example: "required" })
  requirementType: string;

  @ApiPropertyOptional({ example: 1 })
  quantity?: number | null;

  @ApiPropertyOptional({ example: "One standard deck." })
  notes?: string | null;
}

export class PublicCategoryDto {
  @ApiProperty({ example: "strategy" })
  slug: string;

  @ApiProperty({ example: "Strategy" })
  name: string;
}

export class PublicRatingDto {
  @ApiProperty({ example: 5 })
  value: number;

  @ApiPropertyOptional({ example: "Great table presence." })
  comment?: string | null;
}

export class GameCatalogItemDto {
  @ApiProperty({ example: "catan" })
  slug: string;

  @ApiProperty({ example: "The Settlers of Catan" })
  title: string;

  @ApiProperty({ example: "Trade, build and race to ten victory points." })
  summaryMd: string;

  @ApiProperty({ example: 4.5 })
  ratingAverage: number;

  @ApiProperty({ example: 20 })
  ratingCount: number;

  @ApiPropertyOptional({ type: PublicAssetDto })
  coverImage?: PublicAssetDto | null;

  @ApiProperty({ enum: GameStatus, example: GameStatus.Approved })
  status: GameStatus;

  @ApiProperty({ type: [PublicCategoryDto] })
  categories: PublicCategoryDto[];

  @ApiProperty({ type: [PublicMaterialDto] })
  materials: PublicMaterialDto[];

  @ApiProperty({ type: [PublicRatingDto] })
  ratings: PublicRatingDto[];

  @ApiProperty({ example: 3 })
  minPlayers: number;

  @ApiProperty({ example: 4 })
  maxPlayers: number;

  @ApiProperty({ example: 10 })
  minAge: number;

  @ApiProperty({ example: "medium" })
  difficulty: string;

  @ApiProperty({ example: 60 })
  durationMinutes: number;

  @ApiProperty({ example: true })
  indoor: boolean;

  @ApiProperty({ example: false })
  outdoor: boolean;
}

export class PaginatedGamesDto {
  @ApiProperty({ type: [GameCatalogItemDto] })
  items: GameCatalogItemDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 30 })
  limit: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;
}

export class GameDetailDto extends GameCatalogItemDto {
  @ApiProperty({ example: "## Objective\nReach ten victory points." })
  rulesMd: string;

  @ApiProperty({ type: [PublicAssetDto] })
  galleryImages: PublicAssetDto[];

  @ApiProperty({ type: [PublicAssetDto] })
  downloadableAssets: PublicAssetDto[];

  @ApiProperty({ type: [PublicAssetDto] })
  referenceLinks: PublicAssetDto[];

}

export class GameFiltersDto {
  @ApiProperty({ type: [PublicCategoryDto] })
  categories: PublicCategoryDto[];

  @ApiProperty({ type: [PublicMaterialDto] })
  materials: PublicMaterialDto[];

  @ApiProperty({ type: [String], example: ["easy", "medium", "hard"] })
  difficulties: string[];

  @ApiProperty({ example: 1 })
  minPlayers: number;

  @ApiProperty({ example: 12 })
  maxPlayers: number;

  @ApiProperty({ example: 5 })
  minAge: number;

  @ApiProperty({ example: 18 })
  maxAge: number;
}
