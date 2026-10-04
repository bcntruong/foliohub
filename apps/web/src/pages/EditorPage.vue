<script setup lang="ts">
import {
  contactEmailSchema,
  type Portfolio,
  type PortfolioDraft,
  websiteUrlSchema,
} from '@foliohub/contracts'
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import LinksEditor from '../components/LinksEditor.vue'
import AvatarCropEditor from '../components/AvatarCropEditor.vue'
import PortfolioTemplate from '../components/PortfolioTemplate.vue'
import RepeatableSection from '../components/RepeatableSection.vue'
import { apiRequest, mediaUrl } from '../composables/api'
import { portfolioApi } from '../composables/portfolios'

const route = useRoute()
const router = useRouter()
const portfolio = ref<Portfolio | null>(null)
const draft = ref<PortfolioDraft | null>(null)
const skillsText = ref('')
const activeView = ref<'edit' | 'preview'>('edit')
const loading = ref(true)
const saving = ref(false)
const uploading = ref(false)
const avatarFileName = ref('')
const notice = ref('')
const error = ref('')
const copied = ref(false)
const editorForm = ref<HTMLFormElement | null>(null)
const contactEmailInput = ref<HTMLInputElement | null>(null)
const websiteInput = ref<HTMLInputElement | null>(null)
const contactErrors = reactive({ email: '', website: '' })
let pendingSave: Promise<boolean> | null = null

const themes = [
  { key: 'cosmic-cyan', name: 'Cosmic Cyan', description: 'Sâu, công nghệ và sắc nét' },
  { key: 'solar-orange', name: 'Solar Orange', description: 'Ấm áp, táo bạo và giàu năng lượng' },
  { key: 'nebula-violet', name: 'Nebula Violet', description: 'Sáng tạo, huyền bí và giàu chiều sâu' },
  { key: 'paper-blue', name: 'Paper Blue', description: 'Sáng, chỉn chu và chuyên nghiệp' },
  { key: 'mint-studio', name: 'Mint Studio', description: 'Tươi mới, thân thiện và hiện đại' },
] as const

const preview = computed<Portfolio | null>(() => {
  if (!portfolio.value || !draft.value) return null
  return { ...portfolio.value, ...draft.value }
})

const publicUrl = computed(() =>
  `${window.location.origin}/u/${portfolio.value?.username ?? ''}/${draft.value?.slug ?? ''}`,
)

function toDraft(value: Portfolio): PortfolioDraft {
  return {
    slug: value.slug,
    displayName: value.displayName,
    headline: value.headline,
    summary: value.summary,
    strengths: value.strengths,
    location: value.location,
    contactEmail: value.contactEmail,
    phone: value.phone,
    websiteUrl: value.websiteUrl,
    visibility: value.visibility,
    templateKey: value.templateKey,
    themeKey: value.themeKey,
    avatarPositionX: value.avatarPositionX,
    avatarPositionY: value.avatarPositionY,
    skills: [...value.skills],
    experiences: value.experiences.map((item) => ({ ...item })),
    educations: value.educations.map((item) => ({ ...item })),
    projects: value.projects.map((item) => ({ ...item })),
    links: value.links.map((item) => ({ ...item })),
  }
}

async function copyPublicLink() {
  await navigator.clipboard.writeText(publicUrl.value)
  copied.value = true
  window.setTimeout(() => { copied.value = false }, 1800)
}

async function load() {
  try {
    portfolio.value = (await portfolioApi.get(String(route.params.id))).portfolio
    draft.value = toDraft(portfolio.value)
    skillsText.value = draft.value.skills.join(', ')
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Không thể tải portfolio'
  } finally {
    loading.value = false
  }
}

async function persistChanges() {
  if (!draft.value) return false
  notice.value = ''
  error.value = ''
  saving.value = true
  draft.value.skills = skillsText.value.split(',').map((item) => item.trim()).filter(Boolean)
  try {
    portfolio.value = (await portfolioApi.update(String(route.params.id), draft.value)).portfolio
    draft.value = toDraft(portfolio.value)
    notice.value = portfolio.value.visibility === 'public' ? 'Đã lưu và xuất bản.' : 'Đã lưu bản riêng tư.'
    return true
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Không thể lưu thay đổi'
    return false
  } finally {
    saving.value = false
  }
}

function schemaError(result: ReturnType<typeof contactEmailSchema.safeParse>) {
  return result.success ? '' : result.error.issues[0]?.message ?? 'Giá trị không hợp lệ'
}

