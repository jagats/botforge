export interface ApiError {
  detail: string | Array<{ msg: string; loc: string[] }>;
}

export interface PaginationParams {
  skip?: number;
  limit?: number;
}
