<script setup lang="ts">
const senders = [
    { label: 'Direksi Perum LPPNPI', value: 'direksi', image: 'https://ui-avatars.com/api/?name=Direksi+Perum+LPPNPI&background=random' },
    { label: 'Para Executive Vice President', value: 'evp', image: 'https://ui-avatars.com/api/?name=EVP&background=random' },
    { label: 'Azizatun Azhimah', value: 'azizah', image: 'https://ui-avatars.com/api/?name=Azizatun+Azhimah&background=random' },
    { label: 'Setio Anggoro', value: 'setio', image: 'https://ui-avatars.com/api/?name=Setio+Anggoro&background=random' }
]
const senders_selected = ref('')

const date = ref(new Date())

// Computed untuk selected sender
const selectedSender = computed(() =>
    senders.find(s => s.value === senders_selected.value)
)

const items = ref([
    {
        type: 'label',
        label: 'Grup Tertuju'
    },
    {
        label: 'Direksi Perum LPPNPI',
        value: 'direksi',
        image: 'https://ui-avatars.com/api/?name=Direksi+Perum+LPPNPI&size=128&rounded=true&background=random'
    },
    {
        label: 'Para Executive Vice President',
        value: 'evp',
        image: 'https://ui-avatars.com/api/?name=Executive+Vice+President&size=128&rounded=true&background=random'
    },

    { type: 'separator' },

    {
        type: 'label',
        label: 'Tertuju'
    },
    {
        label: 'PT / PH - (-) Ketua Dewan Pengawas Kantor Pusat',
        value: 'ketua',
        image: 'https://ui-avatars.com/api/?name=Ketua+Dewan+Pengawas&size=128&rounded=true&background=random'
    },
    {
        label: 'Avirianto Suratno - (U) Direktur Utama Kantor Pusat',
        value: 'avirianto',
        image: 'https://ui-avatars.com/api/?name=Avirianto+Suratno&size=128&rounded=true&background=random'
    },
    {
        label: 'Azizatun Azhimah - (K) Direktur Keuangan dan Manajemen Risiko Kantor Pusat',
        value: 'azizah',
        image: 'https://ui-avatars.com/api/?name=Azizatun+Azhimah&size=128&rounded=true&background=random'
    },
    {
        label: 'Setio Anggoro - (O) Direktur Operasi Kantor Pusat',
        value: 'setio',
        image: 'https://ui-avatars.com/api/?name=Setio+Anggoro&size=128&rounded=true&background=random'
    }
]);

const selected = ref([])

function isItemSelected(item: any) {
    return selected.value.some(s => s.value === item.value)
}

function removeItem(item: any, event: Event) {
    event.stopPropagation()
    const index = selected.value.findIndex(i => i.value === item.value)
    if (index > -1) {
        selected.value.splice(index, 1)
    }
}

import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
// import Placeholder from '@tiptap/extension-placeholder'

// State untuk Fullscreen & Header/Footer
const isFullscreen = ref(false)
const headerContent = ref('')
const footerContent = ref('')

// Inisialisasi Tiptap Editor
const editor = useEditor({
    content: '<p>Mulai menulis dokumen anda disini...</p>',
    extensions: [
        StarterKit,
        Underline,
        TextAlign.configure({
            types: ['heading', 'paragraph'],
        }),
    ],
    editorProps: {
        attributes: {
            class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none min-h-[500px]',
        },
    },
})

// Toggle Fullscreen
const toggleFullscreen = () => {
    isFullscreen.value = !isFullscreen.value
}

// Clean up saat component destroyed
onBeforeUnmount(() => {
    editor.value?.destroy()
})

const isTemplateModalOpen = ref(false)
const templates = [
    {
        id: 1,
        name: 'Default',
        content: `
            <ol>
            <li>Lorem ipsum dolor sit amet...</li>
            <li>Lorem ipsum dolor sit amet...</li>
            <li>Lorem ipsum dolor sit amet...</li>
            </ol>
            `
    },
    {
        id: 2,
        name: 'Numbering With Child',
        content: `
            <ol>
            <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                <ol type="a">
                <li>Satu</li>
                <li>Dua</li>
                <li>Tiga</li>
                </ol>
            </li>
            </ol>
            `
    },

]
const applyTemplate = (template: any) => {
    editor.value?.commands.setContent(template.content)
    isTemplateModalOpen.value = false
}
</script>

