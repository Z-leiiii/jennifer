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

<!-- ========================================
     GLOBAL RESET (unscoped)
     Removes default browser margins on html/body
     and forces every box to size predictably.
     Scoped styles can never reach html/body,
     so this has to stay global.
======================================== -->
<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #f5f0e6;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}
</style>

<style scoped>
/* ========================================
   BOOK READER
   Fills the true visible viewport on every
   device — phone, tablet, laptop, ultra-wide —
   using dvw/dvh so mobile browser chrome
   (address bars, home indicators) never leaves
   a gap.
======================================== */

.book-reader {
  width: 100vw;
  width: 100dvw;
  height: 100vh;
  height: 100dvh;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  background: #f5f0e6;
  font-family: 'Garamond', 'Georgia', 'Times New Roman', serif;
  color: #3d2b1f;
  overflow: hidden;
}

/* ========================================
   FLOATING TOC BUTTON
======================================== */

.toc-button-floating {
  position: fixed;

  top: clamp(0.5rem, 2vw, 1.25rem);

  right: clamp(0.5rem, 2vw, 1.25rem);

  z-index: 1000;

  padding: clamp(0.4rem, 1vw, 0.6rem);

  color: #3d2b1f;

  cursor: pointer;

  transition: color 0.2s ease, background 0.2s ease;

  background: #f5f0e6;

  border: 1px solid #c4a574;

  border-radius: 4px;
}

.toc-button-floating:hover {
  color: #8b7355;
  background: #e8e0d0;
}

.toc-button-floating svg {
  width: clamp(20px, 4vw, 26px);
  height: clamp(20px, 4vw, 26px);
  display: block;
}

/* ========================================
   TABLE OF CONTENTS
======================================== */

.toc-backdrop {
  position: fixed;

  inset: 0;

  width: 100vw;
  width: 100dvw;

  height: 100vh;
  height: 100dvh;

  background: rgba(61, 43, 31, 0.7);

  z-index: 999;

  display: flex;

  justify-content: center;

  align-items: center;

  padding: 1rem;
}

.table-of-contents {
  position: relative;

  width: min(90vw, 500px);

  max-height: min(80vh, 80dvh);

  background: #f5f0e6;

  border: 2px solid #c4a574;

  border-radius: 8px;

  overflow-y: auto;

  overflow-x: hidden;

  z-index: 1000;

  box-shadow: 0 4px 20px rgba(61, 43, 31, 0.3);

  padding: clamp(1rem, 3vw, 2rem);
}

.table-of-contents h2 {
  font-size: clamp(1rem, 2.2vw, 1.3rem);

  margin: 0 0 1rem 0;

  padding-bottom: 0.75rem;

  padding-right: 2rem;

  border-bottom: 2px solid #c4a574;

  color: #3d2b1f;

  letter-spacing: 0.15em;

  text-transform: uppercase;

  font-family: 'Garamond', 'Georgia', 'Times New Roman', serif;
}

.toc-header {
  display: flex;

  align-items: center;

  justify-content: space-between;

  margin-bottom: 1.5rem;

  padding-bottom: 0.5rem;

  border-bottom: 1px solid #e0d5c0;
}

.toc-close-button {
  position: absolute;

  top: clamp(0.75rem, 2vw, 1rem);

  right: clamp(0.75rem, 2vw, 1rem);

  background: none;

  border: none;

  cursor: pointer;

  padding: 0.25rem;

  font-size: 1.5rem;

  line-height: 1;

  color: #8b7355;

  transition: color 0.2s ease;
}

.toc-close-button:hover {
  color: #3d2b1f;
}

/* ========================================
   TOC ITEMS
======================================== */

.toc-item {
  display: flex;

  align-items: center;

  gap: 1rem;

  width: 100%;

  padding: clamp(0.6rem, 1.8vw, 0.75rem) clamp(0.5rem, 2vw, 1rem);

  cursor: pointer;

  transition: all 0.2s ease;

  border-bottom: 1px solid #e0d5c0;

  font-family: 'Garamond', 'Georgia', 'Times New Roman', serif;
}

.toc-item:hover {
  background: #e8e0d0;
  color: #3d2b1f;
}

.toc-item.active {
  color: #3d2b1f;
  background: #d4c4a8;
  border-left: 3px solid #c4a574;
}

/* ========================================
   CHAPTER NUMBER
======================================== */

.chapter-number {
  font-size: clamp(0.7rem, 1.6vw, 0.85rem);

  color: #8b7355;

  margin-right: 0.5rem;

  min-width: 1.75rem;

  font-family: 'Garamond', 'Georgia', 'Times New Roman', serif;
}

