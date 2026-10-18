<script setup lang="ts">
import { onBeforeUnmount, ref, computed, watch, nextTick } from 'vue'
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { Book, Poem } from '../libraryData'

const props = defineProps<{
  book: Book
}>()

const emit = defineEmits<{
  back: []
}>()

const currentChapterIndex = ref(0)
const showTableOfContents = ref(false)
const pdfCanvas = ref<HTMLCanvasElement | null>(null)
const pdfViewport = ref<HTMLElement | null>(null)
const pdfPageNumber = ref(1)
const pdfPageCount = ref(0)
const pdfLoading = ref(false)
const pdfError = ref('')

const chapters = (props.book.chapters || []) as Poem[]
let pdfLoadingTask: PDFDocumentLoadingTask | null = null
let pdfDocument: PDFDocumentProxy | null = null
let pdfRenderTask: RenderTask | null = null
let pdfResizeObserver: ResizeObserver | null = null
let pdfjs: typeof import('pdfjs-dist') | null = null

function isRenderingCancelled(error: unknown) {
  return pdfjs !== null && error instanceof pdfjs.RenderingCancelledException
}

/*
 * The chapter index is controlled by our navigation functions,
 * so we know it always points to an existing chapter.
 */
const currentChapter = computed(() => {
  return chapters[currentChapterIndex.value]!
})

async function renderPdfPage() {
  const document = pdfDocument
  const canvas = pdfCanvas.value
  const viewportElement = pdfViewport.value

  if (!document || !canvas || !viewportElement) return

  const pageNumber = pdfPageNumber.value

  try {
    if (pdfRenderTask) {
      const previousTask = pdfRenderTask
      pdfRenderTask = null
      previousTask.cancel()

      try {
        await previousTask.promise
      } catch (error) {
        if (!isRenderingCancelled(error)) throw error
      }
    }

    const page = await document.getPage(pageNumber)
    if (document !== pdfDocument || pageNumber !== pdfPageNumber.value) return

    const initialViewport = page.getViewport({ scale: 1 })
    const availableWidth = Math.max(200, viewportElement.clientWidth - 32)
    const scale = Math.min(availableWidth / initialViewport.width, 1.6)
    const viewport = page.getViewport({ scale })
    const outputScale = Math.min(window.devicePixelRatio || 1, 2)
    const context = canvas.getContext('2d')

    if (!context) throw new Error('Unable to create a canvas for the PDF page.')

    canvas.width = Math.floor(viewport.width * outputScale)
    canvas.height = Math.floor(viewport.height * outputScale)
    canvas.style.width = `${viewport.width}px`
    canvas.style.height = `${viewport.height}px`

    const renderTask = page.render({
      canvas,
      viewport,
      transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0],
      background: '#ffffff',
    })

    pdfRenderTask = renderTask
    await renderTask.promise
    if (pdfRenderTask === renderTask) pdfRenderTask = null
    pdfError.value = ''
  } catch (error) {
    if (isRenderingCancelled(error)) return
    pdfError.value = 'Unable to display this PDF. Please try uploading it again.'
    console.error('Unable to render uploaded PDF:', error)
  }
}

async function loadPdf(url: string) {
  pdfLoading.value = true
  pdfError.value = ''
  pdfPageNumber.value = 1
  pdfPageCount.value = 0

  try {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
    pdfjs = pdfjsLib
    const loadingTask = pdfjsLib.getDocument({ url })
    pdfLoadingTask = loadingTask
    const document = await loadingTask.promise
    if (pdfLoadingTask !== loadingTask) return

    pdfDocument = document
    pdfPageCount.value = document.numPages
    pdfResizeObserver = new ResizeObserver(() => {
      void renderPdfPage()
    })
    if (pdfViewport.value) pdfResizeObserver.observe(pdfViewport.value)

    await renderPdfPage()
  } catch (error) {
    if (pdfLoadingTask !== null) {
      pdfError.value = 'Unable to load this PDF. Please check the file and try again.'
      console.error('Unable to load uploaded PDF:', error)
    }
  } finally {
    pdfLoading.value = false
  }
}

async function resetPdf() {
  pdfResizeObserver?.disconnect()
  pdfResizeObserver = null
  pdfRenderTask?.cancel()
  pdfRenderTask = null
  pdfDocument = null

  const loadingTask = pdfLoadingTask
  pdfLoadingTask = null
  if (loadingTask) await loadingTask.destroy()
}

