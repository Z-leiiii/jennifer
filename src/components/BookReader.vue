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
         FLOATING TOC BUTTON
    ========================================= -->

    <button
      class="toc-button-floating"
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

    <!-- ========================================
         TABLE OF CONTENTS
    ========================================= -->

    <div
      v-if="showTableOfContents"
      class="toc-backdrop"
      @click="toggleTableOfContents"
    >

      <div
        class="table-of-contents"
        @click.stop
      >

        <div class="toc-header">
          <h2>
            Table of Contents
          </h2>

          <button
            class="toc-close-button"
            @click="toggleTableOfContents"
            aria-label="Close table of contents"
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
                x1="18"
                y1="6"
                x2="6"
                y2="18"
              ></line>

              <line
                x1="6"
                y1="6"
                x2="18"
                y2="18"
              ></line>
            </svg>
          </button>
        </div>

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
   FLOATING TOC BUTTON
======================================== */

.toc-button-floating {
  position: fixed;

  top: 1rem;
  right: 1rem;

  background: none;

  border: none;

  cursor: pointer;

  padding: 0.5rem;

  color: rgba(255, 255, 255, 0.6);

  transition: color 0.2s;

  z-index: 100;
}

.toc-button-floating:hover {
  color: rgba(255, 255, 255, 1);
}

/* ========================================
   TABLE OF CONTENTS
======================================== */

.toc-backdrop {
  position: fixed;

  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  background: rgba(0, 0, 0, 0.8);

  z-index: 150;
}

.table-of-contents {
  position: fixed;

  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  width: 90%;
  max-width: 500px;
  height: 50vh;

  background: #000000;

  z-index: 200;

  padding: 1.5rem;

  overflow-y: auto;
}

.table-of-contents h2 {
  font-size: 1.2rem;

  color: rgba(255, 255, 255, 0.8);

  margin: 0;

  font-weight: normal;

  letter-spacing: 0.1em;
}

.toc-header {
  display: flex;

  align-items: center;

  justify-content: space-between;

  margin-bottom: 1.5rem;

  padding-bottom: 0.5rem;

  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.toc-close-button {
  background: none;

  border: none;

  cursor: pointer;

  padding: 0.25rem;

  color: rgba(255, 255, 255, 0.5);

  transition: color 0.2s;
}

.toc-close-button:hover {
  color: rgba(255, 255, 255, 0.8);
}

/* ========================================
   TOC ITEMS
======================================== */

.toc-item {
  display: flex;

  align-items: center;

  gap: 1rem;

  width: 100%;

  padding: 0.5rem 0;

  background: none;

  border: none;

  cursor: pointer;

  text-align: left;

  font-family: 'Times New Roman', 'Georgia', serif;
}

.toc-item:hover {
  color: rgba(255, 255, 255, 0.7);
}

.toc-item.active {
  color: rgba(255, 255, 255, 1);
}

/* ========================================
   CHAPTER NUMBER
======================================== */

.chapter-number {
  font-size: 0.85rem;

  color: rgba(255, 255, 255, 0.4);

  font-weight: normal;

  min-width: 2rem;
}

/* ========================================
   CHAPTER TITLE
======================================== */

.chapter-title {
  font-size: 0.9rem;

  color: rgba(255, 255, 255, 0.7);
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
  animation: fadeIn 0.3s ease;
}

/* ========================================
   ANIMATION
======================================== */

@keyframes fadeIn {
  from {
    opacity: 0;

    transform: translateY(10px);
  }

  to {
    opacity: 1;

    transform: translateY(0);
  }
}

/* ========================================
   POEM
======================================== */

.poem-text {
  font-size: 1.1rem;

  line-height: 1.8;

  color: rgba(255, 255, 255, 0.85);

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
}

/* ========================================
   MOBILE
======================================== */

@media (max-width: 768px) {

  .toc-button-floating {
    top: 0.5rem;
    right: 0.5rem;

    padding: 0.5rem;
  }

  .book-content {
    padding: 1.5rem 1rem;
    width: 95%;
  }

  .poem-text {
    font-size: 1rem;
  }

  .table-of-contents {
    width: 95%;
    max-width: 500px;
    height: 60vh;

    padding: 1.5rem;
  }

  .cover-image {
    max-height: 60vh;
  }

}
</style>
