
<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

const emit = defineEmits(['book-added', 'cancel'])

const showVerification = ref(true)
const verificationAnswer = ref('')
const verificationError = ref('')

const title = ref('')
const author = ref('')
const description = ref('')
const coverFile = ref(null)
const bookFile = ref(null)
const loading = ref(false)
const errorMessage = ref('')

const correctAnswer = 'Princess Zaira Delostrino Padua'
const maxBookSize = 50 * 1024 * 1024
const allowedBookTypes = {
  pdf: 'application/pdf',
  epub: 'application/epub+zip',
}

function verify() {
  if (verificationAnswer.value.trim() === correctAnswer) {
    showVerification.value = false
    verificationError.value = ''
  } else {
    verificationError.value = 'Incorrect answer. Please try again.'
  }
}

function handleFileChange(event) {
  coverFile.value = event.target.files?.[0] ?? null
}

function handleBookFileChange(event) {
  bookFile.value = event.target.files?.[0] ?? null
}

async function addBook() {
  errorMessage.value = ''

  if (!title.value.trim() || !author.value.trim()) {
    errorMessage.value = 'Please enter the book title and author.'
    return
  }

  if (!bookFile.value) {
    errorMessage.value = 'Please choose the completed book file to upload.'
    return
  }

  const extension = bookFile.value.name.split('.').pop()?.toLowerCase()
  const bookType = allowedBookTypes[extension]

  if (!bookType) {
    errorMessage.value = 'Upload a completed book as a PDF or EPUB file.'
    return
  }

  if (bookFile.value.size > maxBookSize) {
    errorMessage.value = 'The book file must be 50 MB or smaller.'
    return
  }

  if (coverFile.value) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (!allowedTypes.includes(coverFile.value.type)) {
      errorMessage.value = 'Use a JPG, PNG, or WebP image.'
      return
    }

    if (coverFile.value.size > 5 * 1024 * 1024) {
      errorMessage.value = 'The cover image must be 5 MB or smaller.'
      return
    }
  }

  loading.value = true
  const uploadedFiles = []

  try {
    const bookPath = `${crypto.randomUUID()}.${extension}`
    const { error: bookUploadError } = await supabase.storage
      .from('book-files')
      .upload(bookPath, bookFile.value, {
        contentType: bookType,
        upsert: false,
      })

    if (bookUploadError) throw bookUploadError
    uploadedFiles.push({ bucket: 'book-files', path: bookPath })

    const { data: bookUrlData } = supabase.storage
      .from('book-files')
      .getPublicUrl(bookPath)

    let coverUrl = null

    if (coverFile.value) {
      const coverExtension = coverFile.value.name.split('.').pop()?.toLowerCase()
      const coverPath = `${crypto.randomUUID()}.${coverExtension}`

      const { error: uploadError } = await supabase.storage
        .from('book-covers')
        .upload(coverPath, coverFile.value, {
          contentType: coverFile.value.type,
          upsert: false,
        })

      if (uploadError) throw uploadError
      uploadedFiles.push({ bucket: 'book-covers', path: coverPath })

      const { data: urlData } = supabase.storage
        .from('book-covers')
        .getPublicUrl(coverPath)

      coverUrl = urlData.publicUrl
    }

    const { data, error } = await supabase
      .from('books')
      .insert({
        title: title.value.trim(),
        author: author.value.trim(),
        description: description.value.trim(),
        cover_url: coverUrl,
        file_url: bookUrlData.publicUrl,
        file_name: bookFile.value.name,
        file_type: bookType,
      })
      .select()
      .single()

    if (error) throw error

    emit('book-added', data)
  } catch (error) {
    const cleanupErrors = []

    for (const uploadedFile of uploadedFiles) {
      const { error: cleanupError } = await supabase.storage
        .from(uploadedFile.bucket)
        .remove([uploadedFile.path])

      if (cleanupError) cleanupErrors.push(cleanupError.message)
    }

    const message = error.message || 'Unable to save the book.'
    errorMessage.value = cleanupErrors.length
      ? `${message} Uploaded file cleanup also failed: ${cleanupErrors.join('; ')}`
      : message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="book-form">
    <!-- Verification Screen -->
    <div v-if="showVerification" class="verification">
      <p class="eyebrow">SECURITY CHECK</p>
      <h2>Verify Your Identity</h2>
      <p class="subtitle">
        What is your full name?
      </p>

      <form @submit.prevent="verify">
        <label for="answer">Your Answer *</label>
        <input
          id="answer"
          v-model="verificationAnswer"
          placeholder="Enter your full name"
          required
          autocomplete="off"
        />

        <p v-if="verificationError" class="error" role="alert">
          {{ verificationError }}
        </p>

        <div class="actions">
          <button
            type="button"
            class="secondary"
            @click="emit('cancel')"
          >
            Cancel
          </button>

          <button type="submit">
            Verify
          </button>
        </div>
      </form>
    </div>

    <!-- Add Book Form -->
    <div v-else>
      <p class="eyebrow">THE PRIVATE LIBRARY</p>
      <h2>Add a New Volume</h2>
      <p class="subtitle">
        Add a finished book to your collection. Book contents cannot be edited here.
      </p>

      <form @submit.prevent="addBook">
      <label for="title">Book Title *</label>
      <input
        id="title"
        v-model="title"
        placeholder="e.g. Pride and Prejudice"
        required
      />

      <label for="author">Author *</label>
      <input
        id="author"
        v-model="author"
        placeholder="e.g. Jane Austen"
        required
      />

      <label for="description">Description</label>
      <textarea
        id="description"
        v-model="description"
        placeholder="A few words about this volume..."
        rows="4"
      />

      <label for="cover">Cover Image</label>
      <input
        id="cover"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        @change="handleFileChange"
      />
      <p class="hint">JPG, PNG or WebP · Maximum 5 MB</p>

      <label for="book-file">Completed Book File *</label>
      <input
        id="book-file"
        type="file"
        accept=".pdf,.epub,application/pdf,application/epub+zip"
        required
        @change="handleBookFileChange"
      />
      <p class="hint">PDF or EPUB · Maximum 50 MB · Uploaded as a finished, read-only book</p>

      <p v-if="errorMessage" class="error" role="alert">
        {{ errorMessage }}
      </p>

      <div class="actions">
        <button
          type="button"
          class="secondary"
          @click="emit('cancel')"
        >
          Cancel
        </button>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Saving...' : 'Add to Library' }}
        </button>
      </div>
    </form>
    </div>
  </section>
</template>

<style scoped>
.book-form {
  max-width: 620px;
  margin: 32px auto;
  padding: 38px;
  background: #f8f5ed;
  color: #26382d;
  border: 1px solid #d9cfb9;
  border-radius: 4px;
  box-shadow: 0 12px 35px rgb(42 52 40 / 8%);
}

.eyebrow {
  color: #8b7547;
  font-size: 11px;
  letter-spacing: 3px;
  font-weight: 700;
}

h2 {
  margin: 12px 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(26px, 4vw, 34px);
  font-weight: 400;
}

.subtitle {
  color: #777568;
  font-family: Georgia, serif;
  margin-bottom: 28px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

label {
  margin-top: 12px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.4px;
}

input,
textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  border: 1px solid #d8d0bf;
  border-radius: 2px;
  background: #fffdf8;
  color: #26382d;
  font: inherit;
}

input:focus,
textarea:focus {
  outline: 2px solid #8a987e;
  outline-offset: 1px;
}

textarea {
  resize: vertical;
}

.hint {
  color: #777568;
  font-size: 12px;
  margin: 0;
}

.actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

button {
  padding: 12px 19px;
  background: #294333;
  color: #fffdf8;
  border: 1px solid #294333;
  border-radius: 2px;
  cursor: pointer;
  font: inherit;
  transition: background 0.2s;
}

button:hover:not(:disabled) {
  background: #3d5a45;
}

button:disabled {
  opacity: 0.6;
  cursor: wait;
}

button.secondary {
  background: transparent;
  color: #294333;
}

button.secondary:hover {
  background: #ebe6d9;
}

.error {
  color: #a12e28;
  font-size: 13px;
  overflow-wrap: anywhere;
}

@media (max-width: 480px) {
  .book-form {
    padding: 22px;
    margin: 16px auto;
  }
}
</style>