<template>
    <div class="min-h-screen w-full flex flex-col bg-white overflow-hidden rounded-xl shadow-lg border-gray-100">

        
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h1 class="text-xl font-semibold text-gray-900">Tulis Konsep</h1>
            <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" />
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-4 space-y-1">

            <div class="flex items-center justify-between py-2 border-b border-gray-200 group">
                <div class="flex items-center w-full">
                    <span class="w-30 text-sm text-gray-500 font-medium shrink-0">Pesan</span>
                    <input type="text" class="flex-1 outline-none text-gray-900 py-1 bg-transparent text-sm"
                        placeholder="Ketik pesan" />
                </div>
            </div>

            <div class="flex items-start py-2 border-b border-gray-200">
                <span class="w-30 text-sm mt-1.5 text-gray-500 font-medium shrink-0">Pengirim</span>
                <div class="flex flex-wrap gap-1 w-full items-center">
                    <USelectMenu v-model="senders_selected" :items="senders" value-key="value"
                        placeholder="Pilih Pengirim" variant="none" class="w-full" :ui="{
                            base: '!px-0 !bg-transparent',
                            ring: 'ring-0',
                            shadow: 'shadow-none',
                        }">
                        <!-- Item dropdown -->
                        <template #item="{ item }">
                            <div class="flex items-center gap-3 w-full py-1">
                                <span class="truncate text-sm">{{ item.label }}</span>
                            </div>
                        </template>

                        <template #default>
                            <span v-if="selectedSender" class="truncate text-sm">
                                {{ selectedSender.label }}
                            </span>
                            <span v-else class="text-gray-400 text-sm">
                                Pilih Pengirim
                            </span>
                        </template>
                    </USelectMenu>
                </div>
            </div>

            <div class="flex items-start py-2 border-b border-gray-200 relative">
                <span class="w-30 text-sm mt-1.5 text-gray-500 font-medium shrink-0">Tanggal Surat</span>

                <div class="relative w-full">
                    <!-- Placeholder palsu -->
                    <span v-if="!date"
                        class="absolute inset-y-0 left-0 flex items-center text-sm text-gray-400 pointer-events-none">
                        Tanggal Surat
                    </span>

                    <!-- Input date -->
                    <input type="date" v-model="date" class="w-full h-8 bg-transparent text-sm outline-none text-gray-900 font-medium
                        [&::-webkit-calendar-picker-indicator]:opacity-70
                        hover:[&::-webkit-calendar-picker-indicator]:opacity-100
                        relative z-10" />
                </div>
            </div>

            <div class="flex items-start py-2 border-b border-gray-200">
                <span class="w-30 text-sm mt-1.5 text-gray-500 font-medium shrink-0">Tertuju</span>
                <div class="flex flex-wrap gap-1 w-full items-center">
                    <USelectMenu v-model="selected" :items="items" multiple placeholder="Kepada ..." class="w-full p-0"
                        variant="none" :ui="{
                            base: 'bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 transition-colors',
                            wrapper: 'pr-10',         /* ruang untuk chevron */
                            input: 'pr-10',           /* ruang saat fokus/trigger */
                            value: 'p-0',
                            trigger: { base: 'px-0 py-1' }
                        }">
                        <!-- Custom item dengan checkbox yang berfungsi -->
                        <template #item="{ item, selected: isSel }">
                            <div class="flex items-start gap-3 w-full py-1">
                                <!-- Checkbox -->
                                <UCheckbox :model-value="isItemSelected(item)" class="pointer-events-none shrink-0"
                                    :checked="isItemSelected(item)" />

                                <!-- Image lingkaran -->
                                <img v-if="item.image" :src="item.image" :alt="item.label"
                                    class="w-7 h-7 rounded-full object-cover shrink-0" />

                                <!-- Label (kiri, truncate, jangan overlap chevron) -->
                                <div class="flex-1 min-w-0">
                                    <!-- min-w-0 agar truncate bekerja dalam flex -->
                                    <span class="block text-sm text-left truncate w-[90%]">
                                        {{ item.label }}
                                    </span>
                                </div>
                            </div>
                        </template>

                        <!-- Badges di dalam input tanpa outline -->
                        <template #default>
                            <div class="flex items-center gap-1.5 flex-wrap min-h-[2.5rem] pr-10">
                                <UBadge v-for="item in selected" :key="item.value" color="primary" variant="soft"
                                    size="md" class="gap-1.5 pl-2 pr-1 flex items-center justify-start rounded-md">
                                    <img v-if="item.image" :src="item.image" :alt="item.label"
                                        class="w-3.5 h-3.5 rounded-full object-cover" />
                                    <!-- teks rata kiri dan truncate agar tidak melebihi chip -->
                                    <span class="text-xs font-medium text-left truncate max-w-[220px]">
                                        {{ item.label }}
                                    </span>

                                    <UButton icon="i-lucide-x" size="2xs" color="gray" variant="ghost" :padded="false"
                                        class="w-4 h-4 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                        @click="removeItem(item, $event)" />
                                </UBadge>

                                <!-- Placeholder -->
                                <span v-if="!selected.length" class="text-sm text-gray-400 dark:text-gray-500">
                                    Pilih tertuju
                                </span>
                            </div>
                        </template>
                    </USelectMenu>

                    <!-- Info counter -->
                    <!-- <div v-if="selected.length" class="text-xs text-gray-500 dark:text-gray-400">
                        {{ selected.length }} tertuju tepilih
                    </div> -->
                </div>
            </div>

            <div class="flex items-start py-2 border-b border-gray-200">
                <span class="w-30 text-sm mt-1.5 text-gray-500 font-medium shrink-0">Tembusan</span>
                <div class="flex flex-wrap gap-1 w-full items-center">
                    <USelectMenu v-model="selected" :items="items" multiple placeholder="Kepada ..." class="w-full p-0"
                        variant="none" :ui="{
                            base: 'bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 transition-colors',
                            wrapper: 'pr-10',         /* ruang untuk chevron */
                            input: 'pr-10',           /* ruang saat fokus/trigger */
                            value: 'p-0',
                            trigger: { base: 'px-0 py-1' }
                        }">
                        <!-- Custom item dengan checkbox yang berfungsi -->
                        <template #item="{ item, selected: isSel }">
                            <div class="flex items-start gap-3 w-full py-1">
                                <!-- Checkbox -->
                                <UCheckbox :model-value="isItemSelected(item)" class="pointer-events-none shrink-0"
                                    :checked="isItemSelected(item)" />

                                <!-- Image lingkaran -->
                                <img v-if="item.image" :src="item.image" :alt="item.label"
                                    class="w-7 h-7 rounded-full object-cover shrink-0" />

                                <!-- Label (kiri, truncate, jangan overlap chevron) -->
                                <div class="flex-1 min-w-0">
                                    <!-- min-w-0 agar truncate bekerja dalam flex -->
                                    <span class="block text-sm text-left truncate w-[90%]">
                                        {{ item.label }}
                                    </span>
                                </div>
                            </div>
                        </template>

                        <!-- Badges di dalam input tanpa outline -->
                        <template #default>
                            <div class="flex items-center gap-1.5 flex-wrap min-h-[2.5rem] pr-10">
                                <UBadge v-for="item in selected" :key="item.value" color="primary" variant="soft"
                                    size="md" class="gap-1.5 pl-2 pr-1 flex items-center justify-start rounded-md">
                                    <img v-if="item.image" :src="item.image" :alt="item.label"
                                        class="w-3.5 h-3.5 rounded-full object-cover" />
                                    <!-- teks rata kiri dan truncate agar tidak melebihi chip -->
                                    <span class="text-xs font-medium text-left truncate max-w-[220px]">
                                        {{ item.label }}
                                    </span>

                                    <UButton icon="i-lucide-x" size="2xs" color="gray" variant="ghost" :padded="false"
                                        class="w-4 h-4 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                        @click="removeItem(item, $event)" />
                                </UBadge>

                                <!-- Placeholder -->
                                <span v-if="!selected.length" class="text-sm text-gray-400 dark:text-gray-500">
                                    Pilih tembusan
                                </span>
                            </div>
                        </template>
                    </USelectMenu>

                    <!-- Info counter -->
                    <!-- <div v-if="selected.length" class="text-xs text-gray-500 dark:text-gray-400">
                        {{ selected.length }} tertuju tepilih
                    </div> -->
                </div>
            </div>


            <div class="flex items-center justify-between py-2 border-b border-gray-200 group">
                <div class="flex items-center w-full">
                    <span class="w-30 text-sm text-gray-500 font-medium shrink-0">Perihal</span>
                    <input type="text" class="flex-1 outline-none text-gray-900 py-1 bg-transparent text-sm"
                        placeholder="Ketik perihal" />
                </div>
            </div>

            <div class="relative py-4">
                <div class="flex gap-2 mb-5">
                    <UModal title="Pilih Template">
                        <UButton label="Pilih Template" color="primary" icon="i-heroicons-adjustments-horizontal"
                            class="text-white px-6 hover:bg-primary-600 font-medium" />
                        <template #body>
                            <UCard v-for="template in templates" :key="template.id"
                                class="cursor-pointer hover:bg-gray-50" @click="applyTemplate(template)">
                                <div @click="isTemplateModalOpen = false">
                                    <h3 class="font-bold">{{ template.name }}</h3>
                                    <p class="text-sm text-gray-500 line-clamp-3">
                                        {{ template.content.replace(/<[^>]*>?/gm, '') }}
                                    </p>
                                </div>
                            </UCard>
                        </template>
                    </UModal>

                    <UButton label="Template Saya" color="primary" icon="i-heroicons-rectangle-stack"
                        class="text-white px-6 hover:bg-primary-600 font-medium" />

                    <!-- BUTTON KANAN SENDIRI -->
                    <UButton label="Simpan Template" color="primary" icon="i-heroicons-check-circle"
                        class="text-white px-6 hover:bg-primary-600 font-medium ml-auto" />
                </div>

                <div class="relative transition-all duration-300 ease-in-out flex flex-col border border-neutral-200 border-radius-lg"
                    :class="isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen border-none' : 'min-h-[600px] h-[800px]'">

                    <div class="sticky top-0 z-10 bg-white px-4 py-2 flex items-center justify-between shadow-sm">

                        <div class="flex items-center gap-1 flex-wrap" v-if="editor">
                            <div class="flex items-center gap-1 border-r pr-2 mr-2 border-gray-300">
                                <UButton @click="editor.chain().focus().toggleBold().run()"
                                    :color="editor.isActive('bold') ? 'primary' : 'gray'" variant="ghost"
                                    icon="i-heroicons-bold" size="xs" />
                                <UButton @click="editor.chain().focus().toggleItalic().run()"
                                    :color="editor.isActive('italic') ? 'primary' : 'gray'" variant="ghost"
                                    icon="i-heroicons-italic" size="xs" />
                                <UButton @click="editor.chain().focus().toggleUnderline().run()"
                                    :color="editor.isActive('underline') ? 'primary' : 'gray'" variant="ghost"
                                    icon="i-heroicons-underline" size="xs" />
                                <UButton @click="editor.chain().focus().toggleStrike().run()"
                                    :color="editor.isActive('strike') ? 'primary' : 'gray'" variant="ghost"
                                    icon="i-heroicons-strikethrough" size="xs" />
                            </div>

                            <div class="flex items-center gap-1 border-r pr-2 mr-2 border-gray-300">
                                <UButton @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
                                    :color="editor.isActive('heading', { level: 1 }) ? 'primary' : 'gray'"
                                    variant="ghost" label="H1" size="xs" />
                                <UButton @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
                                    :color="editor.isActive('heading', { level: 2 }) ? 'primary' : 'gray'"
                                    variant="ghost" label="H2" size="xs" />
                            </div>

                            <div class="flex items-center gap-1 border-r pr-2 mr-2 border-gray-300">
                                <UButton @click="editor.chain().focus().setTextAlign('left').run()"
                                    :color="editor.isActive({ textAlign: 'left' }) ? 'primary' : 'gray'" variant="ghost"
                                    icon="i-heroicons-bars-3-bottom-left" size="xs" />
                                <UButton @click="editor.chain().focus().setTextAlign('center').run()"
                                    :color="editor.isActive({ textAlign: 'center' }) ? 'primary' : 'gray'"
                                    variant="ghost" icon="i-heroicons-bars-3" size="xs" />
                                <UButton @click="editor.chain().focus().setTextAlign('right').run()"
                                    :color="editor.isActive({ textAlign: 'right' }) ? 'primary' : 'gray'"
                                    variant="ghost" icon="i-heroicons-bars-3-bottom-right" size="xs" />
                            </div>

                            <div class="flex items-center gap-1">
                                <UButton @click="editor.chain().focus().toggleBulletList().run()"
                                    :color="editor.isActive('bulletList') ? 'primary' : 'gray'" variant="ghost"
                                    icon="i-heroicons-list-bullet" size="xs" />
                                <UButton @click="editor.chain().focus().toggleOrderedList().run()"
                                    :color="editor.isActive('orderedList') ? 'primary' : 'gray'" variant="ghost"
                                    icon="i-heroicons-numbered-list" size="xs" />
                            </div>
                        </div>

                        <div class="flex items-center gap-2 pl-2 border-l border-gray-300">
                            <UButton
                                :icon="isFullscreen ? 'i-heroicons-arrows-pointing-in' : 'i-heroicons-arrows-pointing-out'"
                                variant="ghost" color="gray" @click="toggleFullscreen"
                                :title="isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'" />
                        </div>
                    </div>

                    <div class="flex-1 overflow-y-auto bg-gray-100 p-8 flex justify-center w-full">

                        <div
                            class="bg-white shadow-lg w-full max-w-[794px] min-h-[1123px] flex flex-col relative print:w-full print:shadow-none">

                            <div
                                class="px-10 py-4 border-b border-transparent hover:border-gray-200 transition-colors group">
                                <label
                                    class="text-[10px] text-gray-400 font-bold uppercase mb-1 block opacity-0 group-hover:opacity-100 transition-opacity">Header</label>
                                <input v-model="headerContent" type="text" placeholder="Type header here..."
                                    class="w-full border-none outline-none text-gray-500 text-sm bg-transparent focus:ring-0 p-0 placeholder-gray-300" />
                            </div>

                            <div class="flex-1 px-10 py-2 cursor-text" @click="editor?.chain().focus().run()">
                                <EditorContent :editor="editor" />
                            </div>

                            <div
                                class="px-10 py-4 border-t border-transparent hover:border-gray-200 transition-colors mt-auto group">
                                <label
                                    class="text-[10px] text-gray-400 font-bold uppercase mb-1 block opacity-0 group-hover:opacity-100 transition-opacity">Footer</label>
                                <div class="flex justify-between items-center text-gray-500 text-xs">
                                    <input v-model="footerContent" type="text" placeholder="Type footer here..."
                                        class="flex-1 border-none outline-none bg-transparent focus:ring-0 p-0 placeholder-gray-300" />
                                    <span>Page 1</span>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>

            <div class="flex items-center justify-between py-3 border-b border-gray-200">
                <div class="w-full">
                    <UFileUpload multiple position="inside" layout="list" label="Lampiran File"
                        description="PDF, DOCX atau XLSX (max. 10MB)" :ui="{
                            base: 'w-full border-2 border-dashed border-gray-300 rounded-xl px-4 py-6 transition-colors duration-200 hover:border-gray-400 hover:bg-gray-50',
                            inner: 'flex flex-col items-center gap-3',
                            icon: 'w-10 h-10 text-gray-400',
                            label: 'text-gray-700 font-medium',
                            description: 'text-gray-500 text-sm'
                        }" />
                </div>
            </div>


        </div>

        <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
            <!-- <UButton label="Discard" variant="outline" color="gray"
                class="px-4 border-gray-300 text-gray-700 hover:bg-gray-50" /> -->

            <div class="flex items-center gap-3">
                <!-- <div class="flex items-center gap-1 mr-2 text-gray-400">
                    <UButton icon="i-heroicons-bookmark" color="gray" variant="ghost" class="hover:text-gray-600" />
                    <UButton icon="i-heroicons-paper-clip" color="gray" variant="ghost" class="hover:text-gray-600" />
                    <UButton icon="i-heroicons-clock" color="gray" variant="ghost" class="hover:text-gray-600" />
                </div>

                <UButton label="Send later" icon="i-heroicons-calendar" variant="outline" color="gray"
                    class="border-gray-300 text-gray-700 hover:bg-gray-50" /> -->

                <UButton label="Kirim" color="primary" class="text-white px-6 hover:bg-blue-700 text-md font-medium" />
            </div>
        </div>

    </div>
</template>


<style scoped>
/* Simulasi highlight text seperti di gambar saat di-select */
.selection-highlight {
    position: relative;
}

/* Kustomisasi Scrollbar agar tidak merusak estetika fullscreen */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: #f3f4f6;
}

::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
}

/* Style Prose (Konten Editor) agar mirip Docs */
.ProseMirror p {
    margin-top: 0.5em;
    margin-bottom: 0.5em;
    line-height: 1.6;
}

.ProseMirror:focus {
    outline: none;
}
</style>