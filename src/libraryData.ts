export interface Poem {
  id: number
  title: string
  content: string
}

export interface Book {
  id: string
  title: string
  author: string
  coverImage: string
  chapters: Poem[]
}

import { unsaidBook } from './books/unsaid'

export const libraryData: Book[] = [unsaidBook]
