<script setup lang="ts">
import { ref } from 'vue'
import Library from './components/Library.vue'
import BookReader from './components/BookReader.vue'
import AddBook from './components/AddBook.vue'

const currentView = ref<'library' | 'reader' | 'add-book'>('library')
const selectedBook = ref<any>(null)

const selectBook = (book: any) => {
  selectedBook.value = book
  currentView.value = 'reader'
}

const backToLibrary = () => {
  currentView.value = 'library'
  selectedBook.value = null
}

const showAddBook = () => {
  currentView.value = 'add-book'
}

const bookAdded = () => {
  currentView.value = 'library'
}
</script>

<template>
  <Library
    v-if="currentView === 'library'"
    @select-book="selectBook"
    @add-book="showAddBook"
  />
  <BookReader
    v-else-if="currentView === 'reader' && selectedBook"
    :book="selectedBook"
    @back="backToLibrary"
  />
  <AddBook
    v-else-if="currentView === 'add-book'"
    @book-added="bookAdded"
    @cancel="backToLibrary"
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
