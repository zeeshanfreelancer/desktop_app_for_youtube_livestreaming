import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 bg-zinc-950 p-8 text-center">
          <h1 className="text-lg font-semibold text-white">Something went wrong</h1>
          <p className="max-w-md text-sm text-red-400">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-500"
          >
            Reload App
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
