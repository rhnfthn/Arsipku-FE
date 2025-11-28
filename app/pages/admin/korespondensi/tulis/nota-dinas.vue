<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'

const senders = [
    { label: 'Direksi Perum LPPNPI', value: 'direksi', image: 'https://ui-avatars.com/api/?name=Direksi+Perum+LPPNPI&background=random' },
    { label: 'Para Executive Vice President', value: 'evp', image: 'https://ui-avatars.com/api/?name=EVP&background=random' },
    { label: 'Azizatun Azhimah', value: 'azizah', image: 'https://ui-avatars.com/api/?name=Azizatun+Azhimah&background=random' },
    { label: 'Setio Anggoro', value: 'setio', image: 'https://ui-avatars.com/api/?name=Setio+Anggoro&background=random' }
]
const senders_selected = ref('')

const date = ref(new Date().toISOString().substr(0, 10))

// Computed untuk selected sender
const selectedSender = computed(() =>
    senders.find(s => s.value === senders_selected.value)
)

const breadcrumbs = [
    { label: 'Dashboard', to: '/user/dashboard' },
    { label: 'Nota Dinas', to: '/admin/korespondensi/tulis/nota-dinas' }
]

const items = ref([
    { type: 'label', label: 'Grup Tertuju' },
    { label: 'Direksi Perum LPPNPI', value: 'direksi', image: 'https://ui-avatars.com/api/?name=Direksi+Perum+LPPNPI&size=128&rounded=true&background=random' },
    { label: 'Para Executive Vice President', value: 'evp', image: 'https://ui-avatars.com/api/?name=Executive+Vice+President&size=128&rounded=true&background=random' },
    { type: 'separator' },
    { type: 'label', label: 'Tertuju' },
    { label: 'PT / PH - (-) Ketua Dewan Pengawas Kantor Pusat', value: 'ketua', image: 'https://ui-avatars.com/api/?name=Ketua+Dewan+Pengawas&size=128&rounded=true&background=random' },
    { label: 'Avirianto Suratno - (U) Direktur Utama Kantor Pusat', value: 'avirianto', image: 'https://ui-avatars.com/api/?name=Avirianto+Suratno&size=128&rounded=true&background=random' },
    { label: 'Azizatun Azhimah - (K) Direktur Keuangan dan Manajemen Risiko Kantor Pusat', value: 'azizah', image: 'https://ui-avatars.com/api/?name=Azizatun+Azhimah&size=128&rounded=true&background=random' },
    { label: 'Setio Anggoro - (O) Direktur Operasi Kantor Pusat', value: 'setio', image: 'https://ui-avatars.com/api/?name=Setio+Anggoro&size=128&rounded=true&background=random' }
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
import TextStyle from '@tiptap/extension-text-style'

// State untuk Fullscreen & Header/Footer
const isFullscreen = ref(false)
const headerContent = ref('')
const footerContent = ref('')

const textStyleItems = computed(() => [
    [{
        label: 'Normal Text',
        icon: 'i-heroicons-bars-3',
        click: () => editor.value?.chain().focus().setParagraph().run()
    }],
    [{
        label: 'Heading 1',
        icon: 'i-heroicons-h1',
        click: () => editor.value?.chain().focus().toggleHeading({ level: 1 }).run()
    }, {
        label: 'Heading 2',
        icon: 'i-heroicons-h2',
        click: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run()
    }, {
        label: 'Heading 3',
        icon: 'i-heroicons-h3',
        click: () => editor.value?.chain().focus().toggleHeading({ level: 3 }).run()
    }]
])

const currentTextStyleLabel = computed(() => {
    if (!editor.value) return 'Normal'
    if (editor.value.isActive('heading', { level: 1 })) return 'Heading 1'
    if (editor.value.isActive('heading', { level: 2 })) return 'Heading 2'
    if (editor.value.isActive('heading', { level: 3 })) return 'Heading 3'
    return 'Normal'
})

// Data Default Header (Bisa diedit user via v-model)
const headerData = ref({
    logo: 'https://airnav-event.vercel.app/airnav-logo-notext.png',
    title: 'AirNav Indonesia',
    address: `Kantor Pusat Perum LPPNPI
Gedung AirNav Indonesia
Jl. Ir. H. Juanda No. 1 Tangerang
Banten 15121 Indonesia
Telp : 021-55915000
www.airnavindonesia.co.id`
})

// Data Default Footer
const footerData = ref('Dokumen ini telah ditandatangani secara elektronik menggunakan sertifikat elektronik\nyang diterbitkan oleh Balai Sertifikasi Elektronik (BSrE), Badan Siber dan Sandi Negara')
// Inisialisasi Tiptap Editor
const editor = useEditor({
    content: `
    <p>Mulai menulis dokumen anda disini...</p>
    <ul>
        <li>Contoh list dot 1</li>
        <li>Contoh list dot 2</li>
    </ul>
    <ol>
        <li>Contoh numbering 1</li>
        <li>Contoh numbering 2</li>
    </ol>
    `,
    extensions: [
        StarterKit,
        Underline,
        TextAlign.configure({
            types: ['heading', 'paragraph'],
            alignments: ['left', 'center', 'right', 'justify'],
        }),
    ],
    editorProps: {
        attributes: {
            class: 'focus:outline-none min-h-[300px] px-8 py-4', // Padding dipindah ke inner editor
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
function htmlListToPreview(html) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")

    function getDirectText(li) {
        for (const node of li.childNodes) {
            if (node.nodeType === 3 && node.textContent.trim()) {
                return node.textContent.trim()
            }
        }
        return ''
    }

    function processList(ol, prefix = '') {
        let result = ''
        const type = ol.getAttribute('type') || '1'
        const items = ol.children

        for (let i = 0; i < items.length; i++) {
            const li = items[i]

            let marker = ''
            if (type === '1') marker = `${i + 1}. `
            else if (type === 'a') marker = `${String.fromCharCode(97 + i)}. `

            const text = getDirectText(li)
            result += prefix + marker + text + '\n'

            const childOl = li.querySelector(':scope > ol')
            if (childOl) {
                result += processList(childOl, prefix + '   ')
            }
        }

        return result
    }

    const firstOl = doc.querySelector('ol')
    if (!firstOl) return ''

    return processList(firstOl).trim()
}

const isTemplateModalOpen = ref(false)
const templates = [
    {
        id: 1,
        name: 'Default',
        preview: `1. Lorem ipsum dolor sit amet...\n2. Lorem ipsum...\n3. Lorem ipsum...`,
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
                <li>Lorem ipsum dolor sit amet...
                <ol type="a">
                    <li>Satu</li>
                    <li>Dua</li>
                    <li>Tiga</li>
                </ol>
                </li>
                <li>Lorem ipsum dolor sit amet...
                <ol type="a">
                    <li>Satu</li>
                    <li>Dua</li>
                    <li>Tiga</li>
                </ol>
                </li>
            </ol>
            `,
        get preview() {
            return htmlListToPreview(this.content)
        }
    },

]
const applyTemplate = (template: any) => {
    editor.value?.commands.setContent(template.content)
    isTemplateModalOpen.value = false
}


</script>

<template>
    <div class="space-y-6 w-full max-w-[100vw] overflow-x-hidden">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <PageHeader title="Nota Dinas" :items="breadcrumbs" />
        </div>
    </div>

    <div class="min-h-screen w-full flex flex-col bg-white overflow-hidden rounded-xl shadow-lg border-gray-100 mt-4">

        <div class="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-1">

            <div
                class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 group gap-1 sm:gap-0">
                <div class="flex flex-col sm:flex-row sm:items-center w-full">
                    <span class="w-full sm:w-32 text-sm text-gray-500 font-medium shrink-0">Pesan</span>
                    <input type="text" class="flex-1 outline-none text-gray-900 py-1 bg-transparent text-sm w-full"
                        placeholder="Ketik pesan" />
                </div>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 gap-1 sm:gap-0">
                <span class="w-full sm:w-32 text-sm mt-0 sm:mt-1.5 text-gray-500 font-medium shrink-0">Pengirim</span>
                <div class="flex flex-wrap gap-1 w-full items-center">
                    <USelectMenu v-model="senders_selected" :items="senders" value-key="value"
                        placeholder="Pilih Pengirim" variant="none" class="w-full" :ui="{
                            base: '!px-0 !bg-transparent w-full',
                            ring: 'ring-0',
                            shadow: 'shadow-none',
                        }">
                        <template #item="{ item }">
                            <div class="flex items-center gap-3 w-full py-1 overflow-hidden">
                                <span class="truncate text-sm">{{ item.label }}</span>
                            </div>
                        </template>

                        <template #default>
                            <span v-if="selectedSender" class="truncate text-sm block w-full text-left">
                                {{ selectedSender.label }}
                            </span>
                            <span v-else class="text-gray-400 text-sm block w-full text-left">
                                Pilih Pengirim
                            </span>
                        </template>
                    </USelectMenu>
                </div>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 relative gap-1 sm:gap-0">
                <span class="w-full sm:w-32 text-sm mt-0 sm:mt-1.5 text-gray-500 font-medium shrink-0">Tanggal
                    Surat</span>

                <div class="relative w-full">
                    <span v-if="!date || !date.value"
                        class="absolute inset-y-0 left-0 flex items-center text-sm text-gray-400 pointer-events-none">
                        Tanggal Surat
                    </span>

                    <input type="date" v-model="date" class="w-full h-8 bg-transparent text-sm outline-none text-gray-900 font-medium
                        [&::-webkit-calendar-picker-indicator]:opacity-70
                        hover:[&::-webkit-calendar-picker-indicator]:opacity-100
                        relative z-10" />
                </div>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 gap-1 sm:gap-0">
                <span class="w-full sm:w-32 text-sm mt-0 sm:mt-1.5 text-gray-500 font-medium shrink-0">Tertuju</span>
                <div class="flex flex-wrap gap-1 w-full items-center">
                    <USelectMenu v-model="selected" :items="items" multiple placeholder="Kepada ..." class="w-full p-0"
                        variant="none" :ui="{
                            base: 'bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 transition-colors w-full',
                            wrapper: 'pr-10 w-full',
                            input: 'pr-10 w-full',
                            value: 'p-0 w-full',
                            trigger: { base: 'px-0 py-1 w-full' }
                        }">
                        <template #item="{ item, selected: isSel }">
                            <div class="flex items-start gap-3 w-full py-1 overflow-hidden">
                                <UCheckbox :model-value="isItemSelected(item)" class="pointer-events-none shrink-0"
                                    :checked="isItemSelected(item)" />
                                <img v-if="item.image" :src="item.image" :alt="item.label"
                                    class="w-7 h-7 rounded-full object-cover shrink-0" />
                                <div class="flex-1 min-w-0">
                                    <span class="block text-sm text-left truncate w-full">
                                        {{ item.label }}
                                    </span>
                                </div>
                            </div>
                        </template>

                        <template #default>
                            <div class="flex items-center gap-1.5 flex-wrap min-h-[2.5rem] pr-10 w-full">
                                <UBadge v-for="item in selected" :key="item.value" color="primary" variant="soft"
                                    size="md"
                                    class="gap-1.5 pl-2 pr-1 flex items-center justify-start rounded-md max-w-full">
                                    <img v-if="item.image" :src="item.image" :alt="item.label"
                                        class="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
                                    <span class="text-xs font-medium text-left truncate max-w-[150px] sm:max-w-[220px]">
                                        {{ item.label }}
                                    </span>
                                    <UButton icon="i-lucide-x" size="2xs" color="gray" variant="ghost" :padded="false"
                                        class="w-4 h-4 hover:bg-gray-200 dark:hover:bg-gray-700 rounded shrink-0"
                                        @click="removeItem(item, $event)" />
                                </UBadge>

                                <span v-if="!selected.length" class="text-sm text-gray-400 dark:text-gray-500">
                                    Pilih tertuju
                                </span>
                            </div>
                        </template>
                    </USelectMenu>
                </div>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 gap-1 sm:gap-0">
                <span class="w-full sm:w-32 text-sm mt-0 sm:mt-1.5 text-gray-500 font-medium shrink-0">Tembusan</span>
                <div class="flex flex-wrap gap-1 w-full items-center">
                    <USelectMenu v-model="selected" :items="items" multiple placeholder="Kepada ..." class="w-full p-0"
                        variant="none" :ui="{
                            base: 'bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 transition-colors w-full',
                            wrapper: 'pr-10 w-full',
                            input: 'pr-10 w-full',
                            value: 'p-0 w-full',
                            trigger: { base: 'px-0 py-1 w-full' }
                        }">
                        <template #item="{ item, selected: isSel }">
                            <div class="flex items-start gap-3 w-full py-1 overflow-hidden">
                                <UCheckbox :model-value="isItemSelected(item)" class="pointer-events-none shrink-0"
                                    :checked="isItemSelected(item)" />
                                <img v-if="item.image" :src="item.image" :alt="item.label"
                                    class="w-7 h-7 rounded-full object-cover shrink-0" />
                                <div class="flex-1 min-w-0">
                                    <span class="block text-sm text-left truncate w-full">
                                        {{ item.label }}
                                    </span>
                                </div>
                            </div>
                        </template>

                        <template #default>
                            <div class="flex items-center gap-1.5 flex-wrap min-h-[2.5rem] pr-10 w-full">
                                <UBadge v-for="item in selected" :key="item.value" color="primary" variant="soft"
                                    size="md"
                                    class="gap-1.5 pl-2 pr-1 flex items-center justify-start rounded-md max-w-full">
                                    <img v-if="item.image" :src="item.image" :alt="item.label"
                                        class="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
                                    <span class="text-xs font-medium text-left truncate max-w-[150px] sm:max-w-[220px]">
                                        {{ item.label }}
                                    </span>
                                    <UButton icon="i-lucide-x" size="2xs" color="gray" variant="ghost" :padded="false"
                                        class="w-4 h-4 hover:bg-gray-200 dark:hover:bg-gray-700 rounded shrink-0"
                                        @click="removeItem(item, $event)" />
                                </UBadge>
                                <span v-if="!selected.length" class="text-sm text-gray-400 dark:text-gray-500">
                                    Pilih tembusan
                                </span>
                            </div>
                        </template>
                    </USelectMenu>
                </div>
            </div>

            <div
                class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 group gap-1 sm:gap-0">
                <div class="flex flex-col sm:flex-row sm:items-center w-full">
                    <span class="w-full sm:w-32 text-sm text-gray-500 font-medium shrink-0">Perihal</span>
                    <input type="text" class="flex-1 outline-none text-gray-900 py-1 bg-transparent text-sm w-full"
                        placeholder="Ketik perihal" />
                </div>
            </div>

            <div class="flex flex-col py-4">

                <!-- BAGIAN BUTTON ATAS -->
                <div class="flex flex-row gap-2">

                    <!-- PILIH TEMPLATE -->
                    <UModal title="Pilih Template" :close="{
                        color: 'primary',
                        variant: 'outline',
                        class: 'rounded-full'
                    }">
                        <UButton label="Pilih Template" color="primary" icon="i-heroicons-adjustments-horizontal"
                            class="text-white px-6 hover:bg-primary-600 font-medium" />

                        <template #body>
                            <div class="flex flex-col gap-2">
                                <UCard v-for="template in templates" :key="template.id"
                                    class="cursor-pointer hover:bg-gray-50" @click="applyTemplate(template)">
                                    <div class="py-3">
                                        <h3 class="font-bold">{{ template.name }}</h3>
                                        <p class="text-sm text-gray-500 whitespace-pre-line">
                                            {{ template.preview }}
                                        </p>
                                    </div>
                                </UCard>
                            </div>
                        </template>
                    </UModal>

                    <!-- TEMPLATE SAYA -->
                    <UButton label="Template Saya" color="primary" icon="i-heroicons-rectangle-stack"
                        class="text-white px-6 hover:bg-primary-600 font-medium" />

                    <!-- SIMPAN TEMPLATE BUTTON -->
                    <Modal title="Simpan Template" variant="modal2" :descriptions="['Masukan Nama Template']"
                        :inputs="[{ placeholder: 'Nama Template' }]" primary-button="Simpan" secondary-button="Batal"
                        open="Simpan Template" icon="plus" primary-color="primary" secondary-color="primary"
                        open-color="primary" />
                </div>

                <!-- EDITOR -->

                <div class="transition-all duration-300 ease-in-out flex flex-col border border-neutral-200 rounded-lg overflow-hidden bg-gray-50"
                    :class="isFullscreen ? 'fixed inset-0 z-[9999] h-screen w-screen border-none' : 'relative h-[800px] mt-5'">

                    <div
                        class="sticky top-0 z-50 bg-white border-b border-gray-200 px-2 py-2 flex flex-wrap items-center gap-1 shadow-sm shrink-0">
                        <div v-if="editor" class="flex flex-wrap items-center gap-1 w-full sm:w-auto">

                            <div class="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-1">
                                <UTooltip text="Undo">
                                    <UButton @click="editor.chain().focus().undo().run()"
                                        :disabled="!editor.can().undo()" color="gray" variant="ghost"
                                        icon="i-heroicons-arrow-uturn-left" size="xs" />
                                </UTooltip>
                                <UTooltip text="Redo">
                                    <UButton @click="editor.chain().focus().redo().run()"
                                        :disabled="!editor.can().redo()" color="gray" variant="ghost"
                                        icon="i-heroicons-arrow-uturn-right" size="xs" />
                                </UTooltip>
                            </div>

                            <div class="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-1">
                                <UDropdown :items="textStyleItems" :popper="{ placement: 'bottom-start' }">
                                    <UButton color="white" :label="currentTextStyleLabel"
                                        trailing-icon="i-heroicons-chevron-down-20-solid" size="xs" variant="ghost"
                                        class="w-28 justify-between" />
                                </UDropdown>
                            </div>

                            <div class="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-1">
                                <UButton @click="editor.chain().focus().toggleBold().run()"
                                    :color="editor.isActive('bold') ? 'primary' : 'gray'" variant="ghost"
                                    icon="i-heroicons-bold" size="xs" />
                                <UButton @click="editor.chain().focus().toggleItalic().run()"
                                    :color="editor.isActive('italic') ? 'primary' : 'gray'" variant="ghost"
                                    icon="i-heroicons-italic" size="xs" />
                                <UButton @click="editor.chain().focus().toggleUnderline().run()"
                                    :color="editor.isActive('underline') ? 'primary' : 'gray'" variant="ghost"
                                    icon="i-heroicons-underline" size="xs" />
                            </div>

                            <div class="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-1">
                                <UTooltip text="Align Left">
                                    <UButton @click="editor.chain().focus().setTextAlign('left').run()"
                                        :color="editor.isActive({ textAlign: 'left' }) ? 'primary' : 'gray'"
                                        variant="ghost" icon="i-heroicons-bars-3-bottom-left" size="xs" />
                                </UTooltip>
                                <UTooltip text="Align Center">
                                    <UButton @click="editor.chain().focus().setTextAlign('center').run()"
                                        :color="editor.isActive({ textAlign: 'center' }) ? 'primary' : 'gray'"
                                        variant="ghost" icon="i-heroicons-bars-3" size="xs" />
                                </UTooltip>
                                <UTooltip text="Align Right">
                                    <UButton @click="editor.chain().focus().setTextAlign('right').run()"
                                        :color="editor.isActive({ textAlign: 'right' }) ? 'primary' : 'gray'"
                                        variant="ghost" icon="i-heroicons-bars-3-bottom-right" size="xs" />
                                </UTooltip>
                                <UTooltip text="Justify">
                                    <UButton @click="editor.chain().focus().setTextAlign('justify').run()"
                                        :color="editor.isActive({ textAlign: 'justify' }) ? 'primary' : 'gray'"
                                        variant="ghost" icon="i-heroicons-bars-4" size="xs" />
                                </UTooltip>
                            </div>

                            <div class="flex items-center gap-0.5">
                                <UTooltip text="Bullet List">
                                    <UButton @click="editor.chain().focus().toggleBulletList().run()"
                                        :color="editor.isActive('bulletList') ? 'primary' : 'gray'" variant="ghost"
                                        icon="i-heroicons-list-bullet" size="xs" />
                                </UTooltip>
                                <UTooltip text="Numbered List">
                                    <UButton @click="editor.chain().focus().toggleOrderedList().run()"
                                        :color="editor.isActive('orderedList') ? 'primary' : 'gray'" variant="ghost"
                                        icon="i-heroicons-numbered-list" size="xs" />
                                </UTooltip>
                            </div>
                        </div>

                        <div class="flex items-center gap-2 pl-2 border-l border-gray-300 shrink-0 ml-auto">
                            <UButton
                                :icon="isFullscreen ? 'i-heroicons-arrows-pointing-in' : 'i-heroicons-arrows-pointing-out'"
                                variant="ghost" color="gray" @click="toggleFullscreen" />
                        </div>
                    </div>

                    <div class="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-8 flex justify-center w-full cursor-pointer"
                        @click.self="editor?.chain().focus().run()">

                        <div class="bg-white shadow-xl w-full max-w-[21cm] min-h-[29.7cm] flex flex-col relative print:w-full print:shadow-none mx-auto h-fit shrink-0 cursor-default page-markers"
                            @click.stop>

                            <div class="px-15 pt-8 pb-2">
                                <div class="flex items-start justify-between">
                                    <div class="flex items-end gap-3">
                                        <img :src="headerData.logo" alt="AirNav Logo" class="h-24 w-24 object-contain">
                                        <span class="text-xl font-semibold font-serif text-black tracking-tight mt-2">{{
                                            headerData.title
                                            }}</span>
                                    </div>

                                    <div class="text-right">
                                        <textarea v-model="headerData.address"
                                            class="text-[11px] font-serif text-black text-right w-[250px] h-[80px] outline-none resize-none bg-transparent overflow-hidden leading-tight border-none focus:ring-0 p-0"
                                            spellcheck="false"></textarea>
                                    </div>
                                </div>
                            </div>

                            <div class="flex-1 px-8 py-2 cursor-text editor-content-area">
                                <EditorContent :editor="editor" />
                            </div>

                            <div class="px-8 pb-8 pt-4 mt-auto">
                                <div class="pt-2 text-center">
                                    <textarea v-model="footerData"
                                        class="text-[10px] font-serif text-black text-center w-full h-[30px] outline-none resize-none bg-transparent overflow-hidden leading-tight border-none focus:ring-0 p-0"
                                        spellcheck="false"></textarea>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                <!-- FILE UPLOAD -->
                <div class="flex items-center justify-between py-3 border-b border-gray-200">
                    <UFileUpload class="w-full" multiple position="inside" layout="list" label="Lampiran File"
                        description="PDF, DOCX atau XLSX (max. 10MB)" />
                </div>
            </div>


            <div class="px-4 sm:px-6 py-4 border-t border-gray-100 flex items-center justify-end bg-white">
                <div class="flex items-center gap-3 w-full sm:w-auto">
                    <UButton label="Kirim" color="primary"
                        class="text-white px-6 hover:bg-blue-700 text-md font-medium w-full sm:w-auto justify-center" />
                </div>
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

/* FIX STYLE TIPTAP EDITOR 
   Menggunakan :deep() agar style tembus ke komponen anak (Tiptap)
*/

/* 1. Font Times New Roman */
:deep(.ProseMirror) {
    font-family: 'Times New Roman', Times, serif;
    font-size: 16px;
    /* Ukuran standar surat 12pt approx 16px */
    line-height: 1.6;
    outline: none;
}

:deep(.ProseMirror p) {
    margin-top: 0.5em;
    margin-bottom: 0.5em;
}

/* 2. Fix Numbering (ol) dan Bullets (ul) */
:deep(.ProseMirror ul),
:deep(.ProseMirror ol) {
    padding-left: 1.5rem;
    /* Memberi ruang indentasi */
    margin-top: 0.5em;
    margin-bottom: 0.5em;
}

/* Memunculkan titik (disc) */
:deep(.ProseMirror ul) {
    list-style-type: disc;
}

/* Memunculkan angka (decimal) */
:deep(.ProseMirror ol) {
    list-style-type: decimal;
}

/* Nested list styling (opsional agar lebih rapi) */
:deep(.ProseMirror ul ul),
:deep(.ProseMirror ol ul) {
    list-style-type: circle;
}

:deep(.ProseMirror ol ol) {
    list-style-type: lower-alpha;
    /* a, b, c */
}

/* Heading styles di dalam editor */
:deep(.ProseMirror h1) {
    font-size: 1.5em;
    font-weight: bold;
}

:deep(.ProseMirror h2) {
    font-size: 1.25em;
    font-weight: bold;
}

.page-markers {
    background-image: linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px);
    background-size: 100% 29.7cm;
    background-position: 0 -1px;
    /* Adjust offset */
    position: relative;
}

/* Garis bantu visual batas halaman */
.page-markers::after {
    content: "";
    position: absolute;
    top: 29.7cm;
    left: 0;
    right: 0;
    height: 1px;
    background: repeating-linear-gradient(to right, transparent, transparent 5px, red 5px, red 10px);
    pointer-events: none;
    z-index: 10;
}

/* Jika panjang kertas melebihi 2 halaman, tambahkan marker lagi (manual approach via CSS repeater is limited, JS is better but simple CSS covers 1st break) */

/* Style Font Serif untuk Header/Footer agar mirip surat resmi */
.font-serif {
    font-family: 'Times New Roman', Times, serif;
}
</style>