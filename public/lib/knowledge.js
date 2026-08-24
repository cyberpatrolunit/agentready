// Curated per-framework guidance. Each entry: label, conventions (do this),
// gotchas (watch out for this). Kept concise on purpose — agent instruction
// files work best short and imperative.

export const FRAMEWORK_KNOWLEDGE = {
  next: {
    label: 'Next.js (App Router)',
    conventions: [
      'Use the App Router (`app/`) structure: `page.tsx` for routes, `layout.tsx` for shared chrome, `route.ts` for API endpoints.',
      'Components are Server Components by default — add `"use client"` only when the component needs state, effects, or browser APIs.',
      'Fetch data in Server Components or route handlers, not in client-side `useEffect`.',
      'Use `next/image` for images and `next/link` for internal navigation.',
    ],
    gotchas: [
      'Server Components cannot use hooks or event handlers; moving code between server/client contexts is the most common source of build errors.',
      'Environment variables are only exposed to the browser when prefixed with `NEXT_PUBLIC_`.',
      '`next dev` masks some production-only issues — verify SSR/streaming behavior with `next build && next start` before calling a change done.',
    ],
  },
  react: {
    label: 'React',
    conventions: [
      'Function components with hooks only; no class components.',
      'Derive state where possible instead of syncing copies with `useEffect`.',
      'Co-locate component, styles, and tests in the same directory.',
    ],
    gotchas: [
      'Effects that update state they also depend on cause render loops — check dependency arrays first when debugging re-renders.',
      'Keys must be stable identifiers, not array indices, for any list that reorders.',
    ],
  },
  vite: {
    label: 'Vite',
    conventions: ['Static assets go in `public/`; imported assets are hashed and go through the bundler.'],
    gotchas: ['Env vars must be prefixed `VITE_` to reach client code (`import.meta.env`, not `process.env`).'],
  },
  vue: {
    label: 'Vue 3',
    conventions: [
      'Use `<script setup>` single-file components with the Composition API.',
      'Shared state lives in Pinia stores, not ad-hoc event buses.',
    ],
    gotchas: ['Destructuring a reactive object breaks reactivity — use `storeToRefs`/`toRefs`.'],
  },
  nuxt: {
    label: 'Nuxt',
    conventions: [
      'File-based routing in `pages/`; auto-imported components from `components/`.',
      'Use `useFetch`/`useAsyncData` for data fetching so SSR payloads hydrate correctly.',
    ],
    gotchas: ['Code in `server/` runs only on the server; browser APIs there will crash SSR.'],
  },
  sveltekit: {
    label: 'SvelteKit',
    conventions: [
      'Routes live in `src/routes/`; server-only logic in `+page.server.ts` / `+server.ts` files.',
      'Use form actions for mutations rather than hand-rolled fetch calls where possible.',
    ],
    gotchas: ['Anything imported into `+page.svelte` ships to the client — keep secrets in `.server.` files only.'],
  },
  svelte: {
    label: 'Svelte',
    conventions: ['Prefer runes/stores for shared state; keep components small.'],
    gotchas: ['Reactivity is compile-time: mutating nested objects without reassignment does not trigger updates.'],
  },
  astro: {
    label: 'Astro',
    conventions: [
      'Default to zero-JS `.astro` components; add framework islands only where interactivity is needed.',
      'Use content collections (`src/content/`) for structured markdown content.',
    ],
    gotchas: ['Island components need an explicit `client:*` directive or their JS never loads.'],
  },
  remix: {
    label: 'Remix / React Router',
    conventions: ['Data loading in route `loader`s, mutations in `action`s; use `<Form>` over manual fetch.'],
    gotchas: ['Loaders run on the server — browser globals there break the build.'],
  },
  express: {
    label: 'Express',
    conventions: [
      'Routes thin, logic in service modules; wire errors through a single error-handling middleware.',
      'Validate request bodies at the boundary (e.g. zod) before they reach handlers.',
    ],
    gotchas: ['Async handler errors are swallowed unless passed to `next()` or wrapped — check this first for hanging requests.'],
  },
  fastify: {
    label: 'Fastify',
    conventions: ['Use the plugin system + JSON schema validation on routes; register shared decorators once.'],
    gotchas: ['Route schemas also drive serialization — fields missing from the response schema are silently dropped.'],
  },
  hono: {
    label: 'Hono',
    conventions: ['Keep handlers edge-safe (Web APIs only, no Node built-ins) so the app stays portable across runtimes.'],
    gotchas: ['Middleware order matters and `await next()` is required, or downstream handlers never run.'],
  },
  koa: {
    label: 'Koa',
    conventions: ['Compose behavior through middleware; keep business logic out of middleware bodies.'],
    gotchas: ['Forgetting `await next()` silently skips the rest of the middleware stack.'],
  },
  nest: {
    label: 'NestJS',
    conventions: [
      'Follow module/controller/service structure; inject dependencies via constructors.',
      'Use DTO classes with `class-validator` for request validation.',
    ],
    gotchas: ['Providers must be registered in a module or injection fails at runtime, not compile time.'],
  },
  electron: {
    label: 'Electron',
    conventions: ['Keep main/renderer boundaries strict: IPC via preload scripts with `contextBridge`, never `nodeIntegration: true`.'],
    gotchas: ['Renderer code cannot use Node APIs directly with context isolation on (the secure default).'],
  },
  expo: {
    label: 'Expo / React Native',
    conventions: ['Use Expo Router file-based navigation; test on both platforms before considering UI work done.'],
    gotchas: ['Native module changes require a new development build — hot reload will not pick them up.'],
  },
  'react-native': {
    label: 'React Native',
    conventions: ['Style with `StyleSheet.create`; keep platform forks in `.ios.tsx`/`.android.tsx` files.'],
    gotchas: ['Layout is flexbox-only with different defaults than web (`flexDirection: "column"`).'],
  },
  django: {
    label: 'Django',
    conventions: [
      'Fat models / thin views; business logic in model methods or service functions, not views or templates.',
      'Schema changes always go through migrations: `makemigrations` then `migrate`; never edit applied migrations.',
      'Use the ORM; drop to raw SQL only with a comment explaining why.',
    ],
    gotchas: [
      'N+1 queries are the default failure mode — reach for `select_related`/`prefetch_related` on any queryset used in a loop.',
      'Settings differ across environments; check `DJANGO_SETTINGS_MODULE` before debugging "works locally" issues.',
    ],
  },
  fastapi: {
    label: 'FastAPI',
    conventions: [
      'Define request/response shapes as Pydantic models; set `response_model` on routes.',
      'Use dependency injection (`Depends`) for auth, DB sessions, and shared resources.',
      'Async route handlers must not call blocking IO — use async libraries or `run_in_threadpool`.',
    ],
    gotchas: [
      'A sync call inside an `async def` route blocks the entire event loop — the most common FastAPI performance bug.',
      'Pydantic v2 syntax differs from v1 (`model_validate`, `model_dump`) — check which major version the project pins.',
    ],
  },
  flask: {
    label: 'Flask',
    conventions: ['Use blueprints for route grouping and an app factory (`create_app`) for testability.'],
    gotchas: ['Module-level state is shared across requests under most WSGI servers — avoid mutable globals.'],
  },
  streamlit: {
    label: 'Streamlit',
    conventions: ['Cache expensive work with `@st.cache_data` / `@st.cache_resource`; keep state in `st.session_state`.'],
    gotchas: ['The whole script reruns on every interaction — uncached work runs every time.'],
  },
  'data-science': {
    label: 'Python data stack',
    conventions: [
      'Keep exploration in notebooks but promote reusable logic into importable modules with tests.',
      'Pin data schema expectations (column names, dtypes) at load boundaries.',
    ],
    gotchas: ['Chained pandas indexing (`df[a][b] = x`) silently fails to write — use `.loc`.'],
  },
  ml: {
    label: 'ML training code',
    conventions: ['Seed all RNGs for reproducibility; log hyperparameters and metrics for every run.'],
    gotchas: ['Device placement mismatches (CPU/GPU/MPS) are the most common runtime error — check `.to(device)` on both model and batch.'],
  },
  llm: {
    label: 'LLM integration',
    conventions: [
      'Keep prompts in version-controlled files or constants, not scattered string literals.',
      'Wrap provider calls in one client module so retries, timeouts, and token accounting live in one place.',
      'Never log full prompts/completions that may contain user data; redact before logging.',
    ],
    gotchas: ['Streaming responses and tool calls change response shapes — handle both paths or the integration breaks under load.'],
  },
  axum: {
    label: 'Axum',
    conventions: ['Share state via `State` extractors; convert errors into responses with a central `IntoResponse` error type.'],
    gotchas: ['Handler type errors produce enormous compiler messages — check extractor order and `Send + Sync` bounds first.'],
  },
  actix: {
    label: 'Actix Web',
    conventions: ['App state via `web::Data`; async handlers must be `Send`.'],
    gotchas: ['Blocking calls inside handlers starve the runtime — use `web::block` for CPU/blocking work.'],
  },
  rocket: {
    label: 'Rocket',
    conventions: ['Use request guards for auth/validation; typed route params over manual parsing.'],
    gotchas: ['Fairings run in registration order — order matters for anything touching the same request data.'],
  },
  tauri: {
    label: 'Tauri',
    conventions: ['Expose Rust commands with `#[tauri::command]` and keep the allowlist/capabilities minimal.'],
    gotchas: ['Frontend and Rust versions of the API must stay in sync — regenerate bindings after signature changes.'],
  },
  tokio: {
    label: 'Tokio async runtime',
    conventions: ["Spawned tasks need `'static` data — clone or `Arc` what they capture."],
    gotchas: ['Holding a `std::sync::Mutex` guard across an `.await` can deadlock — use `tokio::sync::Mutex` where needed.'],
  },
  bevy: {
    label: 'Bevy',
    conventions: ['Model behavior as small systems over components; use events for cross-system communication.'],
    gotchas: ['System ordering is nondeterministic unless explicitly constrained — add ordering when systems share state.'],
  },
  gin: {
    label: 'Gin',
    conventions: ['Bind and validate request bodies with struct tags; group routes with middleware per group.'],
    gotchas: ['`c.JSON` does not stop the handler — `return` after writing a response or use `c.AbortWithStatusJSON`.'],
  },
  echo: {
    label: 'Echo',
    conventions: ['Centralize error handling with a custom `HTTPErrorHandler`.'],
    gotchas: ['Middleware registered after routes does not apply to them — register order matters.'],
  },
  chi: {
    label: 'chi',
    conventions: ['Keep handlers `http.HandlerFunc`-compatible; use sub-routers for path grouping.'],
    gotchas: ['URL params come from `chi.URLParam(r, ...)` — the request context, not the raw path.'],
  },
  fiber: {
    label: 'Fiber',
    conventions: ['Handlers use fasthttp under the hood — avoid retaining `*fiber.Ctx` or its buffers past the handler return.'],
    gotchas: ['Values from `c.Params`/`c.Body` are only valid during the handler — copy them if stored.'],
  },
  cobra: {
    label: 'Cobra CLI',
    conventions: ['One file per command under `cmd/`; keep `RunE` thin and return errors instead of calling `os.Exit`.'],
    gotchas: ['Flag values bound with `Viper` resolve at execute time — reading them at init returns zero values.'],
  },
  'spring-boot': {
    label: 'Spring Boot',
    conventions: [
      'Constructor injection over field injection; components discovered via classpath scanning under the main application package.',
      'Configuration in `application.yml` with `@ConfigurationProperties` classes, not scattered `@Value` reads.',
      'Layer boundaries: controllers thin, `@Service` for logic, `@Repository`/Spring Data for persistence; DTOs at the API edge, entities stay internal.',
    ],
    gotchas: [
      'Beans outside the main application package are silently not scanned — the most common "why is my bean null" cause.',
      '`@Transactional` on private or self-invoked methods does nothing (proxy-based AOP); calls must cross a bean boundary.',
      'Slice tests (`@WebMvcTest`, `@DataJpaTest`) load partial contexts — mock what the slice excludes or the context fails to start.',
    ],
  },
  quarkus: {
    label: 'Quarkus',
    conventions: ['Prefer build-time configuration; use `@QuarkusTest` for integration tests and dev services for dependencies.'],
    gotchas: ['Reflection-heavy libraries need registration for native image builds — test native mode before shipping it.'],
  },
  micronaut: {
    label: 'Micronaut',
    conventions: ['DI is compile-time; missing injections surface at build, so treat build warnings as errors.'],
    gotchas: ['No classpath scanning at runtime — dynamic bean lookups that work in Spring do not translate.'],
  },
  aspnet: {
    label: 'ASP.NET Core',
    conventions: [
      'Register services in `Program.cs` with the right lifetime (singleton/scoped/transient); inject via constructors.',
      'Use minimal APIs or controllers consistently — match whichever the project already uses.',
      'Async all the way down: `async Task` endpoints, no `.Result`/`.Wait()` on tasks.',
    ],
    gotchas: [
      'Capturing a scoped service (like a DbContext) in a singleton throws at runtime, not compile time.',
      '`.Result`/`.Wait()` on async code can deadlock in classic contexts and starves the thread pool — always await.',
    ],
  },
  laravel: {
    label: 'Laravel',
    conventions: [
      'Follow MVC + Eloquent conventions; validation in Form Requests, queries via Eloquent scopes.',
      'Use `php artisan` generators so new files land in conventional locations.',
    ],
    gotchas: ['Eager-load relations (`with(...)`) for any collection rendered in a loop — N+1 is the default.'],
  },
  rails: {
    label: 'Ruby on Rails',
    conventions: [
      'Convention over configuration: RESTful controllers, model callbacks used sparingly, business logic in POROs/service objects when it outgrows models.',
      'Schema changes via migrations only; run `bin/rails db:migrate` after pulling.',
    ],
    gotchas: ['N+1 queries: use `includes` for associations rendered in views.'],
  },
};

export const SINGLE_TEST_COMMANDS = {
  vitest: (pm) => `${pm === 'npm' ? 'npx' : pm} vitest run path/to/file.test.ts -t "test name"`,
  jest: (pm) => `${pm === 'npm' ? 'npx' : pm} jest path/to/file.test.ts -t "test name"`,
  playwright: (pm) => `${pm === 'npm' ? 'npx' : pm} playwright test path/to/spec.ts`,
  mocha: (pm) => `${pm === 'npm' ? 'npx' : pm} mocha path/to/test.js --grep "test name"`,
  pytest: (py) => (py ? `${py} pytest tests/test_file.py::test_name` : 'pytest tests/test_file.py::test_name'),
  'cargo-test': () => 'cargo test test_name',
  'go-test': () => 'go test ./path/to/pkg -run TestName',
  rspec: () => 'bundle exec rspec spec/path/to/file_spec.rb:LINE',
  phpunit: () => 'vendor/bin/phpunit --filter testName',
  pest: () => 'vendor/bin/pest --filter testName',
};
