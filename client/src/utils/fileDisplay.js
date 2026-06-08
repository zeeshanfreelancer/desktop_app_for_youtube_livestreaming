export function fileBaseName(filePath) {
  if (!filePath || typeof filePath !== 'string') return ''
  return filePath.split(/[/\\]/).pop() || filePath
}
