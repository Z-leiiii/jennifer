<script setup lang="ts">
import { ref } from 'vue'
import Library from './components/Library.vue'
import BookReader from './components/BookReader.vue'
import { libraryData } from './libraryData'
import type { Book } from './libraryData'

const currentView = ref<'library' | 'reader'>('library')
const selectedBook = ref<Book | null>(null)

const selectBook = (book: Book) => {
  selectedBook.value = book
  currentView.value = 'reader'
}

const backToLibrary = () => {
  currentView.value = 'library'
  selectedBook.value = null
}
</script>

<template>
  <Library
    v-if="currentView === 'library'"
    :books="libraryData"
    @select-book="selectBook"
  />
  <BookReader
    v-else-if="currentView === 'reader' && selectedBook"
    :book="selectedBook"
    @back="backToLibrary"
  />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
}

#app {
  min-height: 100vh;
}
</style>
