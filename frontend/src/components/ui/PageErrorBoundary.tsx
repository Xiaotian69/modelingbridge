import { Component, type ReactNode } from "react";

export class PageErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <section className="site-container py-20" role="alert">
          <h1 className="text-2xl font-semibold">学习内容暂时未能加载</h1>
          <p className="my-5 text-sm text-slate-600">
            请检查网络后重试。本机保存的学习记录不会因刷新被清除。
          </p>
          <button
            className="mb-button button-dark"
            onClick={() => window.location.reload()}
          >
            重新加载
          </button>
        </section>
      );
    return this.props.children;
  }
}