function changePdfPage(offset: number) {
  const nextPage = pdfPageNumber.value + offset
  if (nextPage < 1 || nextPage > pdfPageCount.value) return
  pdfPageNumber.value = nextPage
  void renderPdfPage()
}

watch(
  () => props.book.file_url,
  async (url) => {
    await resetPdf()
    if (!url || props.book.file_type !== 'application/pdf') return
    await nextTick()
    await loadPdf(url)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  void resetPdf().catch((error) => {
    console.error('Unable to clean up the PDF reader:', error)
  })
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
      v-if="!book.file_url"
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
         BACK BUTTON
    ========================================= -->

    <button
      class="back-button"
      @click="emit('back')"
      aria-label="Back to library"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          d="M19 12H5M12 19l-7-7 7-7"
        ></path>
      </svg>
    </button>

    <!-- ========================================
         TABLE OF CONTENTS
    ========================================= -->

    <div
      v-if="!book.file_url && showTableOfContents"
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

    <section v-if="book.file_url" class="uploaded-book">
      <h1>{{ book.title }}</h1>
      <div v-if="book.file_type === 'application/pdf'" class="pdf-reader">
        <div class="pdf-controls">
          <button
            type="button"
            :disabled="pdfLoading || pdfPageNumber <= 1"
            @click="changePdfPage(-1)"
          >
            Previous
          </button>
          <span v-if="pdfPageCount">Page {{ pdfPageNumber }} of {{ pdfPageCount }}</span>
          <span v-else-if="pdfLoading">Loading book...</span>
          <button
            type="button"
            :disabled="pdfLoading || pdfPageNumber >= pdfPageCount"
            @click="changePdfPage(1)"
          >
            Next
          </button>
        </div>
        <p v-if="pdfError" class="pdf-error" role="alert">{{ pdfError }}</p>
        <div ref="pdfViewport" class="pdf-page-area">
          <canvas ref="pdfCanvas" class="pdf-page" :aria-label="`${book.title}, page ${pdfPageNumber}`" />
        </div>
      </div>
      <div v-else class="uploaded-book-download">
        <p>This completed book is available as an EPUB file.</p>
        <a :href="book.file_url" target="_blank" rel="noopener">
          Open or download {{ book.file_name || 'the book' }}
        </a>
      </div>
    </section>

    <main
      v-else
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
          :src="book.coverImage || book.cover_url || '/cover.jpg'"
          :alt="book.title"
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
   BACK BUTTON
======================================== */

.back-button {
  position: fixed;

  top: clamp(0.5rem, 2vw, 1.25rem);

  left: clamp(0.5rem, 2vw, 1.25rem);

  z-index: 1000;

  padding: clamp(0.4rem, 1vw, 0.6rem);

  color: #3d2b1f;

  cursor: pointer;

  transition: color 0.2s ease, background 0.2s ease;

  background: #f5f0e6;

  border: 1px solid #c4a574;

  border-radius: 4px;
}

.back-button:hover {
  color: #8b7355;
  background: #e8e0d0;
}

.back-button svg {
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

.uploaded-book {
  flex: 1;
  min-height: 0;
  width: 100%;
  padding: clamp(1rem, 3vw, 2rem);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.uploaded-book h1 {
  padding: 0 3rem;
  text-align: center;
  font-size: clamp(1.25rem, 3vw, 2rem);
  font-weight: 400;
}

.pdf-reader {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pdf-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  color: #3d2b1f;
}

.pdf-controls button {
  padding: 0.5rem 0.85rem;
  color: #f5f0e6;
  background: #3d2b1f;
  border: 1px solid #c4a574;
  border-radius: 4px;
  font: inherit;
  cursor: pointer;
}

.pdf-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pdf-page-area {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 1rem;
  background: #f5f0e6;
}

.pdf-page {
  max-width: 100%;
  height: auto;
  background: #ffffff;
  box-shadow: 0 3px 16px rgb(61 43 31 / 16%);
}

.pdf-error {
  color: #a12e28;
  text-align: center;
}

.uploaded-book-download {
  margin: auto;
  text-align: center;
  line-height: 1.8;
}

.uploaded-book-download a {
  color: #294333;
  font-weight: 600;
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