import Quill from 'quill'

// Tambahkan icon ke toolbar
const icons = Quill.import('ui/icons')
icons['numbering'] = '<span>123▼</span>'

// Register module
Quill.register('modules/numbering', class {
  constructor(quill: any, options: any) {
    this.quill = quill

    const toolbar = quill.getModule('toolbar')
    if (!toolbar) return

    toolbar.addHandler('numbering', this.selectNumbering.bind(this))

    // inject dropdown
    this.addDropdown(toolbar.container)
  }

  addDropdown(container: HTMLElement) {
    const group = container.querySelector('.ql-formats:last-child')

    // Buat tombol parent
    const button = document.createElement('select')
    button.className = 'ql-numbering'

    const options = [
      { value: 'decimal', label: '1. 2. 3.' },
      { value: 'lower-alpha', label: 'a. b. c.' },
      { value: 'lower-roman', label: 'i. ii. iii.' },
      { value: 'upper-alpha', label: 'A. B. C.' },
      { value: 'upper-roman', label: 'I. II. III.' }
    ]

    options.forEach(opt => {
      const el = document.createElement('option')
      el.value = opt.value
      el.innerText = opt.label
      button.appendChild(el)
    })

    group.appendChild(button)
  }

  selectNumbering(value: string) {
    const range = this.quill.getSelection()
    if (!range) return

    // apply list: ordered
    this.quill.format('list', 'ordered')

    // apply custom style as dataset
    const lines = this.quill.getLines(range.index, range.length)
    lines.forEach((line: any) => {
      const [leaf] = this.quill.getLeaf(this.quill.getIndex(line))
      leaf.domNode.dataset.numbering = value
    })
  }
})
