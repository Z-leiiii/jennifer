<script setup lang="ts">
import { ref, computed } from 'vue'
import { bookData, type Poem } from '../bookData'

const currentChapterIndex = ref(0)
const showTableOfContents = ref(false)

const chapters = bookData as Poem[]

/*
 * The chapter index is controlled by our navigation functions,
 * so we know it always points to an existing chapter.
 */
const currentChapter = computed(() => {
  return chapters[currentChapterIndex.value]!
})

const progress = computed(() => {
  if (chapters.length === 0) {
    return 0
  }

  return ((currentChapterIndex.value + 1) / chapters.length) * 100
})

// ========================================
// CHAPTER NAVIGATION
// ========================================

const nextChapter = () => {
  if (currentChapterIndex.value < chapters.length - 1) {
    currentChapterIndex.value++
  }
}

const previousChapter = () => {
  if (currentChapterIndex.value > 0) {
    currentChapterIndex.value--
  }
}

const goToChapter = (index: number) => {
  if (index >= 0 && index < chapters.length) {
    currentChapterIndex.value = index
    showTableOfContents.value = false
  }
}

// ========================================
// TABLE OF CONTENTS
// ========================================

const toggleTableOfContents = () => {
  showTableOfContents.value = !showTableOfContents.value
}

// ========================================
// TOUCH / SWIPE NAVIGATION
// ========================================

let touchStartX = 0
let touchEndX = 0

const handleTouchStart = (e: TouchEvent) => {
  const touch = e.changedTouches[0]

  if (!touch) {
    return
  }

  touchStartX = touch.screenX
}

const handleTouchEnd = (e: TouchEvent) => {
  const touch = e.changedTouches[0]

  if (!touch) {
    return
  }

  touchEndX = touch.screenX
  handleSwipe()
}

const handleSwipe = () => {
  const swipeThreshold = 50
  const diff = touchStartX - touchEndX

  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0) {
      // Swipe left → next chapter
      nextChapter()
    } else {
      // Swipe right → previous chapter
      previousChapter()
    }
  }
}
</script>

<template>
  <div class="book-reader">

    <!-- ========================================
         PROGRESS BAR
    ========================================= -->

    <div class="progress-bar">
      <div
        class="progress-fill"
        :style="{ width: progress + '%' }"
      ></div>
    </div>

    <!-- ========================================
         HEADER
    ========================================= -->

    <header class="book-header">

      <!-- Table of Contents Button -->
      <button
        class="toc-button"
        @click="toggleTableOfContents"
        aria-label="Open table of contents"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line
            x1="3"
            y1="12"
            x2="21"
            y2="12"
          ></line>

          <line
            x1="3"
            y1="6"
            x2="21"
            y2="6"
          ></line>

          <line
            x1="3"
            y1="18"
            x2="21"
            y2="18"
          ></line>
        </svg>
      </button>

      <!-- Book Title -->
      <h1 class="book-title">
        UNSAID
      </h1>

      <!-- Chapter Indicator -->
      <span class="chapter-indicator">
        {{ currentChapterIndex + 1 }} / {{ chapters.length }}
      </span>

    </header>

    <!-- ========================================
         TABLE OF CONTENTS
    ========================================= -->

    <div
      v-if="showTableOfContents"
      class="table-of-contents"
    >

      <h2>
        Table of Contents
      </h2>

      <button
        v-for="(chapter, index) in chapters"
        :key="chapter.id"
        class="toc-item"
        :class="{
          active: index === currentChapterIndex
        }"
        @click="goToChapter(index)"
      >

        <span
          v-if="chapter.id > 0"
          class="chapter-number"
        >
          {{ chapter.id }}
        </span>

        <span class="chapter-title">
          {{ chapter.title }}
        </span>

      </button>

    </div>

    <!-- ========================================
         BOOK CONTENT
    ========================================= -->

    <main
      class="book-content"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
    >

      <!-- Normal Chapter -->
      <article
        v-if="currentChapter.content !== 'cover'"
        class="chapter"
      >

        <h2 class="chapter-title">
          {{ currentChapter.title }}
        </h2>

        <div class="poem-text">
          {{ currentChapter.content }}
        </div>

      </article>

      <!-- Cover Page -->
      <div
        v-else
        class="cover-page"
      >

        <img
          src="/cover.jpg"
          alt="UNSAID Book Cover"
          class="cover-image"
        />

      </div>

    </main>

  </div>
</template>

<style scoped>
/* ========================================
   BOOK READER
======================================== */

.book-reader {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #000000;
  font-family: 'Times New Roman', 'Georgia', serif;
  color: #ffffff;
}

/* ========================================
   PROGRESS BAR
======================================== */

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

/* ========================================
   HEADER
======================================== */

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

/* ========================================
   TOC BUTTON
======================================== */

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

/* ========================================
   BOOK TITLE
======================================== */

.book-title {
  font-size: 1.5rem;

  font-weight: normal;

  color: #ffffff;

  margin: 0;

  letter-spacing: 0.15em;

  font-family: 'Times New Roman', serif;
}

/* ========================================
   CHAPTER INDICATOR
======================================== */

.chapter-indicator {
  font-size: 0.9rem;

  color: rgba(255, 255, 255, 0.6);

  font-style: italic;
}

/* ========================================
   TABLE OF CONTENTS
======================================== */

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

/* ========================================
   TOC ITEMS
======================================== */

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

/* ========================================
   CHAPTER NUMBER
======================================== */

.chapter-number {
  font-size: 1.2rem;

  color: rgba(255, 255, 255, 0.6);

  font-weight: normal;

  min-width: 2rem;
}

/* ========================================
   CHAPTER TITLE
======================================== */

.chapter-title {
  font-size: 1.1rem;

  color: #ffffff;
}

/* ========================================
   BOOK CONTENT
======================================== */

.book-content {
  flex: 1;

  padding: 3rem;

  max-width: 800px;

  margin: 0 auto;

  width: 90%;

  display: flex;

  flex-direction: column;

  justify-content: center;
}

/* ========================================
   CHAPTER
======================================== */

.chapter {
  animation: fadeIn 0.5s ease;
}

/* ========================================
   ANIMATION
======================================== */

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

/* ========================================
   CHAPTER TITLE
======================================== */

.chapter-title {
  font-size: 2.5rem;

  color: #ffffff;

  margin-bottom: 2rem;

  font-weight: normal;

  text-align: center;

  letter-spacing: 0.1em;
}

/* ========================================
   POEM
======================================== */

.poem-text {
  font-size: 1.3rem;

  line-height: 2;

  color: rgba(255, 255, 255, 0.9);

  text-align: center;

  white-space: pre-line;

  font-family: 'Times New Roman', 'Georgia', serif;
}

/* ========================================
   COVER
======================================== */

.cover-page {
  display: flex;

  justify-content: center;

  align-items: center;

  width: 100%;
}

.cover-image {
  width: 100%;

  max-width: 800px;

  max-height: 70vh;

  object-fit: contain;

  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

/* ========================================
   MOBILE
======================================== */

@media (max-width: 768px) {

  .book-header {
    padding: 1rem;
  }

  .book-title {
    font-size: 1.1rem;
  }

  .book-content {
    padding: 1.5rem 1rem;
    width: 95%;
  }

  .chapter-title {
    font-size: 1.5rem;
  }

  .poem-text {
    font-size: 1rem;
  }

  .table-of-contents {
    padding: 4rem 1rem 1rem;
  }

  .cover-image {
    max-height: 60vh;
  }

}
</style>
