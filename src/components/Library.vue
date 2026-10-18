
<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { localBooks, mergeBooks } from '../libraryData'

const emit = defineEmits(['select-book', 'add-book'])

const books = ref([])
const loading = ref(true)
const errorMessage = ref('')

async function fetchBooks() {
  loading.value = true
  errorMessage.value = ''

  try {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Merge local books with Supabase books
    books.value = mergeBooks(data || [])
  } catch (error) {
    errorMessage.value = error.message
    // If Supabase fails, still show local books
    books.value = localBooks
  } finally {
    loading.value = false
  }
}

const selectBook = (book) => {
  emit('select-book', book)
}

const showAddBook = () => {
  emit('add-book')
}

onMounted(fetchBooks)
</script>


<template>
  <div class="library">
    <div class="library-header">
      <h1 class="library-title">The Library</h1>
      <p class="library-subtitle">A collection of words worth keeping</p>
      <button class="add-book-button" @click="showAddBook">
        + Add New Book
      </button>
    </div>

    <div v-if="loading" class="loading">Loading library...</div>
    <div v-else-if="errorMessage" class="error">{{ errorMessage }}</div>
    <div v-else class="books-grid">
      <div
        v-for="book in books"
        :key="book.id"
        class="book-card"
        @click="selectBook(book)"
      >
        <div class="book-cover">
          <img :src="book.coverImage || book.cover_url || '/cover.jpg'" :alt="book.title" class="cover-image" />
        </div>
        <div class="book-info">
          <h2 class="book-title">{{ book.title }}</h2>
          <p class="book-author">by {{ book.author }}</p>
          <p v-if="book.description" class="book-description">{{ book.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.library {
  min-height: 100vh;
  background: #f5f0e6;
  padding: 3rem 2rem;
  font-family: 'Garamond', 'Georgia', 'Times New Roman', serif;
}

.library-header {
  text-align: center;
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #c4a574;
  position: relative;
}

.library-title {
  font-size: 2.5rem;
  color: #3d2b1f;
  margin: 0 0 0.5rem 0;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.library-subtitle {
  font-size: 1.1rem;
  color: #8b7355;
  margin: 0;
  font-style: italic;
}

.add-book-button {
  position: absolute;
  top: 0;
  right: 0;
  padding: 0.75rem 1.5rem;
  background: #3d2b1f;
  color: #f5f0e6;
  border: 2px solid #c4a574;
  border-radius: 4px;
  font-family: 'Garamond', 'Georgia', 'Times New Roman', serif;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-book-button:hover {
  background: #c4a574;
  color: #3d2b1f;
}

.loading,
.error {
  text-align: center;
  font-size: 1.2rem;
  color: #8b7355;
  padding: 2rem;
}

.error {
  color: #a12e28;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.book-card {
  background: #ffffff;
  border: 2px solid #c4a574;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(61, 43, 31, 0.1);
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(61, 43, 31, 0.2);
  border-color: #a8915a;
}

.book-cover {
  width: 100%;
  height: 350px;
  background: #f5f0e6;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-bottom: 1px solid #e0d5c0;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.book-info {
  padding: 1.5rem;
  text-align: center;
}

.book-title {
  font-size: 1.2rem;
  color: #3d2b1f;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
  letter-spacing: 0.05em;
}

.book-author {
  font-size: 0.95rem;
  color: #8b7355;
  margin: 0 0 0.75rem 0;
  font-style: italic;
}

.book-description {
  font-size: 0.85rem;
  color: #a8915a;
  margin: 0;
  line-height: 1.4;
}

/* Responsive */
@media (max-width: 768px) {
  .library {
    padding: 2rem 1rem;
  }

  .library-title {
    font-size: 2rem;
  }

  .library-subtitle {
    font-size: 1rem;
  }

  .books-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  .book-cover {
    height: 280px;
  }

  .book-info {
    padding: 1rem;
  }

  .book-title {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .library-title {
    font-size: 1.5rem;
  }

  .books-grid {
    grid-template-columns: 1fr;
  }

  .book-cover {
    height: 320px;
  }
}
</style>