async function validateContactInfo() {
  if (!draft.value) return false
  contactErrors.email = schemaError(contactEmailSchema.safeParse(draft.value.contactEmail))
  contactErrors.website = schemaError(websiteUrlSchema.safeParse(draft.value.websiteUrl))
  if (!contactErrors.email && !contactErrors.website) return true

  activeView.value = 'edit'
  error.value = 'Thông tin liên hệ chưa đúng. Vui lòng kiểm tra các trường được đánh dấu.'
  await nextTick()
  ;(contactErrors.email ? contactEmailInput : websiteInput).value?.focus()
  return false
}

function save() {
  if (pendingSave) return pendingSave
  pendingSave = validateContactInfo().then((isValid) => {
    if (!isValid) return false
    if (editorForm.value && !editorForm.value.reportValidity()) return false
    return persistChanges()
  }).finally(() => {
    pendingSave = null
  })
  return pendingSave
}

async function saveAndReturn() {
  if (await save()) await router.push('/dashboard')
}

async function uploadAvatar(event: Event) {
  const input = event.target as HTMLInputElement
  const image = input.files?.[0]
  if (!image || !portfolio.value) return
  uploading.value = true
  error.value = ''
  const body = new FormData()
  body.append('image', image)
  try {
    const result = await apiRequest<{ media: { url: string } }>(
      `/v1/media/portfolio/${portfolio.value.id}/avatar`, { method: 'POST', body },
    )
    portfolio.value.avatarUrl = result.media.url
    if (draft.value) {
      draft.value.avatarPositionX = 50
      draft.value.avatarPositionY = 50
    }
    avatarFileName.value = image.name
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'Không thể tải ảnh'
  } finally {
    uploading.value = false
    input.value = ''
  }
}

onMounted(load)
onBeforeRouteLeave(async () => {
  if (pendingSave) await pendingSave
})
</script>

