<script setup lang="ts">
import { type Portfolio, websiteHref } from '@foliohub/contracts'
import { computed } from 'vue'
import AuthenticatedImage from './AuthenticatedImage.vue'

const props = defineProps<{ portfolio: Portfolio }>()

const avatarStyle = computed(() => ({
  objectPosition: `${props.portfolio.avatarPositionX}% ${props.portfolio.avatarPositionY}%`,
}))

const MAX_DESCRIPTION_LEVEL = 2
const DESCRIPTION_LEVEL_BY_MARKER: Record<string, number> = {
  '-': 0,
  '+': 1,
  '*': 2,
  '•': 0,
}

function hasItems(items: Portfolio['experiences']) {
  return items.length > 0
}

function descriptionLines(description: string) {
  return description.split('\n').flatMap((rawLine) => {
    const line = rawLine.replaceAll('\t', '  ')
    const trimmedLine = line.trim()
    const marker = trimmedLine.match(/^[-+*•]/)?.[0]
    const text = trimmedLine.replace(/^[-+*•]\s*/, '')
    if (!text) return []

    const indentation = line.length - line.trimStart().length
    const legacyLevel = Math.min(Math.floor(indentation / 2), MAX_DESCRIPTION_LEVEL)
    const level = indentation > 0 ? legacyLevel : DESCRIPTION_LEVEL_BY_MARKER[marker ?? '-']
    return [{ text, level }]
  })
}

function strengthLines(strengths: string) {
  return strengths
    .split('\n')
    .map((line) => line.trim().replace(/^[-+*•]\s*/, ''))
    .filter(Boolean)
}
</script>

<template>
  <article
    class="portfolio-sheet"
    :class="`portfolio-theme-${portfolio.themeKey}`"
  >
    <header class="portfolio-hero">
      <div>
        <h1>{{ portfolio.displayName }}</h1>
        <p class="portfolio-headline">
          {{ portfolio.headline }}
        </p>
      </div>
      <div
        v-if="portfolio.avatarUrl"
        class="portfolio-avatar-frame"
      >
        <AuthenticatedImage
          class="portfolio-avatar"
          :source="portfolio.avatarUrl"
          :alt="`Ảnh của ${portfolio.displayName}`"
          :style="avatarStyle"
          width="228"
          height="228"
          fetchpriority="high"
        />
      </div>
      <div
        v-else
        class="portfolio-monogram"
        aria-hidden="true"
      >
        {{ portfolio.displayName.charAt(0) }}
      </div>
    </header>

    <div class="portfolio-grid">
      <aside>
        <section v-if="portfolio.location || portfolio.contactEmail || portfolio.phone || portfolio.websiteUrl">
          <h2>Liên hệ</h2>
          <p v-if="portfolio.location">
            {{ portfolio.location }}
          </p>
          <a
            v-if="portfolio.contactEmail"
            :href="`mailto:${portfolio.contactEmail}`"
          >{{ portfolio.contactEmail }}</a>
          <a
            v-if="portfolio.phone"
            :href="`tel:${portfolio.phone}`"
          >{{ portfolio.phone }}</a>
          <a
            v-if="portfolio.websiteUrl"
            :href="websiteHref(portfolio.websiteUrl)"
            target="_blank"
            rel="noreferrer"
          >{{ portfolio.websiteUrl }}</a>
        </section>
        <section v-if="portfolio.skills.length">
          <h2>Kỹ năng</h2>
          <ul class="skill-list">
            <li
              v-for="skill in portfolio.skills"
              :key="skill"
            >
              {{ skill }}
            </li>
          </ul>
        </section>
        <section v-if="portfolio.links.length">
          <h2>Kết nối</h2>
          <a
            v-for="link in portfolio.links"
            :key="link.url"
            :href="link.url"
            target="_blank"
            rel="noreferrer"
          >{{ link.label }} ↗</a>
        </section>
      </aside>

      <div class="portfolio-main">
        <section v-if="portfolio.summary">
          <h2>Giới thiệu</h2><p class="portfolio-summary">
            {{ portfolio.summary }}
          </p>
        </section>
        <section v-if="hasItems(portfolio.educations)">
          <h2>Học vấn</h2>
          <div class="education-list">
            <article
              v-for="item in portfolio.educations"
              :key="item.id ?? item.title"
              class="education-item"
            >
              <div class="education-heading">
                <div>
                  <h3>{{ item.title || item.subtitle }}</h3>
                  <p v-if="item.title">
                    {{ item.subtitle }}
                  </p>
                </div>
                <span>{{ item.startDate }}<template v-if="item.endDate"> — {{ item.endDate }}</template></span>
              </div>
              <ul
                v-if="item.description"
                class="description-list"
              >
                <li
                  v-for="(line, lineIndex) in descriptionLines(item.description)"
                  :key="lineIndex"
                  :class="`description-level-${line.level}`"
                >
                  {{ line.text }}
                </li>
              </ul>
            </article>
          </div>
        </section>
        <section v-if="portfolio.strengths">
          <h2>Năng lực nổi bật</h2>
          <ul class="description-list strengths-list">
            <li
              v-for="(strength, strengthIndex) in strengthLines(portfolio.strengths)"
              :key="strengthIndex"
            >
              {{ strength }}
            </li>
          </ul>
        </section>
        <section v-if="hasItems(portfolio.experiences)">
          <h2>Kinh nghiệm</h2>
          <div
            v-for="item in portfolio.experiences"
            :key="item.id ?? item.title"
            class="timeline-item"
          >
            <div><h3>{{ item.title }}</h3><p>{{ item.subtitle }}</p></div>
            <span>{{ item.startDate }}<template v-if="item.endDate"> — {{ item.endDate }}</template></span>
            <ul
              v-if="item.description"
              class="description-list"
            >
              <li
                v-for="(line, lineIndex) in descriptionLines(item.description)"
                :key="lineIndex"
                :class="`description-level-${line.level}`"
              >
                {{ line.text }}
              </li>
            </ul>
          </div>
        </section>
        <section v-if="hasItems(portfolio.projects)">
          <h2>Dự án</h2>
          <div
            v-for="item in portfolio.projects"
            :key="item.id ?? item.title"
            class="timeline-item"
          >
            <div><h3>{{ item.title }}</h3><p>{{ item.subtitle }}</p></div>
            <a
              v-if="item.url"
              :href="item.url"
              target="_blank"
              rel="noreferrer"
            >Xem dự án ↗</a>
            <ul
              v-if="item.description"
              class="description-list"
            >
              <li
                v-for="(line, lineIndex) in descriptionLines(item.description)"
                :key="lineIndex"
                :class="`description-level-${line.level}`"
              >
                {{ line.text }}
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>

    <footer
      class="portfolio-footer"
      aria-hidden="true"
    />
  </article>
</template>
