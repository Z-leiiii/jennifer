<script setup lang="ts">
import { ref, computed } from 'vue'
import { bookData, type Poem } from '../bookData'

const currentChapterIndex = ref(0)
const showTableOfContents = ref(false)

const currentChapter = computed(() => bookData[currentChapterIndex.value])
const progress = computed(() => ((currentChapterIndex.value + 1) / bookData.length) * 100)

const chapters = bookData as Poem[]

const nextChapter = () => {
  if (currentChapterIndex.value < bookData.length - 1) {
    currentChapterIndex.value++
  }
}

const previousChapter = () => {
  if (currentChapterIndex.value > 0) {
    currentChapterIndex.value--
  }
}

const goToChapter = (index: number) => {
  currentChapterIndex.value = index
  showTableOfContents.value = false
}

const toggleTableOfContents = () => {
  showTableOfContents.value = !showTableOfContents.value
}

// Touch handling for swipe navigation
let touchStartX = 0
let touchEndX = 0

const handleTouchStart = (e: TouchEvent) => {
  touchStartX = e.changedTouches[0].screenX
}

const handleTouchEnd = (e: TouchEvent) => {
  touchEndX = e.changedTouches[0].screenX
  handleSwipe()
}

const handleSwipe = () => {
  const swipeThreshold = 50
  const diff = touchStartX - touchEndX
  
  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0) {
      // Swipe left - next chapter
      nextChapter()
    } else {
      // Swipe right - previous chapter
      previousChapter()
    }
  }
}
</script>

<template>
  <div class="book-reader">
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: progress + '%' }"></div>
    </div>

    <header class="book-header">
      <button class="toc-button" @click="toggleTableOfContents">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      <h1 class="book-title">UNSAID</h1>
      <span class="chapter-indicator">{{ currentChapterIndex + 1 }} / {{ bookData.length }}</span>
    </header>

    <div class="table-of-contents" v-if="showTableOfContents">
      <h2>Table of Contents</h2>
      <button 
        v-for="(chapter, index) in chapters" 
        :key="chapter.id"
        class="toc-item"
        :class="{ active: index === currentChapterIndex }"
        @click="goToChapter(index)"
      >
        <span class="chapter-number" v-if="chapter.id > 0">{{ chapter.id }}</span>
        <span class="chapter-title">{{ chapter.title }}</span>
      </button>
    </div>

    <main 
      class="book-content" 
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      <article class="chapter" v-if="currentChapter.content !== 'cover'">
        <h2 class="chapter-title">{{ currentChapter.title }}</h2>
        <div class="poem-text">{{ currentChapter.content }}</div>
      </article>
      <div class="cover-page" v-else>
        <img src="/cover.jpg" alt="UNSAID Book Cover" class="cover-image" />
      </div>
    </main>
  </div>
</template>

<style scoped>
.book-reader {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #000000;
  font-family: 'Times New Roman', 'Georgia', serif;
  color: #ffffff;
}

.progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  z-index: 100;
}

.progress-fill {
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  transition: width 0.3s ease;
}

.book-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rem 3rem;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  z-index: 50;
}

.toc-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: rgba(255, 255, 255, 0.7);
  transition: color 0.2s;
}

.toc-button:hover {
  color: rgba(255, 255, 255, 1);
}

.book-title {
  font-size: 1.5rem;
  font-weight: normal;
  color: #ffffff;
  margin: 0;
  letter-spacing: 0.15em;
  font-family: 'Times New Roman', serif;
}

.chapter-indicator {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
}

.table-of-contents {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.98);
  z-index: 200;
  padding: 6rem 3rem 3rem;
  overflow-y: auto;
}

.table-of-contents h2 {
  font-size: 2rem;
  color: #ffffff;
  margin-bottom: 2rem;
  font-weight: normal;
  letter-spacing: 0.1em;
}

.toc-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  text-align: left;
  transition: background 0.2s;
  font-family: 'Times New Roman', 'Georgia', serif;
}

.toc-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.toc-item.active {
  background: rgba(255, 255, 255, 0.1);
  border-left: 3px solid rgba(255, 255, 255, 0.5);
}

.chapter-number {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: normal;
  min-width: 2rem;
}

.chapter-title {
  font-size: 1.1rem;
  color: #ffffff;
}

.book-content {
  flex: 1;
  padding: 3rem;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.chapter {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chapter-title {
  font-size: 2.5rem;
  color: #ffffff;
  margin-bottom: 2rem;
  font-weight: normal;
  text-align: center;
  letter-spacing: 0.1em;
}

.poem-text {
  font-size: 1.3rem;
  line-height: 2;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  white-space: pre-line;
  font-family: 'Times New Roman', 'Georgia', serif;
}

.cover-page {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.cover-image {
  width: 100%;
  max-width: 800px;
  max-height: 80vh;
  object-fit: contain;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

@media (max-width: 768px) {
  .book-header {
    padding: 1.5rem;
  }
  
  .book-title {
    font-size: 1.2rem;
  }
  
  .book-content {
    padding: 2rem 1.5rem;
  }
  
  .chapter-title {
    font-size: 1.8rem;
  }
  
  .poem-text {
    font-size: 1.1rem;
  }
}
</style>
