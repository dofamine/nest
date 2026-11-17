Architecture:

- Components in application should follow the paradigm of dumb and smart components:
    - smart components work with the whole app context like: services, application
      state, router, resolvers etc.
    - dumb components communicate through inputs and outputs and do not own application state or call
      application services. They may own local presentation state such as an open dialog, selected action,
      and form values so they can be reused throughout the application.
- use layer segregation that provides angular: resolvers, guards, interceptors, pipes, directives, etc.
  to keep clean code
- similar logic has to be unified/merged, extracted and reused under shared folder
- use reactive forms in the application
- use folder segregation to keep clean structure of the project

Component contracts and action flows:

- presentation components emit user intent; smart parents decide how to execute it
- keep event contracts small: use an explicit action and only the payload needed for that action;
  do not emit context the parent already has. For example, emit `{ action, payload }` and bind
  `(action)="onAction(user, $event)"` so the parent supplies the row's user
- name actions after business operations, like `changeRole`, `activate`, `deactivate`,
  `deleteUser`, and `deleteInvitation`; do not mix action names with persisted status values
- keep authentication context and application policy in smart components. For example, the parent
  decides whether to render actions for the current user; the child receives a simple `disabled` input
- frontend visibility rules complement backend enforcement; business restrictions must remain enforced
  by the backend
- prefer a straightforward action handler with explicit dispatch, such as a switch, when it makes
  the supported operations easy to follow; do not introduce extra orchestration abstractions without need
- keep the flow easy to trace: component output -> page handler -> API service -> controller -> backend service
- API service methods should represent distinct domain operations. Keep user deletion and invitation
  deletion separate rather than making one method infer the resource from its status
- use each resource's actual identity throughout the chain: users use user IDs; the current invitation
  management flow uses email. Do not assume a presentation row is a persisted user

State and presentation configuration:

- prefer reloading authoritative data after a successful mutation when this avoids duplicating server
  state and maintaining local reconciliation logic; use local updates when there is a concrete UX or
  performance reason
- keep presentation state local and application state in the parent; avoid passing state through several
  layers when the child does not need it
- keep action types, labels, titles, and other static action metadata in a colocated config file;
  keep event and form interfaces in a dedicated model file
- use typed configuration maps, such as `satisfies Record<TUserAction, string>`, so every supported
  action has the required presentation metadata
- derive dialog presentation from the selected action with computed signals; keep branching and
  configuration lookup out of templates. Reading a computed signal in a template is appropriate;
  use pipes for display transformations

General code structure:

- name method after its business logic like: getUsers, onSubmit, setValue etc.
- decompose conditional construction by business scenario. For example, `getMenuItems()` selects
  between `getRegisteredMenuItems(user)` and `getInvitedUserMenuItems()`; each builder owns the
  complete result for its scenario
- keep dispatch methods focused on choosing a scenario and delegating; keep construction details
  in explicitly named methods at a consistent level of abstraction
- prefer returning complete array or object literals from scenario builders instead of incrementally
  assembling them with conditional pushes and repeated checks. Make available items and their order
  visible together
- centralize shared construction behavior in small helpers such as `createMenuItem()`; keep
  scenario-specific labels, actions, and styling visible in the scenario builders
- prefer clear business-specific methods over generic builders with flags or nested conditional
  expressions. A little repeated structure is acceptable when it makes each scenario easier to read
- method lines is no more than 30 lines
- avoid deep nesting 2 levels max
- all dependencies of class plug in constructor
- constructor has to be defined after all class properties
- effects should not be run in the constructors, make a separate methods
- properties in the component should be grouped by their zone of responsibilities and each group has to have a short
  comment which describes that group
- interfaces should start from I{name}, enums E{name}, types T{name} etc.
- all methods has to have return type
- if a prop definition takes more than 2 lines make a method to init value

Tests:

- do not write tests unless it is asked

Forms:

- use typed forms with defined interfaces
- define forms in dedicated initializer methods, including controls, default values, disabled states, and validators;
  properties or computed signals should call those methods instead of defining forms inline

Templates:

- should not be greater than 150 - 200 lines
- should not be overloaded with logic
- use pipes to transform data never call methods from the component to display value
