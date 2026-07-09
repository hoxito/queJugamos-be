export enum Difficulty {
  Easy = "easy",
  Medium = "medium",
  Hard = "hard"
}

export enum GameStatus {
  Draft = "draft",
  Pending = "pending",
  Approved = "approved",
  Rejected = "rejected",
  Archived = "archived"
}

export enum MaterialKind {
  Writing = "writing",
  Paper = "paper",
  Cards = "cards",
  Board = "board",
  Tiles = "tiles",
  Pieces = "pieces",
  Blocks = "blocks",
  Money = "money",
  Bags = "bags",
  Tokens = "tokens",
  Dice = "dice",
  Timer = "timer",
  Space = "space",
  Device = "device",
  Other = "other"
}

export enum RequirementType {
  Required = "required",
  Optional = "optional"
}

export enum DeckType {
  Standard52 = "standard_52",
  Spanish40 = "spanish_40",
  Custom = "custom"
}

export enum AssetKind {
  Cover = "cover",
  RulesPdf = "rules_pdf",
  Printable = "printable",
  Image = "image",
  Video = "video",
  Other = "other"
}

export enum AssetSourceType {
  ManualUrl = "manual_url",
  ObjectStorage = "object_storage"
}

export enum StorageProvider {
  S3 = "s3",
  R2 = "r2",
  Gcs = "gcs",
  AzureBlob = "azure_blob",
  Supabase = "supabase",
  Other = "other"
}
