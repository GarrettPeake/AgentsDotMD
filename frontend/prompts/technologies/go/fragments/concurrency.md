---
id: go-concurrency
technology: go
category: concurrency
optionDependencies:
  use-concurrency: true
sortOrder: 200
version: 1
---

## Go Concurrency Guidelines

- Use goroutines for concurrent work, but always ensure they have a clear shutdown path. Never fire-and-forget goroutines without tracking their lifecycle.
- Prefer channels for communication between goroutines. Use `sync.Mutex` only for protecting shared state that does not need coordination.
- Always use `context.Context` for cancellation and timeouts in concurrent operations. Pass contexts down the call chain, never store them in structs.
- Use `sync.WaitGroup` to wait for a group of goroutines to complete. Call `wg.Add` before launching the goroutine, not inside it.
- Use `errgroup.Group` from `golang.org/x/sync/errgroup` when goroutines can return errors and you need to collect the first failure.
- Avoid shared mutable state between goroutines. If shared state is necessary, protect it with `sync.Mutex` or `sync.RWMutex` and keep the critical section as small as possible.
- Use buffered channels deliberately. Unbuffered channels enforce synchronization; buffered channels decouple producer and consumer speeds.
- Run tests with `go test -race ./...` to detect race conditions. Fix all race conditions before merging.
- Use `select` with a `context.Done()` case to make blocking operations cancellable.
