export interface Poem {
  id: number
  title: string
  content: string
}

export interface Book {
  id: string
  title: string
  author: string
  description?: string
  coverImage?: string
  cover_url?: string
  file_url?: string
  file_name?: string
  file_type?: string
  chapters: Poem[]
}

import { unsaidBook } from './books/unsaid'

export const localBooks: Book[] = [unsaidBook]

export function mergeBooks(supabaseBooks: any[]): Book[] {
  // Convert Supabase books to Book format
  const convertedSupabaseBooks: Book[] = supabaseBooks.map(book => ({
    id: book.id,
    title: book.title,
    author: book.author,
    description: book.description,
    cover_url: book.cover_url,
    file_url: book.file_url,
    file_name: book.file_name,
    file_type: book.file_type,
    chapters: book.chapters || []
  }))

  // Combine local books first, then Supabase books
  return [...localBooks, ...convertedSupabaseBooks]
}