<template>
  <section class="editor-page">
    <div
      v-if="loading"
      class="empty-state shell"
    >
      Đang mở bản nháp…
    </div>
    <div
      v-else-if="error && !draft"
      class="empty-state shell"
    >
      <h1>Không mở được portfolio</h1><p>{{ error }}</p>
    </div>
    <template v-else-if="draft && portfolio">
      <header class="editor-toolbar">
        <button
          class="text-link editor-back-button"
          type="button"
          :disabled="saving"
          @click="saveAndReturn"
        >
          ← Portfolio của tôi
        </button>
        <div
          class="view-switch"
          aria-label="Chế độ xem"
        >
          <button
            type="button"
            :class="{ active: activeView === 'edit' }"
            :disabled="saving"
            @click="activeView = 'edit'"
          >
            Chỉnh sửa
          </button>
          <button
            type="button"
            :class="{ active: activeView === 'preview' }"
            :disabled="saving"
            @click="activeView = 'preview'"
          >
            Xem trước
          </button>
        </div>
        <button
          class="button button-small"
          type="button"
          :disabled="saving"
          @click="save"
        >
          {{ saving ? 'Đang lưu…' : 'Lưu thay đổi' }}
        </button>
      </header>

      <form
        v-if="activeView === 'edit'"
        ref="editorForm"
        class="editor-form"
        @submit.prevent="save"
      >
        <div class="editor-status">
          <p
            v-if="notice"
            class="form-success"
            role="status"
          >
            {{ notice }}
          </p>
          <p
            v-if="error"
            class="form-error"
            role="alert"
          >
            {{ error }}
          </p>
          <label class="visibility-toggle"><span>Trạng thái chia sẻ</span><select v-model="draft.visibility"><option value="private">Riêng tư — chỉ mình tôi</option><option value="public">Công khai — ai có link đều xem được</option></select></label>
          <div class="share-link">
            <span>{{ publicUrl }}</span>
            <button
              v-if="draft.visibility === 'public'"
              class="text-button"
              type="button"
              @click="copyPublicLink"
            >
              {{ copied ? 'Đã sao chép ✓' : 'Sao chép link' }}
            </button>
          </div>
        </div>

        <section class="editor-section theme-section">
          <p class="eyebrow">
            Giao diện portfolio
          </p>
          <h2>Chọn không khí bạn muốn tạo ra</h2>
          <p class="section-copy">
            Bạn có thể đổi theme và xem trước trước khi chuyển sang công khai.
          </p>
          <div class="theme-picker">
            <label
              v-for="theme in themes"
              :key="theme.key"
              class="theme-option"
              :class="[`theme-${theme.key}`, { selected: draft.themeKey === theme.key }]"
            >
              <input
                v-model="draft.themeKey"
                type="radio"
                name="portfolio-theme"
                :value="theme.key"
              >
              <span
                class="theme-orbit"
                aria-hidden="true"
              />
              <strong>{{ theme.name }}</strong>
              <small>{{ theme.description }}</small>
            </label>
          </div>
          <button
            class="text-button preview-theme-button"
            type="button"
            @click="activeView = 'preview'"
          >
            Xem trước theme này →
          </button>
        </section>

        <section class="editor-section">
          <p class="eyebrow">
            Thông tin chính
          </p>
          <h2>Ấn tượng đầu tiên</h2>
          <div class="form-grid">
            <label>Tên hiển thị<input
              v-model="draft.displayName"
              required
            ></label>
            <label>Đường dẫn<input
              v-model="draft.slug"
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            ></label>
            <label class="span-two">Headline<input
              v-model="draft.headline"
              placeholder="Product Designer tạo trải nghiệm dễ dùng"
            ></label>
            <label class="span-two">Giới thiệu<textarea
              v-model="draft.summary"
              rows="6"
              placeholder="Bạn là ai, làm tốt điều gì và đang tìm kiếm cơ hội nào?"
            /></label>
          </div>
        </section>

        <section class="editor-section">
          <h2>Ảnh và liên hệ</h2>
          <div class="avatar-upload-row">
            <AvatarCropEditor
              v-if="portfolio.avatarUrl"
              :image-url="mediaUrl(portfolio.avatarUrl) ?? ''"
              :display-name="draft.displayName"
              :position-x="draft.avatarPositionX"
              :position-y="draft.avatarPositionY"
              @update:position-x="draft.avatarPositionX = $event"
              @update:position-y="draft.avatarPositionY = $event"
            />
            <label class="upload-box">
              <strong>{{ uploading ? 'Đang tải ảnh…' : portfolio.avatarUrl ? 'Thay ảnh đại diện' : 'Chọn ảnh đại diện' }}</strong>
              <span v-if="avatarFileName">Đã tải: {{ avatarFileName }}</span>
              <span v-else-if="portfolio.avatarUrl">Ảnh đang hiển thị bên cạnh. Chọn ảnh khác để thay thế.</span>
              <span v-else>JPEG, PNG hoặc WebP — tối đa 5 MB</span>
              <input
                class="upload-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                :disabled="uploading"
                @change="uploadAvatar"
              >
            </label>
          </div>
          <div class="form-grid">
            <label>Địa điểm<input v-model="draft.location"></label>
            <label>Email liên hệ<input
              ref="contactEmailInput"
              v-model="draft.contactEmail"
              type="email"
              :aria-invalid="Boolean(contactErrors.email)"
              aria-describedby="contact-email-error"
              @input="contactErrors.email = ''"
            ><span
              v-if="contactErrors.email"
              id="contact-email-error"
              class="field-error"
            >{{ contactErrors.email }}</span></label>
            <label>Số điện thoại<input v-model="draft.phone"></label>
            <label>Website<input
              ref="websiteInput"
              v-model="draft.websiteUrl"
              type="text"
              inputmode="url"
              placeholder="example.com hoặc https://example.com"
              :aria-invalid="Boolean(contactErrors.website)"
              aria-describedby="website-error"
              @input="contactErrors.website = ''"
            ><span
              v-if="contactErrors.website"
              id="website-error"
              class="field-error"
            >{{ contactErrors.website }}</span></label>
            <label class="span-two">Kỹ năng, cách nhau bằng dấu phẩy<input
              v-model="skillsText"
              placeholder="Vue.js, UI Design, Research"
            ></label>
            <label class="span-two">Năng lực nổi bật
              <span class="field-hint">Mỗi dòng là một năng lực</span>
              <textarea
                v-model="draft.strengths"
                rows="6"
                placeholder="Chịu được áp lực cao&#10;Khả năng giải quyết vấn đề&#10;Phân tích chuyên sâu, tỉ mỉ"
              />
            </label>
          </div>
        </section>

        <RepeatableSection
          v-model="draft.experiences"
          kind="experience"
        />
        <RepeatableSection
          v-model="draft.projects"
          kind="project"
        />
        <RepeatableSection
          v-model="draft.educations"
          kind="education"
        />
        <LinksEditor v-model="draft.links" />
        <button
          class="button editor-save"
          type="submit"
          :disabled="saving"
        >
          {{ saving ? 'Đang lưu…' : 'Lưu portfolio' }}
        </button>
      </form>

      <div
        v-else
        class="preview-stage"
      >
        <PortfolioTemplate
          v-if="preview"
          :portfolio="preview"
        />
      </div>
    </template>
  </section>
</template>
