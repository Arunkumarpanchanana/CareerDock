import '@testing-library/jest-dom'

class IntersectionObserverMock {
  readonly root: Element | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []
  observe() { }
  unobserve() { }
  disconnect() { }
  takeRecords(): IntersectionObserverEntry[] { return [] }
}

if (typeof IntersectionObserver === 'undefined') {
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    value: IntersectionObserverMock,
    writable: true,
    configurable: true,
  })
}

if (!Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function () {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(this)
    })
  }
}
