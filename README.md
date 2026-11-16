<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Angular frontend

The UI is branded as **Logo Portal**, using PrimeNG 21 components and a custom
Aura preset with red primary actions and grey surfaces. Theme tokens live in
`frontend/src/app/core/theme/logo-portal.preset.ts`.

Frontend structure:

```text
frontend/src/app/
  app.config.ts          # HTTP, router, and PrimeNG providers
  app.routes.ts          # Combines public and private route groups
  routes/
    public.routes.ts     # Login, invitation, and password recovery
    private.routes.ts    # Authenticated pages, protected by authGuard
  pages/
    auth/                # Public account forms and templates
    dashboard/           # Blank dashboard
    patients/            # Blank patients page
    profile/             # Read-only /user/@me form
    users/               # Admin-only invitations
  shared/
    components/          # Header, footer, and right-side navigation
    layouts/             # Private page shell
  core/
    guards/              # Authentication and admin route guards
    interceptors/        # Central session-expiry handling
    models/              # Shared API types
    services/            # API client and session state
    theme/               # Logo Portal design tokens
    utils/               # Shared error presentation
```

All Angular forms use typed reactive forms. Import `ReactiveFormsModule` in each
standalone component that renders a form and create controls with
`NonNullableFormBuilder`. Define validators in TypeScript, bind inputs with
`formControlName`, and keep form values in the form model. Do not introduce
`FormsModule`, `ngModel`, or `NgForm`. Disable controls for fields that do not
apply to the current flow so they do not block validation. Keep loading and API
feedback in signals, and reset form interaction state after successful submission.

Pages are lazy-loaded. New private pages belong under the guarded children in
`private.routes.ts`; public pages remain usable without a session. Backend guards
continue to enforce API permissions independently of frontend routing.

The shared header displays the current name (email if no name is set), role badge,
and a user menu for My profile, Log out, and Log out from everywhere. Reusable UI
components and cross-feature helpers belong under `shared/`; application-wide
authentication, HTTP infrastructure, and singleton state remain in `core/`.
The private layout places navigation on the right on desktop and above the page
on mobile. `/profile`, `/users`, and `/patients` support direct links and refresh.

The standalone Angular app lives in `frontend/` with its own dependencies and
TypeScript configuration. It supports sign in, invitation registration, password
recovery/reset, the current user's profile, logout, and admin invitations.

Install dependencies in both directories:

```bash
npm ci
npm run install:frontend
```

For development, run these in separate terminals:

```bash
npm run start:dev
npm run start:frontend
```

Open `http://127.0.0.1:4200`. Angular proxies `/user/**` to Nest at
`http://127.0.0.1:3000` (edit `frontend/proxy.conf.json` if the backend port changes).
Set `FRONTEND_URL=http://127.0.0.1:4200` in the backend environment for invitation
and password-reset links. Use `NODE_ENV=development` locally over HTTP.
The existing mail transport writes messages to `var/mail` instead of sending email.

To serve both apps from Nest:

```bash
npm run build:all
npm run start:prod
```

Open `http://localhost:3000` and set `FRONTEND_URL` to that origin (or the public
HTTPS origin in production). Deploy both `dist/` and
`frontend/dist/portal/browser/`, keeping the directory structure. The Nest-only
`npm run build` command does not rebuild Angular. Restart Nest after building the
frontend for the first time. If no frontend build exists, Nest runs as an API only.

The API remains at `/user/*`. Cookies are same-origin in both modes; no token is
stored in browser storage. The frontend hides admin controls, while the backend
role guard enforces access. Registration requires an invitation ID from
`/invite/:invitationId`; password reset uses `/reset-password?token=...`.
The existing limit of five requests per 30 seconds can produce a retry message
during rapid manual testing. Active duplicate invitations retain the backend's
existing conflict behavior.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observer](https://observer.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