/* ========================================
   CHAPTER TITLE
======================================== */

.chapter-title {
  font-size: clamp(0.8rem, 1.8vw, 0.95rem);

  color: #3d2b1f;

  font-family: 'Garamond', 'Georgia', 'Times New Roman', serif;
}

/* ========================================
   BOOK CONTENT
   Always fills whatever space book-reader
   gives it, on any device or orientation.
======================================== */

.book-content {
  flex: 1 1 auto;

  min-height: 0;

  padding: 0;

  margin: 0;

  width: 100%;

  max-width: 100%;

  display: flex;

  flex-direction: column;

  justify-content: center;

  align-items: stretch;

  overflow-y: auto;

  overflow-x: hidden;
}

/* ========================================
   CHAPTER
======================================== */

.chapter {
  animation: fadeIn 0.3s ease;
  width: 100%;
  height: 100%;
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
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
   Fluid font-size and padding via clamp()
   instead of hard breakpoints, so text scales
   smoothly between phone, tablet and desktop.
   Line length is capped for readability on
   ultra-wide screens without leaving empty
   background showing as a "gap".
======================================== */

.poem-text {
  font-size: clamp(0.9rem, 1.6vw + 0.6rem, 1.4rem);

  line-height: 1.85;

  color: #2c1810;

  text-align: center;

  white-space: pre-line;

  font-family: 'Garamond', 'Georgia', 'Times New Roman', serif;

  overflow-y: auto;

  overflow-x: hidden;

  max-height: 100%;

  width: 100%;

  max-width: 46rem;

  margin: 0 auto;

  padding: clamp(1.25rem, 5vw, 3rem) clamp(1rem, 4vw, 2.5rem);

  background: #f5f0e6;

  border-left: 1px solid #e0d5c0;

  border-right: 1px solid #e0d5c0;
}

/* ========================================
   COVER
   True full-bleed: the cover image fills the
   entire viewport edge to edge on every
   device, with the frame drawn as an inset
   overlay so it never shrinks the image or
   leaves background showing around it.
======================================== */

.cover-page {
  position: relative;

  display: flex;

  justify-content: center;

  align-items: center;

  width: 100%;

  height: 100%;

  overflow: hidden;

  padding: 0;

  margin: 0;

  background: #000000;
}

/* Blurred, scaled-up copy of the same image fills every corner of the
   screen behind the real cover, so there's never empty background
   showing around it — without ever distorting or over-cropping the
   actual cover artwork. */
.cover-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: v-bind('"url(/cover.jpg)"');
  background-size: cover;
  background-position: center;
  filter: blur(30px) brightness(0.55) saturate(1.1);
  transform: scale(1.15);
  z-index: 0;
}

.cover-page::after {
  content: '';
  position: absolute;
  inset: clamp(0.5rem, 2vw, 1rem);
  border: 3px double rgba(196, 165, 116, 0.85);
  border-radius: 4px;
  pointer-events: none;
  z-index: 2;
}

.cover-image {
  position: relative;
  z-index: 1;

  width: auto;

  height: auto;

  max-width: 100%;

  max-height: 100%;

  object-fit: contain;

  object-position: center;

  display: block;

  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
}

/* ========================================
   RESPONSIVE
   Fine-tuning at key breakpoints; base rules
   above already flex fluidly between these.
======================================== */

/* Extra small phones */
@media (max-width: 380px) {
  .poem-text {
    border-left: none;
    border-right: none;
  }
}

/* Landscape phones / small tablets */
@media (max-height: 480px) and (orientation: landscape) {
  .toc-button-floating {
    top: 0.4rem;
    right: 0.4rem;
  }

  .poem-text {
    line-height: 1.5;
    padding-top: 1rem;
    padding-bottom: 1rem;
  }

  .table-of-contents {
    max-height: min(90vh, 90dvh);
  }
}

/* Tablets and up: allow a wider reading column */
@media (min-width: 768px) {
  .poem-text {
    max-width: 40rem;
  }
}

/* Large desktop / ultra-wide: cap reading width, let background fill the rest */
@media (min-width: 1440px) {
  .poem-text {
    max-width: 44rem;
    font-size: clamp(1.2rem, 1vw + 0.8rem, 1.6rem);
  }

  .table-of-contents {
    width: min(40vw, 620px);
  }
}

/* Ultra-wide monitors */
@media (min-width: 2000px) {
  .poem-text {
    max-width: 50rem;
    font-size: 1.75rem;
  }
}
</style>