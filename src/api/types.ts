/** openapi.yml の components.schemas に対応する型。 */

export interface User {
  email: string;
  token: string;
  username: string;
  bio: string | null;
  image: string | null;
}

export interface Profile {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface Article {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: Profile;
}

export interface Comment {
  id: number;
  createdAt: string;
  updatedAt: string;
  body: string;
  author: Profile;
}

export interface LoginUser {
  email: string;
  password: string;
}

export interface NewUser {
  username: string;
  email: string;
  password: string;
}

export interface UpdateUser {
  email?: string;
  password?: string;
  username?: string;
  bio?: string | null;
  image?: string | null;
}

export interface NewArticle {
  title: string;
  description: string;
  body: string;
  tagList?: string[];
}

export interface UpdateArticle {
  title?: string;
  description?: string;
  body?: string;
  tagList?: string[];
}

export interface NewComment {
  body: string;
}

/** GenericErrorModel の errors。フィールド名 -> メッセージ配列。 */
export type Errors = Record<string, string[]>;

export interface ArticlesQuery {
  tag?: string;
  author?: string;
  favorited?: string;
  limit?: number;
  offset?: number;
}

export interface FeedQuery {
  limit?: number;
  offset?: number;
}
